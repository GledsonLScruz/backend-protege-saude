import { Router } from 'express';
import { autenticarJWT } from '../auth/auth-middleware';
import {
  atualizarProfissao,
  criarProfissao,
  listarProfissoes,
  listarProfissoesPublicas,
  removerProfissao,
} from './profissao-controller';
import { alterarStatusProfissao } from './profissao-status-controller';

const router = Router();

router.get('/public/profissoes', listarProfissoesPublicas);
router.get('/profissoes', listarProfissoes);
router.post('/profissoes', autenticarJWT, criarProfissao);
router.put('/profissoes/:id', autenticarJWT, atualizarProfissao);
router.delete('/profissoes/:id', autenticarJWT, removerProfissao);
router.patch('/profissoes/:id/status', autenticarJWT, alterarStatusProfissao);

export { router as profissaoRoutes };
