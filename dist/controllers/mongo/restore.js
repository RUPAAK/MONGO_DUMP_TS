"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRestoreHandler = void 0;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const extract_zip_1 = __importDefault(require("extract-zip"));
const createRestore = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { url, database } = req.body;
    const response = yield node_fetch_1.default(url);
    const bufferData = yield response.buffer();
    fs_1.default.writeFile('zipfile.zip', bufferData, () => {
        fs_1.default.mkdir('dump', () => __awaiter(void 0, void 0, void 0, function* () {
            yield extract_zip_1.default('zipfile.zip', { dir: path_1.default.resolve('dump') });
        }));
    });
    const child = child_process_1.spawn('mongorestore', [
        '--gzip',
        '--uri', database,
        '--drop'
    ]);
    child.stdout.on('data', (data) => {
        console.log('stdout:', data);
    });
    child.stderr.on('data', (data) => {
        console.log('stdout:', Buffer.from(data).toString());
    });
    child.on('error', (error) => console.log('error', error));
    child.on('exit', (code, signal) => {
        if (code)
            console.log('Process exit with code: ', code);
        else if (signal)
            console.log('Prcess killed with signal: ', signal);
        else {
            fs_1.default.rm('dump', { recursive: true }, () => {
                fs_1.default.unlink('zipfile.zip', () => {
                    console.log('Removed');
                });
            });
            res.send({
                data: "sucessfull"
            });
        }
    });
});
exports.createRestoreHandler = createRestore;
