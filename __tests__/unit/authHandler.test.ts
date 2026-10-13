// SPDX-License-Identifier: Apache-2.0
import { validateTokenAndClaims } from '@tazama-lf/auth-lib';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { loggerService } from '../../src';
import { tokenHandler } from '../../src/auth/authHandler';

jest.mock('@tazama-lf/auth-lib', () => ({ validateTokenAndClaims: jest.fn() }));
jest.mock('../../src', () => ({ loggerService: { log: jest.fn(), error: jest.fn() } }));

const claim = 'POST_V1_EVALUATE_ISO20022_PACS_008_001_10';
const validateToken = jest.mocked(validateTokenAndClaims);

const createRequest = (authorization?: string): FastifyRequest => ({ headers: { authorization } }) as FastifyRequest;
const createReply = () => ({ code: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis() });

describe('tokenHandler', () => {
  it.each<ReturnType<typeof validateTokenAndClaims>>([{ [claim]: false }, {}])(
    'rejects denied or missing claims without logging authentication success: %j',
    async (claims) => {
      validateToken.mockReturnValueOnce(claims);
      const reply = createReply();

      await tokenHandler(claim)(createRequest('Bearer test-token'), reply as unknown as FastifyReply);

      expect(validateToken).toHaveBeenCalledWith('test-token', [claim]);
      expect(reply.code).toHaveBeenCalledTimes(1);
      expect(reply.code).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledTimes(1);
      expect(reply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(loggerService.log).not.toHaveBeenCalled();
    },
  );

  it('logs authentication success only when the required claim is granted', async () => {
    validateToken.mockReturnValueOnce({ [claim]: true });
    const reply = createReply();

    await tokenHandler(claim)(createRequest('Bearer test-token'), reply as unknown as FastifyReply);

    expect(validateToken).toHaveBeenCalledWith('test-token', [claim]);
    expect(loggerService.log).toHaveBeenCalledTimes(1);
    expect(loggerService.log).toHaveBeenCalledWith('Authenticated', 'tokenHandler()');
    expect(reply.code).not.toHaveBeenCalled();
    expect(reply.send).not.toHaveBeenCalled();
  });

  it.each([undefined, '', 'Basic test-token', 'bearer test-token'])('rejects invalid authorization header %s', async (authorization) => {
    const reply = createReply();

    await tokenHandler(claim)(createRequest(authorization), reply as unknown as FastifyReply);

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(validateToken).not.toHaveBeenCalled();
    expect(loggerService.log).not.toHaveBeenCalled();
  });

  it('rejects an empty required claim before validating the token', async () => {
    const reply = createReply();

    await tokenHandler('')(createRequest('Bearer test-token'), reply as unknown as FastifyReply);

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(validateToken).not.toHaveBeenCalled();
    expect(loggerService.log).not.toHaveBeenCalled();
  });

  it('rejects token validation errors without logging authentication success', async () => {
    validateToken.mockImplementationOnce(() => {
      throw new Error('Invalid test token');
    });
    const reply = createReply();

    await tokenHandler(claim)(createRequest('Bearer test-token'), reply as unknown as FastifyReply);

    expect(reply.code).toHaveBeenCalledTimes(1);
    expect(reply.code).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledTimes(1);
    expect(reply.send).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(loggerService.error).toHaveBeenCalledWith(expect.stringContaining('Invalid test token'), 'tokenHandler()');
    expect(loggerService.log).not.toHaveBeenCalled();
  });

  it.each([false, true])('Fastify invokes the route handler only for granted claims: %s', async (granted) => {
    validateToken.mockReturnValueOnce({ [claim]: granted });
    const app = Fastify();
    const handler = jest.fn(async () => ({ ok: true }));
    app.post('/test', { preHandler: tokenHandler(claim) }, handler);

    try {
      const response = await app.inject({ method: 'POST', url: '/test', headers: { authorization: 'Bearer test-token' } });

      expect(response.statusCode).toBe(granted ? 200 : 401);
      expect(response.json()).toEqual(granted ? { ok: true } : { error: 'Unauthorized' });
      expect(handler).toHaveBeenCalledTimes(granted ? 1 : 0);
      expect(loggerService.log).toHaveBeenCalledTimes(granted ? 1 : 0);
      if (granted) expect(loggerService.log).toHaveBeenCalledWith('Authenticated', 'tokenHandler()');
    } finally {
      await app.close();
    }
  });
});
