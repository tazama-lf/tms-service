// SPDX-License-Identifier: Apache-2.0
/* eslint-disable */
import { type RouteHandlerMethod } from 'fastify';
import { type FastifySchema } from 'fastify/types/schema';

const reposnseSchema = async (schemaTransactionName: string) => {
  return {
    '2xx': {
      type: 'object',
      properties: {
        message: {
          type: 'string',
        },
        data: {
          $ref: `${schemaTransactionName}#`,
        },
      },
    },
  };
};

const SetOptions = (handler: RouteHandlerMethod, schemaTransactionName: string): { handler: RouteHandlerMethod; schema: FastifySchema } => {
  return {
    handler,
    schema: { body: { $ref: `${schemaTransactionName}#` }, response: reposnseSchema(schemaTransactionName) },
  };
};

export default SetOptions;
