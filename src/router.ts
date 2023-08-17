import Router from 'koa-router';
import { handleExecute, handleQuoteReply, handleTransfer, handleTransferResponse, handleHealthCheck } from './app.controller';
import { configuration } from './config';

const router = new Router();

router.get('/', handleHealthCheck);
router.get('/health', handleHealthCheck);

if (configuration.quoting) {
  router.post('/execute', handleExecute);
  router.post('/quoteReply', handleQuoteReply);
}

router.post('/transfer', handleTransfer);
router.post('/transfer-response', handleTransferResponse);

export default router;
