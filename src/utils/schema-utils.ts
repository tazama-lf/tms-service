// SPDX-License-Identifier: Apache-2.0
import type { Pacs002, Pacs008, Pain001, Pain013 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { FastifySchema } from 'fastify/types/schema';
import { configuration } from '../';
import { tokenHandler } from '../auth/authHandler';
import { validateTenantMiddleware } from '../middleware/validateTenantMiddleware';

export type TransactionTypes = Pain001 | Pain013 | Pacs008 | Pacs002;
type preHandler = (request: FastifyRequest<{ Body: TransactionTypes }>, reply: FastifyReply) => Promise<void>;

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

const SetOptions = (schemaTransactionName: string, claim: string): { preHandler?: preHandler[]; schema: FastifySchema } => {
  const preHandlers: preHandler[] = configuration.AUTHENTICATED
    ? [validateTenantMiddleware, tokenHandler(claim)]
    : [validateTenantMiddleware];

  return {
    preHandler: preHandlers,
    schema: { body: { $ref: `${schemaTransactionName}#` }, response: responseSchema(schemaTransactionName) },
  };
};

export default SetOptions;
