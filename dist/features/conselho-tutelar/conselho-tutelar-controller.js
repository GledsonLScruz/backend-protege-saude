"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConselhoTutelarController = void 0;
class ConselhoTutelarController {
    constructor(service) {
        this.service = service;
    }
    async getAll(req, res) {
        try {
            const conselhos = this.service.getAllConselhos();
            return res.json(conselhos);
        }
        catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar conselhos tutelares' });
        }
    }
    async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            const conselho = this.service.getConselhoById(id);
            if (!conselho) {
                return res.status(404).json({ error: 'Conselho tutelar não encontrado' });
            }
            return res.json(conselho);
        }
        catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar conselho tutelar' });
        }
    }
    async getByCidade(req, res) {
        try {
            const { cidade } = req.params;
            const conselho = this.service.getConselhoByCidade(cidade);
            if (!conselho) {
                return res.status(404).json({ error: 'Conselho tutelar não encontrado para esta cidade' });
            }
            return res.json(conselho);
        }
        catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar conselho tutelar' });
        }
    }
    async search(req, res) {
        try {
            const { termo } = req.query;
            if (!termo || typeof termo !== 'string') {
                return res.status(400).json({ error: 'Termo de busca é obrigatório' });
            }
            const resultados = this.service.searchConselhos(termo);
            return res.json(resultados);
        }
        catch (error) {
            return res.status(500).json({ error: 'Erro ao realizar busca' });
        }
    }
}
exports.ConselhoTutelarController = ConselhoTutelarController;
