// SPDX-License-Identifier: Apache-2.0
import { type Pacs002, type Pacs008, type Pain001, type Pain013 } from '@tazama-lf/frms-coe-lib/lib/interfaces';
import { loggerService } from '.';
import { handlePacs002, handlePacs008, handlePain001, handlePain013 } from './logic.service';
import { type FastifyRequest, type FastifyReply } from 'fastify';

export const Pain001Handler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const urlPath = JSON.stringify(req.routeOptions.url);
  const lastIndexOfForwardSlash = urlPath.lastIndexOf('/') + 1;
  const transactionType = urlPath.substring(lastIndexOfForwardSlash, urlPath.length - 1);

  loggerService.log(`Start - Handle ${transactionType} request`);

  try {
    const request = req.body as Pain001;
    await handlePain001(request, transactionType);

    const body = {
      message: 'Transaction is valid',
      data: request,
    };
    reply.code(200);
    reply.send(body);
  } catch (err) {
    const failMessage = `Failed to process execution request. \n${JSON.stringify(err, null, 4)}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.code(500);
    reply.send(failMessage);
  } finally {
    loggerService.log(`End - Handle ${transactionType} request`);
  }
};

export const Pain013Handler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const urlPath = JSON.stringify(req.routeOptions.url);
  const lastIndexOfForwardSlash = urlPath.lastIndexOf('/') + 1;
  const transactionType = urlPath.substring(lastIndexOfForwardSlash, urlPath.length - 1);

  loggerService.log(`Start - Handle ${transactionType} request`);
  try {
    const request = req.body as Pain013;
    handlePain013(request, transactionType);

    const body = {
      message: 'Transaction is valid',
      data: { ...request, TxTp: transactionType },
    };
    reply.status(200);
    reply.send(body);
  } catch (err) {
    const failMessage = `Failed to process execution request. \n${JSON.stringify((err as Error).message, null, 4)}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.status(500);
    reply.send(failMessage);
  } finally {
    loggerService.log(`End - Handle ${transactionType} request`);
  }
};

export const Pacs008Handler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const urlPath = JSON.stringify(req.routeOptions.url);
  const lastIndexOfForwardSlash = urlPath.lastIndexOf('/') + 1;
  const transactionType = urlPath.substring(lastIndexOfForwardSlash, urlPath.length - 1);

  loggerService.log(`Start - Handle ${transactionType} request`);
  try {
    const request = req.body as Pacs008;
    await handlePacs008(request, transactionType);

    const body = {
      message: 'Transaction is valid',
      data: request,
    };
    reply.status(200);
    reply.send(body);
  } catch (err) {
    loggerService.error(JSON.stringify(err));
    const failMessage = `Failed to process execution request. \n${JSON.stringify(err, null, 4)}`;
    loggerService.error(failMessage, 'ApplicationService');
    reply.status(500);
    reply.send(failMessage);
  } finally {
    loggerService.log(`End - Handle ${transactionType} request`);
  }
};

export const Pacs002Handler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const urlPath = JSON.stringify(req.routeOptions.url);
  const lastIndexOfForwardSlash = urlPath.lastIndexOf('/') + 1;
  const transactionType = urlPath.substring(lastIndexOfForwardSlash, urlPath.length - 1);

  loggerService.log(`Start - Handle ${transactionType} request`);
  try {
    const request = req.body as Pacs002;
    await handlePacs002(request, transactionType);

    const body = {
      message: 'Transaction is valid',
      data: request,
    };
    reply.status(200);
    reply.send(body);
  } catch (err) {
    const failMessage = `Failed to process execution request. \n${JSON.stringify(err, null, 4)}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.status(500);
    reply.send(failMessage);
  } finally {
    loggerService.log(`End - Handle ${transactionType} request`);
  }
};

const handleHealthCheck = async (): Promise<{ status: string }> => {
  return {
    status: 'UP',
  };
};

export { handleHealthCheck };
