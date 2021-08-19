"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDumpRouter = void 0;
const express_1 = __importDefault(require("express"));
const dump_1 = require("../../controllers/mongo/dump");
const router = express_1.default.Router();
exports.createDumpRouter = router;
router.post('/dump', dump_1.createDumpHandler);
