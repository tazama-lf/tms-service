// SPDX-License-Identifier: Apache-2.0

import type { FastifyRequest, FastifyReply } from 'fastify';
import { configuration, loggerService } from '..';
import { extractTenant } from '@tazama-lf/auth-lib';
import type { TenantRequest } from '../interfaces/iTenantRequest';

export const validateTenantMiddleware = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const logContext = 'validateTenantMiddleware()';
  try {
    const response = extractTenant(configuration.AUTHENTICATED, req.headers.authorization);
    if (!response.success || !response.tenantId) {
      loggerService.error('Tenant validation failed: No tenantId found in token', logContext);
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }
    (req as TenantRequest).tenantId = response.tenantId;
  } catch (error) {
    const err = error as Error;
    loggerService.error(`${err.name}: ${err.message}\n${err.stack}`, logContext);
    reply.code(401).send({ error: 'Unauthorized' });
  }
};
