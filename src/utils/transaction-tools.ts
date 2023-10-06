import { createHash } from 'node:crypto';
import { type Pacs008, type Pain001, type Pain013 } from '@frmscoe/frms-coe-lib/lib/interfaces';

export function calcCreditorHash(transaction: Pain001 | Pain013 | Pacs008): string {
  if ('CdtrPmtActvtnReq' in transaction) {
    const creditorIdentification = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id;
    const creditorMemberIdentification = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
    const creditorProprietary = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.SchmeNm.Prtry;
    return createHash('sha256').update(`${creditorMemberIdentification}${creditorIdentification}${creditorProprietary}`).digest('hex');
  }

  if ('FIToFICstmrCdt' in transaction) {
    const creditorIdentification = transaction.FIToFICstmrCdt.CdtTrfTxInf.CdtrAcct.Id.Othr.Id;
    const creditorMemberIdentification = transaction.FIToFICstmrCdt.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
    const creditorProprietary = transaction.FIToFICstmrCdt.CdtTrfTxInf.CdtrAcct.Id.Othr.SchmeNm.Prtry;
    return createHash('sha256').update(`${creditorMemberIdentification}${creditorIdentification}${creditorProprietary}`).digest('hex');
  }

  const creditorIdentification = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.Id;
  const creditorMemberIdentification = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const creditorProprietary = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr.SchmeNm.Prtry;
  return createHash('sha256').update(`${creditorMemberIdentification}${creditorIdentification}${creditorProprietary}`).digest('hex');
}

export const calcDebtorHash = (transaction: Pain001 | Pain013 | Pacs008): string => {
  if ('CdtrPmtActvtnReq' in transaction) {
    const debtorIdentification = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr.Id;
    const debtorMemberIdentification = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
    const debtorProprietary = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr.SchmeNm.Prtry;
    return createHash('sha256').update(`${debtorMemberIdentification}${debtorIdentification}${debtorProprietary}`).digest('hex');
  }

  if ('FIToFICstmrCdt' in transaction) {
    const debtorIdentification = transaction.FIToFICstmrCdt.CdtTrfTxInf.DbtrAcct.Id.Othr.Id;
    const debtorMemberIdentification = transaction.FIToFICstmrCdt.CdtTrfTxInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
    const debtorProprietary = transaction.FIToFICstmrCdt.CdtTrfTxInf.DbtrAcct.Id.Othr.SchmeNm.Prtry;
    return createHash('sha256').update(`${debtorMemberIdentification}${debtorIdentification}${debtorProprietary}`).digest('hex');
  }

  const debtorIdentification = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.Id;
  const debtorMemberIdentification = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const debtorProprietary = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr.SchmeNm.Prtry;
  return createHash('sha256').update(`${debtorMemberIdentification}${debtorIdentification}${debtorProprietary}`).digest('hex');
};
