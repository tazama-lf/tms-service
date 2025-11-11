// SPDX-License-Identifier: Apache-2.0
import apm from './apm';

import { createMessageBuffer } from '@tazama-lf/frms-coe-lib/lib/helpers/protobuf';
import type { DataCache, Pacs002, Pacs008, Pain001, Pain013, TransactionDetails } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { cacheDatabaseManager, loggerService, server } from '.';
import { configuration } from './';
import type { TransactionTypes } from './utils/schema-utils';

const calculateDuration = (startTime: bigint): number => {
  const endTime = process.hrtime.bigint();
  return Number(endTime - startTime);
};

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

const notifyEventDirector = (transaction: TransactionTypes, dataCache: DataCache | undefined, startTime: bigint): void => {
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

const parseDataCache = (transaction: Pacs008): AccountIds => {
  const [debtorOthr] = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.Dbtr.Id.PrvtId.Othr;
  const [creditorOthr] = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr;
  const [debtorAcctOthr] = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAcct.Id.Othr;
  const debtorMmbId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const [creditorAcctOthr] = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAcct.Id.Othr;
  const creditorMmbId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;

  const debtorId = `${debtorOthr.Id}${debtorOthr.SchmeNm.Prtry}`;
  const creditorId = `${creditorOthr.Id}${creditorOthr.SchmeNm.Prtry}`;
  const debtorAcctId = `${debtorAcctOthr.Id}${debtorAcctOthr.SchmeNm.Prtry}${debtorMmbId}`;
  const creditorAcctId = `${creditorAcctOthr.Id}${creditorAcctOthr.SchmeNm.Prtry}${creditorMmbId}`;

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
 * @param {string} id - ID for logging
 * @return {*}  {(Promise<DataCache | undefined>)}
 */
export const rebuildCache = async (
  endToEndId: string,
  writeToRedis: boolean,
  tenantId: string,
  id: string,
): Promise<DataCache | undefined> => {
  const span = apm.startSpan('db.cache.rebuild.tenant');
  const context = 'rebuildCache()';
  const pacs008 = await cacheDatabaseManager.getTransactionPacs008(endToEndId, tenantId);

  if (!pacs008) {
    loggerService.error('Could not find pacs008 transaction to rebuild dataCache with', context, id);
    span?.end();
    return undefined;
  }

  const cdtTrfTxInf = pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf;

  const { cdtrId, cdtrAcctId, dbtrId, dbtrAcctId } = parseDataCache(pacs008);

  const dataCache: DataCache = {
    cdtrId,
    dbtrId,
    cdtrAcctId,
    dbtrAcctId,
    creDtTm: pacs008.FIToFICstmrCdtTrf.GrpHdr.CreDtTm,
    instdAmt: {
      amt: cdtTrfTxInf.InstdAmt.Amt.Amt,
      ccy: cdtTrfTxInf.InstdAmt.Amt.Ccy,
    },
    intrBkSttlmAmt: {
      amt: cdtTrfTxInf.IntrBkSttlmAmt.Amt.Amt,
      ccy: cdtTrfTxInf.IntrBkSttlmAmt.Amt.Ccy,
    },
    xchgRate: cdtTrfTxInf.XchgRate,
  };

  if (writeToRedis) {
    const buffer = createMessageBuffer({ DataCache: { ...dataCache } });

    if (buffer) {
      const redisTTL = configuration.redisConfig.distributedCacheTTL;
      const tenantCacheKey = `${tenantId}:${endToEndId}`;
      await cacheDatabaseManager.set(tenantCacheKey, buffer, redisTTL ?? 0);
    } else {
      loggerService.error('[pacs008] could not rebuild redis cache');
    }
  }

  span?.end();
  return dataCache;
};

export const handlePain001 = async (transaction: Pain001): Promise<void> => {
  const { TenantId } = transaction;
  const id = transaction.CstmrCdtTrfInitn.GrpHdr.MsgId;

  loggerService.log(`Start - Handle transaction data for tenant ${TenantId}`, 'handlePain001()', id);

  const span = apm.startSpan('transaction.pain001.tenant');
  const startTime = process.hrtime.bigint();
  const { TxTp } = transaction;
  const { Amt } = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;
  const { Ccy } = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;

  const [othrCreditorAcct] = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr;
  const creditorMmbId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const creditorAcctId = `${othrCreditorAcct.Id}${othrCreditorAcct.SchmeNm.Prtry}${creditorMmbId}`;

  const [othrCreditor] = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr;
  const creditorId = `${othrCreditor.Id}${othrCreditor.SchmeNm.Prtry}`;

  const [othrDebtor] = transaction.CstmrCdtTrfInitn.PmtInf.Dbtr.Id.PrvtId.Othr;
  const debtorId = `${othrDebtor.Id}${othrDebtor.SchmeNm.Prtry}`;

  const { CreDtTm } = transaction.CstmrCdtTrfInitn.GrpHdr;

  const [othrDebtorAcct] = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr;
  const debtorMmbId = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const debtorAcctId = `${othrDebtorAcct.Id}${othrDebtorAcct.SchmeNm.Prtry}${debtorMmbId}`;

  const { EndToEndId } = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.PmtId;
  const lat = transaction.CstmrCdtTrfInitn.SplmtryData.Envlp.Doc.InitgPty.Glctn.Lat;
  const long = transaction.CstmrCdtTrfInitn.SplmtryData.Envlp.Doc.InitgPty.Glctn.Long;
  const { MsgId } = transaction.CstmrCdtTrfInitn.GrpHdr;

  const transactionDetails: TransactionDetails = {
    source: debtorAcctId,
    destination: creditorAcctId,
    Amt,
    Ccy,
    CreDtTm,
    EndToEndId,
    lat,
    long,
    MsgId,
    TxTp,
    TenantId,
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
      cacheDatabaseManager.saveTransactionHistory(transaction),
      cacheDatabaseManager.addAccount(debtorAcctId, TenantId),
      cacheDatabaseManager.addAccount(creditorAcctId, TenantId),
      cacheDatabaseManager.addEntity(creditorId, TenantId, CreDtTm),
      cacheDatabaseManager.addEntity(debtorId, TenantId, CreDtTm),
    ]);

    await Promise.all([
      cacheDatabaseManager.saveTransactionDetails(transactionDetails),
      cacheDatabaseManager.addAccountHolder(creditorId, creditorAcctId, CreDtTm, TenantId),
      cacheDatabaseManager.addAccountHolder(debtorId, debtorAcctId, CreDtTm, TenantId),
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

export const handlePain013 = async (transaction: Pain013): Promise<void> => {
  const { TenantId } = transaction;
  const logContext = 'handlePain013()';
  const id = transaction.CdtrPmtActvtnReq.GrpHdr.MsgId;

  loggerService.log(`Start - Handle transaction data for tenant ${TenantId}`, logContext, id);

  const span = apm.startSpan('transaction.pain013.tenant');
  const startTime = process.hrtime.bigint();

  const { TxTp } = transaction;
  const { Amt } = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;
  const { Ccy } = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;
  const { CreDtTm } = transaction.CdtrPmtActvtnReq.GrpHdr;
  const { EndToEndId } = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.PmtId;
  const { MsgId } = transaction.CdtrPmtActvtnReq.GrpHdr;

  const [creditorAcctOthr] = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr;
  const creditorMmbId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const creditorAcctId = `${creditorAcctOthr.Id}${creditorAcctOthr.SchmeNm.Prtry}${creditorMmbId}`;

  const [debtorAcctOthr] = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr;
  const debtorMmbId = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const debtorAcctId = `${debtorAcctOthr.Id}${debtorAcctOthr.SchmeNm.Prtry}${debtorMmbId}`;

  const [dbtrOthr] = transaction.CdtrPmtActvtnReq.PmtInf.Dbtr.Id.PrvtId.Othr;
  const dbtrId = `${dbtrOthr.Id}${dbtrOthr.SchmeNm.Prtry}`;

  const [cdtrOthr] = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr;
  const cdtrId = `${cdtrOthr.Id}${cdtrOthr.SchmeNm.Prtry}`;

  const transactionDetails: TransactionDetails = {
    source: creditorAcctId,
    destination: debtorAcctId,
    Amt,
    Ccy,
    CreDtTm,
    EndToEndId,
    MsgId,
    TxTp,
    TenantId,
  };

  const dataCache: DataCache = {
    cdtrAcctId: creditorAcctId,
    dbtrAcctId: debtorAcctId,
    cdtrId,
    dbtrId,
  };

  transaction.DataCache = dataCache;

  const spanInsert = apm.startSpan('db.insert.pain013.tenant');
  try {
    await Promise.all([
      cacheDatabaseManager.saveTransactionHistory(transaction),
      cacheDatabaseManager.addAccount(debtorAcctId, TenantId),
      cacheDatabaseManager.addAccount(creditorAcctId, TenantId),
    ]);

    await cacheDatabaseManager.saveTransactionDetails(transactionDetails);
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

export const handlePacs008 = async (transaction: Pacs008): Promise<void> => {
  const { TenantId } = transaction;
  const logContext = 'handlePacs008()';
  const id = transaction.FIToFICstmrCdtTrf.GrpHdr.MsgId;

  loggerService.log(`Start - Handle transaction data for tenant ${TenantId}`, logContext, id);

  const span = apm.startSpan('transaction.pacs008.tenant');
  const startTime = process.hrtime.bigint();

  const { TxTp } = transaction;
  const InstdAmt = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.InstdAmt.Amt.Amt;
  const InstdAmtCcy = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.InstdAmt.Amt.Ccy;
  const IntrBkSttlmAmt = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.IntrBkSttlmAmt.Amt.Amt;
  const IntrBkSttlmAmtCcy = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.IntrBkSttlmAmt.Amt.Ccy;
  const { XchgRate } = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf;
  const { Ccy } = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.InstdAmt.Amt;
  const creDtTm = transaction.FIToFICstmrCdtTrf.GrpHdr.CreDtTm;
  const { EndToEndId } = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.PmtId;
  const { MsgId } = transaction.FIToFICstmrCdtTrf.GrpHdr;

  const { dbtrAcctId, dbtrId, cdtrAcctId, cdtrId } = parseDataCache(transaction);

  const transactionDetails: TransactionDetails = {
    source: dbtrAcctId,
    destination: cdtrAcctId,
    Amt: InstdAmt,
    Ccy,
    CreDtTm: creDtTm,
    EndToEndId,
    MsgId,
    TxTp,
    TenantId,
  };

  const pendingPromises = [cacheDatabaseManager.addAccount(dbtrAcctId, TenantId), cacheDatabaseManager.addAccount(cdtrAcctId, TenantId)];

  const dataCache: DataCache = {
    cdtrId,
    dbtrId,
    cdtrAcctId,
    dbtrAcctId,
    creDtTm,
    instdAmt: {
      amt: InstdAmt,
      ccy: InstdAmtCcy,
    },
    intrBkSttlmAmt: {
      amt: IntrBkSttlmAmt,
      ccy: IntrBkSttlmAmtCcy,
    },
    xchgRate: XchgRate,
  };
  transaction.DataCache = dataCache;

  const cacheBuffer = createMessageBuffer({ DataCache: { ...dataCache } });
  if (cacheBuffer) {
    const redisTTL = configuration.redisConfig.distributedCacheTTL;
    const tenantCacheKey = `${TenantId}:${EndToEndId}`;
    pendingPromises.push(cacheDatabaseManager.set(tenantCacheKey, cacheBuffer, redisTTL ?? 0));
  } else {
    throw new Error('[pacs008] data cache could not be serialized');
  }

  if (!configuration.QUOTING) {
    pendingPromises.push(cacheDatabaseManager.addEntity(cdtrId, TenantId, creDtTm));
    pendingPromises.push(cacheDatabaseManager.addEntity(dbtrId, TenantId, creDtTm));

    await Promise.all(pendingPromises);

    await Promise.all([
      cacheDatabaseManager.addAccountHolder(cdtrId, cdtrAcctId, creDtTm, TenantId),
      cacheDatabaseManager.addAccountHolder(dbtrId, dbtrAcctId, creDtTm, TenantId),
    ]);
  } else {
    await Promise.all(pendingPromises);
  }

  const spanInsert = apm.startSpan('db.insert.pacs008');
  try {
    await Promise.all([
      cacheDatabaseManager.saveTransactionDetails(transactionDetails),
      cacheDatabaseManager.saveTransactionHistory(transaction),
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

export const handlePacs002 = async (transaction: Pacs002): Promise<void> => {
  const { TenantId } = transaction;
  const logContext = 'handlePacs002()';
  const id = transaction.FIToFIPmtSts.GrpHdr.MsgId;

  loggerService.log(`Start - Handle transaction data for tenant ${TenantId}`, logContext, id);

  const span = apm.startSpan('transactions.pacs002.tenant');
  const startTime = process.hrtime.bigint();

  const { TxTp } = transaction;
  const { CreDtTm } = transaction.FIToFIPmtSts.GrpHdr;
  const EndToEndId = transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId;
  const { MsgId } = transaction.FIToFIPmtSts.GrpHdr;
  const { TxSts } = transaction.FIToFIPmtSts.TxInfAndSts;

  const transactionDetails: TransactionDetails = {
    source: '',
    destination: '',
    CreDtTm,
    EndToEndId,
    MsgId,
    TxTp,
    TxSts,
    TenantId,
  };

  let dataCache;
  const spanDataCache = apm.startSpan('req.get.dataCache.pacs002.tenant');
  try {
    const tenantCacheKey = `${TenantId}:${EndToEndId}`;
    const dataCacheJSON = (await cacheDatabaseManager.getBuffer(tenantCacheKey)).DataCache;
    dataCache = dataCacheJSON ? (dataCacheJSON as DataCache) : await rebuildCache(EndToEndId, false, TenantId, id);
  } catch (ex) {
    loggerService.error(`Could not retrieve data cache for: ${EndToEndId} from redis`, logContext, id);
    loggerService.log('Proceeding with Datacache rebuild', logContext, id);
    dataCache = await rebuildCache(EndToEndId, false, TenantId, id);
  } finally {
    spanDataCache?.end();
  }

  transaction.DataCache = dataCache;

  const spanInsert = apm.startSpan('db.insert.pacs002');
  try {
    await cacheDatabaseManager.saveTransactionHistory(transaction);

    // data cache is valid at this point

    if (dataCache?.cdtrAcctId && dataCache.dbtrAcctId) {
      transactionDetails.destination = dataCache.dbtrAcctId;
      transactionDetails.source = dataCache.cdtrAcctId;
    }

    await cacheDatabaseManager.saveTransactionDetails(transactionDetails);
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

// Export utility functions for testing and external usage
export { calculateDuration, parseDataCache, type AccountIds };
