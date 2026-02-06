"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DenunciaService = exports.EMAIL_POR_REGIAO = void 0;
const nodemailer_1 = require("../../integration/nodemailer");
const _types_1 = require("./@types");
const denuncia_repository_1 = require("./denuncia-repository");
const db_1 = __importDefault(require("../../database/db"));
const uuid_1 = require("uuid");
exports.EMAIL_POR_REGIAO = {
    [_types_1.Regiao.NORTE]: process.env.CONSELHO_REGIAO_NORTE_EMAIL,
    [_types_1.Regiao.SUL]: process.env.CONSELHO_REGIAO_SUL_EMAIL,
    [_types_1.Regiao.LESTE]: process.env.CONSELHO_REGIAO_LESTE_EMAIL,
    [_types_1.Regiao.OESTE]: process.env.CONSELHO_REGIAO_OESTE_EMAIL
};
const DenunciaService = async () => {
    const database = await db_1.default;
    const denunciaRepo = new denuncia_repository_1.DenunciaRepository(database);
    function gerarProtocolo() {
        const ano = new Date().getFullYear();
        const uuid = (0, uuid_1.v4)().split('-')[0];
        return `DEN-${ano}-${uuid.toUpperCase()}`;
    }
    const enviarDenuncia = async (body) => {
        const emailDestino = exports.EMAIL_POR_REGIAO[body.regiao];
        const protocolo = gerarProtocolo();
        const subject = 'Nova Denúncia Recebida - OdontoGuardião';
        const emailBody = `
    Prezados,

    Uma nova denúncia foi registrada no sistema OdontoGuardião.

    Protocolo: ${protocolo}
    Data: ${new Date().toLocaleDateString('pt-BR')}
    Hora: ${new Date().toLocaleTimeString('pt-BR')}

    Esta é uma mensagem automática. Por favor, não responda a este e-mail.

    Atenciosamente,
    Equipe OdontoGuardião
    `;
        const attachments = [];
        if (body.pdf) {
            attachments.push({
                filename: body.pdf.originalname,
                content: body.pdf.buffer,
            });
        }
        try {
            const info = await nodemailer_1.transporter.sendMail({
                from: process.env.ODONTO_GUARDIAO_EMAIL,
                to: emailDestino,
                subject,
                text: emailBody,
                attachments,
            });
            const denunciaId = await denunciaRepo.criar({
                protocolo,
                regiao: body.regiao,
            });
            console.log(`Email enviado: ${info.response}`);
            return { success: true, protocolo, message: 'Denúncia enviada com sucesso.' };
        }
        catch (error) {
            console.error('Erro ao enviar denúncia:', error);
            throw new Error('Erro ao enviar denúncia.');
        }
    };
    const listaTodasDenuncias = async () => {
        return await denunciaRepo.listarTodas();
    };
    return {
        enviarDenuncia,
        listaTodasDenuncias
    };
};
exports.DenunciaService = DenunciaService;
