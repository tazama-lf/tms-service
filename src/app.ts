/* eslint-disable @typescript-eslint/no-explicit-any */
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { Server } from 'http';
import router from './router';
import helmet from 'koa-helmet';
import { LoggerService } from './logger.service';

class App extends Koa {
  public servers: Server[];
  constructor() {
    super();

    // bodyparser needs to be loaded first in order to work
    this.servers = [];
    this._configureRoutes();
  }

  async _configureRoutes(): Promise<void> {
    this.use(bodyParser());
    this.use(router.routes());
    this.use(router.allowedMethods());
    this.use(helmet());
  }

  configureMiddlewares(): void {
    // LoggerService Middleware
    this.use(async (ctx, next) => {
      await next();
      const rt = ctx.response.get('X-Response-Time');
      if (ctx.path !== '/health') {
        LoggerService.log(`${ctx.method} ${ctx.url} - ${rt}`);
      }
    });

    // x-response-time
    this.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      ctx.set('X-Response-Time', `${ms}ms`);
    });
  }

  listen(...args: any[]): Server {
    const server = super.listen(...args);
    this.servers.push(server);
    return server;
  }

  terminate(): void {
    for (const server of this.servers) {
      server.close();
    }
  }
}

export default App;
