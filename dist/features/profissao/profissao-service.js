"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfissaoService = void 0;
const profissao_repository_1 = require("./profissao-repository");
const db_1 = __importDefault(require("../../database/db"));
const ProfissaoService = async () => {
    const database = await db_1.default;
    const repo = new profissao_repository_1.ProfissaoRepository(database);
    const validarDados = (data, isCreate) => {
        if (isCreate) {
            if (!data.nome?.trim())
                throw new Error('Nome é obrigatório');
            if (!data.descricao?.trim())
                throw new Error('Descrição é obrigatória');
            if (!data.cor?.trim())
                throw new Error('Cor é obrigatória');
        }
        if (data.status !== undefined && ![0, 1].includes(data.status)) {
            throw new Error('Status deve ser 0 ou 1');
        }
    };
    const listar = async () => {
        return repo.listar();
    };
    const criar = async (payload) => {
        validarDados(payload, true);
        try {
            return await repo.criar(payload);
        }
        catch (err) {
            if (err?.code === 'SQLITE_CONSTRAINT') {
                throw new Error('Já existe uma profissão com esse nome');
            }
            throw err;
        }
    };
    const atualizar = async (id, payload) => {
        validarDados(payload, false);
        try {
            const atualizado = await repo.atualizar(id, payload);
            if (!atualizado) {
                throw new Error('Profissão não encontrada');
            }
            return atualizado;
        }
        catch (err) {
            if (err?.code === 'SQLITE_CONSTRAINT') {
                throw new Error('Já existe uma profissão com esse nome');
            }
            throw err;
        }
    };
    const alterarStatus = async (id, status) => {
        if (![0, 1].includes(status))
            throw new Error('Status deve ser 0 ou 1');
        const atualizado = await repo.alterarStatus(id, status);
        if (!atualizado)
            throw new Error('Profissão não encontrada');
        return atualizado;
    };
    return {
        listar,
        criar,
        atualizar,
        alterarStatus,
    };
};
exports.ProfissaoService = ProfissaoService;
