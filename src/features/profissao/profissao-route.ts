import { Router } from 'express';
import { autenticarJWT } from '../auth/auth-middleware';
import {
  atualizarProfissao,
  buscarProfissao,
  clonarProfissao,
  criarProfissao,
  importarConteudoProfissao,
  listarProfissoes,
  listarProfissoesPublicas,
  removerProfissao,
} from './profissao-controller';
import { alterarStatusProfissao } from './profissao-status-controller';

const router = Router();

router.get('/public/profissoes', listarProfissoesPublicas);
router.get('/profissoes', listarProfissoes);
router.get('/profissoes/:id', buscarProfissao);
router.post('/profissoes', autenticarJWT, criarProfissao);
router.post('/profissoes/:id/clonar', autenticarJWT, clonarProfissao);
router.post('/profissoes/:id/importar', autenticarJWT, importarConteudoProfissao);
router.put('/profissoes/:id', autenticarJWT, atualizarProfissao);
router.delete('/profissoes/:id', autenticarJWT, removerProfissao);
router.patch('/profissoes/:id/status', autenticarJWT, alterarStatusProfissao);

export { router as profissaoRoutes };
