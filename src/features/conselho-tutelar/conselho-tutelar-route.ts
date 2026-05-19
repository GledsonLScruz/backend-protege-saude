import { Router } from 'express';
import { autenticarJWT } from '../auth/auth-middleware';
import {
  atualizarConselhoTutelar,
  buscarConselhoTutelarPorCidade,
  buscarConselhoTutelarPorId,
  criarConselhoTutelar,
  listarConselhosTutelares,
  pesquisarConselhosTutelares,
  removerConselhoTutelar,
} from './conselho-tutelar-controller';

const router = Router();

router.get('/conselhos-tutelares', listarConselhosTutelares);
router.get('/conselhos-tutelares/search', pesquisarConselhosTutelares);
router.post('/conselhos-tutelares', autenticarJWT, criarConselhoTutelar);
router.put('/conselhos-tutelares/:id', autenticarJWT, atualizarConselhoTutelar);
router.delete('/conselhos-tutelares/:id', autenticarJWT, removerConselhoTutelar);
router.get('/conselhos-tutelares/cidade/:cidade', buscarConselhoTutelarPorCidade);
router.get('/conselhos-tutelares/:id', buscarConselhoTutelarPorId);

export { router as conselhoTutelarRoutes };
