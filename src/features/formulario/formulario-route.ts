import { Router } from 'express';
import { autenticarJWT } from '../auth/auth-middleware';
import {
  atualizarCampoFormulario,
  atualizarPassoFormulario,
  criarCampoFormulario,
  criarPassoFormulario,
  listarCamposFormularioPorPasso,
  listarPassosFormularioPorProfissao,
  listarTiposCampoFormulario,
  obterFormularioPublicoPorProfissao,
  removerCampoFormulario,
  removerPassoFormulario,
  reorderCamposFormulario,
  reorderPassosFormulario,
} from './formulario-controller';

const router = Router();

router.get('/public/profissoes/:profissaoId/formulario', obterFormularioPublicoPorProfissao);
router.get('/profissoes/:profissaoId/formulario-passos', listarPassosFormularioPorProfissao);
router.get('/formulario-campos/tipos', listarTiposCampoFormulario);
router.post('/profissoes/:profissaoId/formulario-passos', autenticarJWT, criarPassoFormulario);
router.patch('/formulario-passos/reorder', autenticarJWT, reorderPassosFormulario);
router.put('/formulario-passos/:id', autenticarJWT, atualizarPassoFormulario);
router.patch('/formulario-passos/:id', autenticarJWT, atualizarPassoFormulario);
router.delete('/formulario-passos/:id', autenticarJWT, removerPassoFormulario);

router.get('/formulario-passos/:passoId/formulario-campos', listarCamposFormularioPorPasso);
router.post('/formulario-passos/:passoId/formulario-campos', autenticarJWT, criarCampoFormulario);
router.patch('/formulario-campos/reorder', autenticarJWT, reorderCamposFormulario);
router.put('/formulario-campos/:id', autenticarJWT, atualizarCampoFormulario);
router.patch('/formulario-campos/:id', autenticarJWT, atualizarCampoFormulario);
router.delete('/formulario-campos/:id', autenticarJWT, removerCampoFormulario);

export { router as formularioRoutes };
