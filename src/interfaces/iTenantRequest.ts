import type { FastifyRequest } from 'fastify';

export interface TenantRequest extends FastifyRequest {
  tenantId: string;
}
