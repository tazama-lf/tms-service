import {
  type DatabaseManagerInstance,
  type PseudonymsDB,
  type ManagerConfig,
  type RedisService,
  type TransactionHistoryDB,
} from '@frmscoe/frms-coe-lib';
import { type Pacs002, type Pacs008, type Pain001, type Pain013 } from '../classes/pain-pacs';
import { type TransactionRelationship } from '../interfaces/iTransactionRelationship';

export class CacheDatabaseService {
  private readonly dbClient: DatabaseManagerInstance<ManagerConfig & PseudonymsDB & TransactionHistoryDB & RedisService>;
  cacheExpireTime: number;

  private constructor(dbClient: unknown, expire: number) {
    this.dbClient = dbClient as DatabaseManagerInstance<ManagerConfig & PseudonymsDB & TransactionHistoryDB & RedisService>;
    this.cacheExpireTime = expire;
  }

  public static async create(db: unknown, expire: number): Promise<CacheDatabaseService> {
    return new CacheDatabaseService(db, expire);
  }

  quit = (): void => {
    this.dbClient?.quit();
  };

  async getTransactionHistoryPacs008(EndToEndId: string): Promise<unknown> {
    return await (this.dbClient as unknown as TransactionHistoryDB).getTransactionPacs008(EndToEndId);
  }

  async addAccount(hash: string): Promise<void> {
    await this.dbClient.saveAccount(hash);
  }

  async addEntity(entityId: string, CreDtTm: string): Promise<void> {
    await this.dbClient.saveEntity(entityId, CreDtTm);
  }

  async addAccountHolder(entityId: string, accountId: string, CreDtTm: string): Promise<void> {
    await this.dbClient.saveAccountHolder(entityId, accountId, CreDtTm);
  }

  async saveTransactionRelationship(tR: TransactionRelationship): Promise<void> {
    await this.dbClient.saveTransactionRelationship(tR);
  }

  async saveTransactionHistory(
    transaction: Pain001 | Pain013 | Pacs008 | Pacs002,
    transactionHistoryCollection: string,
    redisKey = '',
  ): Promise<void> {
    if (redisKey) await this.dbClient.setJson(redisKey, JSON.stringify(transaction), this.cacheExpireTime);

    await this.dbClient.saveTransaction(transaction, transactionHistoryCollection);
  }
}
