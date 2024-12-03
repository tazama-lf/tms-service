// SPDX-License-Identifier: Apache-2.0
import { Apm } from '@tazama-lf/frms-coe-lib/lib/services/apm';

const apm = new Apm({
  usePathAsTransactionName: true,
  transactionIgnoreUrls: ['/health'],
});

export default apm;
