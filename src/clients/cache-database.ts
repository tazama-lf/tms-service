import { Pacs002, Pacs008, Pain001, Pain013 } from '../classes/pain-pacs';
import { TransactionRelationship } from '../interfaces/iTransactionRelationship';
import { ArangoDBService } from './arango';
import { RedisService } from './redis';

export class CacheDatabaseService {
  private dbClient: ArangoDBService;
  private cacheClient: RedisService;
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

  async getPseudonyms(hash: string): Promise<any> {
    return await this.dbClient.getPseudonyms(hash);
  }

  async getTransactionHistoryPacs008(EndToEndId: string): Promise<any> {
    return await this.dbClient.getTransactionHistoryPacs008(EndToEndId);
  }

  async addAccount(hash: string): Promise<any> {
    return await this.dbClient.addAccount(hash);
  }

  async addEntity(entityId: string, CreDtTm: string): Promise<any> {
    return await this.dbClient.addEntity(entityId, CreDtTm);
  }

  async addAccountHolder(entityId: string, accountId: string, CreDtTm: string): Promise<any> {
    return await this.dbClient.addAccountHolder(entityId, accountId, CreDtTm);
  }

  async saveTransactionRelationship(tR: TransactionRelationship): Promise<any> {
    return await this.dbClient.saveTransactionRelationship(tR);
  }

  async saveTransactionHistory(
    transaction: Pain001 | Pain013 | Pacs008 | Pacs002,
    transactionHistoryCollection: string,
    redisKey = '',
  ): Promise<any> {
    if (redisKey) await this.cacheClient.setJson(redisKey, JSON.stringify(transaction), this.cacheExpireTime);

    return await this.dbClient.saveTransactionHistory(transaction, transactionHistoryCollection);
  }

  async savePseudonym(pseudonym: any): Promise<any> {
    return await this.dbClient.savePseudonym(pseudonym);
  }
}
