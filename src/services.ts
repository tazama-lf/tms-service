import NodeCache from 'node-cache';
import { ArangoDBService, RedisService } from './clients';

export class Services {
  private static cache: NodeCache;
  private static databaseClient: ArangoDBService;
  private static cacheClient: RedisService;

  public static getCacheInstance(): NodeCache {
    if (!Services.cache) Services.cache = new NodeCache();

    return Services.cache;
  }

  public static getDatabaseInstance(): ArangoDBService {
    if (!Services.databaseClient) Services.databaseClient = new ArangoDBService();

    return Services.databaseClient;
  }

  public static getCacheClientInstance(): RedisService {
    if (!Services.cacheClient) Services.cacheClient = new RedisService();

    return Services.cacheClient;
  }
}
