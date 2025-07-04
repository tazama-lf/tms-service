// SPDX-License-Identifier: Apache-2.0
import apm from './apm';
import { createMessageBuffer } from '@tazama-lf/frms-coe-lib/lib/helpers/protobuf';
import { unwrap } from '@tazama-lf/frms-coe-lib/lib/helpers/unwrap';
import type { DataCache, Pacs002, Pacs008, Pain001, Pain013 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { cacheDatabaseManager, loggerService, server } from '.';
import { configuration } from './';
import type { TransactionRelationship } from './interfaces/iTransactionRelationship';

const calculateDuration = (startTime: bigint): number => {
  const endTime = process.hrtime.bigint();
  return Number(endTime - startTime);
};

export const handlePain001 = async (transaction: Pain001, transactionType: string): Promise<void> => {
  const id = transaction.CstmrCdtTrfInitn.GrpHdr.MsgId;
  loggerService.log('Start - Handle transaction data', 'handlePain001()', id);
  const span = apm.startSpan('transaction.pain001');
  const startTime = process.hrtime.bigint();
  const TxTp = transactionType;
  transaction.TxTp = TxTp;
  const { Amt } = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;
  const { Ccy } = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;

  const othrCreditorAcct = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0];
  const creditorMmbId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const creditorAcctId = `${othrCreditorAcct.Id}${othrCreditorAcct.SchmeNm.Prtry}${creditorMmbId}`;

  const othrCreditor = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr[0];
  const creditorId = `${othrCreditor.Id}${othrCreditor.SchmeNm.Prtry}`;

  const othrDebtor = transaction.CstmrCdtTrfInitn.PmtInf.Dbtr.Id.PrvtId.Othr[0];
  const debtorId = `${othrDebtor.Id}${othrDebtor.SchmeNm.Prtry}`;

  const { CreDtTm } = transaction.CstmrCdtTrfInitn.GrpHdr;

  const othrDebtorAcct = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr[0];
  const debtorMmbId = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const debtorAcctId = `${othrDebtorAcct.Id}${othrDebtorAcct.SchmeNm.Prtry}${debtorMmbId}`;

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
  };

  const dataCache: DataCache = {
    cdtrId: creditorId,
    dbtrId: debtorId,
    cdtrAcctId: creditorAcctId,
    dbtrAcctId: debtorAcctId,
  };

  transaction.DataCache = dataCache;

  const spanInsert = apm.startSpan('db.insert.pain001');
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

export const handlePain013 = async (transaction: Pain013, transactionType: string): Promise<void> => {
  const logContext = 'handlePain013()';
  const id = transaction.CdtrPmtActvtnReq.GrpHdr.MsgId;
  loggerService.log('Start - Handle transaction data', logContext, id);
  const span = apm.startSpan('transaction.pain013');
  const startTime = process.hrtime.bigint();

  const TxTp = transactionType;
  transaction.TxTp = TxTp;
  const { Amt } = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;
  const { Ccy } = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt;
  const { CreDtTm } = transaction.CdtrPmtActvtnReq.GrpHdr;
  const { EndToEndId } = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.PmtId;
  const { MsgId } = transaction.CdtrPmtActvtnReq.GrpHdr;
  const { PmtInfId } = transaction.CdtrPmtActvtnReq.PmtInf;

  const creditorAcctOthr = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0];
  const creditorMmbId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const creditorAcctId = `${creditorAcctOthr.Id}${creditorAcctOthr.SchmeNm.Prtry}${creditorMmbId}`;

  const debtorAcctOthr = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr[0];
  const debtorMmbId = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const debtorAcctId = `${debtorAcctOthr.Id}${debtorAcctOthr.SchmeNm.Prtry}${debtorMmbId}`;

  const dbtrOthr = transaction.CdtrPmtActvtnReq.PmtInf.Dbtr.Id.PrvtId.Othr[0];
  const dbtrId = `${dbtrOthr.Id}${dbtrOthr.SchmeNm.Prtry}`;

  const cdtrOthr = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr[0];
  const cdtrId = `${cdtrOthr.Id}${cdtrOthr.SchmeNm.Prtry}`;

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
  };

  const dataCache: DataCache = {
    cdtrAcctId: creditorAcctId,
    dbtrAcctId: debtorAcctId,
    cdtrId,
    dbtrId,
  };

  transaction.DataCache = dataCache;
  transaction._key = MsgId;

  const spanInsert = apm.startSpan('db.insert.pain013');
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

export const handlePacs008 = async (transaction: Pacs008, transactionType: string): Promise<void> => {
  const logContext = 'handlePacs008()';
  const id = transaction.FIToFICstmrCdtTrf.GrpHdr.MsgId;
  loggerService.log('Start - Handle transaction data', logContext, id);
  const span = apm.startSpan('transaction.pacs008');
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

  const { dbtrAcctId, dbtrId, cdtrAcctId, cdtrId } = parseDataCache(transaction);

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
    pendingPromises.push(cacheDatabaseManager.set(EndToEndId, cacheBuffer, redisTTL ?? 0));
  } else {
    // this is fatal
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

export const handlePacs002 = async (transaction: Pacs002, transactionType: string): Promise<void> => {
  const logContext = 'handlePacs002()';
  const id = transaction.FIToFIPmtSts.GrpHdr.MsgId;
  loggerService.log('Start - Handle transaction data', logContext, id);
  const span = apm.startSpan('transactions.pacs002');
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
  };

  let dataCache;
  const spanDataCache = apm.startSpan('req.get.dataCache.pacs002');
  try {
    const dataCacheJSON = (await cacheDatabaseManager.getBuffer(EndToEndId)).DataCache;
    dataCache = dataCacheJSON ? (dataCacheJSON as DataCache) : await rebuildCache(EndToEndId, false, id);
  } catch (ex) {
    loggerService.error(`Could not retrieve data cache for: ${EndToEndId} from redis`, logContext, id);
    loggerService.log('Proceeding with Arango Call', logContext, id);
    dataCache = await rebuildCache(EndToEndId, false, id);
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

/**
 * Rebuilds the DataCache object using the given endToEndId to fetch a stored Pacs008 message
 *
 * @param {string} endToEndId
 * @return {*}  {(Promise<DataCache | undefined>)}
 */
export const rebuildCache = async (endToEndId: string, writeToRedis: boolean, id?: string): Promise<DataCache | undefined> => {
  const span = apm.startSpan('db.cache.rebuild');
  const context = 'rebuildCache()';
  const currentPacs008 = (await cacheDatabaseManager.getTransactionPacs008(endToEndId)) as [Pacs008[]];

  const pacs008 = unwrap(currentPacs008);

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
      await cacheDatabaseManager.set(endToEndId, buffer, redisTTL ?? 0);
    } else {
      loggerService.error('[pacs008] could not rebuild redis cache');
    }
  }

  span?.end();
  return dataCache;
};

// A utility type for the fields we are extracting from the pacs008 entity
type AccountIds = Required<Pick<DataCache, 'cdtrId' | 'dbtrId' | 'dbtrAcctId' | 'cdtrAcctId'>>;

// reused by the pacs008 handler and rebuildCache function
function parseDataCache(transaction: Pacs008): AccountIds {
  const debtorOthr = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.Dbtr.Id.PrvtId.Othr[0];
  const debtorId = `${debtorOthr.Id}${debtorOthr.SchmeNm.Prtry}`;

  const creditorOthr = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr[0];
  const creditorId = `${creditorOthr.Id}${creditorOthr.SchmeNm.Prtry}`;

  const debtorAcctOthr = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAcct.Id.Othr[0];
  const debtorMmbId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const debtorAcctId = `${debtorAcctOthr.Id}${debtorAcctOthr.SchmeNm.Prtry}${debtorMmbId}`;

  const creditorAcctOthr = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAcct.Id.Othr[0];
  const creditorMmbId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const creditorAcctId = `${creditorAcctOthr.Id}${creditorAcctOthr.SchmeNm.Prtry}${creditorMmbId}`;

  return {
    cdtrId: creditorId,
    dbtrId: debtorId,
    cdtrAcctId: creditorAcctId,
    dbtrAcctId: debtorAcctId,
  };
}
