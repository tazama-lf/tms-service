// SPDX-License-Identifier: Apache-2.0

import type { ManagerConfig } from '@tazama-lf/frms-coe-lib';
import type { AdditionalConfig, ProcessorConfig } from '@tazama-lf/frms-coe-lib/lib/config/processor.config';

export const additionalEnvironmentVariables: AdditionalConfig[] = [
  {
    name: 'PORT',
    type: 'number',
  },
  {
    name: 'QUOTING',
    type: 'boolean',
  },
  {
    name: 'AUTHENTICATED',
    type: 'boolean',
  },
  {
    name: 'CORS_POLICY',
    type: 'string',
    optional: true,
  },
];

export interface ExtendedConfig {
  PORT: number;
  QUOTING: boolean;
  AUTHENTICATED: boolean;
  CORS_POLICY?: 'demo' | 'prod';
}

type Databases = Required<Pick<ManagerConfig, 'rawHistory' | 'eventHistory' | 'redisConfig'>>;
export type Configuration = ProcessorConfig & Databases & ExtendedConfig;
