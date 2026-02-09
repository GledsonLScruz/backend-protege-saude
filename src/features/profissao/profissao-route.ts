import { Router } from 'express';
import { autenticarJWT } from '../auth/auth-middleware';
import { atualizarProfissao, criarProfissao, listarProfissoes } from './profissao-controller';
import { alterarStatusProfissao } from './profissao-status-controller';

const router = Router();

router.get('/profissoes', listarProfissoes);
router.post('/profissoes', autenticarJWT, criarProfissao);
router.put('/profissoes/:id', autenticarJWT, atualizarProfissao);
router.patch('/profissoes/:id/status', autenticarJWT, alterarStatusProfissao);

export { router as profissaoRoutes };
