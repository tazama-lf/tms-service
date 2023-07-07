import { CreateDatabaseManager, type DatabaseManagerInstance, LoggerService } from '@frmscoe/frms-coe-lib';
import apm from 'elastic-apm-node';
import os from 'os';
import { configuration } from './config';
import { handleTransaction } from './logic.service';
import { ServicesContainer, initCacheDatabase } from './services-container';
import { StartupFactory, IStartupService } from 'startup';
import cluster from 'cluster';

const databaseManagerConfig = {
  redisConfig: {
    db: configuration.redis.db,
    host: configuration.redis.host,
    password: configuration.redis.auth,
    port: configuration.redis.port,
  },
  transactionHistory: {
    certPath: configuration.cert,
    databaseName: configuration.db.transactionhistorydb,
    user: configuration.db.user,
    password: configuration.db.password,
    url: configuration.db.url,
  },
};

export const loggerService: LoggerService = new LoggerService();
export let server: IStartupService;
/*
 * Initialize the APM Logging
 **/
if (configuration.apm.active === 'true') {
  apm.start({
    serviceName: configuration.apm?.serviceName,
    secretToken: configuration.apm?.secretToken,
    serverUrl: configuration.apm?.url,
    usePathAsTransactionName: true,
    active: Boolean(configuration.apm?.active),
    transactionIgnoreUrls: ['/health'],
  });
}

export const cache = ServicesContainer.getCacheInstance();
let databaseManager: DatabaseManagerInstance<typeof databaseManagerConfig>;

export const dbinit = async (): Promise<void> => {
  databaseManager = await CreateDatabaseManager(databaseManagerConfig);
};

export const runServer = async () => {
  await dbinit();
  await initCacheDatabase(configuration.cacheTTL); // Deprecated - please use dbinit and the databasemanger for all future development.
  server = new StartupFactory();
  for (let retryCount = 0; retryCount < 10; retryCount++) {
    console.log(`Connecting to nats server...`);
    if (!(await server.init(handleTransaction))) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      console.log(`Connected to nats`);
      break;
    }
  }
};

const numCPUs = os.cpus().length > configuration.maxCPU ? configuration.maxCPU + 1 : os.cpus().length + 1;

if (cluster.isPrimary && configuration.maxCPU != 1) {
  for (let i = 1; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    cluster.fork();
  });
} else {
  (async () => {
    try {
      if (process.env.NODE_ENV !== 'test') {
        async () => {
          await runServer();
        }
      }
    } catch (err) {
      loggerService.error(`Error while starting NATS server on Worker ${process.pid}`, err);
    }
  })()
}

export { databaseManager };

