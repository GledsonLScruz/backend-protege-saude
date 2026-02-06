"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atualizarProfissao = exports.criarProfissao = exports.listarProfissoes = void 0;
const profissao_service_1 = require("./profissao-service");
const dto_1 = require("./dto");
const listarProfissoes = async (_req, res) => {
    const service = await (0, profissao_service_1.ProfissaoService)();
    try {
        const profissoes = await service.listar();
        return res.json(profissoes);
    }
    catch (error) {
        console.error('Erro ao listar profissões:', error);
        return res.status(500).json({ error: 'Erro ao listar profissões' });
    }
};
exports.listarProfissoes = listarProfissoes;
const criarProfissao = async (req, res) => {
    const service = await (0, profissao_service_1.ProfissaoService)();
    try {
        const dto = dto_1.CriarProfissaoRequest.from(req.body);
        const criada = await service.criar(dto);
        return res.status(201).json(criada);
    }
    catch (error) {
        const message = error?.message || 'Erro ao criar profissão';
        const status = message.includes('encontrada') ? 404 : message.includes('existe') ? 409 : 400;
        return res.status(status).json({ error: message });
    }
};
exports.criarProfissao = criarProfissao;
const atualizarProfissao = async (req, res) => {
    const service = await (0, profissao_service_1.ProfissaoService)();
    const id = Number(req.params.id);
    if (Number.isNaN(id))
        return res.status(400).json({ error: 'ID inválido' });
    try {
        const dto = dto_1.AtualizarProfissaoRequest.from(req.body);
        const atualizada = await service.atualizar(id, dto);
        return res.json(atualizada);
    }
    catch (error) {
        const message = error?.message || 'Erro ao atualizar profissão';
        let status = 400;
        if (message.includes('não encontrada'))
            status = 404;
        else if (message.includes('existe'))
            status = 409;
        return res.status(status).json({ error: message });
    }
};
exports.atualizarProfissao = atualizarProfissao;
