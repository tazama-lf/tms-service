// SPDX-License-Identifier: Apache-2.0
import type { Pacs002, Pacs008, Pain001, Pain013 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { loggerService } from '.';
import { handlePacs002, handlePacs008, handlePain001, handlePain013 } from './logic.service';
import type { FastifyReply } from 'fastify';
import { extractTransactionType } from './utils/transaction-utils';
import { enhanceTransactionWithTenant } from './utils/tenantUtils';
import type { TenantRequest } from './middleware/tenantMiddleware';
import * as util from 'node:util';

// Utility functions to reduce duplication
const createResponseBody = (data: unknown, transactionType?: string): { message: string; data: unknown } => ({
  message: 'Transaction is valid',
  data: transactionType ? { ...(data as Record<string, unknown>), TxTp: transactionType } : data,
});

const handleError = (err: unknown, reply: FastifyReply): void => {
  let errorMessage = 'Unknown error occurred';

  if (err instanceof Error) {
    errorMessage = err.message;
  } else if (typeof err === 'string') {
    errorMessage = err;
  } else {
    errorMessage = util.inspect(err);
  }

  const failMessage = `Failed to process execution request. \n${errorMessage}`;
  loggerService.error(failMessage, 'ApplicationService');
  reply.status(500);
  reply.send(failMessage);
};

export const Pain001Handler = async (req: TenantRequest, reply: FastifyReply): Promise<void> => {
  const transactionType = extractTransactionType(req.routeOptions.url);
  const { tenantId } = req;

  loggerService.log(`Start - Handle ${transactionType} request for tenant ${tenantId}`);

  try {
    const request = req.body as Pain001;
    const enhancedRequest = enhanceTransactionWithTenant(request, tenantId);
    await handlePain001(enhancedRequest, transactionType);

    const body = createResponseBody(request);
    reply.status(200);
    reply.send(body);
  } catch (err) {
    handleError(err, reply);
  } finally {
    loggerService.log(`End - Handle ${transactionType} request`);
  }
};

export const Pain013Handler = async (req: TenantRequest, reply: FastifyReply): Promise<void> => {
  const transactionType = extractTransactionType(req.routeOptions.url);
  const { tenantId } = req;

  loggerService.log(`Start - Handle ${transactionType} request for tenant ${tenantId}`);

  try {
    const request = req.body as Pain013;
    const enhancedRequest = enhanceTransactionWithTenant(request, tenantId);
    await handlePain013(enhancedRequest, transactionType);

    const body = createResponseBody(request, transactionType);
    reply.status(200);
    reply.send(body);
  } catch (err) {
    handleError(err, reply);
  } finally {
    loggerService.log(`End - Handle ${transactionType} request`);
  }
};

export const Pacs008Handler = async (req: TenantRequest, reply: FastifyReply): Promise<void> => {
  const transactionType = extractTransactionType(req.routeOptions.url);
  const { tenantId } = req;

  loggerService.log(`Start - Handle ${transactionType} request for tenant ${tenantId}`);

  try {
    const request = req.body as Pacs008;
    const enhancedRequest = enhanceTransactionWithTenant(request, tenantId);
    await handlePacs008(enhancedRequest, transactionType);

    const body = createResponseBody(request);
    reply.status(200);
    reply.send(body);
  } catch (err) {
    handleError(err, reply);
  } finally {
    loggerService.log(`End - Handle ${transactionType} request`);
  }
};

export const Pacs002Handler = async (req: TenantRequest, reply: FastifyReply): Promise<void> => {
  const transactionType = extractTransactionType(req.routeOptions.url);
  const { tenantId } = req;

  loggerService.log(`Start - Handle ${transactionType} request for tenant ${tenantId}`);

  try {
    const request = req.body as Pacs002;
    const enhancedRequest = enhanceTransactionWithTenant(request, tenantId);
    await handlePacs002(enhancedRequest, transactionType);

    const body = createResponseBody(request);
    reply.status(200);
    reply.send(body);
  } catch (err) {
    handleError(err, reply);
  } finally {
    loggerService.log(`End - Handle ${transactionType} request`);
  }
};

const handleHealthCheck = (): { status: string } => ({
  status: 'UP',
});

export { handleHealthCheck };
