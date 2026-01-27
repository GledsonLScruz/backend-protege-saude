import { Router } from 'express';
import { atualizarProfissao, criarProfissao, listarProfissoes } from './profissao-controller';
import { alterarStatusProfissao } from './profissao-status-controller';

const router = Router();

router.get('/profissoes', listarProfissoes);
router.post('/profissoes', criarProfissao);
router.put('/profissoes/:id', atualizarProfissao);
router.patch('/profissoes/:id/status', alterarStatusProfissao);

export { router as profissaoRoutes };
