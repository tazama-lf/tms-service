import cluster from 'cluster';
import apm from 'elastic-apm-node';
import { Context } from 'koa';
import App from './app';
import { configuration } from './config';
import { LoggerService } from './logger.service';
import { ServicesContainer, initCacheDatabase } from './services-container';
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

export const cache = ServicesContainer.getCacheInstance();

export const runServer = async (): Promise<App> => {
  const koaApp = new App();

  await initCacheDatabase(configuration.cacheTTL);

  /*
   * Centralized error handling
   **/
  koaApp.on('error', handleError);

  function handleError(err: Error, ctx: Context): void {
    if (ctx == null) {
      LoggerService.error(err, undefined, 'Unhandled exception occured');
    }
  }

  function terminate(signal: NodeJS.Signals): void {
    try {
      koaApp.terminate();
    } finally {
      LoggerService.log('App is terminated');
      process.kill(process.pid, signal);
    }
  }

  /*
   * Start server
   **/
  if (Object.values(require.cache).filter(async (m) => m?.children.includes(module))) {
    const server = koaApp.listen(configuration.port, () => {
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

  return koaApp;
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
        await runServer();
      }
    } catch (err) {
      LoggerService.error(`Error while starting HTTP server on Worker ${process.pid}`, err);
    }
  })()
}
