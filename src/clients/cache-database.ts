import { type DatabaseManagerType } from '@frmscoe/frms-coe-lib/lib/services/dbManager';
import { type Pacs002, type Pacs008, type Pain001, type Pain013 } from '../classes/pain-pacs';
import { type TransactionRelationship } from '../interfaces/iTransactionRelationship';

export class CacheDatabaseService {
  private readonly dbClient: DatabaseManagerType;

  cacheExpireTime: number;

  private constructor(dbClient: unknown, expire: number) {
    this.dbClient = dbClient as DatabaseManagerType;
    this.cacheExpireTime = expire;
  }

  /**
   * Creates a wrapper database for adding optional caching to dbManager librart
   *
   * @static
   * @param {unknown} db frms-coe-lib dbManager instance
   * @param {number} expire cache expire time
   * @return {*}  {Promise<CacheDatabaseService>}
   * @memberof CacheDatabaseService
   */
  public static async create(db: unknown, expire: number): Promise<CacheDatabaseService> {
    return new CacheDatabaseService(db, expire);
  }

  /**
   * Wrapper method for dbManager.quit;
   *
   * @memberof CacheDatabaseService
   */
  quit = (): void => {
    this.dbClient.quit?.();
  };

  /**
   * Wrapper method for dbManager.getTransactionPacs008
   *
   * @param {string} EndToEndId
   * @return {*}  {Promise<unknown>}
   * @memberof CacheDatabaseService
   */
  async getTransactionHistoryPacs008(EndToEndId: string): Promise<unknown> {
    const pacs008 = await this.dbClient.getTransactionPacs008?.(EndToEndId);
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
    await this.dbClient.saveAccount?.(hash);
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
    await this.dbClient.saveEntity?.(entityId, CreDtTm);
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
    await this.dbClient.saveAccountHolder?.(entityId, accountId, CreDtTm);
  }

  /**
   * Wrapper method for dbManager.saveTransactionRelationship
   *
   * @param {TransactionRelationship} tR
   * @return {*}  {Promise<void>}
   * @memberof CacheDatabaseService
   */
  async saveTransactionRelationship(tR: TransactionRelationship): Promise<void> {
    await this.dbClient.saveTransactionRelationship?.(tR);
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
    if (redisKey) await this.dbClient.setJson?.(redisKey, JSON.stringify(transaction), this.cacheExpireTime);

    await this.dbClient.saveTransactionHistory?.(transaction, transactionHistoryCollection);
  }
}
