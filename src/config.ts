// SPDX-License-Identifier: Apache-2.0
// config settings, env variables
import { type ManagerConfig } from '@frmscoe/frms-coe-lib';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file into process.env if it exists. This is convenient for running locally.
dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

export interface IConfig {
  functionName: string;
  maxCPU: number;
  env: string;
  port: number;
  quoting: boolean;
  authentication: boolean;
  apm: {
    secretToken: string;
    serviceName: string;
    url: string;
    active: string;
  };
  db: ManagerConfig;
  transactionHistoryPain001Collection: string;
  transactionHistoryPain013Collection: string;
  transactionHistoryPacs008Collection: string;
  transactionHistoryPacs002Collection: string;
  logger: {
    logstashHost: string;
    logstashPort: number;
    logstashLevel: string;
  };
  cacheTTL: number;
  sidecarHost: string;
}

export const configuration: IConfig = {
  functionName: process.env.FUNCTION_NAME!,
  maxCPU: parseInt(process.env.MAX_CPU!, 10) || 1,
  port: parseInt(process.env.PORT!, 10) || 3000,
  quoting: process.env.QUOTING === 'true',
  authentication: process.env.AUTHENTICATED === 'true',
  apm: {
    serviceName: process.env.APM_SERVICE_NAME!,
    url: process.env.APM_URL!,
    secretToken: process.env.APM_SECRET_TOKEN!,
    active: process.env.APM_ACTIVE!,
  },
  db: {
    redisConfig: {
      db: parseInt(process.env.REDIS_DB!, 10) || 0,
      servers: JSON.parse(process.env.REDIS_SERVERS! || '[{"hostname": "127.0.0.1", "port":6379}]'),
      password: process.env.REDIS_AUTH!,
      isCluster: process.env.REDIS_IS_CLUSTER === 'true',
    },
    transactionHistory: {
      url: process.env.TRANSACTION_HISTORY_DATABASE_URL!,
      databaseName: process.env.TRANSACTION_HISTORY_DATABASE!,
      user: process.env.TRANSACTION_HISTORY_DATABASE_USER!,
      password: process.env.TRANSACTION_HISTORY_DATABASE_PASSWORD!,
      certPath: process.env.TRANSACTION_HISTORY_DATABASE_CERT_PATH!,
    },
    pseudonyms: {
      url: process.env.PSEUDONYMS_DATABASE_URL!,
      databaseName: process.env.PSEUDONYMS_DATABASE!,
      user: process.env.PSEUDONYMS_DATABASE_USER!,
      password: process.env.PSEUDONYMS_DATABASE_PASSWORD!,
      certPath: process.env.PSEUDONYMS_DATABASE_CERT_PATH!,
    },
  },
  cacheTTL: parseInt(process.env.CACHE_TTL!, 10) || 300,
  transactionHistoryPain001Collection: process.env.TRANSACTION_HISTORY_PAIN001_COLLECTION!,
  transactionHistoryPain013Collection: process.env.TRANSACTION_HISTORY_PAIN013_COLLECTION!,
  transactionHistoryPacs008Collection: process.env.TRANSACTION_HISTORY_PACS008_COLLECTION!,
  transactionHistoryPacs002Collection: process.env.TRANSACTION_HISTORY_PACS002_COLLECTION!,
  env: process.env.NODE_ENV!,
  logger: {
    logstashHost: process.env.LOGSTASH_HOST!,
    logstashPort: parseInt(process.env.LOGSTASH_PORT ?? '0', 10),
    logstashLevel: process.env.LOGSTASH_LEVEL! || 'info',
  },
  sidecarHost: process.env.SIDECAR_HOST!,
};
