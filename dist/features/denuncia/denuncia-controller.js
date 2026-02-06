"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.criarDenunciaRoute = exports.listaTodasDenuncias = exports.criarDenuncia = void 0;
const multer_1 = require("../../integration/multer");
const denuncia_service_1 = require("./denuncia-service");
const criarDenuncia = async (req, res) => {
    const service = await (0, denuncia_service_1.DenunciaService)();
    const denuncia = req.body;
    const pdf = req.file;
    if (!denuncia.regiao) {
        return res.status(400).json({ error: 'O campo "regiao" é obrigatório.' });
    }
    try {
        const result = await service.enviarDenuncia({
            protocolo: denuncia.protocolo,
            regiao: denuncia.regiao,
            pdf: pdf
        });
        return res.status(201).json({ message: result.message, protocolo: result.protocolo });
    }
    catch (error) {
        return res.status(500).json({ error: 'Erro ao enviar denúncia.' });
    }
};
exports.criarDenuncia = criarDenuncia;
const listaTodasDenuncias = async (req, res) => {
    const service = await (0, denuncia_service_1.DenunciaService)();
    try {
        const denuncias = await service.listaTodasDenuncias();
        return res.status(200).json(denuncias);
    }
    catch (err) {
        console.error('Erro ao listar denúncias:', err);
        return res.status(500).json({ error: 'Erro ao listar denúncias.' });
    }
};
exports.listaTodasDenuncias = listaTodasDenuncias;
exports.criarDenunciaRoute = multer_1.upload.single('pdf');
