/* eslint-disable @typescript-eslint/no-explicit-any */
import { configuration } from './config';
import { type RouteHandlerMethod, type FastifyInstance } from 'fastify';
import { handleExecute, handleQuoteReply, handleTransfer, handleTransferResponse, handleHealthCheck } from './app.controller';
import {
  pain001SchemaResponse,
  pain013SchemaResponse,
  pacs002SchemaResponse,
  pacs008SchemaResponse,
} from '@frmscoe/frms-coe-lib/lib/schemata';

const setSchemaOptions = (
  handler: RouteHandlerMethod,
  requestBodySchemaRef: string,
  requestSchemaHeaderRef: string,
  responseBodySchemaRef: any,
): { handler: RouteHandlerMethod; schema: { body: { $ref: string }; headers: { $ref: string }; response: any } } => {
  return {
    handler,
    schema: {
      body: { $ref: requestBodySchemaRef.concat('#') },
      headers: { $ref: requestSchemaHeaderRef.concat('#') },
      response: responseBodySchemaRef,
    },
  };
};

const reqHeaderSchema = 'requestHeaderSchema';

async function Routes(fastify: FastifyInstance, options: unknown): Promise<void> {
  fastify.get('/', handleHealthCheck);
  fastify.get('/health', handleHealthCheck);
  if (configuration.quoting) {
    fastify.post('/execute', setSchemaOptions(handleExecute, 'pain001Schema', reqHeaderSchema, pain001SchemaResponse));
    fastify.post('/quoteReply', setSchemaOptions(handleQuoteReply, 'pain013Schema', reqHeaderSchema, pain013SchemaResponse));
  }
  fastify.post('/transfer', setSchemaOptions(handleTransfer, 'pacs008Schema', reqHeaderSchema, pacs008SchemaResponse));
  fastify.post('/transfer-response', setSchemaOptions(handleTransferResponse, 'pacs002Schema', reqHeaderSchema, pacs002SchemaResponse));
}

export default Routes;
