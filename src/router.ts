// SPDX-License-Identifier: Apache-2.0

import { configuration } from './config';
import { type FastifyInstance } from 'fastify';
import { Pain001Handler, Pain013Handler, Pacs008Handler, Pacs002Handler, handleHealthCheck } from './app.controller';
import SetOptions from './utils/schema-utils';

async function Routes(fastify: FastifyInstance, options: unknown): Promise<void> {
  fastify.get('/', handleHealthCheck);
  fastify.get('/health', handleHealthCheck);
  if (configuration.quoting) {
    fastify.post('/v1/evaluate/iso20022/pain.001.001.11', SetOptions(Pain001Handler, 'messageSchemaPain001'));
    fastify.post('/v1/evaluate/iso20022/pain.013.001.09', SetOptions(Pain013Handler, 'messageSchemaPain013'));
  }
  fastify.post('/v1/evaluate/iso20022/pacs.008.001.10', SetOptions(Pacs008Handler, 'messageSchemaPacs008'));
  fastify.post('/v1/evaluate/iso20022/pacs.002.001.12', SetOptions(Pacs002Handler, 'messageSchemaPacs002'));
}

export default Routes;
