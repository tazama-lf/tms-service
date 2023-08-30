/* eslint-disable @typescript-eslint/no-explicit-any */
import { configuration } from './config';
import { type FastifyInstance } from 'fastify';
import { handleExecute, handleQuoteReply, handleTransfer, handleTransferResponse, handleHealthCheck } from './app.controller';
import SetOptions from './utils/schema-utils';

async function Routes(fastify: FastifyInstance, options: unknown): Promise<void> {
  fastify.get('/', handleHealthCheck);
  fastify.get('/health', handleHealthCheck);
  if (configuration.quoting) {
    fastify.post('/execute', SetOptions(handleExecute));
    fastify.post('/quoteReply', SetOptions(handleQuoteReply));
  }
  fastify.post('/transfer', SetOptions(handleTransfer));
  fastify.post('/transfer-response', SetOptions(handleTransferResponse));
}

export default Routes;
