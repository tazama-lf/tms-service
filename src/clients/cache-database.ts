// SPDX-License-Identifier: Apache-2.0
import { Database } from '@tazama-lf/frms-coe-lib/lib/config/database.config';
import { Cache } from '@tazama-lf/frms-coe-lib/lib/config/redis.config';
import type { Pacs002, Pacs008, Pain001, Pain013, TransactionDetails } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { CreateStorageManager, type DatabaseManagerInstance, type ManagerConfig } from '@tazama-lf/frms-coe-lib/lib/services/dbManager';
import type { Configuration } from '../config';

// Cache Constants
const CACHE_CONSTANTS = {
  DEFAULT_TTL: 0,
} as const;

export class CacheDatabaseService {
  private readonly dbManager: DatabaseManagerInstance<Configuration>;

  cacheExpireTime: number;

  private constructor(dbInstance: DatabaseManagerInstance<Configuration>, expire: number) {
    this.dbManager = dbInstance;
    this.cacheExpireTime = expire;
  }

  /**
   * Creates a wrapper database for adding optional caching to dbManager library.
   * Missing methods will have to be added by manually
   *
   * @static
   * @param {unknown} db frms-coe-lib dbManager instance
   * @param {number} expire cache expire time
   * @return {*}  {Promise<CacheDatabaseService>}
   * @memberof CacheDatabaseService
   */
  public static async create(configuration: Configuration): Promise<{ db: CacheDatabaseService; config: ManagerConfig }> {
    const auth = configuration.nodeEnv === 'production';
    const { db, config } = await CreateStorageManager<typeof configuration>(
      [Database.RAW_HISTORY, Database.EVENT_HISTORY, Cache.DISTRIBUTED],
      auth,
    );
    return { config, db: new CacheDatabaseService(db, config.redisConfig?.distributedCacheTTL ?? CACHE_CONSTANTS.DEFAULT_TTL) };
  }

  /**
   * Wrapper method for dbManager.quit;
   *
   * @memberof CacheDatabaseService
   */
  quit = (): void => {
    this.dbManager.quit();
  };

  /**
   * Wrapper method for dbManager.getTransactionPacs008
   *
   * @param {string} EndToEndId
   * @param {string} tenantId - Tenant ID for filtering
   * @return {*}  {Promise<unknown>}
   * @memberof CacheDatabaseService
   */
  async getTransactionPacs008(EndToEndId: string, tenantId: string): Promise<Pacs008 | undefined> {
    return await this.dbManager.getTransactionPacs008(EndToEndId, tenantId);
  }

  /**
   * Wrapper method for dbManager.saveAccount
   *
   * @param {string} hash
   * @param {string} tenantId
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async addAccount(hash: string, tenantId: string): Promise<void> {
    await this.dbManager.saveAccount(hash, tenantId);
  }

  /**
   * Wrapper method for dbManager.saveEntity
   *
   * @param entityId - The entity ID
   * @param tenantId - The tenant ID
   * @param CreDtTm - The creation date time
   * @returns Promise<void>
   * @memberof CacheDatabaseService
   */
  async addEntity(entityId: string, tenantId: string, CreDtTm: string): Promise<void> {
    await this.dbManager.saveEntity(entityId, tenantId, CreDtTm);
  }

  /**
   * Wrapper method for dbManager.saveAccountHolder
   *
   * @param {string} entityId
   * @param {string} accountId
   * @param {string} CreDtTm
   * @param {string} tenantId
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async addAccountHolder(entityId: string, accountId: string, CreDtTm: string, tenantId: string): Promise<void> {
    await this.dbManager.saveAccountHolder(entityId, accountId, CreDtTm, tenantId);
  }

  /**
   * Wrapper method for dbManager.saveTransactionRelationship
   *
   * @param {TransactionDetails} td
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async saveTransactionDetails(td: TransactionDetails): Promise<void> {
    await this.dbManager.saveTransactionDetails(td);
  }

  /**
   * Wrapper method for dbManager.saveTransactionHistory with additional pre-caching
   *
   * @param {(Pain001 | Pain013 | Pacs008 | Pacs002)} transaction
   * @param {string} transactionHistoryCollection
   * @param {string} [redisKey=''] Optional key if we want to pre-cache the transaction to redis
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async saveTransactionHistory(transaction: Pain001 | Pain013 | Pacs008 | Pacs002): Promise<void> {
    switch (transaction.TxTp) {
      case 'pain.001.001.11': {
        await this.dbManager.saveTransactionHistoryPain001(transaction as Pain001);
        break;
      }
      case 'pain.013.001.09': {
        await this.dbManager.saveTransactionHistoryPain013(transaction as Pain013);
        break;
      }
      case 'pacs.008.001.10': {
        await this.dbManager.saveTransactionHistoryPacs008(transaction as Pacs008);
        break;
      }
      case 'pacs.002.001.12': {
        await this.dbManager.saveTransactionHistoryPacs002(transaction as Pacs002);
        break;
      }
      default:
        throw Error('Error while selecting transaction type.');
    }
  }

  /**
   * Wrapper method for dbManager.set
   *
   * @param {string} key
   * @param {string | number | Buffer} value
   * @param {number} expire
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async set(key: string, value: string | number | Buffer, expire: number): Promise<void> {
    await this.dbManager.set(key, value, expire);
  }

  /**
   * Wrapper method for dbManager.getBuffer
   *
   * @param {string} key
   * @return {*}  {Promise<Record<string, unknown>>}
   * @memberof CacheDatabaseService
   */
  async getBuffer(key: string): Promise<Record<string, unknown>> {
    const buf = await this.dbManager.getBuffer(key);
    return buf;
  }

  /**
   * Wrapper method for dbManager.isReadyCheck
   *
   * @return {*}  {Record<string, unknown> | undefined}
   * @memberof CacheDatabaseService
   */
  isReadyCheck(): Record<string, unknown> | undefined {
    const ready = this.dbManager.isReadyCheck() as Record<string, unknown>;
    if (typeof ready === 'object') {
      return ready;
    }
  }
}
