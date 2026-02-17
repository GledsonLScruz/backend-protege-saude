import { Router } from 'express';
import { upload } from '../../integration/multer';
import { autenticarJWT } from '../auth/auth-middleware';
import {
  atualizarDocumento,
  buscarDocumentoPorId,
  criarDocumento,
  listarDocumentosPorProfissao,
  removerDocumento,
} from './documento-controller';

const router = Router();

const uploadDocumentoArquivos = upload.fields([
  { name: 'arquivo', maxCount: 1 },
  { name: 'foto_capa', maxCount: 1 },
]);

router.get('/profissoes/:profissaoId/documentos', listarDocumentosPorProfissao);
router.get('/documentos/:id', buscarDocumentoPorId);
router.post('/documentos', autenticarJWT, uploadDocumentoArquivos, criarDocumento);
router.put('/documentos/:id', autenticarJWT, uploadDocumentoArquivos, atualizarDocumento);
router.delete('/documentos/:id', autenticarJWT, removerDocumento);

export { router as documentoRoutes };

