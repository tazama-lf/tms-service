import apm from 'elastic-apm-node';
import { Context, Next } from 'koa';
import { Pacs002 } from './classes/pacs.002.001.12';
import { Pacs008 } from './classes/pacs.008.001.10';
import { Pain001 } from './classes/pain.001.001.11';
import { Pain013 } from './classes/pain.013.001.09';
import { LoggerService } from './logger.service';
import { handlePacs002, handlePacs008, handlePain001, handlePain013 } from './logic.service';

export const handleExecute = async (ctx: Context, next: Next): Promise<Context> => {
  LoggerService.log('Start - Handle execute request');
  const tx = apm.startTransaction('Handle execute request', 'Pain001.001.11');
  try {
    const request = ctx.request.body as Pain001;
    const result = await handlePain001(request);

    ctx.status = 200;
    ctx.body = result;

    await next();
    return ctx;
  } catch (err) {
    const failMessage = 'Failed to process execution request.';
    LoggerService.error(failMessage, err as Error, 'ApplicationService');

    ctx.status = 500;
    ctx.body = failMessage
    return ctx;
  } finally {
    tx?.end()
    LoggerService.log('End - Handle execute request');
  }
};

export const handleQuoteReply = async (ctx: Context, next: Next): Promise<Context> => {
  LoggerService.log('Start - Handle quote reply request');
  const tx = apm.startTransaction('Handle quote reply request', 'Pain013.001.09');
  try {
    const request = ctx.request.body as Pain013;
    const result = await handlePain013(request);

    ctx.status = 200;
    ctx.body = result;

    await next();
    return ctx;
  } catch (err) {
    const failMessage = 'Failed to process execution request.';
    LoggerService.error(failMessage, err as Error, 'ApplicationService');

    ctx.status = 500;
    ctx.body = failMessage
    return ctx;
  } finally {
    tx?.end()
    LoggerService.log('End - Handle quote reply request');
  }
};

export const handleTransfer = async (ctx: Context, next: Next): Promise<Context> => {
  LoggerService.log('Start - Handle transfer request');
  const tx = apm.startTransaction('Handle transfer request', 'Pacs008.001.10');
  try {
    const request = ctx.request.body as Pacs008;
    const result = await handlePacs008(request);

    ctx.status = 200;
    ctx.body = result;

    await next();
    return ctx;
  } catch (err) {
    const failMessage = 'Failed to process execution request.';
    LoggerService.error(failMessage, err as Error, 'ApplicationService');

    ctx.status = 500;
    ctx.body = failMessage
    return ctx;
  } finally {
    tx?.end()
    LoggerService.log('End - Handle transfer request');
  }
};

export const handleTransferResponse = async (ctx: Context, next: Next): Promise<Context> => {
  LoggerService.log('Start - Handle transfer response request');
  const tx = apm.startTransaction('Handle transfer response request', 'Pacs002.001.12');
  try {
    const request = ctx.request.body as Pacs002;
    const result = await handlePacs002(request);

    ctx.status = 200;
    ctx.body = result;

    await next();
    return ctx;
  } catch (err) {
    const failMessage = 'Failed to process execution request.';
    LoggerService.error(failMessage, err as Error, 'ApplicationService');

    ctx.status = 500;
    ctx.body = failMessage
    return ctx;
  } finally {
    tx?.end()
    LoggerService.log('End - Handle transfer response request');
  }
};
