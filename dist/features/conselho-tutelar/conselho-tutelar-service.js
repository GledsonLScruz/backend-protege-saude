"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConselhoTutelarService = void 0;
class ConselhoTutelarService {
    constructor(repository) {
        this.repository = repository;
    }
    getAllConselhos() {
        return this.repository.findAll();
    }
    getConselhoById(id) {
        return this.repository.findById(id);
    }
    getConselhoByCidade(cidade) {
        return this.repository.findByCidade(cidade);
    }
    searchConselhos(termo) {
        if (!termo.trim()) {
            throw new Error('Termo de busca é obrigatório');
        }
        return this.repository.search(termo);
    }
}
exports.ConselhoTutelarService = ConselhoTutelarService;
