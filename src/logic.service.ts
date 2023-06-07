import axios from 'axios';
import apm from 'elastic-apm-node';
import { Pacs002, Pacs008, Pain001, Pain013 } from '../src/classes/pain-pacs';
import { configuration } from './config';
import { TransactionRelationship } from './interfaces/iTransactionRelationship';
import { LoggerService } from './logger.service';
import { cacheDatabaseClient } from './services-container';
import { calcCreditorHash, calcDebtorHash } from './utils/transaction-tools';

export const handlePain001 = async (transaction: Pain001): Promise<any> => {
  LoggerService.log('Start - Handle transaction data');
  const span = apm.startSpan('Handle transaction data');
  const creditorHash = calcCreditorHash(transaction);
  const debtorHash = calcDebtorHash(transaction);

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
    from: `accounts/${debtorHash}`,
    to: `accounts/${creditorHash}`,
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



  try {
    await Promise.all([
      cacheDatabaseClient.saveTransactionHistory(transaction, configuration.db.transactionhistory_pain001_collection, `pain001_${transaction.EndToEndId}`),
      cacheDatabaseClient.addAccount(debtorHash),
      cacheDatabaseClient.addAccount(creditorHash),
      cacheDatabaseClient.addEntity(creditorId, CreDtTm),
      cacheDatabaseClient.addEntity(debtorId, CreDtTm),
    ]);

    await Promise.all([
      cacheDatabaseClient.saveTransactionRelationship(transactionRelationship),
      cacheDatabaseClient.addAccountHolder(creditorId, creditorHash, CreDtTm),
      cacheDatabaseClient.addAccountHolder(debtorId, debtorHash, CreDtTm)
    ]);

    transaction.DataCache = {
      "cdtrId": creditorId, 
      "dbtrId": debtorId,
      "cdtrAcctId": creditorAcctId,
      "dbtrAcctId": debtorAcctId
    }

  } catch (err) {
    LoggerService.log(JSON.stringify(err));
    throw err;
  }

  // Notify CRSP
  executePost(configuration.crspEndpoint, transaction);
  LoggerService.log('Transaction send to CRSP service');

  span?.end();
  LoggerService.log('END - Handle transaction data');
  return transaction;
};

export const handlePain013 = async (transaction: Pain013): Promise<any> => {
  LoggerService.log('Start - Handle transaction data');
  const span = apm.startSpan('Handle transaction data');
  const creditorHash = calcCreditorHash(transaction);
  const debtorHash = calcDebtorHash(transaction);

  transaction.EndToEndId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.PmtId.EndToEndId;

  const Amt = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Amt;
  const Ccy = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.Amt.InstdAmt.Amt.Ccy;
  const CreDtTm = transaction.CdtrPmtActvtnReq.GrpHdr.CreDtTm;
  const EndToEndId = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.PmtId.EndToEndId;
  const MsgId = transaction.CdtrPmtActvtnReq.GrpHdr.MsgId;
  const PmtInfId = transaction.CdtrPmtActvtnReq.PmtInf.PmtInfId;
  const TxTp = transaction.TxTp;

  const transactionRelationship: TransactionRelationship = {
    from: `accounts/${creditorHash}`,
    to: `accounts/${debtorHash}`,
    Amt,
    Ccy,
    CreDtTm,
    EndToEndId,
    MsgId,
    PmtInfId,
    TxTp,
  };

  transaction._key = MsgId;

  try {
    await Promise.all([
      cacheDatabaseClient.saveTransactionHistory(transaction, configuration.db.transactionhistory_pain013_collection, `pain013_${transaction.EndToEndId}`),
      cacheDatabaseClient.addAccount(debtorHash),
      cacheDatabaseClient.addAccount(creditorHash),
    ]);

    await cacheDatabaseClient.saveTransactionRelationship(transactionRelationship);
  } catch (err) {
    LoggerService.log(JSON.stringify(err));
    throw err;
  }

  transaction.DataCache = {
    "cdtrAcctId": creditorHash,
    "dbtrAcctId": debtorHash
  }

  // Notify CRSP
  executePost(configuration.crspEndpoint, transaction);
  LoggerService.log('Transaction send to CRSP service');

  span?.end();
  LoggerService.log('END - Handle transaction data');
  return transaction;
};

export const handlePacs008 = async (transaction: Pacs008): Promise<any> => {
  LoggerService.log('Start - Handle transaction data');
  const span = apm.startSpan('Handle transaction data');
  const creditorHash = calcCreditorHash(transaction);
  const debtorHash = calcDebtorHash(transaction);

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

  const transactionRelationship: TransactionRelationship = {
    from: `accounts/${debtorHash}`,
    to: `accounts/${creditorHash}`,
    Amt,
    Ccy,
    CreDtTm,
    EndToEndId,
    MsgId,
    PmtInfId,
    TxTp,
  };

  try {
    await Promise.all([
      cacheDatabaseClient.saveTransactionHistory(transaction, configuration.db.transactionhistory_pacs008_collection, `pacs008_${transaction.EndToEndId}`),
      cacheDatabaseClient.addAccount(debtorHash),
      cacheDatabaseClient.addAccount(creditorHash),
    ]);

    await cacheDatabaseClient.saveTransactionRelationship(transactionRelationship);
  } catch (err) {
    LoggerService.log(JSON.stringify(err));
    throw err;
  }

  transaction.DataCache = {
    "dbtrAcctId": debtorHash,
    "cdtrAcctId": creditorHash
  }

  // Notify CRSP
  executePost(configuration.crspEndpoint, transaction);
  LoggerService.log('Transaction send to CRSP service');

  return transaction;
};

export const handlePacs002 = async (transaction: Pacs002): Promise<any> => {
  LoggerService.log('Start - Handle transaction data');
  const span = apm.startSpan('Handle transaction data');

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

  transaction._key = MsgId;

  try {
    await cacheDatabaseClient.saveTransactionHistory(transaction, configuration.db.transactionhistory_pacs002_collection, `pacs002_${transaction.EndToEndId}`);

    const result = await cacheDatabaseClient.getTransactionHistoryPacs008(EndToEndId);
    const crdtPseudo = result[0][0].FIToFICstmrCdt.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr.Id;
    const dtrPseudo = result[0][0].FIToFICstmrCdt.CdtTrfTxInf.DbtrAcct.Id.Othr.Id;
    transactionRelationship.from = `accounts/${crdtPseudo}`;
    transactionRelationship.to = `accounts/${dtrPseudo}`;

    await cacheDatabaseClient.saveTransactionRelationship(transactionRelationship);
  } catch (err) {
    LoggerService.log(JSON.stringify(err));
    throw err;
  }

  transaction.DataCache = {
    "cdtrAcctId": transactionRelationship.from,
    "dbtrAcctId": transactionRelationship.to
  }

  // Notify CRSP
  executePost(configuration.crspEndpoint, transaction);
  LoggerService.log('Transaction send to CRSP service');

  span?.end();
  LoggerService.log('END - Handle transaction data');
  return transaction;
};
// Submit the transaction to CRSP
const executePost = async (endpoint: string, request: any) => {
  const span = apm.startSpan(`POST ${endpoint}`);
  try {
    const crspRes = await axios.post(endpoint, request);

    if (crspRes.status !== 200) {
      LoggerService.error(`CRSP Response StatusCode != 200, request:\r\n${request}`);
    }
    LoggerService.log(`CRSP Reponse - ${crspRes.status} with data\n ${JSON.stringify(crspRes.data)}`);
    span?.end();
  } catch (error) {
    LoggerService.error(`Error while sending request to CRSP at ${endpoint || ''} with message: ${error}`);
    LoggerService.trace(`CRSP Error Request:\r\n${JSON.stringify(request)}`);
  }
};
