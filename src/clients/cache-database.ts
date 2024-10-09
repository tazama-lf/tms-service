// SPDX-License-Identifier: Apache-2.0
import { createMessageBuffer } from '@tazama-lf/frms-coe-lib/lib/helpers/protobuf';
import { type Pacs002, type Pacs008, type Pain001, type Pain013 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { CreateDatabaseManager, type DatabaseManagerInstance, type ManagerConfig } from '@tazama-lf/frms-coe-lib/lib/services/dbManager';
import { type TransactionRelationship } from '../interfaces/iTransactionRelationship';

export class CacheDatabaseService<T extends ManagerConfig> {
  private readonly dbManager: DatabaseManagerInstance<T>;

  cacheExpireTime: number;

  private constructor(dbInstance: DatabaseManagerInstance<T>, expire: number) {
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
  public static async create<T extends ManagerConfig>(databaseManagerConfig: T, expire: number): Promise<CacheDatabaseService<T>> {
    const dbManager = await CreateDatabaseManager(databaseManagerConfig);
    return new CacheDatabaseService<T>(dbManager, expire);
  }

  /**
   * Wrapper method for dbManager.quit;
   *
   * @memberof CacheDatabaseService
   */
  quit = (): void => {
    this.dbManager.quit?.();
  };

  /**
   * Wrapper method for dbManager.getTransactionPacs008
   *
   * @param {string} EndToEndId
   * @return {*}  {Promise<unknown>}
   * @memberof CacheDatabaseService
   */
  async getTransactionPacs008(EndToEndId: string): Promise<unknown> {
    const pacs008 = await this.dbManager.getTransactionPacs008(EndToEndId);
    return pacs008;
  }

  /**
   * Wrapper method for dbManager.saveAccount
   *
   * @param {string} hash
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async addAccount(hash: string): Promise<void> {
    await this.dbManager.saveAccount(hash);
  }

  /**
   * Wrapper method for dbManager.saveEntity
   *
   * @param {string} entityId
   * @param {string} CreDtTm
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async addEntity(entityId: string, CreDtTm: string): Promise<void> {
    await this.dbManager.saveEntity(entityId, CreDtTm);
  }

  /**
   * Wrapper method for dbManager.saveAccountHolder
   *
   * @param {string} entityId
   * @param {string} accountId
   * @param {string} CreDtTm
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async addAccountHolder(entityId: string, accountId: string, CreDtTm: string): Promise<void> {
    await this.dbManager.saveAccountHolder(entityId, accountId, CreDtTm);
  }

  /**
   * Wrapper method for dbManager.saveTransactionRelationship
   *
   * @param {TransactionRelationship} tR
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async saveTransactionRelationship(tR: TransactionRelationship): Promise<void> {
    await this.dbManager.saveTransactionRelationship(tR);
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
  async saveTransactionHistory(
    transaction: Pain001 | Pain013 | Pacs008 | Pacs002,
    transactionHistoryCollection: string,
    redisKey = '',
  ): Promise<void> {
    const buff = createMessageBuffer({ ...transaction });

    if (redisKey && buff) await this.dbManager.set(redisKey, buff, this.cacheExpireTime);

    await this.dbManager.saveTransactionHistory(transaction, transactionHistoryCollection);
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
   * @return {*}  {Promise<Record<string, unknown>>}
   * @memberof CacheDatabaseService
   */
  async isReadyCheck(): Promise<Record<string, unknown>> {
    const ready = await this.dbManager.isReadyCheck();
    return ready;
  }
}
