// SPDX-License-Identifier: Apache-2.0

import { type FastifyInstance } from 'fastify';
import { Pacs002Handler, Pacs008Handler, Pain001Handler, Pain013Handler, handleHealthCheck } from './app.controller';
import { configuration } from './';
import SetOptions from './utils/schema-utils';

const routePrivilege = {
  pain001: 'POST_V1_EVALUATE_ISO20022_PAIN_001_001_11',
  pain013: 'POST_V1_EVALUATE_ISO20022_PAIN_013_001_09',
  pacs008: 'POST_V1_EVALUATE_ISO20022_PACS_008_001_10',
  pacs002: 'POST_V1_EVALUATE_ISO20022_PACS_002_001_12',
};

async function Routes(fastify: FastifyInstance, options: unknown): Promise<void> {
  fastify.get('/', handleHealthCheck);
  fastify.get('/health', handleHealthCheck);
  if (configuration.QUOTING) {
    fastify.post('/v1/evaluate/iso20022/pain.001.001.11', SetOptions(Pain001Handler, 'messageSchemaPain001', routePrivilege.pain001));
    fastify.post('/v1/evaluate/iso20022/pain.013.001.09', SetOptions(Pain013Handler, 'messageSchemaPain013', routePrivilege.pain013));
  }
  fastify.post('/v1/evaluate/iso20022/pacs.008.001.10', SetOptions(Pacs008Handler, 'messageSchemaPacs008', routePrivilege.pacs008));
  fastify.post('/v1/evaluate/iso20022/pacs.002.001.12', SetOptions(Pacs002Handler, 'messageSchemaPacs002', routePrivilege.pacs002));
}

export default Routes;
