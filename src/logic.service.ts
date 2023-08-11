import apm from 'elastic-apm-node';
import { databaseManager, loggerService, server } from '.';
import { type Pacs002, type Pacs008, type Pain001, type Pain013 } from '../src/classes/pain-pacs';
import { type DataCache } from './classes/data-cache';
import { configuration } from './config';
import { type TransactionRelationship } from './interfaces/iTransactionRelationship';
import { cacheDatabaseClient } from './services-container';

const calculateDuration = (startTime: bigint): number => {
  const endTime = process.hrtime.bigint();
  return Number(endTime - startTime);
};

export const handlePain001 = async (transaction: Pain001): Promise<void> => {
  loggerService.log('Start - Handle transaction data');
  const span = apm.startSpan('transaction.pain001');

  const startTime = process.hrtime.bigint();

  transaction.EndToEndId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.PmtId.EndToEndId;
  transaction.DebtorAcctId = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id;
  transaction.CreditorAcctId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id;
  transaction.CreDtTm = transaction.CstmrCdtTrfInitn.GrpHdr.CreDtTm;

  const Amt = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Amt;
  const Ccy = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy;
  const creditorAcctId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id;
  const creditorId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr.Id;
  const CreDtTm = transaction.CstmrCdtTrfInitn.GrpHdr.CreDtTm;
  const debtorAcctId = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id;
  const debtorId = transaction.CstmrCdtTrfInitn.PmtInf.Dbtr.Id.PrvtId.Othr.Id;
  const EndToEndId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.PmtId.EndToEndId;
  const lat = transaction.CstmrCdtTrfInitn.SplmtryData.Envlp.Doc.InitgPty.Glctn.Lat;
  const long = transaction.CstmrCdtTrfInitn.SplmtryData.Envlp.Doc.InitgPty.Glctn.Long;
  const MsgId = transaction.CstmrCdtTrfInitn.GrpHdr.MsgId;
  const PmtInfId = transaction.CstmrCdtTrfInitn.PmtInf.PmtInfId;
  const TxTp = transaction.TxTp;

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
      cacheDatabaseClient.saveTransactionHistory(
        transaction,
        configuration.db.transactionhistory_pain001_collection,
        `pain001_${transaction.EndToEndId}`,
      ),
      cacheDatabaseClient.addAccount(debtorAcctId),
      cacheDatabaseClient.addAccount(creditorAcctId),
      cacheDatabaseClient.addEntity(creditorId, CreDtTm),
      cacheDatabaseClient.addEntity(debtorId, CreDtTm),
      databaseManager.setJson(transaction.EndToEndId, JSON.stringify(dataCache), 150),
    ]);

    await Promise.all([
      cacheDatabaseClient.saveTransactionRelationship(transactionRelationship),
      cacheDatabaseClient.addAccountHolder(creditorId, creditorAcctId, CreDtTm),
      cacheDatabaseClient.addAccountHolder(debtorId, debtorAcctId, CreDtTm),
    ]);
  } catch (err) {
    loggerService.log(JSON.stringify(err));
    spanInsert?.end();
    throw err;
  }
  spanInsert?.end();

  // Notify CRSP
  server.handleResponse({
    transaction,
    DataCache: dataCache,
    metaData: { prcgTmDP: calculateDuration(startTime), traceParent: apm.currentTraceparent },
  });
  loggerService.log('Transaction send to CRSP service');

  span?.end();
  loggerService.log('END - Handle transaction data');
};

export const handlePain013 = async (transaction: Pain013): Promise<void> => {
  loggerService.log('Start - Handle transaction data');
  const span = apm.startSpan('transaction.pain013');
  const startTime = process.hrtime.bigint();

  transaction.EndToEndId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.PmtId.EndToEndId;

  const Amt = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Amt;
  const Ccy = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy;
  const CreDtTm = transaction.CdtrPmtActvtnReq.GrpHdr.CreDtTm;
  const EndToEndId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.PmtId.EndToEndId;
  const MsgId = transaction.CdtrPmtActvtnReq.GrpHdr.MsgId;
  const PmtInfId = transaction.CdtrPmtActvtnReq.PmtInf.PmtInfId;
  const TxTp = transaction.TxTp;

  const creditorAcctId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id;
  const debtorAcctId = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr.Id;

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

  let dataCache;
  const spanDataCache = apm.startSpan('req.get.dataCache.pain013');
  try {
    const dataCacheJSON = await databaseManager.getJson(transaction.EndToEndId);
    dataCache = JSON.parse(dataCacheJSON) as DataCache;
  } catch (ex) {
    loggerService.log(`Could not retrieve data cache for : ${transaction.EndToEndId} from redis. Proceeding with Arango Call.`);
    dataCache = await rebuildCache(transaction.EndToEndId);
  } finally {
    spanDataCache?.end();
  }

  transaction._key = MsgId;

  const spanInsert = apm.startSpan('db.insert.pain013');
  try {
    await Promise.all([
      cacheDatabaseClient.saveTransactionHistory(
        transaction,
        configuration.db.transactionhistory_pain013_collection,
        `pain013_${transaction.EndToEndId}`,
      ),
      cacheDatabaseClient.addAccount(debtorAcctId),
      cacheDatabaseClient.addAccount(creditorAcctId),
    ]);

    await cacheDatabaseClient.saveTransactionRelationship(transactionRelationship);
  } catch (err) {
    loggerService.log(JSON.stringify(err));
    spanInsert?.end();
    throw err;
  }

  spanInsert?.end();

  // Notify CRSP
  server.handleResponse({
    transaction,
    DataCache: dataCache,
    metaData: { prcgTmDP: calculateDuration(startTime), traceParent: apm.currentTraceparent },
  });
  loggerService.log('Transaction send to CRSP service');

  span?.end();
  loggerService.log('END - Handle transaction data');
};

export const handlePacs008 = async (transaction: Pacs008): Promise<void> => {
  loggerService.log('Start - Handle transaction data');
  const span = apm.startSpan('transaction.pacs008');
  const startTime = process.hrtime.bigint();

  transaction.EndToEndId = transaction.FIToFICstmrCdt.CdtTrfTxInf.PmtId.EndToEndId;
  transaction.DebtorAcctId = transaction.FIToFICstmrCdt.CdtTrfTxInf.DbtrAcct.Id.Othr.Id;
  transaction.CreditorAcctId = transaction.FIToFICstmrCdt.CdtTrfTxInf.CdtrAcct.Id.Othr.Id;
  transaction.CreDtTm = transaction.FIToFICstmrCdt.GrpHdr.CreDtTm;

  const Amt = transaction.FIToFICstmrCdt.CdtTrfTxInf.InstdAmt.Amt.Amt;
  const Ccy = transaction.FIToFICstmrCdt.CdtTrfTxInf.InstdAmt.Amt.Ccy;
  const CreDtTm = transaction.FIToFICstmrCdt.GrpHdr.CreDtTm;
  const EndToEndId = transaction.FIToFICstmrCdt.CdtTrfTxInf.PmtId.EndToEndId;
  const MsgId = transaction.FIToFICstmrCdt.GrpHdr.MsgId;
  const PmtInfId = transaction.FIToFICstmrCdt.CdtTrfTxInf.PmtId.InstrId;
  const TxTp = transaction.TxTp;

  const debtorAcctId = transaction.FIToFICstmrCdt.CdtTrfTxInf.DbtrAcct.Id.Othr.Id;
  const creditorAcctId = transaction.FIToFICstmrCdt.CdtTrfTxInf.CdtrAcct.Id.Othr.Id;

  const transactionRelationship: TransactionRelationship = {
    from: `accounts/${debtorAcctId}`,
    to: `accounts/${creditorAcctId}`,
    Amt,
    Ccy,
    CreDtTm,
    EndToEndId,
    MsgId,
    PmtInfId,
    TxTp,
  };

  let dataCache;
  const spanDataCache = apm.startSpan('req.get.dataCache.pacs008');
  try {
    const dataCacheJSON = await databaseManager.getJson(transaction.EndToEndId);
    dataCache = JSON.parse(dataCacheJSON) as DataCache;
  } catch (ex) {
    loggerService.log(`Could not retrieve data cache for : ${transaction.EndToEndId} from redis. Proceeding with Arango Call.`);
    dataCache = await rebuildCache(transaction.EndToEndId);
  } finally {
    spanDataCache?.end();
  }

  const spanInsert = apm.startSpan('db.insert.pacs008');
  try {
    await Promise.all([
      cacheDatabaseClient.saveTransactionHistory(
        transaction,
        configuration.db.transactionhistory_pacs008_collection,
        `pacs008_${transaction.EndToEndId}`,
      ),
      cacheDatabaseClient.addAccount(debtorAcctId),
      cacheDatabaseClient.addAccount(creditorAcctId),
    ]);

    await cacheDatabaseClient.saveTransactionRelationship(transactionRelationship);
  } catch (err) {
    loggerService.log(JSON.stringify(err));
    spanInsert?.end();
    throw err;
  } finally {
    spanInsert?.end();
  }

  // Notify CRSP
  server.handleResponse({
    transaction,
    DataCache: dataCache,
    metaData: { prcgTmDP: calculateDuration(startTime), traceParent: apm.currentTraceparent },
  });
  loggerService.log('Transaction send to CRSP service');
  span?.end();
};

export const handlePacs002 = async (transaction: Pacs002): Promise<void> => {
  loggerService.log('Start - Handle transaction data');
  const span = apm.startSpan('transactions.pacs002');
  const startTime = process.hrtime.bigint();

  transaction.EndToEndId = transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId;
  transaction.TxSts = transaction.FIToFIPmtSts.TxInfAndSts.TxSts;

  const CreDtTm = transaction.FIToFIPmtSts.GrpHdr.CreDtTm;
  const EndToEndId = transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId;
  const MsgId = transaction.FIToFIPmtSts.GrpHdr.MsgId;
  const PmtInfId = transaction.FIToFIPmtSts.TxInfAndSts.OrgnlInstrId;
  const TxSts = transaction.FIToFIPmtSts.TxInfAndSts.TxSts;
  const TxTp = transaction.TxTp;

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
    const dataCacheJSON = await databaseManager.getJson(transaction.EndToEndId);
    dataCache = JSON.parse(dataCacheJSON) as DataCache;
  } catch (ex) {
    loggerService.log(`Could not retrieve data cache for : ${transaction.EndToEndId} from redis. Proceeding with Arango Call.`);
    dataCache = await rebuildCache(transaction.EndToEndId);
  } finally {
    spanDataCache?.end();
  }

  transaction._key = MsgId;

  const spanInsert = apm.startSpan('db.insert.pacs002');
  try {
    await cacheDatabaseClient.saveTransactionHistory(
      transaction,
      configuration.db.transactionhistory_pacs002_collection,
      `pacs002_${transaction.EndToEndId}`,
    );

    const result = (await cacheDatabaseClient.getTransactionHistoryPacs008(EndToEndId)) as [Pacs008[]];

    const debtorAcctId = result[0][0].FIToFICstmrCdt.CdtTrfTxInf.DbtrAcct.Id.Othr.Id;
    const creditorAcctId = result[0][0].FIToFICstmrCdt.CdtTrfTxInf.CdtrAcct.Id.Othr.Id;

    transactionRelationship.to = `accounts/${debtorAcctId}`;
    transactionRelationship.from = `accounts/${creditorAcctId}`;

    await cacheDatabaseClient.saveTransactionRelationship(transactionRelationship);
  } catch (err) {
    spanInsert?.end();
    loggerService.log(JSON.stringify(err));
    throw err;
  } finally {
    spanInsert?.end();
  }

  // Notify CRSP
  server.handleResponse({
    transaction,
    DataCache: dataCache,
    metaData: { prcgTmDP: calculateDuration(startTime), traceParent: apm.currentTraceparent },
  });
  loggerService.log('Transaction send to CRSP service');

  span?.end();
  loggerService.log('END - Handle transaction data');
};

export const rebuildCache = async (endToEndId: string): Promise<DataCache | undefined> => {
  const span = apm.startSpan('db.cache.rebuild');
  const currentPain001 = (await databaseManager.getTransactionPain001(endToEndId)) as [Pain001[]];
  if (!currentPain001 || !currentPain001[0] || !currentPain001[0][0]) {
    loggerService.error('Could not find pain001 transaction to rebuild dataCache with');
    span?.end();
    return undefined;
  }
  const dataCache: DataCache = {
    cdtrId: currentPain001[0][0].CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr.Id,
    dbtrId: currentPain001[0][0].CstmrCdtTrfInitn.PmtInf.Dbtr.Id.PrvtId.Othr.Id,
    cdtrAcctId: currentPain001[0][0].CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id,
    dbtrAcctId: currentPain001[0][0].CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id,
  };
  await databaseManager.setJson(endToEndId, JSON.stringify(dataCache), 150);

  span?.end();
  return dataCache;
};
