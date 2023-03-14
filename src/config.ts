/* eslint-disable @typescript-eslint/no-non-null-assertion */
// config settings, env variables
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env file into process.env if it exists. This is convenient for running locally.
dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

export interface IConfig {
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
    pseudonymscollection: string;
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
  logstash: {
    host: string;
    port: number;
  };
  redis: {
    auth: string;
    db: number;
    host: string;
    port: number;
  };
}

export const configuration: IConfig = {
  apm: {
    serviceName: <string>process.env.APM_SERVICE_NAME,
    url: <string>process.env.APM_URL,
    secretToken: <string>process.env.APM_SECRET_TOKEN,
    active: <string>process.env.APM_ACTIVE,
  },
  cacheTTL: parseInt(process.env.CACHE_TTL!, 10),
  cert: <string>process.env.CERT_PATH,
  crspEndpoint: <string>process.env.CRSP_ENDPOINT,
  db: {
    pseudonymsdb: <string>process.env.PSEUDONYMS_DATABASE,
    pseudonymscollection: <string>process.env.PSEUDONYMS_COLLECTION,
    transactionhistorydb: <string>process.env.TRANSACTIONHISTORY_DATABASE,
    transactionhistory_pain001_collection: <string>process.env.TRANSACTIONHISTORY_PAIN001_COLLECTION,
    transactionhistory_pain013_collection: <string>process.env.TRANSACTIONHISTORY_PAIN013_COLLECTION,
    transactionhistory_pacs008_collection: <string>process.env.TRANSACTIONHISTORY_PACS008_COLLECTION,
    transactionhistory_pacs002_collection: <string>process.env.TRANSACTIONHISTORY_PACS002_COLLECTION,
    password: <string>process.env.DATABASE_PASSWORD,
    url: <string>process.env.DATABASE_URL,
    user: <string>process.env.DATABASE_USER,
  },
  env: <string>process.env.NODE_ENV,
  functionName: <string>process.env.FUNCTION_NAME,
  logstash: {
    host: <string>process.env.LOGSTASH_HOST,
    port: parseInt(process.env.LOGSTASH_PORT!, 10),
  },
  port: parseInt(process.env.PORT!, 10) || 3000,
  redis: {
    auth: <string>process.env.REDIS_AUTH,
    db: parseInt(process.env.REDIS_DB!, 10) || 0,
    host: <string>process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT!, 10),
  },
};
