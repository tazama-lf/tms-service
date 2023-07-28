import { type RedisService } from '@frmscoe/frms-coe-lib';
import NodeCache from 'node-cache';
import { ArangoDBService } from './clients';
import { CacheDatabaseService } from './clients/cache-database';

/* eslint-disable @typescript-eslint/no-extraneous-class */
export class ServicesContainer {
  private static cache: NodeCache;
  private static databaseClient: ArangoDBService;
  private static cacheDatabaseClient: CacheDatabaseService;

  public static getCacheInstance(): NodeCache {
    if (!ServicesContainer.cache) ServicesContainer.cache = new NodeCache();

    return ServicesContainer.cache;
  }

  public static async getDatabaseInstance(): Promise<ArangoDBService> {
    if (!ServicesContainer.databaseClient) ServicesContainer.databaseClient = new ArangoDBService();

    return ServicesContainer.databaseClient;
  }

  public static async getCacheDatabaseInstance(expire: number, redisService: RedisService): Promise<CacheDatabaseService> {
    if (!ServicesContainer.cacheDatabaseClient) {
      const dbService = await this.getDatabaseInstance();
      ServicesContainer.cacheDatabaseClient = await CacheDatabaseService.create(dbService, redisService, expire);
    }

    return ServicesContainer.cacheDatabaseClient;
  }
}

export const initCacheDatabase = async (expire: number, redisService: RedisService): Promise<void> => {
  cacheDatabaseClient = await ServicesContainer.getCacheDatabaseInstance(expire, redisService);
};

export let cacheDatabaseClient: CacheDatabaseService;
