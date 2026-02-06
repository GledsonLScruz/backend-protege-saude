"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashSenha = hashSenha;
exports.verificarSenha = verificarSenha;
const crypto_1 = __importDefault(require("crypto"));
const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = 'sha512';
function hashSenha(plain) {
    const salt = crypto_1.default.randomBytes(16).toString('hex');
    const hash = crypto_1.default.pbkdf2Sync(plain, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
    return `${ITERATIONS}:${salt}:${hash}`;
}
function verificarSenha(plain, stored) {
    try {
        const [iterStr, salt, hash] = stored.split(':');
        const iterations = Number(iterStr) || ITERATIONS;
        const derived = crypto_1.default.pbkdf2Sync(plain, salt, iterations, KEYLEN, DIGEST).toString('hex');
        return crypto_1.default.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
    }
    catch {
        return false;
    }
}
