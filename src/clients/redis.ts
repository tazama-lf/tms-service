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
      password: configuration.redis?.auth
    });

    this.client.on('connect', () => {
      LoggerService.log('✅ Redis connection is ready');
    });
    this.client.on('error', (error) => {
      LoggerService.error('❌ Redis connection is not ready', error);
    });
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

  setJson = (key: string, value: string): Promise<number> =>
    new Promise((resolve) => {
      this.client.sadd(key, value, (err, res) => {
        if (err) {
          LoggerService.error('Error while adding key to redis with message:', err, 'RedisService');

          resolve(-1);
        }
        resolve(res as number);
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
      this.client.multi()
      .sadd(key, value)
      .smembers(key)
      .exec((err, res) => {
        // smembers result
        if (res && res[1] && res[1][1]) {
          resolve(res[1][1] as string[])
        } 

        if (err) {
          LoggerService.error('Error while executing transaction on redis with message:', err, 'RedisService');
        }

        resolve(null);
      });
    });
}
