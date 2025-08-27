// SPDX-License-Identifier: Apache-2.0

import type { FastifyRequest, FastifyReply } from 'fastify';
import { loggerService, configuration } from '../';
import { validateTokenAndClaims } from '@tazama-lf/auth-lib';

interface JwtPayload {
  TENANT_ID?: string;
  tenantId?: string;
  [key: string]: unknown;
}

export interface TenantRequest extends FastifyRequest {
  tenantId: string; // Required - middleware guarantees this will be set
}

/**
 * Middleware to validate and extract tenant ID using Auth-Lib
 */
export const validateAndExtractTenantMiddleware = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    let tenantId = 'DEFAULT';

    if (configuration.AUTHENTICATED) {
      // Use Auth-Lib for JWT validation and tenant extraction
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        reply.code(401).send({ error: 'Missing or invalid authorization header' });
        return;
      }
      try {
        const [, token] = authHeader.split(' ');
        // Use Auth-Lib to verify token
        const claimsResult = validateTokenAndClaims(token, ['TENANT_ID', 'tenantId']);
        // Decode payload and extract value
        const [, payloadPart] = token.split('.');
        const payload: JwtPayload = JSON.parse(Buffer.from(payloadPart, 'base64').toString()) as JwtPayload;
        let extractedTenantId = '';
        if (typeof payload.TENANT_ID === 'string') {
          extractedTenantId = payload.TENANT_ID.trim();
        } else if (typeof payload.tenantId === 'string') {
          extractedTenantId = payload.tenantId.trim();
        }
        if (!claimsResult.TENANT_ID && !claimsResult.tenantId) {
          loggerService.error('Neither TENANT_ID nor tenantId attribute found in JWT token', 'validateAndExtractTenantMiddleware');
          reply.code(403).send({
            error: 'Forbidden',
            message: 'TENANT_ID or tenantId attribute is required and cannot be blank',
          });
          return;
        }
        if (!extractedTenantId) {
          loggerService.error('TENANT_ID or tenantId attribute is blank in JWT token', 'validateAndExtractTenantMiddleware');
          reply.code(403).send({
            error: 'Forbidden',
            message: 'TENANT_ID or tenantId attribute is required and cannot be blank',
          });
          return;
        }
        tenantId = extractedTenantId;
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
      // AUTHENTICATED=false: Check for tenantId header for testing, otherwise use default
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
