// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-explicit-any */
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

const fastify = Fastify();

const ajv = new Ajv({
  removeAdditional: 'all',
  useDefaults: true,
  coerceTypes: 'array',
  strict: false,
});

const schemaPacs002 = { ...messageSchemaPacs002, $id: 'messageSchemaPacs002' };
const schemaPacs008 = { ...messageSchemaPacs008, $id: 'messageSchemaPacs008' };
const schemaPain001 = { ...messageSchemaPain001, $id: 'messageSchemaPain001' };
const schemaPain013 = { ...messageSchemaPain013, $id: 'messageSchemaPain013' };
export default async function initializeFastifyClient(): Promise<FastifyInstance> {
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
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });
  fastify.setValidatorCompiler(({ schema, method, url, httpPart }) => {
    return ajv.compile({ schemaPacs002, schemaPacs008, schemaPain001, schemaPain013 });
  });
  fastify.addSchema(schemaPacs002);
  fastify.addSchema(schemaPacs008);
  fastify.addSchema(schemaPain001);
  fastify.addSchema(schemaPain013);
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
