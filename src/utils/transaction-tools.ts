import { createHash } from 'node:crypto';
import { Pacs008 } from '../classes/pacs.008.001.10';
import { Pain001 } from '../classes/pain.001.001.11';
import { Pain013 } from '../classes/pain.013.001.09';

export function calcCreditorHash(transaction: Pain001 | Pain013 | Pacs008): string {
  if ('CdtrPmtActvtnReq' in transaction) {
    const Creditor_Identification = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id;
    const Creditor_MemberIdentification = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
    const Creditor_Proprietary = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.SchmeNm.Prtry;
    return createHash('sha256').update(`${Creditor_MemberIdentification}${Creditor_Identification}${Creditor_Proprietary}`).digest('hex');
  }

  if ('FIToFICstmrCdt' in transaction) {
    const Creditor_Identification = transaction.FIToFICstmrCdt.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr.Id;
    const Creditor_MemberIdentification = transaction.FIToFICstmrCdt.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
    const Creditor_Proprietary = transaction.FIToFICstmrCdt.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr.SchmeNm.Prtry;
    return createHash('sha256').update(`${Creditor_MemberIdentification}${Creditor_Identification}${Creditor_Proprietary}`).digest('hex');
  }

  const Creditor_Identification = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id;
  const Creditor_MemberIdentification = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const Creditor_Proprietary = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.SchmeNm.Prtry;
  return createHash('sha256').update(`${Creditor_MemberIdentification}${Creditor_Identification}${Creditor_Proprietary}`).digest('hex');
}

export const calcDebtorHash = (transaction: Pain001 | Pain013 | Pacs008): string => {
  if ('CdtrPmtActvtnReq' in transaction) {
    const Debtor_Identification = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr.Id;
    const Debtor_MemberIdentification = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
    const Debtor_Proprietary = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr.SchmeNm.Prtry;
    return createHash('sha256').update(`${Debtor_Proprietary}${Debtor_MemberIdentification}${Debtor_Identification}`).digest('hex');
  }

  if ('FIToFICstmrCdt' in transaction) {
    const Debtor_Identification = transaction.FIToFICstmrCdt.CdtTrfTxInf.DbtrAcct.Id.Othr.Id;
    const Debtor_MemberIdentification = transaction.FIToFICstmrCdt.CdtTrfTxInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
    const Debtor_Proprietary = transaction.FIToFICstmrCdt.CdtTrfTxInf.DbtrAcct.Id.Othr.SchmeNm.Prtry;
    return createHash('sha256').update(`${Debtor_Proprietary}${Debtor_MemberIdentification}${Debtor_Identification}`).digest('hex');
  }

  const Debtor_Identification = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id;
  const Debtor_MemberIdentification = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const Debtor_Proprietary = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.SchmeNm.Prtry;
  return createHash('sha256').update(`${Debtor_Proprietary}${Debtor_MemberIdentification}${Debtor_Identification}`).digest('hex');
};
