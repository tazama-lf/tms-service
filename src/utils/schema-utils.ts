/* eslint-disable */
import { type RouteHandlerMethod } from 'fastify';
import { type FastifySchema } from 'fastify/types/schema';

const schemaId = 'transactionSchema#';

const responseSchema = {
  '2xx': {
    type: 'object',
    properties: {
      message: {
        type: 'string',
      },
      data: {
        $ref: schemaId,
      },
    },
  },
};

const SetOptions = (handler: RouteHandlerMethod): { handler: RouteHandlerMethod; schema: FastifySchema } => {
  return {
    handler,
    schema: { body: { $ref: schemaId }, response: responseSchema },
  };
};

export default SetOptions;
