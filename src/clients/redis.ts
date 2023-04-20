import Redis from 'ioredis';
import { configuration } from '../config';
import { LoggerService } from '../logger.service';

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
    return new Promise((resolve, reject) => {
      this.client.on('connect', () => {
        LoggerService.log('✅ Redis connection is ready');
        resolve();
      });
      this.client.on('error', (error) => {
        LoggerService.error('❌ Redis connection is not ready', error);
        reject();
      });
    });
  }

  public static async create(): Promise<RedisService> {
    const redisInstance = new RedisService();
    await redisInstance.init();
    return redisInstance;
  }

  getJson = (key: string): Promise<string[]> =>
    new Promise((resolve) => {
      this.client.smembers(key, (err, res) => {
        if (err) {
          LoggerService.error('Error while getting key from redis with message:', err, 'RedisService');

          resolve([]);
        }
        resolve(res ?? ['']);
      });
    });

  setJson = (key: string, value: string, expire: number): Promise<'OK' | undefined> =>
    new Promise((resolve) => {
      this.client.set(key, value, 'EX', expire, (err, res) => {
        if (err) {
          LoggerService.error('Error while setting key in redis with message:', err, 'RedisService');

          resolve(undefined);
        }
        resolve(res);
      });
    });

  deleteKey = (key: string): Promise<number> =>
    new Promise((resolve) => {
      this.client.del(key, (err, res) => {
        if (err) {
          LoggerService.error('Error while deleting key from redis with message:', err, 'RedisService');

          resolve(0);
        }
        resolve(res as number);
      });
    });

  addOneGetAll = (key: string, value: string): Promise<string[] | null> =>
    new Promise((resolve) => {
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
            LoggerService.error('Error while executing transaction on redis with message:', err, 'RedisService');
          }

          resolve(null);
        });
    });

  quit = (): void => {
    this.client.quit();
  };
}
