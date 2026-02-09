import { Router } from 'express';
import { login, refresh } from './auth-controller';

const router = Router();

router.post('/auth/login', login);
router.post('/auth/refresh', refresh);

export { router as authRoutes };
