import NodeCache from 'node-cache';
import { ArangoDBService, RedisService } from './clients';
import { CacheDatabaseService } from './clients/cache-database';

export class ServicesContainer {
  private static cache: NodeCache;
  private static databaseClient: ArangoDBService;
  private static cacheClient: RedisService;
  private static cacheDatabaseClient: CacheDatabaseService;

  public static getCacheInstance(): NodeCache {
    if (!ServicesContainer.cache) ServicesContainer.cache = new NodeCache();

    return ServicesContainer.cache;
  }

  public static async getDatabaseInstance(): Promise<ArangoDBService> {
    if (!ServicesContainer.databaseClient) ServicesContainer.databaseClient = new ArangoDBService();

    return ServicesContainer.databaseClient;
  }

  public static async getCacheClientInstance(): Promise<RedisService> {
    if (!ServicesContainer.cacheClient) {
      ServicesContainer.cacheClient = await RedisService.create();
    }

    return ServicesContainer.cacheClient;
  }

  public static async getCacheDatabaseInstance(expire: number): Promise<CacheDatabaseService> {
    if (!ServicesContainer.cacheDatabaseClient) {
      const dbService = await this.getDatabaseInstance();
      const redisService = await this.getCacheClientInstance();
      ServicesContainer.cacheDatabaseClient = await CacheDatabaseService.create(dbService, redisService, expire);
    }

    return ServicesContainer.cacheDatabaseClient;
  }
}

export const initCacheDatabase = async (expire: number): Promise<void> => {
  cacheDatabaseClient = await ServicesContainer.getCacheDatabaseInstance(expire);
};

export let cacheDatabaseClient: CacheDatabaseService;
