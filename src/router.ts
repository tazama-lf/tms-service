// SPDX-License-Identifier: Apache-2.0
import type { Pacs002, Pacs008, Pain001, Pain013 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import type { FastifyInstance } from 'fastify';
import { configuration } from './';
import { Pacs002Handler, Pacs008Handler, Pain001Handler, Pain013Handler, handleHealthCheck } from './app.controller';
import SetOptions from './utils/schema-utils';

const routePrivilege = {
  pain001: 'POST_V1_EVALUATE_ISO20022_PAIN_001_001_11',
  pain013: 'POST_V1_EVALUATE_ISO20022_PAIN_013_001_09',
  pacs008: 'POST_V1_EVALUATE_ISO20022_PACS_008_001_10',
  pacs002: 'POST_V1_EVALUATE_ISO20022_PACS_002_001_12',
};

function Routes(fastify: FastifyInstance, options: unknown): void {
  fastify.get('/', handleHealthCheck);
  fastify.get('/health', handleHealthCheck);

  if (configuration.QUOTING) {
    fastify.post<{ Body: Pain001 }>(
      '/v1/evaluate/iso20022/pain.001.001.11',
      { ...SetOptions('messageSchemaPain001', routePrivilege.pain001) },
      Pain001Handler,
    );

    fastify.post<{ Body: Pain013 }>(
      '/v1/evaluate/iso20022/pain.013.001.09',
      { ...SetOptions('messageSchemaPain013', routePrivilege.pain013) },
      Pain013Handler,
    );
  }

  fastify.post<{ Body: Pacs008 }>(
    '/v1/evaluate/iso20022/pacs.008.001.10',
    {
      ...SetOptions('messageSchemaPacs008', routePrivilege.pacs008),
    },
    Pacs008Handler,
  );
  fastify.post<{ Body: Pacs002 }>(
    '/v1/evaluate/iso20022/pacs.002.001.12',
    {
      ...SetOptions('messageSchemaPacs002', routePrivilege.pacs002),
    },
    Pacs002Handler,
  );
}

export default Routes;
