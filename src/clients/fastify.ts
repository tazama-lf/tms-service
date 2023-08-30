/* eslint-disable @typescript-eslint/no-explicit-any */
import Fastify, { type FastifyInstance } from 'fastify';
import { fastifySwagger } from '@fastify/swagger';
import { fastifyCors } from '@fastify/cors';
import Routes from '../router';
import { messageSchema } from '@frmscoe/frms-coe-lib/lib/helpers/schemas/message';

const fastify = Fastify();

const schema = { ...messageSchema.properties.transaction, $id: 'transactionSchema' };
export default async function initializeFastifyClient(): Promise<FastifyInstance> {
  fastify.register(fastifySwagger, {
    specification: {
      path: './build/swagger.yaml',
      postProcessor: function (swaggerObject) {
        return swaggerObject;
      },
      baseDir: '../../',
    },
    prefix: '/swagger',
  });
  fastify.addSchema(schema);
  await fastify.register(fastifyCors, {
    origin: '*',
    methods: ['POST'],
    allowedHeaders: '*',
  });
  fastify.register(Routes);
  await fastify.ready();
  fastify.swagger();
  return await fastify;
}

export async function destroyFasityClient(): Promise<void> {
  await fastify.close();
}
