// SPDX-License-Identifier: Apache-2.0
// config settings, env variables

import { type ManagerConfig } from '@tazama-lf/frms-coe-lib';
import { type AdditionalConfig, type ProcessorConfig } from '@tazama-lf/frms-coe-lib/lib/config/processor.config';

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
];

export interface ExtendedConfig {
  PORT: number;
  QUOTING: boolean;
  AUTHENTICATED: boolean;
}

type Databases = Required<Pick<ManagerConfig, 'transactionHistory' | 'pseudonyms' | 'redisConfig'>>;
export type Configuration = ProcessorConfig & Databases & ExtendedConfig;
