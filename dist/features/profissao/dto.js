"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtualizarProfissaoRequest = exports.CriarProfissaoRequest = void 0;
class CriarProfissaoRequest {
    constructor(props) {
        this.nome = props.nome.trim();
        this.descricao = props.descricao.trim();
        this.cor = props.cor.trim();
        this.status = props.status ?? 1;
    }
    static from(body) {
        return new CriarProfissaoRequest({
            nome: body?.nome ?? '',
            descricao: body?.descricao ?? '',
            cor: body?.cor ?? '',
            status: body?.status,
        });
    }
}
exports.CriarProfissaoRequest = CriarProfissaoRequest;
class AtualizarProfissaoRequest {
    constructor(props) {
        this.nome = props.nome?.trim();
        this.descricao = props.descricao?.trim();
        this.cor = props.cor?.trim();
        this.status = props.status;
    }
    static from(body) {
        return new AtualizarProfissaoRequest({
            nome: body?.nome,
            descricao: body?.descricao,
            cor: body?.cor,
            status: body?.status,
        });
    }
}
exports.AtualizarProfissaoRequest = AtualizarProfissaoRequest;
