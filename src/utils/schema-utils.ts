// SPDX-License-Identifier: Apache-2.0
import type { FastifyReply, FastifyRequest, RouteHandlerMethod } from 'fastify';
import type { FastifySchema } from 'fastify/types/schema';
import { loggerService } from '..';
import { tokenHandler } from '../auth/authHandler';
import { validateTenantMiddleware } from '../middleware/validateTenantMiddleware';
import { configuration } from '../';

type preHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

const responseSchema = (schemaTransactionName: string): Record<string, unknown> => ({
  '2xx': {
    type: 'object',
    properties: {
      message: {
        type: 'string',
      },
      data: {
        type: 'object',
        $ref: `${schemaTransactionName}#`,
      },
    },
  },
});

const SetOptions = (
  handler: RouteHandlerMethod,
  schemaTransactionName: string,
  claim: string,
): { preHandler?: preHandler[]; handler: RouteHandlerMethod; schema: FastifySchema } => {
  loggerService.debug(`Authentication is ${configuration.AUTHENTICATED ? 'ENABLED' : 'DISABLED'} for ${handler.name}`);

  const preHandlers: preHandler[] = configuration.AUTHENTICATED
    ? [validateTenantMiddleware, tokenHandler(claim)]
    : [validateTenantMiddleware];

  return {
    preHandler: preHandlers,
    handler,
    schema: { body: { $ref: `${schemaTransactionName}#` }, response: responseSchema(schemaTransactionName) },
  };
};

export default SetOptions;
