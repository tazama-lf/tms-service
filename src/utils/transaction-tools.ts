// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
import { type Pacs008, type Pain001, type Pain013 } from '@frmscoe/frms-coe-lib/lib/interfaces';

export function calcCreditorHash(transaction: Pain001 | Pain013 | Pacs008): string {
  if ('CdtrPmtActvtnReq' in transaction) {
    const creditorIdentification = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0].Id;
    const creditorMemberIdentification = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
    const creditorProprietary = transaction.CdtrPmtActvtnReq.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0].SchmeNm.Prtry;
    return createHash('sha256').update(`${creditorMemberIdentification}${creditorIdentification}${creditorProprietary}`).digest('hex');
  }

  if ('FIToFICstmrCdtTrf' in transaction) {
    const creditorIdentification = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAcct.Id.Othr[0].Id;
    const creditorMemberIdentification = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
    const creditorProprietary = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAcct.Id.Othr[0].SchmeNm.Prtry;
    return createHash('sha256').update(`${creditorMemberIdentification}${creditorIdentification}${creditorProprietary}`).digest('hex');
  }

  const creditorIdentification = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0].Id;
  const creditorMemberIdentification = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const creditorProprietary = transaction.CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.CdtrAcct.Id.Othr[0].SchmeNm.Prtry;
  return createHash('sha256').update(`${creditorMemberIdentification}${creditorIdentification}${creditorProprietary}`).digest('hex');
}

export const calcDebtorHash = (transaction: Pain001 | Pain013 | Pacs008): string => {
  if ('CdtrPmtActvtnReq' in transaction) {
    const debtorIdentification = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr[0].Id;
    const debtorMemberIdentification = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
    const debtorProprietary = transaction.CdtrPmtActvtnReq.PmtInf.DbtrAcct.Id.Othr[0].SchmeNm.Prtry;
    return createHash('sha256').update(`${debtorMemberIdentification}${debtorIdentification}${debtorProprietary}`).digest('hex');
  }

  if ('FIToFICstmrCdtTrf' in transaction) {
    const debtorIdentification = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAcct.Id.Othr[0].Id;
    const debtorMemberIdentification = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
    const debtorProprietary = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAcct.Id.Othr[0].SchmeNm.Prtry;
    return createHash('sha256').update(`${debtorMemberIdentification}${debtorIdentification}${debtorProprietary}`).digest('hex');
  }

  const debtorIdentification = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr[0].Id;
  const debtorMemberIdentification = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const debtorProprietary = transaction.CstmrCdtTrfInitn.PmtInf.DbtrAcct.Id.Othr[0].SchmeNm.Prtry;
  return createHash('sha256').update(`${debtorMemberIdentification}${debtorIdentification}${debtorProprietary}`).digest('hex');
};
