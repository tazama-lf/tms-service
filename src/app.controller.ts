import { type Pacs002, type Pacs008, type Pain001, type Pain013 } from '@frmscoe/frms-coe-lib/lib/interfaces';
import { loggerService } from '.';
import { handlePacs002, handlePacs008, handlePain001, handlePain013 } from './logic.service';
import { type FastifyRequest, type FastifyReply } from 'fastify';

export const handleExecute = async (
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<{ message?: string; data?: Pain001; err?: unknown }> => {
  loggerService.log('Start - Handle execute request');

  try {
    const request = req.body as Pain001;
    await handlePain001(request);

    const body = {
      message: 'Transaction is valid',
      data: request,
    };
    reply.code(200);
    reply.send(body);

    return body;
  } catch (err) {
    const failMessage = `Failed to process execution request. \n${JSON.stringify(err, null, 4)}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.code(500);
    reply.send(failMessage);
    return { err: failMessage };
  } finally {
    loggerService.log('End - Handle execute request');
  }
};

export const handleQuoteReply = async (
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<{ message?: string; data?: Pain013; err?: unknown }> => {
  loggerService.log('Start - Handle quote reply request');
  try {
    const request = req.body as Pain013;
    handlePain013(request);

    const body = {
      message: 'Transaction is valid',
      data: request,
    };
    reply.status(200);
    reply.send(body);

    return body;
  } catch (err) {
    const failMessage = `Failed to process execution request. \n${JSON.stringify(err, null, 4)}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.status(500);
    reply.send(failMessage);
    return { err: failMessage };
  } finally {
    loggerService.log('End - Handle quote reply request');
  }
};

export const handleTransfer = async (
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<{ message?: string; data?: Pacs008; err?: unknown }> => {
  loggerService.log('Start - Handle transfer request');
  try {
    const request = req.body as Pacs008;
    await handlePacs008(request);

    const body = {
      message: 'Transaction is valid',
      data: request,
    };
    reply.status(200);
    reply.send(body);

    return body;
  } catch (err) {
    const failMessage = `Failed to process execution request. \n${JSON.stringify(err, null, 4)}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.status(500);
    reply.send(failMessage);
    return { err: failMessage };
  } finally {
    loggerService.log('End - Handle transfer request');
  }
};

export const handleTransferResponse = async (
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<{ message?: string; data?: Pacs002; err?: unknown }> => {
  loggerService.log('Start - Handle transfer response request');
  try {
    const request = req.body as Pacs002;
    await handlePacs002(request);

    const body = {
      message: 'Transaction is valid',
      data: request,
    };
    reply.status(200);
    reply.send(body);

    return body;
  } catch (err) {
    const failMessage = `Failed to process execution request. \n${JSON.stringify(err, null, 4)}`;
    loggerService.error(failMessage, 'ApplicationService');

    reply.status(500);
    reply.send(failMessage);
    return { err: failMessage };
  } finally {
    loggerService.log('End - Handle transfer response request');
  }
};

const handleHealthCheck = async (): Promise<{ status: string }> => {
  return {
    status: 'UP',
  };
};

export { handleHealthCheck };
