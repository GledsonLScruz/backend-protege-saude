"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refresh = exports.login = void 0;
const auth_service_1 = require("./auth-service");
const login = async (req, res) => {
    const service = await (0, auth_service_1.AuthService)();
    const body = req.body;
    try {
        const { usuario, accessToken, refreshToken } = await service.authenticate(body);
        return res.json({ message: 'Autenticado com sucesso', usuario, accessToken, refreshToken });
    }
    catch (error) {
        const message = error?.message || 'Erro ao autenticar';
        const status = message === 'Usuário e senha são obrigatórios'
            ? 400
            : message.includes('Credenciais inválidas')
                ? 401
                : 500;
        return res.status(status).json({ error: message });
    }
};
exports.login = login;
const refresh = async (req, res) => {
    const service = await (0, auth_service_1.AuthService)();
    const { refreshToken } = req.body || {};
    try {
        const { usuario, accessToken, refreshToken: newRefresh } = await service.refreshTokens(refreshToken);
        return res.json({ message: 'Tokens renovados com sucesso', usuario, accessToken, refreshToken: newRefresh });
    }
    catch (error) {
        const message = error?.message || 'Erro ao renovar token';
        const status = message.includes('obrigatório') ? 400 : message.includes('expirado') ? 401 : 401;
        return res.status(status).json({ error: message });
    }
};
exports.refresh = refresh;
