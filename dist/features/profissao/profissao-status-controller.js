"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alterarStatusProfissao = void 0;
const profissao_service_1 = require("./profissao-service");
const alterarStatusProfissao = async (req, res) => {
    const service = await (0, profissao_service_1.ProfissaoService)();
    const id = Number(req.params.id);
    if (Number.isNaN(id))
        return res.status(400).json({ error: 'ID inválido' });
    const { status } = req.body;
    try {
        const atualizada = await service.alterarStatus(id, status);
        return res.json(atualizada);
    }
    catch (error) {
        const message = error?.message || 'Erro ao alterar status';
        let statusCode = 400;
        if (message.includes('não encontrada'))
            statusCode = 404;
        return res.status(statusCode).json({ error: message });
    }
};
exports.alterarStatusProfissao = alterarStatusProfissao;
