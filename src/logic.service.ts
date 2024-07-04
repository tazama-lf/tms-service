// SPDX-License-Identifier: Apache-2.0
import apm from './apm';
import { cacheDatabaseManager, loggerService, server } from '.';
import { type Pacs002, type Pacs008, type Pain001, type Pain013, type DataCache } from '@frmscoe/frms-coe-lib/lib/interfaces';
import { configuration } from './config';
import { type TransactionRelationship } from './interfaces/iTransactionRelationship';
import { createMessageBuffer } from '@frmscoe/frms-coe-lib/lib/helpers/protobuf';
import { unwrap } from '@frmscoe/frms-coe-lib/lib/helpers/unwrap';

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
  const Amt = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Amt;
  const Ccy = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy;
  const creditorAcctId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0].Id;
  const creditorId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr[0].Id;
  const CreDtTm = transaction.CstmrCdtTrfInitn.GrpHdr.CreDtTm;
  const debtorAcctId = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr[0].Id;
  const debtorId = transaction.CstmrCdtTrfInitn.PmtInf.Dbtr.Id.PrvtId.Othr[0].Id;
  const EndToEndId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.PmtId.EndToEndId;
  const lat = transaction.CstmrCdtTrfInitn.SplmtryData.Envlp.Doc.InitgPty.Glctn.Lat;
  const long = transaction.CstmrCdtTrfInitn.SplmtryData.Envlp.Doc.InitgPty.Glctn.Long;
  const MsgId = transaction.CstmrCdtTrfInitn.GrpHdr.MsgId;
  const PmtInfId = transaction.CstmrCdtTrfInitn.PmtInf.PmtInfId;

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
  const spanInsert = apm.startSpan('db.insert.pain001');
  try {
    await Promise.all([
      cacheDatabaseManager.saveTransactionHistory(transaction, configuration.transactionHistoryPain001Collection, `pain001_${EndToEndId}`),
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
  const Amt = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Amt;
  const Ccy = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy;
  const CreDtTm = transaction.CdtrPmtActvtnReq.GrpHdr.CreDtTm;
  const EndToEndId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.PmtId.EndToEndId;
  const MsgId = transaction.CdtrPmtActvtnReq.GrpHdr.MsgId;
  const PmtInfId = transaction.CdtrPmtActvtnReq.PmtInf.PmtInfId;

  const creditorAcctId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0].Id;
  const debtorAcctId = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr[0].Id;

  const dbtrId = transaction.CdtrPmtActvtnReq.PmtInf.Dbtr.Id.PrvtId.Othr[0].Id;
  const cdtrId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr[0].Id;

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

  transaction._key = MsgId;

  const spanInsert = apm.startSpan('db.insert.pain013');
  try {
    await Promise.all([
      cacheDatabaseManager.saveTransactionHistory(transaction, configuration.transactionHistoryPain013Collection, `pain013_${EndToEndId}`),
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
  const Amt = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.InstdAmt.Amt.Amt;
  const Ccy = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.InstdAmt.Amt.Ccy;
  const creDtTm = transaction.FIToFICstmrCdtTrf.GrpHdr.CreDtTm;
  const EndToEndId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.PmtId.EndToEndId;
  const MsgId = transaction.FIToFICstmrCdtTrf.GrpHdr.MsgId;
  const PmtInfId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.PmtId.InstrId;
  const debtorId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.Dbtr.Id.PrvtId.Othr[0].Id;
  const creditorId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr[0].Id;

  const debtorAcctId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAcct.Id.Othr[0].Id;
  const creditorAcctId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAcct.Id.Othr[0].Id;

  const transactionRelationship: TransactionRelationship = {
    from: `accounts/${debtorAcctId}`,
    to: `accounts/${creditorAcctId}`,
    Amt,
    Ccy,
    CreDtTm: creDtTm,
    EndToEndId,
    MsgId,
    PmtInfId,
    TxTp,
  };

  const accountInserts = [cacheDatabaseManager.addAccount(debtorAcctId), cacheDatabaseManager.addAccount(creditorAcctId)];

  const dataCache: DataCache = {
    cdtrId: creditorId,
    dbtrId: debtorId,
    cdtrAcctId: creditorAcctId,
    dbtrAcctId: debtorAcctId,
    creDtTm,
    amt: {
      amt: parseFloat(Amt),
      ccy: Ccy,
    },
  };
  const cacheBuffer = createMessageBuffer({ DataCache: { ...dataCache } });
  if (cacheBuffer) {
    accountInserts.push(cacheDatabaseManager.set(EndToEndId, cacheBuffer, configuration.cacheTTL));
  } else {
    // this is fatal
    throw new Error('[pacs008] data cache could not be serialised');
  }

  if (!configuration.quoting) {
    accountInserts.push(cacheDatabaseManager.addEntity(creditorId, creDtTm));
    accountInserts.push(cacheDatabaseManager.addEntity(debtorId, creDtTm));
    const dataCache: DataCache = {
      cdtrId: creditorId,
      dbtrId: debtorId,
      cdtrAcctId: creditorAcctId,
      dbtrAcctId: debtorAcctId,
      creDtTm,
      amt: {
        amt: parseFloat(Amt),
        ccy: Ccy,
      },
    };

    const cacheBuffer = createMessageBuffer({ DataCache: { ...dataCache } });

    accountInserts.push(cacheDatabaseManager.addEntity(creditorId, creDtTm));
    accountInserts.push(cacheDatabaseManager.addEntity(debtorId, creDtTm));
    if (cacheBuffer) {
      accountInserts.push(cacheDatabaseManager.set(EndToEndId, cacheBuffer, 150));
    } else {
      // this is fatal
      throw new Error('[pacs008] data cache could not be serialised');
    }
    await Promise.all(accountInserts);

    await Promise.all([
      cacheDatabaseManager.addAccountHolder(creditorId, creditorAcctId, creDtTm),
      cacheDatabaseManager.addAccountHolder(debtorId, debtorAcctId, creDtTm),
    ]);
  } else {
    await Promise.all(accountInserts);
  }
  cacheDatabaseManager.saveTransactionRelationship(transactionRelationship);

  const spanInsert = apm.startSpan('db.insert.pacs008');
  try {
    await Promise.all([
      cacheDatabaseManager.saveTransactionHistory(transaction, configuration.transactionHistoryPacs008Collection, `pacs008_${EndToEndId}`),
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
  const CreDtTm = transaction.FIToFIPmtSts.GrpHdr.CreDtTm;
  const EndToEndId = transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId;
  const MsgId = transaction.FIToFIPmtSts.GrpHdr.MsgId;
  const PmtInfId = transaction.FIToFIPmtSts.TxInfAndSts.OrgnlInstrId;
  const TxSts = transaction.FIToFIPmtSts.TxInfAndSts.TxSts;

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
    dataCache = dataCacheJSON as DataCache;
  } catch (ex) {
    loggerService.error(`Could not retrieve data cache for: ${EndToEndId} from redis`, logContext, id);
    loggerService.log('Proceeding with Arango Call', logContext, id);
    dataCache = await rebuildCache(EndToEndId, false, id);
  } finally {
    spanDataCache?.end();
  }

  transaction._key = MsgId;

  const spanInsert = apm.startSpan('db.insert.pacs002');
  try {
    await cacheDatabaseManager.saveTransactionHistory(
      transaction,
      configuration.transactionHistoryPacs002Collection,
      `pacs002_${EndToEndId}`,
    );

    const result = (await cacheDatabaseManager.getTransactionPacs008(EndToEndId)) as [Pacs008[]];

    const debtorAcctId = result[0][0].FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAcct.Id.Othr[0].Id;
    const creditorAcctId = result[0][0].FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAcct.Id.Othr[0].Id;

    transactionRelationship.to = `accounts/${debtorAcctId}`;
    transactionRelationship.from = `accounts/${creditorAcctId}`;

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

  const dataCache: DataCache = {
    cdtrId: cdtTrfTxInf.Cdtr.Id.PrvtId.Othr[0].Id,
    dbtrId: cdtTrfTxInf.Dbtr.Id.PrvtId.Othr[0].Id,
    cdtrAcctId: cdtTrfTxInf.CdtrAcct.Id.Othr[0].Id,
    dbtrAcctId: cdtTrfTxInf.DbtrAcct.Id.Othr[0].Id,
    creDtTm: pacs008.FIToFICstmrCdtTrf.GrpHdr.CreDtTm,
    amt: {
      amt: parseFloat(cdtTrfTxInf.InstdAmt.Amt.Amt),
      ccy: cdtTrfTxInf.InstdAmt.Amt.Ccy,
    },
  };

  if (writeToRedis) {
    const buffer = createMessageBuffer({ DataCache: { ...dataCache } });

    if (buffer) {
      await cacheDatabaseManager.set(endToEndId, buffer, configuration.cacheTTL);
    } else {
      loggerService.error('[pacs008] could not rebuild redis cache');
    }
  }

  span?.end();
  return dataCache;
};
