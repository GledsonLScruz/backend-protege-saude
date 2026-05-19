import { Router } from 'express';
import { listarBairros, listarCidades, listarEstados } from './localidades-controller';

const router = Router();

router.get('/localidades/estados', listarEstados);
router.get('/localidades/cidades', listarCidades);
router.get('/localidades/bairros', listarBairros);

export { router as localidadesRoutes };
