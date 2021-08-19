import { CustomError } from "./custom-error";

export class ProcessFailedError extends CustomError{
    statusCode= 400;
    constructor(){
        super('Process ran into some problem. Terminate!')

        Object.setPrototypeOf(this, ProcessFailedError.prototype)
    }

    serializeErrors(){
        return [{message: this.message}]
    }
}