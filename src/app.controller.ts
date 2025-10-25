// SPDX-License-Identifier: Apache-2.0
import type { Pacs002, Pacs008, Pain001, Pain013 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import type { FastifyReply, FastifyRequest } from 'fastify';
import * as util from 'node:util';
import { loggerService } from '.';
import { handlePacs002, handlePacs008, handlePain001, handlePain013 } from './logic.service';
import type { TransactionTypes } from './utils/schema-utils';

const createResponseBody = (data: TransactionTypes): { message: string; data: TransactionTypes } => ({
  message: 'Transaction is valid',
  data,
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

export const Pain001Handler = async (req: FastifyRequest<{ Body: Pain001 }>, reply: FastifyReply): Promise<void> => {
  const { TenantId: tenantId } = req.body;

  loggerService.log(`Start - Handle Pain001 request for tenant ${tenantId}`);

  try {
    const request = req.body;
    await handlePain001(request);

    const body = createResponseBody(request);
    reply.status(200);
    reply.send(body);
  } catch (err) {
    handleError(err, reply);
  } finally {
    loggerService.log('End - Handle Pain001 request');
  }
};

export const Pain013Handler = async (req: FastifyRequest<{ Body: Pain013 }>, reply: FastifyReply): Promise<void> => {
  const { TenantId: tenantId } = req.body;

  loggerService.log(`Start - Handle Pain013 request for tenant ${tenantId}`);

  try {
    const request = req.body;
    await handlePain013(request);

    const body = createResponseBody(request);
    reply.status(200);
    reply.send(body);
  } catch (err) {
    handleError(err, reply);
  } finally {
    loggerService.log('End - Handle Pain013 request');
  }
};

export const Pacs008Handler = async (req: FastifyRequest<{ Body: Pacs008 }>, reply: FastifyReply): Promise<void> => {
  const { TenantId: tenantId } = req.body;

  loggerService.log(`Start - Handle Pacs008 request for tenant ${tenantId}`);

  try {
    const request = req.body;
    await handlePacs008(request);

    const body = createResponseBody(request);
    reply.status(200);
    reply.send(body);
  } catch (err) {
    handleError(err, reply);
  } finally {
    loggerService.log('End - Handle Pacs008 request');
  }
};

export const Pacs002Handler = async (req: FastifyRequest<{ Body: Pacs002 }>, reply: FastifyReply): Promise<void> => {
  const { TenantId: tenantId } = req.body;

  loggerService.log(`Start - Handle Pacs002 request for tenant ${tenantId}`);

  try {
    const request = req.body;
    await handlePacs002(request);

    const body = createResponseBody(request);
    reply.status(200);
    reply.send(body);
  } catch (err) {
    handleError(err, reply);
  } finally {
    loggerService.log('End - Handle Pacs002 request');
  }
};

const handleHealthCheck = (): { status: string } => ({
  status: 'UP',
});

export { handleHealthCheck };
