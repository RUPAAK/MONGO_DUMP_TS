"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessFailedError = void 0;
const custom_error_1 = require("./custom-error");
class ProcessFailedError extends custom_error_1.CustomError {
    constructor() {
        super('Process ran into some problem. Terminate!');
        this.statusCode = 400;
        Object.setPrototypeOf(this, ProcessFailedError.prototype);
    }
    serializeErrors() {
        return [{ message: this.message }];
    }
}
exports.ProcessFailedError = ProcessFailedError;
