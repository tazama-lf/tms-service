// SPDX-License-Identifier: Apache-2.0
import Fastify, { type FastifyInstance } from 'fastify';
import { fastifySwagger } from '@fastify/swagger';
import { fastifyCors } from '@fastify/cors';
import Routes from '../router';
import Ajv from 'ajv';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import messageSchemaPacs002 from '../schemas/pacs.002.json';
import messageSchemaPacs008 from '../schemas/pacs.008.json';
import messageSchemaPain001 from '../schemas/pain.001.json';
import messageSchemaPain013 from '../schemas/pain.013.json';
import { configuration } from '..';

const schemaPacs002 = { ...messageSchemaPacs002, $id: 'messageSchemaPacs002' };
const schemaPacs008 = { ...messageSchemaPacs008, $id: 'messageSchemaPacs008' };
const schemaPain001 = { ...messageSchemaPain001, $id: 'messageSchemaPain001' };
const schemaPain013 = { ...messageSchemaPain013, $id: 'messageSchemaPain013' };

const fastify = Fastify();

const ajv = new Ajv({
  removeAdditional: 'all',
  useDefaults: true,
  coerceTypes: 'array',
  strictTuples: false,
  strict: false,
});

ajv.addSchema(schemaPain001);
ajv.addSchema(schemaPain013);
ajv.addSchema(schemaPacs008);
ajv.addSchema(schemaPacs002);

export default async function initializeFastifyClient(): Promise<FastifyInstance> {
  fastify.addSchema(schemaPacs002);
  fastify.addSchema(schemaPacs008);
  fastify.addSchema(schemaPain001);
  fastify.addSchema(schemaPain013);
  await fastify.register(fastifySwagger, {
    specification: {
      path: './build/swagger.yaml',
      postProcessor: function (swaggerObject) {
        return swaggerObject;
      },
      baseDir: '../../',
    },
    prefix: '/swagger',
  });
  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next();
      },
      preHandler: function (request, reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => swaggerObject,
    transformSpecificationClone: true,
  });
  fastify.setValidatorCompiler(({ schema }) => ajv.compile(schema));
  const methods = configuration.CORS_POLICY?.toLowerCase() === 'demo' ? ['GET', 'POST'] : ['POST'];
  await fastify.register(fastifyCors, {
    origin: '*',
    methods,
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
