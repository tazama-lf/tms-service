// SPDX-License-Identifier: Apache-2.0
import type { FastifyRequest, FastifyReply } from 'fastify';
import { loggerService, configuration } from '../';

// JWT Payload Interface
interface JWTPayload {
  TENANT_ID?: string;
  tenantId?: string;
  [key: string]: unknown;
}

export interface TenantRequest extends FastifyRequest {
  tenantId: string; // Required - middleware guarantees this will be set
}

/**
 * Middleware to validate that incoming messages don't contain predefined tenantId
 * and to always extract/assign a tenant ID using Auth-Lib
 *
 * TODO: This middleware will be updated to use Auth-Lib's validateAndExtractTenant()
 * and validateTokenAndExtractTenant() functions once the Auth-Lib PR is merged.
 */
export const validateAndExtractTenantMiddleware = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    let tenantId = 'DEFAULT'; // Default value

    if (configuration.AUTHENTICATED) {
      // Extract from JWT when authenticated
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith('Bearer ')) {
        reply.code(401).send({ error: 'Missing or invalid authorization header' });
        return;
      }

      try {
        const [, token] = authHeader.split(' ');

        // Temporary manual JWT parsing - will be replaced with Auth-Lib function
        const [, payloadPart] = token.split('.');
        const payload = JSON.parse(Buffer.from(payloadPart, 'base64').toString()) as JWTPayload;

        // Support both TENANT_ID and tenantId claims for backward compatibility
        const { TENANT_ID, tenantId: jwtTenantId } = payload;
        if (TENANT_ID?.trim()) {
          tenantId = TENANT_ID;
          loggerService.log(`Extracted tenant ID: ${tenantId}`, 'validateAndExtractTenantMiddleware');
        } else if (jwtTenantId?.trim()) {
          tenantId = jwtTenantId;
          loggerService.log(`Extracted tenant ID: ${tenantId}`, 'validateAndExtractTenantMiddleware');
        } else {
          loggerService.error('Neither TENANT_ID nor tenantId attribute found in JWT token', 'validateAndExtractTenantMiddleware');
          reply.code(403).send({
            error: 'Forbidden',
            message: 'TENANT_ID or tenantId attribute is required and cannot be blank',
          });
          return;
        }
      } catch (jwtError) {
        loggerService.error('Failed to decode JWT token', 'validateAndExtractTenantMiddleware');
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

    // Always assign tenantId (either extracted or default)
    (req as TenantRequest).tenantId = tenantId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    loggerService.error(`Error in tenant validation middleware: ${errorMessage}`, 'validateAndExtractTenantMiddleware');
    reply.code(500).send({ error: 'Internal Server Error' });
  }
};
