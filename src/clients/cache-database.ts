import { type Pacs002, type Pacs008, type Pain001, type Pain013 } from '../classes/pain-pacs';
import { type TransactionRelationship } from '../interfaces/iTransactionRelationship';
import { type ArangoDBService } from './arango';
import { type RedisService } from '@frmscoe/frms-coe-lib';

export class CacheDatabaseService {
  private readonly dbClient: ArangoDBService;
  private readonly cacheClient: RedisService;
  cacheExpireTime: number;

  private constructor(dbClient: ArangoDBService, cacheClient: RedisService, expire: number) {
    this.dbClient = dbClient;
    this.cacheClient = cacheClient;
    this.cacheExpireTime = expire;
  }

  public static async create(db: ArangoDBService, cacheClient: RedisService, expire: number): Promise<CacheDatabaseService> {
    return new CacheDatabaseService(db, cacheClient, expire);
  }

  quit = (): void => {
    this.dbClient.pseudonymsClient.close();
    this.dbClient.transactionHistoryClient.close();
    this.cacheClient.quit();
  };

  async getPseudonyms(hash: string): Promise<unknown> {
    return await this.dbClient.getPseudonyms(hash);
  }

  async getTransactionHistoryPacs008(EndToEndId: string): Promise<unknown> {
    return await this.dbClient.getTransactionHistoryPacs008(EndToEndId);
  }

  async addAccount(hash: string): Promise<void> {
    await this.dbClient.addAccount(hash);
  }

  async addEntity(entityId: string, CreDtTm: string): Promise<void> {
    await this.dbClient.addEntity(entityId, CreDtTm);
  }

  async addAccountHolder(entityId: string, accountId: string, CreDtTm: string): Promise<void> {
    await this.dbClient.addAccountHolder(entityId, accountId, CreDtTm);
  }

  async saveTransactionRelationship(tR: TransactionRelationship): Promise<void> {
    await this.dbClient.saveTransactionRelationship(tR);
  }

  async saveTransactionHistory(
    transaction: Pain001 | Pain013 | Pacs008 | Pacs002,
    transactionHistoryCollection: string,
    redisKey = '',
  ): Promise<void> {
    if (redisKey) await this.cacheClient.setJson(redisKey, JSON.stringify(transaction), this.cacheExpireTime);

    await this.dbClient.saveTransactionHistory(transaction, transactionHistoryCollection);
  }
}
