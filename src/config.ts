/* eslint-disable @typescript-eslint/no-non-null-assertion */
// config settings, env variables
import * as path from 'path';
import * as dotenv from 'dotenv';
import { type RedisConfig } from '@frmscoe/frms-coe-lib/lib/interfaces';

// Load .env file into process.env if it exists. This is convenient for running locally.
dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

export interface IConfig {
  maxCPU: number;
  env: string;
  functionName: string;
  port: number;
  apm: {
    secretToken: string;
    serviceName: string;
    url: string;
    active: string;
  };
  db: {
    pseudonymsdb: string;
    transactionhistorydb: string;
    transactionhistory_pain001_collection: string;
    transactionhistory_pain013_collection: string;
    transactionhistory_pacs008_collection: string;
    transactionhistory_pacs002_collection: string;
    password: string;
    url: string;
    user: string;
  };
  cacheTTL: number;
  cert: string;
  crspEndpoint: string;
  logger: {
    logstashHost: string;
    logstashPort: number;
    logstashLevel: string;
  };
  redis: RedisConfig;
  quoting: boolean;
}

export const configuration: IConfig = {
  maxCPU: parseInt(process.env.MAX_CPU!, 10) || 1,
  apm: {
    serviceName: process.env.APM_SERVICE_NAME as string,
    url: process.env.APM_URL as string,
    secretToken: process.env.APM_SECRET_TOKEN as string,
    active: process.env.APM_ACTIVE as string,
  },
  cacheTTL: parseInt(process.env.CACHE_TTL!, 10) || 300,
  cert: process.env.CERT_PATH as string,
  crspEndpoint: process.env.CRSP_ENDPOINT as string,
  db: {
    pseudonymsdb: process.env.PSEUDONYMS_DATABASE as string,
    transactionhistorydb: process.env.TRANSACTIONHISTORY_DATABASE as string,
    transactionhistory_pain001_collection: process.env.TRANSACTIONHISTORY_PAIN001_COLLECTION as string,
    transactionhistory_pain013_collection: process.env.TRANSACTIONHISTORY_PAIN013_COLLECTION as string,
    transactionhistory_pacs008_collection: process.env.TRANSACTIONHISTORY_PACS008_COLLECTION as string,
    transactionhistory_pacs002_collection: process.env.TRANSACTIONHISTORY_PACS002_COLLECTION as string,
    password: process.env.DATABASE_PASSWORD as string,
    url: process.env.DATABASE_URL as string,
    user: process.env.DATABASE_USER as string,
  },
  env: process.env.NODE_ENV as string,
  functionName: process.env.FUNCTION_NAME as string,
  logger: {
    logstashHost: process.env.LOGSTASH_HOST as string,
    logstashPort: parseInt(process.env.LOGSTASH_PORT ?? '0', 10),
    logstashLevel: (process.env.LOGSTASH_LEVEL as string) || 'info',
  },
  port: parseInt(process.env.PORT!, 10) || 3000,
  redis: {
    db: parseInt(process.env.REDIS_DB!, 10) || 0,
    servers: JSON.parse((process.env.REDIS_SERVERS as string) || '[{"hostname": "127.0.0.1", "port":6379}]'),
    password: process.env.REDIS_AUTH as string,
    isCluster: process.env.REDIS_IS_CLUSTER === 'true',
  },
  quoting: process.env.QUOTING === 'true',
};
