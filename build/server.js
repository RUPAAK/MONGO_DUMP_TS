"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = require("./app");
const server = require('http').createServer(app_1.app);
dotenv_1.default.config();
server.listen(process.env.PORT, () => console.log('SERVER UP AND RUNNING'));
