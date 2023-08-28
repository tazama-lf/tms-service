import { Apm } from '@frmscoe/frms-coe-lib/lib/services/apm';
import { configuration } from './config';

const { serviceName, secretToken, url, active } = configuration.apm;
const apm = new Apm({
  serviceName,
  secretToken,
  serverUrl: url,
  usePathAsTransactionName: true,
  active: Boolean(active),
});

export default apm;

// if (configuration.apm.active === 'true') {
//  apm.start({
//    //  transactionIgnoreUrls: ['/health'],
//  });
// }
