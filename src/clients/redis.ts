import Redis from 'ioredis';
import { configuration } from '../config';
import { loggerService } from '..';

export class RedisService {
  client: Redis;

  constructor() {
    this.client = new Redis({
      db: configuration.redis?.db,
      host: configuration.redis?.host,
      port: configuration.redis?.port,
      password: configuration.redis?.auth,
    });
  }

  async init(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.client.on('connect', () => {
        loggerService.log('✅ Redis connection is ready');
        resolve();
      });
      this.client.on('error', (error) => {
        loggerService.error('❌ Redis connection is not ready', error);
        throw new Error('❌ Redis connection is not ready');
      });
    });
  }

  public static async create(): Promise<RedisService> {
    const redisInstance = new RedisService();
    await redisInstance.init();
    return redisInstance;
  }

  getJson = async (key: string): Promise<string[]> =>
    await new Promise((resolve) => {
      this.client.smembers(key, (err, res) => {
        if (err) {
          loggerService.error('Error while getting key from redis with message:', err, 'RedisService');

          resolve([]);
        }
        resolve(res ?? ['']);
      });
    });

  setJson = async (key: string, value: string, expire: number): Promise<'OK' | undefined> =>
    await new Promise((resolve) => {
      this.client.set(key, value, 'EX', expire, (err, res) => {
        if (err) {
          loggerService.error('Error while setting key in redis with message:', err, 'RedisService');

          resolve(undefined);
        }
        resolve(res);
      });
    });

  deleteKey = async (key: string): Promise<number> =>
    await new Promise((resolve) => {
      this.client.del(key, (err, res) => {
        if (err) {
          loggerService.error('Error while deleting key from redis with message:', err, 'RedisService');

          resolve(0);
        }
        resolve(res as number);
      });
    });

  addOneGetAll = async (key: string, value: string): Promise<string[] | null> =>
    await new Promise((resolve) => {
      this.client
        .multi()
        .sadd(key, value)
        .smembers(key)
        .exec((err, res) => {
          // smembers result
          if (res && res[1] && res[1][1]) {
            resolve(res[1][1] as string[]);
          }

          if (err) {
            loggerService.error('Error while executing transaction on redis with message:', err, 'RedisService');
          }

          resolve(null);
        });
    });

  quit = (): void => {
    this.client.quit();
  };
}
