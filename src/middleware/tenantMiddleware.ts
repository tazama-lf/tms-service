// SPDX-License-Identifier: Apache-2.0
import type { FastifyRequest, FastifyReply } from 'fastify';
import { loggerService, configuration } from '../';
import type { JWTPayload } from '../interfaces/jwt';

export interface TenantRequest extends FastifyRequest {
  tenantId: string; // Required - middleware guarantees this will be set
}

// Constants for JWT handling
const BEARER_PREFIX = 'Bearer ';
const JWT_PAYLOAD_INDEX = 1;

/**
 * Middleware to validate that incoming messages don't contain predefined tenantId
 * and to always extract/assign a tenant ID
 */
export const validateAndExtractTenantMiddleware = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    // Always extract or assign tenant ID
    let tenantId = 'DEFAULT'; // Default value

    if (configuration.AUTHENTICATED) {
      // Extract from JWT when authenticated
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith(BEARER_PREFIX)) {
        reply.code(401).send({ error: 'Missing or invalid authorization header' });
        return;
      }

      const token = authHeader.substring(BEARER_PREFIX.length);

      // Decode JWT to extract tenant ID (simplified - in production use proper JWT library)
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[JWT_PAYLOAD_INDEX], 'base64').toString()) as JWTPayload;

        if (payload.TENANT_ID && payload.TENANT_ID.trim() !== '') {
          tenantId = payload.TENANT_ID;
          loggerService.log(`Extracted tenant ID: ${tenantId}`, 'validateAndExtractTenantMiddleware');
        } else {
          loggerService.error('TENANT_ID attribute is blank in JWT token', 'validateAndExtractTenantMiddleware');
          reply.code(403).send({
            error: 'Forbidden',
            message: 'TENANT_ID attribute is required and cannot be blank',
          });
          return;
        }
      } catch (jwtError) {
        loggerService.error('Failed to decode JWT token', 'validateAndExtractTenantMiddleware');
        reply.code(401).send({ error: 'Invalid JWT token' });
        return;
      }
    } else {
      // AUTHENTICATED=false: Check for X-Tenant-ID header for testing, otherwise use default
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
