"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const db_1 = __importDefault(require("../../database/db"));
const usuario_admin_repository_1 = require("./usuario-admin-repository");
const password_hash_1 = require("./password-hash");
const jwt_utils_1 = require("./jwt-utils");
const token_hash_1 = require("./token-hash");
const AuthService = async () => {
    const database = await db_1.default;
    const repo = new usuario_admin_repository_1.UsuarioAdminRepository(database);
    const authenticate = async (credentials) => {
        if (!credentials.usuario?.trim() || !credentials.senha?.trim()) {
            throw new Error('Usuário e senha são obrigatórios');
        }
        const usuario = await repo.findByUsuario(credentials.usuario);
        if (!usuario) {
            throw new Error('Credenciais inválidas');
        }
        const ok = (0, password_hash_1.verificarSenha)(credentials.senha, usuario.senha_hash);
        if (!ok) {
            throw new Error('Credenciais inválidas');
        }
        const payload = { id: usuario.id, usuario: usuario.usuario };
        const accessToken = (0, jwt_utils_1.generateAccessToken)(payload);
        const refreshToken = (0, jwt_utils_1.generateRefreshToken)(payload);
        await repo.updateRefreshTokenHash(payload.id, (0, token_hash_1.hashToken)(refreshToken));
        return { usuario: payload, accessToken, refreshToken };
    };
    const refreshTokens = async (refreshToken) => {
        if (!refreshToken?.trim()) {
            throw new Error('Refresh token é obrigatório');
        }
        let payload;
        try {
            payload = (0, jwt_utils_1.verifyRefreshToken)(refreshToken);
        }
        catch (error) {
            throw new Error(error?.name === 'TokenExpiredError' ? 'Refresh token expirado' : 'Refresh token inválido');
        }
        const user = await repo.findById(payload.id);
        if (!user || !user.refresh_token_hash) {
            throw new Error('Refresh token não reconhecido');
        }
        const incomingHash = (0, token_hash_1.hashToken)(refreshToken);
        if (incomingHash !== user.refresh_token_hash) {
            throw new Error('Refresh token não reconhecido');
        }
        const newPayload = { id: user.id, usuario: user.usuario };
        const accessToken = (0, jwt_utils_1.generateAccessToken)(newPayload);
        const newRefreshToken = (0, jwt_utils_1.generateRefreshToken)(newPayload);
        await repo.updateRefreshTokenHash(user.id, (0, token_hash_1.hashToken)(newRefreshToken));
        return { usuario: newPayload, accessToken, refreshToken: newRefreshToken };
    };
    return { authenticate, refreshTokens };
};
exports.AuthService = AuthService;
