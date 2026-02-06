"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConselhoTutelarRepository = void 0;
const conselhos_tutelares_json_1 = __importDefault(require("./data/conselhos-tutelares.json"));
class ConselhoTutelarRepository {
    constructor() {
        this.conselhos = this.validateConselhos(conselhos_tutelares_json_1.default.conselhosTutelares);
    }
    validateConselhos(data) {
        return data.map(item => this.validateConselho(item));
    }
    validateConselho(item) {
        // Garantir que todos os campos obrigatórios existam
        return {
            id: item.id || 0,
            cidade: item.cidade || '',
            endereco: item.endereco || '',
            emails: item.emails || [],
            conselhoDireito: item.conselhoDireito || '',
            conselhoTutelar: item.conselhoTutelar || '',
            conselhosRegionais: item.conselhosRegionais || [],
            subconselhos: item.subconselhos || []
        };
    }
    findAll() {
        return this.conselhos;
    }
    findById(id) {
        return this.conselhos.find(conselho => conselho.id === id);
    }
    findByCidade(cidade) {
        return this.conselhos.find(conselho => conselho.cidade.toLowerCase() === cidade.toLowerCase());
    }
    search(termo) {
        const termoBusca = termo.toLowerCase();
        return this.conselhos.filter(conselho => conselho.cidade.toLowerCase().includes(termoBusca) || conselho.cidade.length &&
            conselho.emails.some(email => email.toLowerCase().includes(termoBusca)));
    }
}
exports.ConselhoTutelarRepository = ConselhoTutelarRepository;
