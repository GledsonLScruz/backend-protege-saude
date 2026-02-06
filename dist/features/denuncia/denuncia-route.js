"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.denunciaRoutes = void 0;
const express_1 = __importDefault(require("express"));
const denuncia_controller_1 = require("./denuncia-controller");
const multer_1 = require("../../integration/multer");
const router = express_1.default.Router();
exports.denunciaRoutes = router;
router.post('/denuncia', multer_1.upload.single('pdf'), denuncia_controller_1.criarDenuncia);
router.get('/relatorio-denuncia', denuncia_controller_1.listaTodasDenuncias);
