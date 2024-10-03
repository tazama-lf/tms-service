// SPDX-License-Identifier: Apache-2.0
import { Apm } from '@tazama-lf/frms-coe-lib/lib/services/apm';
import { configuration } from './config';

const apm = new Apm({
  serviceName: configuration.apm.apmServiceName,
  secretToken: configuration.apm.apmSecretToken,
  serverUrl: configuration.apm.apmUrl,
  usePathAsTransactionName: true,
  active: configuration.apm?.apmUrl?.toLowerCase() === 'true',
  transactionIgnoreUrls: ['/health'],
});

export default apm;
