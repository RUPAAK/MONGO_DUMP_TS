"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRestoreRouter = void 0;
const express_1 = __importDefault(require("express"));
const restore_1 = require("../../controllers/mongo/restore");
const router = express_1.default.Router();
exports.createRestoreRouter = router;
router.post("/restore", restore_1.createRestoreHandler);
