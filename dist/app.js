"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
require("express-async-errors");
const cors_1 = __importDefault(require("cors"));
const mongo_1 = require("./routes/mongo");
const common_1 = require("./common");
const app = express_1.default();
exports.app = app;
app.use(cors_1.default());
app.use(express_1.default.json());
app.get('/', (req, res) => {
    res.send('hi');
    // throw new BadRequestError('NO')
});
app.use('/api/v1/mongo', mongo_1.indexMongoRouter);
app.use(common_1.errorHandler);
