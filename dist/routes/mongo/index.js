"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.indexMongoRouter = void 0;
const express_1 = __importDefault(require("express"));
const common_1 = require("../../common");
const dump_1 = require("./dump");
const restore_1 = require("./restore");
const router = express_1.default.Router();
exports.indexMongoRouter = router;
router.use(dump_1.createDumpRouter);
router.use(restore_1.createRestoreRouter);
router.use(common_1.errorHandler);
