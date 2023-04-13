import { ArangoDBService, RedisService } from './clients';

export class Services {
     private static databaseClient: ArangoDBService
     private static cacheClient: RedisService

    public static getDatabaseInstance(): ArangoDBService {
        if (!Services.databaseClient)
            Services.databaseClient = new ArangoDBService();
        
            return Services.databaseClient;
    }

    public static getCacheClientInstance(): RedisService {
        if (!Services.cacheClient)
            Services.cacheClient = new RedisService();
        
            return Services.cacheClient;
    }
}