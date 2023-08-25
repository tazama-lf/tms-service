import Fastify, { type FastifyInstance } from 'fastify';
import { fastifySwagger } from '@fastify/swagger';
import { fastifyCors } from '@fastify/cors';
import Routes from '../router';
import { pain001Schema, pacs008Schema, pacs002Schema, pain013Schema, requestHeaderSchema } from '@frmscoe/frms-coe-lib/lib/schemata';

const fastify = Fastify();

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
  await fastify.register(fastifyCors, {
    origin: '*',
    methods: ['POST'],
    allowedHeaders: '*',
  });

  fastify.addSchema(pain001Schema);
  fastify.addSchema(pacs002Schema);
  fastify.addSchema(pacs008Schema);
  fastify.addSchema(pain013Schema);
  fastify.addSchema(requestHeaderSchema);

  fastify.register(Routes);
  await fastify.ready();
  fastify.swagger();
  return await fastify;
}

export async function destroyFasityClient(): Promise<void> {
  await fastify.close();
}
