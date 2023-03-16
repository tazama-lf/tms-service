import axios from 'axios';
import { config } from 'dotenv';
import apm from 'elastic-apm-node';
import { databaseClient } from '.';
import { Pacs002 } from './classes/pacs.002.001.12';
import { Pacs008 } from './classes/pacs.008.001.10';
import { Pain001 } from './classes/pain.001.001.11';
import { Pain013 } from './classes/pain.013.001.09';
import { configuration } from './config';
import { TransactionRelationship } from './interfaces/iTransactionRelationship';
import { LoggerService } from './logger.service';
import { calcCreditorHash, calcDebtorHash } from './utils/transaction-tools';

export const handlePain001 = async (transaction: Pain001): Promise<any> => {
  LoggerService.log('Start - Handle transaction data');
  const span = apm.startSpan('Handle transaction data');
  const creditorHash = calcCreditorHash(transaction);
  const debtorHash = calcDebtorHash(transaction);

  transaction.EndToEndId = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.PmtId.EndToEndId;

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

  let transactionRelationship: TransactionRelationship = {
    from: `accounts/${debtorHash}`,
    to: `accounts/${creditorHash}`,
    Amt: Amt,
    Ccy: Ccy,
    CreDtTm: CreDtTm,
    EndToEndId: EndToEndId,
    lat: lat,
    long: long,
    MsgId: MsgId,
    PmtInfId: PmtInfId,
    TxTp: TxTp,
  };

  // let lookupCreditor = databaseClient.getPseudonyms(creditorHash);
  // let lookupDebtor = databaseClient.getPseudonyms(debtorHash);

  // const [lookupCreditorResult, lookupDebtorResult] = await Promise.all([lookupCreditor, lookupDebtor]);

  // // if (lookupCreditorResult.length === 0) 
  // {
  //   //insert creditor pseudonym
  //   // let pseudonym = {
  //   //   _key: creditorHash,
  //   //   pseudonym: creditorHash,
  //   //   Proprietary: transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.SchmeNm.Prtry,
  //   //   MemberIdentification: transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId,
  //   //   Identification: transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id,
  //   // };
  //   // await databaseClient.savePseudonym(pseudonym);
  // }
  // // if (lookupDebtorResult.length === 0) 
  // {
  //   //insert debtor pseudonym
  //   // let pseudonym = {
  //   //   _key: debtorHash,
  //   //   pseudonym: debtorHash,
  //   //   Proprietary: transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.SchmeNm.Prtry,
  //   //   MemberIdentification: transaction.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId,
  //   //   Identification: transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id,
  //   // };
  //   // await databaseClient.savePseudonym(pseudonym);
  // }

  // transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id = creditorHash;
  // transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.SchmeNm.Prtry = 'PSEUDO';
  // transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id = debtorHash;
  // transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.SchmeNm.Prtry = 'PSEUDO';

  try {
    await Promise.all([
      databaseClient.saveTransactionHistory(transaction, configuration.db.transactionhistory_pain001_collection),
      databaseClient.addAccount(debtorHash),
      databaseClient.addAccount(creditorHash),
      databaseClient.addEntity(creditorId, CreDtTm),
      databaseClient.addEntity(debtorId, CreDtTm)
    ]);

    await Promise.all([
      databaseClient.saveTransactionRelationship(transactionRelationship),
      databaseClient.addAccountHolder(creditorId, creditorAcctId, CreDtTm),
      databaseClient.addAccountHolder(debtorId, debtorAcctId, CreDtTm)
    ]);
  } catch (err) {
    LoggerService.log(JSON.stringify(err));
    throw err;
  }

  //Notify CRSP
  executePost(configuration.crspEndpoint, transaction);
  LoggerService.log('Transaction send to CRSP service');

  span?.end()
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
  const TxTp = transaction.TxTp

  let transactionRelationship: TransactionRelationship = {
    from: `accounts/${creditorHash}`,
    to: `accounts/${debtorHash}`,
    Amt: Amt,
    Ccy: Ccy,
    CreDtTm: CreDtTm,
    EndToEndId: EndToEndId,
    MsgId: MsgId,
    PmtInfId: PmtInfId,
    TxTp: TxTp,
  };

  // let lookupCreditor = databaseClient.getPseudonyms(creditorHash);
  // let lookupDebtor = databaseClient.getPseudonyms(debtorHash);

  // const [lookupCreditorResult, lookupDebtorResult] = await Promise.all([lookupCreditor, lookupDebtor]);

  // if (lookupCreditorResult.length === 0) {
  //   //insert creditor pseudonym
  //   let pseudonym = {
  //     _key: creditorHash,
  //     pseudonym: creditorHash,
  //     Proprietary: transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id,
  //     MemberIdentification: transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId,
  //     Identification: transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.SchmeNm.Prtry,
  //   };
  //   await databaseClient.savePseudonym(pseudonym);
  // }
  // if (lookupDebtorResult.length === 0) {
  //   //insert debtor pseudonym
  //   let pseudonym = {
  //     _key: debtorHash,
  //     pseudonym: debtorHash,
  //     Proprietary: transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr.Id,
  //     MemberIdentification: transaction.CdtrPmtActvtnReq.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId,
  //     Identification: transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr.SchmeNm.Prtry,
  //   };
  //   await databaseClient.savePseudonym(pseudonym);
  // }

  // transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id = creditorHash
  // transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.SchmeNm.Prtry = 'PSEUDO'
  // transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr.Id = debtorHash
  // transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr.SchmeNm.Prtry = 'PSEUDO'
  transaction._key = MsgId

  try {
    await Promise.all([
      databaseClient.saveTransactionHistory(transaction, configuration.db.transactionhistory_pain013_collection),
      databaseClient.addAccount(debtorHash),
      databaseClient.addAccount(creditorHash)
    ]);

    await databaseClient.saveTransactionRelationship(transactionRelationship);
  } catch (err) {
    LoggerService.log(JSON.stringify(err));
    throw err;
  }

  //Notify CRSP
  executePost(configuration.crspEndpoint, transaction);
  LoggerService.log('Transaction send to CRSP service');

  span?.end()
  LoggerService.log('END - Handle transaction data');
  return transaction;
};

export const handlePacs008 = async (transaction: Pacs008): Promise<any> => {
  LoggerService.log('Start - Handle transaction data');
  const span = apm.startSpan('Handle transaction data');
  const creditorHash = calcCreditorHash(transaction);
  const debtorHash = calcDebtorHash(transaction);

  transaction.EndToEndId = transaction.FIToFICstmrCdt.CdtTrfTxInf.PmtId.EndToEndId;

  const Amt = transaction.FIToFICstmrCdt.CdtTrfTxInf.InstdAmt.Amt.Amt;
  const Ccy = transaction.FIToFICstmrCdt.CdtTrfTxInf.InstdAmt.Amt.Ccy;
  const CreDtTm = transaction.FIToFICstmrCdt.GrpHdr.CreDtTm;
  const EndToEndId = transaction.FIToFICstmrCdt.CdtTrfTxInf.PmtId.EndToEndId;
  const MsgId = transaction.FIToFICstmrCdt.GrpHdr.MsgId;
  const PmtInfId = transaction.FIToFICstmrCdt.CdtTrfTxInf.PmtId.InstrId;
  const TxTp = transaction.TxTp;

  let transactionRelationship: TransactionRelationship = {
    from: `accounts/${debtorHash}`,
    to: `accounts/${creditorHash}`,
    Amt: Amt,
    Ccy: Ccy,
    CreDtTm: CreDtTm,
    EndToEndId: EndToEndId,
    MsgId: MsgId,
    PmtInfId: PmtInfId,
    TxTp: TxTp,
  };

  // let lookupCreditor = databaseClient.getPseudonyms(creditorHash);
  // let lookupDebtor = databaseClient.getPseudonyms(debtorHash);

  // const [lookupCreditorResult, lookupDebtorResult] = await Promise.all([lookupCreditor, lookupDebtor]);

  // if (lookupCreditorResult.length === 0) {
  //   //insert creditor pseudonym
  //   let pseudonym = {
  //     _key: creditorHash,
  //     pseudonym: creditorHash,
  //     Proprietary: transaction.FIToFICstmrCdt.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr.Id,
  //     MemberIdentification: transaction.FIToFICstmrCdt.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId,
  //     Identification: transaction.FIToFICstmrCdt.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr.SchmeNm.Prtry,
  //   };
  //   await databaseClient.savePseudonym(pseudonym);
  // }
  // if (lookupDebtorResult.length === 0) {
  //   //insert debtor pseudonym
  //   let pseudonym = {
  //     _key: debtorHash,
  //     pseudonym: debtorHash,
  //     Proprietary: transaction.FIToFICstmrCdt.CdtTrfTxInf.DbtrAcct.Id.Othr.Id,
  //     MemberIdentification: transaction.FIToFICstmrCdt.CdtTrfTxInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId,
  //     Identification: transaction.FIToFICstmrCdt.CdtTrfTxInf.DbtrAcct.Id.Othr.SchmeNm.Prtry,
  //   };
  //   await databaseClient.savePseudonym(pseudonym);
  // }

  // transaction.FIToFICstmrCdt.CdtTrfTxInf.DbtrAcct.Id.Othr.Id = debtorHash
  // transaction.FIToFICstmrCdt.CdtTrfTxInf.DbtrAcct.Id.Othr.SchmeNm.Prtry = "PSEUDO"
  // transaction.FIToFICstmrCdt.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr.Id = creditorHash
  // transaction.FIToFICstmrCdt.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr.SchmeNm.Prtry = "PSEUDO"

  try {
    await Promise.all([
      databaseClient.saveTransactionHistory(transaction, configuration.db.transactionhistory_pacs008_collection),
      databaseClient.addAccount(debtorHash),
      databaseClient.addAccount(creditorHash)
    ]);

    await databaseClient.saveTransactionRelationship(transactionRelationship);
  } catch (err) {
    LoggerService.log(JSON.stringify(err));
    throw err;
  }

  //Notify CRSP
  executePost(configuration.crspEndpoint, transaction);
  LoggerService.log('Transaction send to CRSP service');

  return transaction;
};

export const handlePacs002 = async (transaction: Pacs002): Promise<any> => {
  LoggerService.log('Start - Handle transaction data');
  const span = apm.startSpan('Handle transaction data');

  transaction.EndToEndId = transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId
  const CreDtTm = transaction.FIToFIPmtSts.GrpHdr.CreDtTm
  const EndToEndId = transaction.FIToFIPmtSts.TxInfAndSts.OrgnlEndToEndId
  const MsgId = transaction.FIToFIPmtSts.GrpHdr.MsgId
  const PmtInfId = transaction.FIToFIPmtSts.TxInfAndSts.OrgnlInstrId
  const TxSts = transaction.FIToFIPmtSts.TxInfAndSts.TxSts
  const TxTp = transaction.TxTp

  let transactionRelationship: TransactionRelationship = {
    from: '',
    to: '',
    CreDtTm: CreDtTm,
    EndToEndId: EndToEndId,
    MsgId: MsgId,
    PmtInfId: PmtInfId,
    TxTp: TxTp,
    TxSts: TxSts
  };

  transaction._key = MsgId

  try {
    await databaseClient.saveTransactionHistory(transaction, configuration.db.transactionhistory_pacs002_collection);

    let result = await databaseClient.getTransactionHistoryPacs008(EndToEndId)
    let crdtPseudo = result[0][0].FIToFICstmrCdt.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr.Id
    let dtrPseudo = result[0][0].FIToFICstmrCdt.CdtTrfTxInf.DbtrAcct.Id.Othr.Id
    transactionRelationship.from = `accounts/${crdtPseudo}`
    transactionRelationship.to = `accounts/${dtrPseudo}`

    await databaseClient.saveTransactionRelationship(transactionRelationship);
  } catch (err) {
    LoggerService.log(JSON.stringify(err));
    throw err;
  }

  //Notify CRSP
  executePost(configuration.crspEndpoint, transaction);
  LoggerService.log('Transaction send to CRSP service');

  span?.end()
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
    LoggerService.log(`CRSP Reponse - ${crspRes.status} with data\n ${JSON.stringify(crspRes.data)}`)
    span?.end();
  } catch (error) {
    LoggerService.error(`Error while sending request to CRSP at ${endpoint ?? ''} with message: ${error}`);
    LoggerService.trace(`CRSP Error Request:\r\n${JSON.stringify(request)}`);
  }
};
