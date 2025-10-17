// SPDX-License-Identifier: Apache-2.0
import './apm';
import { LoggerService } from '@tazama-lf/frms-coe-lib';
import { validateProcessorConfig } from '@tazama-lf/frms-coe-lib/lib/config';
import { StartupFactory, type IStartupService } from '@tazama-lf/frms-coe-startup-lib';
import cluster from 'node:cluster';
import os from 'node:os';
import { setTimeout } from 'node:timers/promises';
import * as util from 'node:util';
import { CacheDatabaseService } from './clients/cache-database';
import initializeFastifyClient from './clients/fastify';
import { additionalEnvironmentVariables, type Configuration } from './config';

// Application Constants
const APP_CONSTANTS = {
  MAX_LISTENERS: 10,
  TIMEOUT_MS: 5000,
  RETRY_INCREMENT: 1,
  PRIMARY_WORKER_OFFSET: 1,
  EXIT_CODE_ERROR: 1,
} as const;

let configuration = validateProcessorConfig(additionalEnvironmentVariables) as Configuration;

export const loggerService: LoggerService = new LoggerService(configuration);
export let server: IStartupService;

let cacheDatabaseManager: CacheDatabaseService;

export const dbInit = async (): Promise<void> => {
  const { config, db } = await CacheDatabaseService.create(configuration);
  cacheDatabaseManager = db;
  configuration = { ...configuration, ...config };
  loggerService.log(util.inspect(cacheDatabaseManager.isReadyCheck()));
};

const connect = async (): Promise<void> => {
  let isConnected = false;
  for (let retryCount = 0; retryCount < APP_CONSTANTS.MAX_LISTENERS; retryCount++) {
    loggerService.log('Connecting to nats server...');
    if (!(await server.initProducer())) {
      await setTimeout(APP_CONSTANTS.TIMEOUT_MS);
    } else {
      loggerService.log('Connected to nats');
      isConnected = true;
      break;
    }
  }

  if (!isConnected) {
    throw new Error('Unable to connect to nats after 10 retries');
  }

  const fastify = await initializeFastifyClient();
  fastify.listen({ port: configuration.PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      loggerService.error(err);
      throw Error(err.message);
    }

    loggerService.log(`Fastify listening on ${address}`);
  });
};

export const runServer = async (): Promise<void> => {
  server = new StartupFactory();
  if (configuration.nodeEnv !== 'test') await connect();
};

process.on('uncaughtException', (err) => {
  loggerService.error('process on uncaughtException error', err, 'index.ts');
});

process.on('unhandledRejection', (err) => {
  loggerService.error(`process on unhandledRejection error: ${util.inspect(err)}`);
});

const numCPUs =
  os.cpus().length > configuration.maxCPU
    ? configuration.maxCPU + APP_CONSTANTS.PRIMARY_WORKER_OFFSET
    : os.cpus().length + APP_CONSTANTS.PRIMARY_WORKER_OFFSET;

if (cluster.isPrimary && configuration.maxCPU !== APP_CONSTANTS.PRIMARY_WORKER_OFFSET) {
  for (let i = APP_CONSTANTS.PRIMARY_WORKER_OFFSET; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    cluster.fork();
  });
} else {
  (async () => {
    try {
      if (process.env.NODE_ENV !== 'test') {
        await dbInit();
        await runServer();

        loggerService.debug(`Authentication is ${configuration.AUTHENTICATED ? 'ENABLED' : 'DISABLED'}`);
      }
    } catch (err) {
      loggerService.error(`Error while starting ${configuration.functionName}`, err);
      process.exit(APP_CONSTANTS.EXIT_CODE_ERROR);
    }
  })();
}

export { cacheDatabaseManager, configuration };
