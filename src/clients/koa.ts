/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Server } from 'http';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { koaSwagger } from 'koa2-swagger-ui';
import * as swagger from 'swagger2';
import { validate } from 'swagger2-koa';
import { loggerService } from '..';
import router from '../router';

class App extends Koa {
  public servers: Server[];

  constructor() {
    super();
    // bodyparser needs to be loaded first in order to work - in fact, order for all the below is very import!
    this.servers = [];
    this.use(bodyParser());
    this.configureMiddlewares();
    this.configureRoutes();
  }

  configureMiddlewares(): void {
    const readSwagger = swagger.loadDocumentSync('./build/swagger.yaml');
    const swaggerDocument: swagger.Document = readSwagger as swagger.Document;
    this.use(
      koaSwagger({
        routePrefix: '/swagger', // host at /swagger instead of default /docs
        swaggerOptions: {
          url: './build/swagger.yaml', // example path to json
        },
      }),
    );
    this.use(validate(swaggerDocument));

    this.use(async (ctx, next) => {
      await next();
      const rt = ctx.response.get('X-Response-Time');
      if (ctx.path !== '/health') {
        loggerService.log(`${ctx.method} ${ctx.url} - ${rt}`);
      }
    });

    // x - response - time
    this.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      ctx.set('x-response-time', `${ms}ms`);
    });
  }

  configureRoutes(): void {
    // Bootstrap application router
    this.use(router.routes());
    this.use(router.allowedMethods());
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
