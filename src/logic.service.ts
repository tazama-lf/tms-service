// SPDX-License-Identifier: Apache-2.0
import apm from './apm';
import { createMessageBuffer } from '@tazama-lf/frms-coe-lib/lib/helpers/protobuf';
import { unwrap } from '@tazama-lf/frms-coe-lib/lib/helpers/unwrap';
import type { DataCache, Pacs002, Pacs008, Pain001, Pain013 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { cacheDatabaseManager, loggerService, server } from '.';
import { configuration } from './';
import type { TransactionRelationship } from './interfaces/iTransactionRelationship';
import {
  generateDebtorEntityKey,
  generateCreditorEntityKey,
  generateDebtorAccountKey,
  generateCreditorAccountKey,
  generateTenantCacheKey,
} from './utils/tenantUtils';

// ============================================================================
// CONSOLIDATED UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates the duration in nanoseconds from a start time
 */
const calculateDuration = (startTime: bigint): number => {
  const endTime = process.hrtime.bigint();
  return Number(endTime - startTime);
};

/**
 * Common error handling utility for database operations
 */
const handleDatabaseError = (err: unknown, span?: { end: () => void } | null, mainSpan?: { end: () => void } | null): Error => {
  let error: Error;
  if (err instanceof Error) {
    error = err;
  } else {
    const strErr = JSON.stringify(err);
    error = new Error(strErr);
  }
  span?.end();
  mainSpan?.end();
  return error;
};

/**
 * Common server response utility for notifying event-director
 */
const notifyEventDirector = (transaction: unknown, dataCache: DataCache | undefined, startTime: bigint): void => {
  server.handleResponse({
    transaction,
    DataCache: dataCache,
    metaData: {
      prcgTmDP: calculateDuration(startTime),
      traceParent: apm.getCurrentTraceparent(),
    },
  });
};

// A utility type for the fields we are extracting from the pacs008 entity
type AccountIds = Required<Pick<DataCache, 'cdtrId' | 'dbtrId' | 'dbtrAcctId' | 'cdtrAcctId'>>;

// Constants for magic numbers
const DEFAULT_TTL = 0;

// Tenant-aware parseDataCache function
const parseDataCache = (transaction: Pacs008, tenantId = 'DEFAULT'): AccountIds => {
  // Access nested properties directly since Pacs008 type guarantees structure
  const [debtorOthr] = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.Dbtr.Id.PrvtId.Othr;
  const [creditorOthr] = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr;
  const [debtorAcctOthr] = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAcct.Id.Othr;
  const debtorMmbId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const [creditorAcctOthr] = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAcct.Id.Othr;
  const creditorMmbId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;

  // Generate tenant-aware keys
  const debtorId = generateDebtorEntityKey(tenantId, debtorOthr.Id, debtorOthr.SchmeNm.Prtry);
  const creditorId = generateCreditorEntityKey(tenantId, creditorOthr.Id, creditorOthr.SchmeNm.Prtry);
  const debtorAcctId = generateDebtorAccountKey(tenantId, debtorAcctOthr.Id, debtorAcctOthr.SchmeNm.Prtry, debtorMmbId);
  const creditorAcctId = generateCreditorAccountKey(tenantId, creditorAcctOthr.Id, creditorAcctOthr.SchmeNm.Prtry, creditorMmbId);

  return {
    cdtrId: creditorId,
    dbtrId: debtorId,
    cdtrAcctId: creditorAcctId,
    dbtrAcctId: debtorAcctId,
  };
};

/**
 * Rebuilds the DataCache object using the given endToEndId to fetch a stored Pacs008 message
 * Always uses tenant-aware key generation with DEFAULT tenant fallback
 *
 * @param {string} endToEndId
 * @param {boolean} writeToRedis
 * @param {string} tenantId - Tenant ID (defaults to 'DEFAULT' if not provided)
 * @param {string} id - Optional ID for logging
 * @return {*}  {(Promise<DataCache | undefined>)}
 */
export const rebuildCache = async (
  endToEndId: string,
  writeToRedis: boolean,
  tenantId = 'DEFAULT',
  id?: string,
): Promise<DataCache | undefined> => {
  const span = apm.startSpan('db.cache.rebuild.tenant');
  const context = 'rebuildCache()';
  const currentPacs008 = (await cacheDatabaseManager.getTransactionPacs008(endToEndId, tenantId)) as [Pacs008[]];

  const pacs008 = unwrap(currentPacs008);

  if (!pacs008) {
    loggerService.error('Could not find pacs008 transaction to rebuild dataCache with', context, id);
    span?.end();
    return undefined;
  }

  const cdtTrfTxInf = pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf;

  // Always use tenant-aware parsing with DEFAULT fallback
  const { cdtrId, cdtrAcctId, dbtrId, dbtrAcctId } = parseDataCache(pacs008, tenantId);

  const dataCache: DataCache = {
    cdtrId,
    dbtrId,
    cdtrAcctId,
    dbtrAcctId,
    creDtTm: pacs008.FIToFICstmrCdtTrf.GrpHdr.CreDtTm,
    instdAmt: {
      amt: parseFloat(cdtTrfTxInf.InstdAmt.Amt.Amt),
      ccy: cdtTrfTxInf.InstdAmt.Amt.Ccy,
    },
    intrBkSttlmAmt: {
      amt: parseFloat(cdtTrfTxInf.IntrBkSttlmAmt.Amt.Amt),
      ccy: cdtTrfTxInf.IntrBkSttlmAmt.Amt.Ccy,
    },
    xchgRate: cdtTrfTxInf.XchgRate,
  };

  if (writeToRedis) {
    const buffer = createMessageBuffer({ DataCache: { ...dataCache } });

    if (buffer) {
      const redisTTL = configuration.redisConfig.distributedCacheTTL;
      // Use tenant-aware cache key for complete tenant isolation
      const tenantCacheKey = generateTenantCacheKey(tenantId, endToEndId);
      await cacheDatabaseManager.set(tenantCacheKey, buffer, redisTTL ?? DEFAULT_TTL);
    } else {
      loggerService.error('[pacs008] could not rebuild redis cache');
    }
  }

  span?.end();
  return dataCache;
};

// ============================================================================
// MAIN BUSINESS LOGIC FUNCTIONS
// ============================================================================

export const handlePain001 = async (transaction: Pain001 | (Pain001 & { TenantId: string }), transactionType: string): Promise<void> => {
  const tenantId = 'TenantId' in transaction && transaction.TenantId ? transaction.TenantId : 'DEFAULT';
  const id = transaction.CstmrCdtTrfInitn.GrpHdr.MsgId;

  loggerService.log(`Start - Handle transaction data for tenant ${tenantId}`, 'handlePain001()', id);

  const span = apm.startSpan('transaction.pain001.tenant');
  const startTime = process.hrtime.bigint();
  const TxTp = transactionType;
  transaction.TxTp = TxTp;
  const { Amt } = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;
  const { Ccy } = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;

  const [othrCreditorAcct] = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr;
  const creditorMmbId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;

  const [othrCreditor] = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr;
  const [othrDebtor] = transaction.CstmrCdtTrfInitn.PmtInf.Dbtr.Id.PrvtId.Othr;
  const [othrDebtorAcct] = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr;
  const debtorMmbId = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;

  // Always use tenant-aware key generation
  const creditorAcctId = generateCreditorAccountKey(tenantId, othrCreditorAcct.Id, othrCreditorAcct.SchmeNm.Prtry, creditorMmbId);
  const creditorId = generateCreditorEntityKey(tenantId, othrCreditor.Id, othrCreditor.SchmeNm.Prtry);
  const debtorId = generateDebtorEntityKey(tenantId, othrDebtor.Id, othrDebtor.SchmeNm.Prtry);
  const debtorAcctId = generateDebtorAccountKey(tenantId, othrDebtorAcct.Id, othrDebtorAcct.SchmeNm.Prtry, debtorMmbId);

  const { CreDtTm } = transaction.CstmrCdtTrfInitn.GrpHdr;

  const { EndToEndId } = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.PmtId;
  const lat = transaction.CstmrCdtTrfInitn.SplmtryData.Envlp.Doc.InitgPty.Glctn.Lat;
  const long = transaction.CstmrCdtTrfInitn.SplmtryData.Envlp.Doc.InitgPty.Glctn.Long;
  const { MsgId } = transaction.CstmrCdtTrfInitn.GrpHdr;
  const { PmtInfId } = transaction.CstmrCdtTrfInitn.PmtInf;

  const transactionRelationship: TransactionRelationship = {
    from: `accounts/${debtorAcctId}`,
    to: `accounts/${creditorAcctId}`,
    Amt,
    Ccy,
    CreDtTm,
    EndToEndId,
    lat,
    long,
    MsgId,
    PmtInfId,
    TxTp,
    TenantId: tenantId, // Standardized tenant identifier
  };

  const dataCache: DataCache = {
    cdtrId: creditorId,
    dbtrId: debtorId,
    cdtrAcctId: creditorAcctId,
    dbtrAcctId: debtorAcctId,
  };

  transaction.DataCache = dataCache;

  const spanInsert = apm.startSpan('db.insert.pain001.tenant');
  try {
    await Promise.all([
      cacheDatabaseManager.saveTransactionHistory(transaction, `pain001_${EndToEndId}`),
      cacheDatabaseManager.addAccount(debtorAcctId, tenantId),
      cacheDatabaseManager.addAccount(creditorAcctId, tenantId),
      cacheDatabaseManager.addEntity(creditorId, CreDtTm, tenantId),
      cacheDatabaseManager.addEntity(debtorId, CreDtTm, tenantId),
    ]);

    await Promise.all([
      cacheDatabaseManager.saveTransactionRelationship(transactionRelationship),
      cacheDatabaseManager.addAccountHolder(creditorId, creditorAcctId, CreDtTm, tenantId),
      cacheDatabaseManager.addAccountHolder(debtorId, debtorAcctId, CreDtTm, tenantId),
    ]);
  } catch (err) {
    loggerService.error(err instanceof Error ? err.message : JSON.stringify(err));
    throw handleDatabaseError(err, spanInsert, span);
  }
  spanInsert?.end();

  // Notify event-director
  notifyEventDirector(transaction, dataCache, startTime);
  loggerService.log('Transaction send to event-director service', 'handlePain001()', id);

  span?.end();
  loggerService.log('END - Handle transaction data', 'handlePain001()', id);
};

export const handlePain013 = async (transaction: Pain013 | (Pain013 & { TenantId: string }), transactionType: string): Promise<void> => {
  const tenantId = 'TenantId' in transaction && transaction.TenantId ? transaction.TenantId : 'DEFAULT';
  const logContext = 'handlePain013()';
  const id = transaction.CdtrPmtActvtnReq.GrpHdr.MsgId;

  loggerService.log(`Start - Handle transaction data for tenant ${tenantId}`, logContext, id);

  const span = apm.startSpan('transaction.pain013.tenant');
  const startTime = process.hrtime.bigint();

  const TxTp = transactionType;
  transaction.TxTp = TxTp;
  const { Amt } = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;
  const { Ccy } = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;
  const { CreDtTm } = transaction.CdtrPmtActvtnReq.GrpHdr;
  const { EndToEndId } = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.PmtId;
  const { MsgId } = transaction.CdtrPmtActvtnReq.GrpHdr;
  const { PmtInfId } = transaction.CdtrPmtActvtnReq.PmtInf;

  // Extract raw IDs for key generation
  const [creditorAcctOthr] = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr;
  const creditorMmbId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const [debtorAcctOthr] = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr;
  const debtorMmbId = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const [dbtrOthr] = transaction.CdtrPmtActvtnReq.PmtInf.Dbtr.Id.PrvtId.Othr;
  const [cdtrOthr] = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr;

  // Always use tenant-aware key generation
  const creditorAcctId = generateCreditorAccountKey(tenantId, creditorAcctOthr.Id, creditorAcctOthr.SchmeNm.Prtry, creditorMmbId);
  const debtorAcctId = generateDebtorAccountKey(tenantId, debtorAcctOthr.Id, debtorAcctOthr.SchmeNm.Prtry, debtorMmbId);
  const dbtrId = generateDebtorEntityKey(tenantId, dbtrOthr.Id, dbtrOthr.SchmeNm.Prtry);
  const cdtrId = generateCreditorEntityKey(tenantId, cdtrOthr.Id, cdtrOthr.SchmeNm.Prtry);

  const transactionRelationship: TransactionRelationship = {
    from: `accounts/${creditorAcctId}`,
    to: `accounts/${debtorAcctId}`,
    Amt,
    Ccy,
    CreDtTm,
    EndToEndId,
    MsgId,
    PmtInfId,
    TxTp,
    TenantId: tenantId, // Standardized tenant identifier
  };

  const dataCache: DataCache = {
    cdtrAcctId: creditorAcctId,
    dbtrAcctId: debtorAcctId,
    cdtrId,
    dbtrId,
  };

  transaction.DataCache = dataCache;
  transaction._key = MsgId;

  const spanInsert = apm.startSpan('db.insert.pain013.tenant');
  try {
    await Promise.all([
      cacheDatabaseManager.saveTransactionHistory(transaction, `pain013_${EndToEndId}`),
      cacheDatabaseManager.addAccount(debtorAcctId, tenantId),
      cacheDatabaseManager.addAccount(creditorAcctId, tenantId),
    ]);

    await cacheDatabaseManager.saveTransactionRelationship(transactionRelationship);
  } catch (err) {
    loggerService.error(err instanceof Error ? err.message : JSON.stringify(err), logContext, id);
    throw handleDatabaseError(err, spanInsert, span);
  }

  spanInsert?.end();

  // Notify event-director
  notifyEventDirector(transaction, dataCache, startTime);
  loggerService.log('Transaction send to event-director service', logContext, id);

  span?.end();
  loggerService.log('END - Handle transaction data', logContext, id);
};

export const handlePacs008 = async (transaction: Pacs008 | (Pacs008 & { TenantId: string }), transactionType: string): Promise<void> => {
  const tenantId = 'TenantId' in transaction && transaction.TenantId ? transaction.TenantId : 'DEFAULT';
  const logContext = 'handlePacs008()';
  const id = transaction.FIToFICstmrCdtTrf.GrpHdr.MsgId;

  loggerService.log(`Start - Handle transaction data for tenant ${tenantId}`, logContext, id);

  const span = apm.startSpan('transaction.pacs008.tenant');
  const startTime = process.hrtime.bigint();

  const TxTp = transactionType;
  transaction.TxTp = TxTp;
  const InstdAmt = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.InstdAmt.Amt.Amt;
  const InstdAmtCcy = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.InstdAmt.Amt.Ccy;
  const IntrBkSttlmAmt = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.IntrBkSttlmAmt.Amt.Amt;
  const IntrBkSttlmAmtCcy = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.IntrBkSttlmAmt.Amt.Ccy;
  const { XchgRate } = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf;
  const { Ccy } = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.InstdAmt.Amt;
  const creDtTm = transaction.FIToFICstmrCdtTrf.GrpHdr.CreDtTm;
  const { EndToEndId } = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.PmtId;
  const { MsgId } = transaction.FIToFICstmrCdtTrf.GrpHdr;
  const PmtInfId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.PmtId.InstrId;

  // Always use tenant-aware parseDataCache
  const { dbtrAcctId, dbtrId, cdtrAcctId, cdtrId } = parseDataCache(transaction as Pacs008, tenantId);

  const transactionRelationship: TransactionRelationship = {
    from: `accounts/${dbtrAcctId}`,
    to: `accounts/${cdtrAcctId}`,
    Amt: InstdAmt,
    Ccy,
    CreDtTm: creDtTm,
    EndToEndId,
    MsgId,
    PmtInfId,
    TxTp,
    TenantId: tenantId, // Standardized tenant identifier
  };

  const pendingPromises = [cacheDatabaseManager.addAccount(dbtrAcctId, tenantId), cacheDatabaseManager.addAccount(cdtrAcctId, tenantId)];

  const dataCache: DataCache = {
    cdtrId,
    dbtrId,
    cdtrAcctId,
    dbtrAcctId,
    creDtTm,
    instdAmt: {
      amt: parseFloat(InstdAmt),
      ccy: InstdAmtCcy,
    },
    intrBkSttlmAmt: {
      amt: parseFloat(IntrBkSttlmAmt),
      ccy: IntrBkSttlmAmtCcy,
    },
    xchgRate: XchgRate,
  };
  transaction.DataCache = dataCache;

  const cacheBuffer = createMessageBuffer({ DataCache: { ...dataCache } });
  if (cacheBuffer) {
    const redisTTL = configuration.redisConfig.distributedCacheTTL;
    // Use tenant-aware cache key for complete tenant isolation
    const tenantCacheKey = generateTenantCacheKey(tenantId, EndToEndId);
    pendingPromises.push(cacheDatabaseManager.set(tenantCacheKey, cacheBuffer, redisTTL ?? DEFAULT_TTL));
  } else {
    throw new Error('[pacs008] data cache could not be serialized');
  }

  if (!configuration.QUOTING) {
    pendingPromises.push(cacheDatabaseManager.addEntity(cdtrId, creDtTm, tenantId));
    pendingPromises.push(cacheDatabaseManager.addEntity(dbtrId, creDtTm, tenantId));

    await Promise.all(pendingPromises);

    await Promise.all([
      cacheDatabaseManager.addAccountHolder(cdtrId, cdtrAcctId, creDtTm, tenantId),
      cacheDatabaseManager.addAccountHolder(dbtrId, dbtrAcctId, creDtTm, tenantId),
    ]);
  } else {
    await Promise.all(pendingPromises);
  }

  const spanInsert = apm.startSpan('db.insert.pacs008');
  try {
    await Promise.all([
      cacheDatabaseManager.saveTransactionRelationship(transactionRelationship),
      cacheDatabaseManager.saveTransactionHistory(transaction, `pacs008_${EndToEndId}`),
    ]);
  } catch (err) {
    loggerService.error(err instanceof Error ? err.message : JSON.stringify(err), logContext, id);
    throw handleDatabaseError(err, spanInsert, span);
  } finally {
    spanInsert?.end();
  }

  // Notify event-director
  notifyEventDirector(transaction, dataCache, startTime);
  loggerService.log('Transaction send to event-director service', logContext, id);
  span?.end();
};

export const handlePacs002 = async (transaction: Pacs002 | (Pacs002 & { TenantId: string }), transactionType: string): Promise<void> => {
  const tenantId = 'TenantId' in transaction && transaction.TenantId ? transaction.TenantId : 'DEFAULT';
  const logContext = 'handlePacs002()';
  const id = transaction.FIToFIPmtSts.GrpHdr.MsgId;

  loggerService.log(`Start - Handle transaction data for tenant ${tenantId}`, logContext, id);

  const span = apm.startSpan('transactions.pacs002.tenant');
  const startTime = process.hrtime.bigint();

  const TxTp = transactionType;
  transaction.TxTp = TxTp;
  const { CreDtTm } = transaction.FIToFIPmtSts.GrpHdr;
  const EndToEndId = transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId;
  const { MsgId } = transaction.FIToFIPmtSts.GrpHdr;
  const PmtInfId = transaction.FIToFIPmtSts.TxInfAndSts.OrgnlInstrId;
  const { TxSts } = transaction.FIToFIPmtSts.TxInfAndSts;

  const transactionRelationship: TransactionRelationship = {
    from: '',
    to: '',
    CreDtTm,
    EndToEndId,
    MsgId,
    PmtInfId,
    TxTp,
    TxSts,
    TenantId: tenantId, // Standardized tenant identifier
  };

  let dataCache;
  const spanDataCache = apm.startSpan('req.get.dataCache.pacs002.tenant');
  try {
    // Use tenant-aware cache key for complete tenant isolation
    const tenantCacheKey = generateTenantCacheKey(tenantId, EndToEndId);
    const dataCacheJSON = (await cacheDatabaseManager.getBuffer(tenantCacheKey)).DataCache;
    dataCache = dataCacheJSON ? (dataCacheJSON as DataCache) : await rebuildCache(EndToEndId, false, tenantId, id);
  } catch (ex) {
    loggerService.error(`Could not retrieve data cache for: ${EndToEndId} from redis`, logContext, id);
    loggerService.log('Proceeding with Arango Call', logContext, id);
    dataCache = await rebuildCache(EndToEndId, false, tenantId, id);
  } finally {
    spanDataCache?.end();
  }

  transaction._key = MsgId;
  transaction.DataCache = dataCache;

  const spanInsert = apm.startSpan('db.insert.pacs002');
  try {
    await cacheDatabaseManager.saveTransactionHistory(transaction, `pacs002_${EndToEndId}`);

    // data cache is valid at this point
    transactionRelationship.to = `accounts/${dataCache?.dbtrAcctId}`;
    transactionRelationship.from = `accounts/${dataCache?.cdtrAcctId}`;

    await cacheDatabaseManager.saveTransactionRelationship(transactionRelationship);
  } catch (err) {
    loggerService.log(err instanceof Error ? err.message : JSON.stringify(err), logContext, id);
    throw handleDatabaseError(err, spanInsert, span);
  } finally {
    spanInsert?.end();
  }

  // Notify event-director
  notifyEventDirector(transaction, dataCache, startTime);
  loggerService.log('Transaction send to event-director service', logContext, id);

  span?.end();
  loggerService.log('END - Handle transaction data', logContext, id);
};

// ============================================================================
// EXPORTS FOR TESTING AND EXTERNAL USE
// ============================================================================

// Export utility functions for testing and external usage
export { calculateDuration, parseDataCache, type AccountIds };
