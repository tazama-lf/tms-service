// SPDX-License-Identifier: Apache-2.0
// config settings, env variables
import { type ManagerConfig } from '@tazama-lf/frms-coe-lib';
import {
  validateDatabaseConfig,
  validateEnvVar,
  validateLogConfig,
  validateRedisConfig,
  validateAPMConfig,
  validateProcessorConfig,
} from '@tazama-lf/frms-coe-lib/lib/helpers/env';
import { Database } from '@tazama-lf/frms-coe-lib/lib/helpers/env/database.config';
import { type ApmConfig, type LogConfig } from '@tazama-lf/frms-coe-lib/lib/helpers/env/monitoring.config';
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
  apm: ApmConfig;
  db: ManagerConfig;
  transactionHistoryPain001Collection: string;
  transactionHistoryPain013Collection: string;
  transactionHistoryPacs008Collection: string;
  transactionHistoryPacs002Collection: string;
  logger: LogConfig;
  cacheTTL: number;
}

const serviceAuth: boolean = validateEnvVar('AUTHENTICATED', 'boolean', true) || false;
const redisConfig = validateRedisConfig(serviceAuth);
const transactionHistory = validateDatabaseConfig(serviceAuth, Database.TRANSACTION_HISTORY);
const pseudonyms = validateDatabaseConfig(serviceAuth, Database.PSEUDONYMS);
const apm = validateAPMConfig();
const logger = validateLogConfig();
const generalConfig = validateProcessorConfig();

export const configuration: IConfig = {
  functionName: generalConfig.functionName,
  maxCPU: generalConfig.maxCPU || 1,
  port: validateEnvVar('PORT', 'number', true) || 3000,
  quoting: validateEnvVar('QUOTING', 'boolean', true) || false,
  authentication: serviceAuth,
  apm,
  db: {
    redisConfig,
    transactionHistory,
    pseudonyms,
  },
  cacheTTL: validateEnvVar('CACHETTL', 'number') || 300,
  transactionHistoryPain001Collection: validateEnvVar('TRANSACTION_HISTORY_PAIN001_COLLECTION', 'string'),
  transactionHistoryPain013Collection: validateEnvVar('TRANSACTION_HISTORY_PAIN013_COLLECTION', 'string'),
  transactionHistoryPacs008Collection: validateEnvVar('TRANSACTION_HISTORY_PACS008_COLLECTION', 'string'),
  transactionHistoryPacs002Collection: validateEnvVar('TRANSACTION_HISTORY_PACS002_COLLECTION', 'string'),
  env: generalConfig.nodeEnv,
  logger,
};
