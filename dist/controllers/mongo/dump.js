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
exports.createDumpHandler = void 0;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const archiver_1 = __importDefault(require("archiver"));
const uuid_1 = require("uuid");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const axios_1 = __importDefault(require("axios"));
const common_1 = require("../../common");
const createDump = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    aws_sdk_1.default.config.update({
        region: process.env.AWS_S3_API_REGION,
        accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_SECRET_KEY,
        apiVersion: process.env.AWS_S3_API_VERSION,
    });
    const s3 = new aws_sdk_1.default.S3();
    const { baseUrl, id, url, database } = req.body;
    const child = child_process_1.spawn('mongodump', [
        '--gzip',
        `--uri`, `${url}/${database}`,
        '--forceTableScan'
    ]);
    // child.stdout.on('data', async (data)=>{ //no data comes
    //     console.log('stdouts:', "data")
    // })
    child.stderr.on('data', (data) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('stdout:', Buffer.from(data).toString());
        yield axios_1.default.post(`${baseUrl}/logger?isSuccessfull=false&isFailed=false&isPending=true`, { id, message: Buffer.from(data).toString(), link: '' });
    }));
    // child.on('error',(error: Error)=>{ //if command is not found
    //     res.send('hi')
    // })
    child.on('exit', (code, signal) => __awaiter(void 0, void 0, void 0, function* () {
        if (code)
            throw new common_1.BadRequestError(`Process exit with code: ${code}`);
        else if (signal)
            throw new common_1.BadRequestError(`Process killed with signal: ${signal}`);
        else {
            console.log('Backup successfull');
            yield axios_1.default.post(`${baseUrl}/logger?isSuccessfull=true&isFailed=false&isPending=true`, { id, message: "Backup successfull", link: '' });
            if (!fs_1.default.existsSync('restore')) {
                fs_1.default.mkdirSync('restore');
            }
            const output = yield fs_1.default.createWriteStream('restore/dump.zip');
            const archive = archiver_1.default('zip', {
                zlib: { level: 9 }
            });
            archive.on('error', function (err) {
                throw new common_1.BadRequestError('Failed to create Zip folder');
            });
            yield archive.pipe(output);
            // append files from a sub-directory, putting its contents at the root of archive
            yield archive.directory('./dump', false);
            yield archive.finalize();
            const zipPath = path_1.default.resolve('./restore/dump.zip');
            const zipFile = fs_1.default.readFile(zipPath, (err, data) => {
                if (err)
                    throw new common_1.BadRequestError('Dump\'s zipfile not created');
                if (data) {
                    const params = {
                        Bucket: process.env.AWS_S3_BUCKET_NAME,
                        Key: `${uuid_1.v4()}${path_1.default.extname(zipPath)}`,
                        Body: data
                    };
                    s3.upload(params, function (s3Err, aws) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (s3Err) {
                                res.json({
                                    message: s3Err.message
                                });
                            }
                            if (aws) {
                                yield axios_1.default.post(`${baseUrl}/logger?isSuccessfull=true&isFailed=false&isPending=false`, { id, message: "Backup successfull", link: aws.Location });
                                fs_1.default.rm('dump', { recursive: true }, () => {
                                    fs_1.default.rm('restore', { recursive: true }, () => {
                                        res.status(200).send({
                                            backupId: id,
                                            link: aws.Location
                                        });
                                    });
                                });
                            }
                        });
                    });
                }
            });
        }
    }));
});
exports.createDumpHandler = createDump;
