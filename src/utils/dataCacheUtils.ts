// SPDX-License-Identifier: Apache-2.0
import type { DataCache, Pacs008 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import {
  generateDebtorEntityKey,
  generateCreditorEntityKey,
  generateDebtorAccountKey,
  generateCreditorAccountKey,
} from './tenantKeyGenerator';

// A utility type for the fields we are extracting from the pacs008 entity
export type AccountIds = Required<Pick<DataCache, 'cdtrId' | 'dbtrId' | 'dbtrAcctId' | 'cdtrAcctId'>>;

// Always use tenant-aware parsing (legacy function for compatibility)
export function parseDataCache(transaction: Pacs008, tenantId = 'DEFAULT'): AccountIds {
  return parseDataCacheTenantAware(transaction, tenantId);
}

// Tenant-aware version of parseDataCache function (now the primary implementation)
export function parseDataCacheTenantAware(transaction: Pacs008, tenantId: string): AccountIds {
  const debtorOthr = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.Dbtr.Id.PrvtId.Othr[0];
  const creditorOthr = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr[0];
  const debtorAcctOthr = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAcct.Id.Othr[0];
  const debtorMmbId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.DbtrAgt.FinInstnId.ClrSysMmbId.MmbId;
  const creditorAcctOthr = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAcct.Id.Othr[0];
  const creditorMmbId = transaction.FIToFICstmrCdtTrf.CdtTrfTxInf.CdtrAgt.FinInstnId.ClrSysMmbId.MmbId;

  // Generate tenant-aware keys
  const debtorId = generateDebtorEntityKey(tenantId, debtorOthr.Id, debtorOthr.SchmeNm.Prtry);
  const creditorId = generateCreditorEntityKey(tenantId, creditorOthr.Id, creditorOthr.SchmeNm.Prtry);
  const debtorAcctId = generateDebtorAccountKey(tenantId, debtorAcctOthr.Id, debtorAcctOthr.SchmeNm.Prtry, debtorMmbId);
  const creditorAcctId = generateCreditorAccountKey(tenantId, creditorAcctOthr.Id, creditorAcctOthr.SchmeNm.Prtry, creditorMmbId);

  return {
    cdtrId: creditorId,
    dbtrId: debtorId,
    cdtrAcctId: creditorAcctId,
    dbtrAcctId: debtorAcctId,
  };
}
