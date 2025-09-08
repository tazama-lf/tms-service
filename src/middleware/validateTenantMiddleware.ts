// // SPDX-License-Identifier: Apache-2.0

// import type { FastifyRequest, FastifyReply } from 'fastify';
// import { configuration } from '../';
// import { validateAndExtractTenant } from '@tazama-lf/auth-lib';

// export interface TenantRequest extends FastifyRequest {
//   tenantId: string;
// }

// export const validateAndExtractTenantMiddleware = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
//   const result = validateAndExtractTenant(req.headers.authorization, {
//     authenticated: configuration.AUTHENTICATED,
//     defaultTenantId: 'DEFAULT',
//     tenantIdHeader: req.headers.tenantId as string,
//   });

//   if (!result.success) {
//     reply.code(result.statusCode ?? 401).send({
//       error: result.statusCode === 403 ? 'Forbidden' : 'Unauthorized',
//       message: result.error ?? 'Authentication failed',
//     });
//     return;
//   }

//   (req as TenantRequest).tenantId = result.tenantId ?? 'DEFAULT';
// };
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
