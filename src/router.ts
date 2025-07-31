// SPDX-License-Identifier: Apache-2.0
import type { FastifyInstance, RouteHandlerMethod, preHandlerHookHandler } from 'fastify';
import { Pacs002Handler, Pacs008Handler, Pain001Handler, Pain013Handler, handleHealthCheck } from './app.controller';
import { validateAndExtractTenantMiddleware } from './middleware/tenantMiddleware';
import { configuration } from './';
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
    // Pain001 and Pain013 routes (tenant-aware via middleware)
    fastify.post('/v1/evaluate/iso20022/pain.001.001.11', {
      preHandler: validateAndExtractTenantMiddleware as preHandlerHookHandler,
      ...SetOptions(Pain001Handler as RouteHandlerMethod, 'messageSchemaPain001', routePrivilege.pain001),
    });
    fastify.post('/v1/evaluate/iso20022/pain.013.001.09', {
      preHandler: validateAndExtractTenantMiddleware as preHandlerHookHandler,
      ...SetOptions(Pain013Handler as RouteHandlerMethod, 'messageSchemaPain013', routePrivilege.pain013),
    });
  }

  // Pacs008 and Pacs002 routes (tenant-aware via middleware)
  fastify.post('/v1/evaluate/iso20022/pacs.008.001.10', {
    preHandler: validateAndExtractTenantMiddleware as preHandlerHookHandler,
    ...SetOptions(Pacs008Handler as RouteHandlerMethod, 'messageSchemaPacs008', routePrivilege.pacs008),
  });
  fastify.post('/v1/evaluate/iso20022/pacs.002.001.12', {
    preHandler: validateAndExtractTenantMiddleware as preHandlerHookHandler,
    ...SetOptions(Pacs002Handler as RouteHandlerMethod, 'messageSchemaPacs002', routePrivilege.pacs002),
  });
}

export default Routes;
