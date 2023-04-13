import apm from 'elastic-apm-node';
import { Context } from 'koa';
import NodeCache from 'node-cache';
import App from './app';
import { ArangoDBService, RedisService } from './clients';
import { configuration } from './config';
import { LoggerService } from './logger.service';
import cluster from 'cluster';
import os from 'os';

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

export const databaseClient = new ArangoDBService();
export const cache = new NodeCache();
export const cacheClient = new RedisService();

export const runServer = (): void => {
  const app = new App();

  /*
   * Centralized error handling
   **/
  app.on('error', handleError);

  function handleError(err: Error, ctx: Context): void {
    if (ctx == null) {
      LoggerService.error(err, undefined, 'Unhandled exception occured');
    }
  }

  function terminate(signal: NodeJS.Signals): void {
    try {
      app.terminate();
    } finally {
      LoggerService.log('App is terminated');
      process.kill(process.pid, signal);
    }
  }

  /*
   * Start server
   **/
  if (Object.values(require.cache).filter(async (m) => m?.children.includes(module))) {
    const server = app.listen(configuration.port, () => {
      LoggerService.log(`API server listening on PORT ${configuration.port}`, 'execute');
    });
    server.on('error', handleError);

    const errors = ['unhandledRejection', 'uncaughtException'];
    errors.forEach((error) => {
      process.on(error, handleError);
    });

    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.once(signal, () => terminate(signal));
    });
  }  
};

const numCPUs = os.cpus().length > configuration.maxCPU ? configuration.maxCPU + 1: os.cpus().length + 1;

if (cluster.isPrimary && configuration.maxCPU !== 1) {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers.
  for (let i = 1; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died, starting another worker`);
    cluster.fork();
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  try {
    runServer();
  } catch (err) {
    LoggerService.error(`Error while starting HTTP server on Worker ${process.pid}`, err);
  }
  console.log(`Worker ${process.pid} started`);
}
