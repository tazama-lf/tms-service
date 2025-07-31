// SPDX-License-Identifier: Apache-2.0
import type { FastifyRequest, FastifyReply } from 'fastify';
import { loggerService, configuration } from '../';

export interface TenantRequest extends FastifyRequest {
  tenantId: string; // Required - middleware guarantees this will be set
}

// Constants for JWT handling
const BEARER_PREFIX = 'Bearer ';
const JWT_PAYLOAD_INDEX = 1;

// JWT payload interface
interface JWTPayload {
  TENANT_ID?: string;
  tenantId?: string;
}

/**
 * Middleware to validate that incoming messages don't contain predefined tenantId
 * and to always extract/assign a tenant ID
 */
export const validateAndExtractTenantMiddleware = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    // VALIDATION: Reject messages with predefined tenantId attribute
    if (req.body && typeof req.body === 'object') {
      const bodyObj = req.body as Record<string, unknown>;
      if ('tenantId' in bodyObj) {
        loggerService.error('Message contains predefined tenantId attribute', 'validateAndExtractTenantMiddleware');
        reply.code(400).send({
          error: 'Bad Request',
          message: 'Messages must not contain a predefined tenantId attribute',
        });
        return;
      }
    }

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
      // AUTHENTICATED=false: Use default tenant ID
      loggerService.log('Set tenant ID to DEFAULT (unauthenticated mode)', 'validateAndExtractTenantMiddleware');
    }

    // Always assign tenantId (either extracted or default)
    (req as TenantRequest).tenantId = tenantId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    loggerService.error(`Error in tenant validation middleware: ${errorMessage}`, 'validateAndExtractTenantMiddleware');
    reply.code(500).send({ error: 'Internal Server Error' });
  }
};

/**
 * Legacy middleware for backward compatibility - to be deprecated
 * @deprecated Use validateAndExtractTenantMiddleware instead
 */
export const extractTenantMiddleware = async (req: TenantRequest, reply: FastifyReply): Promise<void> => {
  try {
    // Check if authentication is enabled
    if (configuration.AUTHENTICATED) {
      const authHeader = req.headers.authorization;

      if (!authHeader?.startsWith(BEARER_PREFIX)) {
        reply.code(401).send({ error: 'Missing or invalid authorization header' });
        return;
      }

      const token = authHeader.substring(BEARER_PREFIX.length);

      // Decode JWT to extract tenant ID (simplified - in production use proper JWT library)
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[JWT_PAYLOAD_INDEX], 'base64').toString()) as JWTPayload;

        if (payload.tenantId) {
          req.tenantId = payload.tenantId;
          loggerService.log(`Extracted tenant ID: ${req.tenantId}`, 'extractTenantMiddleware');
        } else {
          loggerService.log('No tenant ID found in JWT token', 'extractTenantMiddleware');
        }
      } catch (jwtError) {
        loggerService.error('Failed to decode JWT token', 'extractTenantMiddleware');
        reply.code(401).send({ error: 'Invalid JWT token' });
      }
    } else {
      // In non-authenticated mode, tenant ID could come from headers
      const tenantHeader = req.headers['x-tenant-id'] as string;
      if (tenantHeader) {
        req.tenantId = tenantHeader;
        loggerService.log(`Extracted tenant ID from header: ${req.tenantId}`, 'extractTenantMiddleware');
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    loggerService.error(`Error in tenant middleware: ${errorMessage}`, 'extractTenantMiddleware');
    // Continue processing even if tenant extraction fails
  }
};

/**
 * Helper function to enhance transaction with tenant ID
 */
export const enhanceTransactionWithTenant = <T>(transaction: T, tenantId?: string): T & { tenantId: string } => {
  const finalTenantId = tenantId ?? 'DEFAULT';
  return {
    ...transaction,
    tenantId: finalTenantId,
  };
};
