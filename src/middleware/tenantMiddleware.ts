// SPDX-License-Identifier: Apache-2.0

import type { FastifyRequest, FastifyReply } from 'fastify';
import { loggerService, configuration } from '../';
import { validateTokenAndClaims } from '@tazama-lf/auth-lib';

export interface TenantRequest extends FastifyRequest {
  tenantId: string;
}

export const validateAndExtractTenantMiddleware = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    let tenantId = 'DEFAULT';

    if (configuration.AUTHENTICATED) {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        reply.code(401).send({ error: 'Missing or invalid authorization header' });
        return;
      }
      try {
        const [, token] = authHeader.split(' ');
        const claimsResult = validateTokenAndClaims(token, ['tenantId']) as { tenantId?: string };
        const tenantIdFromToken = claimsResult.tenantId;
        if (typeof tenantIdFromToken !== 'string' || tenantIdFromToken.trim() === '') {
          loggerService.error('tenantId attribute is required and cannot be blank in JWT token', 'validateAndExtractTenantMiddleware');
          reply.code(403).send({
            error: 'Forbidden',
            message: 'tenantId attribute is required and cannot be blank',
          });
          return;
        }
        tenantId = tenantIdFromToken.trim();
        loggerService.log(`Extracted tenant ID: ${tenantId}`, 'validateAndExtractTenantMiddleware');
      } catch (authLibError) {
        loggerService.error(
          `Auth-Lib tenant extraction failed: ${authLibError instanceof Error ? authLibError.message : String(authLibError)}`,
          'validateAndExtractTenantMiddleware',
        );
        reply.code(401).send({ error: 'Invalid JWT token' });
        return;
      }
    } else {
      const headerTenantId = req.headers.tenantId as string;
      if (headerTenantId && headerTenantId.trim() !== '') {
        tenantId = headerTenantId.trim();
        loggerService.log(`Using tenant ID from header: ${tenantId}`, 'validateAndExtractTenantMiddleware');
      } else {
        loggerService.log('Set tenant ID to DEFAULT (unauthenticated mode)', 'validateAndExtractTenantMiddleware');
      }
    }
    (req as TenantRequest).tenantId = tenantId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    loggerService.error(`Error in tenant validation middleware: ${errorMessage}`, 'validateAndExtractTenantMiddleware');
    reply.code(500).send({ error: 'Internal Server Error' });
  }
};
