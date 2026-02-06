"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autenticarJWT = void 0;
const jwt_utils_1 = require("./jwt-utils");
const autenticarJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : authHeader.trim();
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
    try {
        const payload = (0, jwt_utils_1.verifyAccessToken)(token);
        req.usuarioAutenticado = payload;
        return next();
    }
    catch (error) {
        const isSecretMissing = error?.message?.includes('JWT_SECRET');
        const message = error?.name === 'TokenExpiredError'
            ? 'Token expirado'
            : isSecretMissing
                ? 'Falha interna de autenticação'
                : 'Token inválido';
        const status = isSecretMissing ? 500 : 401;
        return res.status(status).json({ error: message });
    }
};
exports.autenticarJWT = autenticarJWT;
