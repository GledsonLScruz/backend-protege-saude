"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const conselho_tutelar_route_1 = require("./features/conselho-tutelar/conselho-tutelar-route");
const denuncia_route_1 = require("./features/denuncia/denuncia-route");
const profissao_route_1 = require("./features/profissao/profissao-route");
const auth_route_1 = require("./features/auth/auth-route");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./database/db"));
dotenv_1.default.config();
const requiredEnvVars = [
    'ODONTO_GUARDIAO_EMAIL',
    'ODONTO_GUARDIAO_PWD',
    'CONSELHO_REGIAO_NORTE_EMAIL',
    'CONSELHO_REGIAO_SUL_EMAIL',
    'CONSELHO_REGIAO_LESTE_EMAIL',
    'CONSELHO_REGIAO_OESTE_EMAIL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
];
requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        console.error(`❌ Variável de ambiente obrigatória faltando: ${envVar}`);
    }
    else {
        console.log(`✅ ${envVar}: [DEFINIDO (oculto)]`);
    }
});
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
// Rotas
app.use('/api', denuncia_route_1.denunciaRoutes);
app.use('/api', conselho_tutelar_route_1.conselhoTutelarRoutes);
app.use('/api', profissao_route_1.profissaoRoutes);
app.use('/api', auth_route_1.authRoutes);
async function startServer() {
    try {
        const db = await db_1.default;
        console.log('Banco de dados conectado e pronto.');
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    }
    catch (error) {
        console.error('Erro ao inicializar o banco de dados ou iniciar o servidor:', error);
        process.exit(1);
    }
}
startServer();
