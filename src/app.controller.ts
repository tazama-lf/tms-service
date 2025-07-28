// SPDX-License-Identifier: Apache-2.0
import type { Pacs002, Pacs008, Pain001, Pain013 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { loggerService } from '.';
import { handlePacs002, handlePacs008, handlePain001, handlePain013 } from './logic.service';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { validateAndExtractTenantMiddleware, enhanceTransactionWithTenant, type TenantRequest } from './middleware/tenantMiddleware';

// Constants for HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Constants for array indexing and string operations
const ARRAY_OFFSET = 1;
const STRING_END_OFFSET = 1;
const URL_POSITION_OFFSET = 4;

export const Pain001Handler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  // Extract tenant information first
  await validateAndExtractTenantMiddleware(req as TenantRequest, reply);
  if (reply.sent) return; // If middleware sent a response (error), exit early

  const urlPath = JSON.stringify(req.routeOptions.url);
  const lastIndexOfForwardSlash = urlPath.lastIndexOf('/') + ARRAY_OFFSET;
  const transactionType = urlPath.substring(lastIndexOfForwardSlash, urlPath.length - STRING_END_OFFSET);

  const { tenantId } = req as TenantRequest;
  const finalTenantId = tenantId ?? 'DEFAULT';
  loggerService.log(`Start - Handle ${transactionType} request for tenant ${finalTenantId}`);

  try {
    const request = req.body as Pain001;
    const enhancedRequest = enhanceTransactionWithTenant(request, finalTenantId);
    await handlePain001(enhancedRequest, transactionType);

    const body = {
      message: 'Transaction is valid',
      data: request,
    };
    reply.code(HTTP_STATUS.OK);
    reply.send(body);
  } catch (err) {
    const failMessage = `Failed to process execution request. \n${JSON.stringify(err, null, URL_POSITION_OFFSET)}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    reply.send(failMessage);
  } finally {
    loggerService.log(`End - Handle ${transactionType} request`);
  }
};

export const Pain013Handler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  // Extract tenant information first
  await validateAndExtractTenantMiddleware(req as TenantRequest, reply);
  if (reply.sent) return; // If middleware sent a response (error), exit early

  const urlPath = JSON.stringify(req.routeOptions.url);
  const lastIndexOfForwardSlash = urlPath.lastIndexOf('/') + ARRAY_OFFSET;
  const transactionType = urlPath.substring(lastIndexOfForwardSlash, urlPath.length - STRING_END_OFFSET);

  const { tenantId } = req as TenantRequest;
  const finalTenantId = tenantId ?? 'DEFAULT';
  loggerService.log(`Start - Handle ${transactionType} request for tenant ${finalTenantId}`);

  try {
    const request = req.body as Pain013;
    const enhancedRequest = enhanceTransactionWithTenant(request, finalTenantId);
    await handlePain013(enhancedRequest, transactionType);

    const body = {
      message: 'Transaction is valid',
      data: { ...request, TxTp: transactionType },
    };
    reply.status(HTTP_STATUS.OK);
    reply.send(body);
  } catch (err) {
    const failMessage = `Failed to process execution request. \n${JSON.stringify((err as Error).message, null, URL_POSITION_OFFSET)}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    reply.send(failMessage);
  } finally {
    loggerService.log(`End - Handle ${transactionType} request`);
  }
};

export const Pacs008Handler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  // Extract tenant information first
  await validateAndExtractTenantMiddleware(req as TenantRequest, reply);
  if (reply.sent) return; // If middleware sent a response (error), exit early

  const urlPath = JSON.stringify(req.routeOptions.url);
  const lastIndexOfForwardSlash = urlPath.lastIndexOf('/') + ARRAY_OFFSET;
  const transactionType = urlPath.substring(lastIndexOfForwardSlash, urlPath.length - STRING_END_OFFSET);

  const { tenantId } = req as TenantRequest;
  const finalTenantId = tenantId ?? 'DEFAULT';
  loggerService.log(`Start - Handle ${transactionType} request for tenant ${finalTenantId}`);

  try {
    const request = req.body as Pacs008;
    const enhancedRequest = enhanceTransactionWithTenant(request, finalTenantId);
    await handlePacs008(enhancedRequest, transactionType);

    const body = {
      message: 'Transaction is valid',
      data: request,
    };
    reply.status(HTTP_STATUS.OK);
    reply.send(body);
  } catch (err) {
    loggerService.error(JSON.stringify(err));
    const failMessage = `Failed to process execution request. \n${JSON.stringify(err, null, URL_POSITION_OFFSET)}`;
    loggerService.error(failMessage, 'ApplicationService');
    reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    reply.send(failMessage);
  } finally {
    loggerService.log(`End - Handle ${transactionType} request`);
  }
};

export const Pacs002Handler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  // Extract tenant information first
  await validateAndExtractTenantMiddleware(req as TenantRequest, reply);
  if (reply.sent) return; // If middleware sent a response (error), exit early

  const urlPath = JSON.stringify(req.routeOptions.url);
  const lastIndexOfForwardSlash = urlPath.lastIndexOf('/') + ARRAY_OFFSET;
  const transactionType = urlPath.substring(lastIndexOfForwardSlash, urlPath.length - STRING_END_OFFSET);

  const { tenantId } = req as TenantRequest;
  const finalTenantId = tenantId ?? 'DEFAULT';
  loggerService.log(`Start - Handle ${transactionType} request for tenant ${finalTenantId}`);

  try {
    const request = req.body as Pacs002;
    const enhancedRequest = enhanceTransactionWithTenant(request, finalTenantId);
    await handlePacs002(enhancedRequest, transactionType);

    const body = {
      message: 'Transaction is valid',
      data: request,
    };
    reply.status(HTTP_STATUS.OK);
    reply.send(body);
  } catch (err) {
    const failMessage = `Failed to process execution request. \n${JSON.stringify(err, null, URL_POSITION_OFFSET)}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.status(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    reply.send(failMessage);
  } finally {
    loggerService.log(`End - Handle ${transactionType} request`);
  }
};

const handleHealthCheck = (): { status: string } => ({
  status: 'UP',
});

export { handleHealthCheck };
