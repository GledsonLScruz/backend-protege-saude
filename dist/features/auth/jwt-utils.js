"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const getRequired = (key) => {
    const value = process.env[key];
    if (!value)
        throw new Error(`${key} não configurado`);
    return value;
};
const generateAccessToken = (payload) => jsonwebtoken_1.default.sign(payload, getRequired('JWT_SECRET'), { expiresIn: '1h' });
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => jsonwebtoken_1.default.sign(payload, getRequired('JWT_REFRESH_SECRET'), { expiresIn: '30d' });
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => jsonwebtoken_1.default.verify(token, getRequired('JWT_SECRET'));
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => jsonwebtoken_1.default.verify(token, getRequired('JWT_REFRESH_SECRET'));
exports.verifyRefreshToken = verifyRefreshToken;
