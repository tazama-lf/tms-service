/* eslint-disable @typescript-eslint/no-explicit-any */
import { configuration } from './config';
import { type FastifyInstance } from 'fastify';
import { handleExecute, handleQuoteReply, handleTransfer, handleTransferResponse, handleHealthCheck } from './app.controller';

async function Routes(fastify: FastifyInstance, options: unknown): Promise<void> {
  fastify.get('/', handleHealthCheck);
  fastify.get('/health', handleHealthCheck);
  if (configuration.quoting) {
    fastify.post('/execute', handleExecute);
    fastify.post('/quoteReply', handleQuoteReply);
  }
  fastify.post('/transfer', handleTransfer);
  fastify.post('/transfer-response', handleTransferResponse);
}

export default Routes;
