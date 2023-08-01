import Router from 'koa-router';
import { handleExecute, handleQuoteReply, handleTransfer, handleTransferResponse, handleHealthCheck } from './app.controller';

const router = new Router();

router.get('/', handleHealthCheck);
router.get('/health', handleHealthCheck);
router.post('/execute', handleExecute);
router.post('/quoteReply', handleQuoteReply);
router.post('/transfer', handleTransfer);
router.post('/transfer-response', handleTransferResponse);

export default router;
