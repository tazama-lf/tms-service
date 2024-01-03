// SPDX-License-Identifier: Apache-2.0
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
  quoting: boolean;
  logger: {
    logstashHost: string;
    logstashPort: number;
    logstashLevel: string;
  };
  redis: RedisConfig;
  sidecarHost: string;
}

export const configuration: IConfig = {
  maxCPU: parseInt(process.env.MAX_CPU!, 10) || 1,
  quoting: process.env.QUOTING === 'true',
  apm: {
    serviceName: process.env.APM_SERVICE_NAME!,
    url: process.env.APM_URL!,
    secretToken: process.env.APM_SECRET_TOKEN!,
    active: process.env.APM_ACTIVE!,
  },
  cacheTTL: parseInt(process.env.CACHE_TTL!, 10) || 300,
  cert: process.env.CERT_PATH!,
  crspEndpoint: process.env.CRSP_ENDPOINT!,
  db: {
    pseudonymsdb: process.env.PSEUDONYMS_DATABASE!,
    transactionhistorydb: process.env.TRANSACTIONHISTORY_DATABASE!,
    transactionhistory_pain001_collection: process.env.TRANSACTIONHISTORY_PAIN001_COLLECTION!,
    transactionhistory_pain013_collection: process.env.TRANSACTIONHISTORY_PAIN013_COLLECTION!,
    transactionhistory_pacs008_collection: process.env.TRANSACTIONHISTORY_PACS008_COLLECTION!,
    transactionhistory_pacs002_collection: process.env.TRANSACTIONHISTORY_PACS002_COLLECTION!,
    password: process.env.DATABASE_PASSWORD!,
    url: process.env.DATABASE_URL!,
    user: process.env.DATABASE_USER!,
  },
  env: process.env.NODE_ENV!,
  functionName: process.env.FUNCTION_NAME!,
  logger: {
    logstashHost: process.env.LOGSTASH_HOST!,
    logstashPort: parseInt(process.env.LOGSTASH_PORT ?? '0', 10),
    logstashLevel: process.env.LOGSTASH_LEVEL! || 'info',
  },
  port: parseInt(process.env.PORT!, 10) || 3000,
  redis: {
    db: parseInt(process.env.REDIS_DB!, 10) || 0,
    servers: JSON.parse(process.env.REDIS_SERVERS! || '[{"hostname": "127.0.0.1", "port":6379}]'),
    password: process.env.REDIS_AUTH!,
    isCluster: process.env.REDIS_IS_CLUSTER === 'true',
  },
  sidecarHost: process.env.SIDECAR_HOST!,
};
