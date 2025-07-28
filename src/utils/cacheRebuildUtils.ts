// SPDX-License-Identifier: Apache-2.0
import apm from '../apm';
import { createMessageBuffer } from '@tazama-lf/frms-coe-lib/lib/helpers/protobuf';
import { unwrap } from '@tazama-lf/frms-coe-lib/lib/helpers/unwrap';
import type { DataCache, Pacs008 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { cacheDatabaseManager, loggerService, configuration } from '../';
import { parseDataCacheTenantAware } from './dataCacheUtils';

/**
 * Rebuilds the DataCache object using the given endToEndId to fetch a stored Pacs008 message
 * Always uses tenant-aware key generation with DEFAULT tenant fallback
 *
 * @param {string} endToEndId
 * @param {boolean} writeToRedis
 * @param {string} tenantId - Tenant ID (defaults to 'DEFAULT' if not provided)
 * @param {string} id - Optional ID for logging
 * @return {*}  {(Promise<DataCache | undefined>)}
 */
export const rebuildCache = async (
  endToEndId: string,
  writeToRedis: boolean,
  tenantId = 'DEFAULT',
  id?: string,
): Promise<DataCache | undefined> => {
  const span = apm.startSpan('db.cache.rebuild.tenant');
  const context = 'rebuildCache()';
  const currentPacs008 = (await cacheDatabaseManager.getTransactionPacs008(endToEndId)) as [Pacs008[]];

  const pacs008 = unwrap(currentPacs008);

  if (!pacs008) {
    loggerService.error('Could not find pacs008 transaction to rebuild dataCache with', context, id);
    span?.end();
    return undefined;
  }

  const cdtTrfTxInf = pacs008.FIToFICstmrCdtTrf.CdtTrfTxInf;

  // Always use tenant-aware parsing with DEFAULT fallback
  const { cdtrId, cdtrAcctId, dbtrId, dbtrAcctId } = parseDataCacheTenantAware(pacs008, tenantId);

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
      // Use tenant-aware cache key for complete tenant isolation
      const tenantCacheKey = `${tenantId}:${endToEndId}`;
      await cacheDatabaseManager.set(tenantCacheKey, buffer, redisTTL ?? 0);
    } else {
      loggerService.error('[pacs008] could not rebuild redis cache');
    }
  }

  span?.end();
  return dataCache;
};
