import express from 'express';
import { criarDenuncia, listaTodasDenuncias, validarCepDenuncia } from './denuncia-controller';
import { upload } from '../../integration/multer';

const router = express.Router();

router.get('/denuncia/validar-cep/:cep', validarCepDenuncia);
router.post('/denuncia', upload.single('pdf'), criarDenuncia);
router.get('/relatorio-denuncia', listaTodasDenuncias)

export { router as denunciaRoutes };
