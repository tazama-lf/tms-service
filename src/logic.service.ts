// SPDX-License-Identifier: Apache-2.0
import apm from './apm';
import { createMessageBuffer } from '@tazama-lf/frms-coe-lib/lib/helpers/protobuf';
import type { DataCache, Pacs002, Pacs008, Pain001, Pain013 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { cacheDatabaseManager, loggerService, server } from '.';
import { configuration } from './';
import type { TransactionRelationship } from './interfaces/iTransactionRelationship';

// Utility imports
import { calculateDuration } from './utils/commonUtils';
import { parseDataCacheTenantAware } from './utils/dataCacheUtils';
import { rebuildCache } from './utils/cacheRebuildUtils';
import {
  generateDebtorEntityKey,
  generateCreditorEntityKey,
  generateDebtorAccountKey,
  generateCreditorAccountKey,
} from './utils/tenantKeyGenerator';

export const handlePain001 = async (transaction: Pain001 | (Pain001 & { tenantId: string }), transactionType: string): Promise<void> => {
  const tenantId = 'tenantId' in transaction && transaction.tenantId ? transaction.tenantId : 'DEFAULT';
  const id = transaction.CstmrCdtTrfInitn.GrpHdr.MsgId;

  loggerService.log(`Start - Handle transaction data for tenant ${tenantId}`, 'handlePain001()', id);

  const span = apm.startSpan('transaction.pain001.tenant');
  const startTime = process.hrtime.bigint();
  const TxTp = transactionType;
  transaction.TxTp = TxTp;
  const { Amt } = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;
  const { Ccy } = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;

  const othrCreditorAcct = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0];
  const creditorMmbId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;

  const othrCreditor = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr[0];
  const othrDebtor = transaction.CstmrCdtTrfInitn.PmtInf.Dbtr.Id.PrvtId.Othr[0];
  const othrDebtorAcct = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr[0];
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
    tenantId, // Always include tenantId
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
      cacheDatabaseManager.addAccount(debtorAcctId),
      cacheDatabaseManager.addAccount(creditorAcctId),
      cacheDatabaseManager.addEntity(creditorId, CreDtTm),
      cacheDatabaseManager.addEntity(debtorId, CreDtTm),
    ]);

    await Promise.all([
      cacheDatabaseManager.saveTransactionRelationship(transactionRelationship),
      cacheDatabaseManager.addAccountHolder(creditorId, creditorAcctId, CreDtTm),
      cacheDatabaseManager.addAccountHolder(debtorId, debtorAcctId, CreDtTm),
    ]);
  } catch (err) {
    let error: Error;
    if (err instanceof Error) {
      loggerService.error(err.message);
      error = err;
    } else {
      const strErr = JSON.stringify(err);
      loggerService.error(strErr);
      error = new Error(strErr);
    }
    spanInsert?.end();
    span?.end();
    throw error;
  }
  spanInsert?.end();

  // Notify event-director
  server.handleResponse({
    transaction,
    DataCache: dataCache,
    metaData: {
      prcgTmDP: calculateDuration(startTime),
      traceParent: apm.getCurrentTraceparent(),
    },
  });
  loggerService.log('Transaction send to event-director service', 'handlePain001()', id);

  span?.end();
  loggerService.log('END - Handle transaction data', 'handlePain001()', id);
};

export const handlePain013 = async (transaction: Pain013 | (Pain013 & { tenantId: string }), transactionType: string): Promise<void> => {
  const tenantId = 'tenantId' in transaction && transaction.tenantId ? transaction.tenantId : 'DEFAULT';
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
  const creditorAcctOthr = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0];
  const creditorMmbId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const debtorAcctOthr = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr[0];
  const debtorMmbId = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const dbtrOthr = transaction.CdtrPmtActvtnReq.PmtInf.Dbtr.Id.PrvtId.Othr[0];
  const cdtrOthr = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr[0];

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
    tenantId, // Always include tenantId
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
      cacheDatabaseManager.addAccount(debtorAcctId),
      cacheDatabaseManager.addAccount(creditorAcctId),
    ]);

    await cacheDatabaseManager.saveTransactionRelationship(transactionRelationship);
  } catch (err) {
    let error: Error;
    if (err instanceof Error) {
      loggerService.error(err.message, logContext, id);
      error = err;
    } else {
      const strErr = JSON.stringify(err);
      error = new Error(strErr);
      loggerService.error(strErr, logContext, id);
    }
    spanInsert?.end();
    span?.end();
    throw error;
  }

  spanInsert?.end();

  // Notify event-director
  server.handleResponse({
    transaction,
    DataCache: dataCache,
    metaData: {
      prcgTmDP: calculateDuration(startTime),
      traceParent: apm.getCurrentTraceparent(),
    },
  });
  loggerService.log('Transaction send to event-director service', logContext, id);

  span?.end();
  loggerService.log('END - Handle transaction data', logContext, id);
};

export const handlePacs008 = async (transaction: Pacs008 | (Pacs008 & { tenantId: string }), transactionType: string): Promise<void> => {
  const tenantId = 'tenantId' in transaction && transaction.tenantId ? transaction.tenantId : 'DEFAULT';
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
  const { dbtrAcctId, dbtrId, cdtrAcctId, cdtrId } = parseDataCacheTenantAware(transaction as Pacs008, tenantId);

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
    tenantId, // Always include tenantId
  };

  const pendingPromises = [cacheDatabaseManager.addAccount(dbtrAcctId), cacheDatabaseManager.addAccount(cdtrAcctId)];

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
    const tenantCacheKey = `${tenantId}:${EndToEndId}`;
    pendingPromises.push(cacheDatabaseManager.set(tenantCacheKey, cacheBuffer, redisTTL ?? 0));
  } else {
    throw new Error('[pacs008] data cache could not be serialized');
  }

  if (!configuration.QUOTING) {
    pendingPromises.push(cacheDatabaseManager.addEntity(cdtrId, creDtTm));
    pendingPromises.push(cacheDatabaseManager.addEntity(dbtrId, creDtTm));

    await Promise.all(pendingPromises);

    await Promise.all([
      cacheDatabaseManager.addAccountHolder(cdtrId, cdtrAcctId, creDtTm),
      cacheDatabaseManager.addAccountHolder(dbtrId, dbtrAcctId, creDtTm),
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
    let error: Error;
    if (err instanceof Error) {
      loggerService.error(err.message, logContext, id);
      error = err;
    } else {
      const strErr = JSON.stringify(err);
      loggerService.error(strErr, logContext, id);
      error = new Error(strErr);
    }
    spanInsert?.end();
    span?.end();
    throw error;
  } finally {
    spanInsert?.end();
  }

  // Notify event-director
  server.handleResponse({
    transaction,
    DataCache: dataCache,
    metaData: {
      prcgTmDP: calculateDuration(startTime),
      traceParent: apm.getCurrentTraceparent(),
    },
  });
  loggerService.log('Transaction send to event-director service', logContext, id);
  span?.end();
};

export const handlePacs002 = async (transaction: Pacs002 | (Pacs002 & { tenantId: string }), transactionType: string): Promise<void> => {
  const tenantId = 'tenantId' in transaction && transaction.tenantId ? transaction.tenantId : 'DEFAULT';
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
    tenantId, // Always include tenantId
  };

  let dataCache;
  const spanDataCache = apm.startSpan('req.get.dataCache.pacs002.tenant');
  try {
    // Use tenant-aware cache key for complete tenant isolation
    const tenantCacheKey = `${tenantId}:${EndToEndId}`;
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
    let error: Error;
    if (err instanceof Error) {
      loggerService.log(err.message, logContext, id);
      error = err;
    } else {
      const strErr = JSON.stringify(err);
      loggerService.log(strErr, logContext, id);
      error = new Error(strErr);
    }
    spanInsert?.end();
    span?.end();
    throw error;
  } finally {
    spanInsert?.end();
  }

  // Notify event-director
  server.handleResponse({
    transaction,
    DataCache: dataCache,
    metaData: {
      prcgTmDP: calculateDuration(startTime),
      traceParent: apm.getCurrentTraceparent(),
    },
  });
  loggerService.log('Transaction send to event-director service', logContext, id);

  span?.end();
  loggerService.log('END - Handle transaction data', logContext, id);
};
