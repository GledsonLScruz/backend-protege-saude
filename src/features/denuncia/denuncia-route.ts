import express from 'express';
import { criarDenuncia, listaTodasDenuncias, validarCepDenuncia } from './denuncia-controller';
import { upload } from '../../integration/multer';

const router = express.Router();

router.get('/denuncia/validar-cep/:cep', validarCepDenuncia);
router.post(
  '/denuncia',
  (req, res, next) => {
    const start = Date.now();

    //logparaeficientedadenuncia
    console.log('[denuncia] request_start', {
      contentLength: req.headers['content-length'],
      contentType: req.headers['content-type'],
    });

    res.on('finish', () => {
      //logparaeficientedadenuncia
      console.log('[denuncia] request_finish', {
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
      });
    });

    next();
  },
  upload.single('pdf'),
  criarDenuncia
);
router.get('/relatorio-denuncia', listaTodasDenuncias)

export { router as denunciaRoutes };
