import {Request, Response} from 'express'
import {spawn} from 'child_process'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk'
import axios from 'axios'
import { loggerFunction } from '../../common/errors/loggerFunction'

// import { ProcessfailedError } from '../../common/errors/process-failed-error'

interface Params{
    Bucket: string;
    Key: string;
    Body: Buffer
}
export enum State{
    Failed= "failed",
    Success= "success",
    Success_Pending= "success&pending",
    Pending= "pending"
}

const createDump= async(req: Request, res: Response)=>{
    AWS.config.update({
        region: process.env.AWS_S3_API_REGION!,
        accessKeyId: process.env.AWS_S3_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_S3_SECRET_KEY!,
        apiVersion: process.env.AWS_S3_API_VERSION!,
    });

    const s3= new AWS.S3()

    const {baseUrl, id, url}= req.body
    if(!id || !url){
        loggerFunction("Empty Field", State.Failed, '', baseUrl, id)
        // loggerFunction(baseUrl, "Empty Field", id, '', State.Failed)
        res.end()
    }else{
        const child= spawn('mongodump', [
            '--gzip',
            `--uri`, `${url}`,
            '--forceTableScan'
        ])
    
        child.stderr.on('data', async(data)=>{
            try {
                console.log('stdout:', Buffer.from(data).toString())
                loggerFunction(Buffer.from(data).toString(), State.Pending, '', baseUrl, id)
                res.end()
            } catch (error) {
                loggerFunction(error.message, State.Failed, '', baseUrl, id)
                res.end()
            }
        })
    
        child.on('exit', async(code: number, signal:  NodeJS.Signals)=>{
            if(code){
                try {
                    loggerFunction(`Backup Failed with code: ${code}`, State.Failed, '', baseUrl, id )
                    // loggerFunction(baseUrl, `Backup Failed with code: ${code}`, id, '', State.Failed)
                    res.end()
                } catch (error) {
                    loggerFunction(error.message, State.Failed, '', baseUrl, id)
                    // loggerFunction(baseUrl, error.message, ?id, '', State.Failed)
                    res.end()
                }
            }
            else if(signal){
                try {
                    loggerFunction(`Backup Failed with signal: ${signal}`, State.Failed, '', baseUrl, id)
                    // loggerFunction(baseUrl, `Backup Failed with signal: ${signal}`, id, '', State.Failed)
                    res.end()
                } catch (error) {
                    loggerFunction(error.message, State.Failed, '', baseUrl, id)
                    // loggerFunction(baseUrl, error.message, id, '', State.Failed)
                    res.end()
                }
            }
            else{
                try {
                    loggerFunction("Backup SuccessFull", State.Success_Pending, '', baseUrl, id)
                    // loggerFunction(baseUrl, "Backup SuccessFull", id, '', State.Success_Pending)
                    if(!fs.existsSync('restore')){
                        fs.mkdirSync('restore')
                    }
                    const output = await fs.createWriteStream('restore/dump.zip');
                    const archive = archiver('zip', {
                        zlib: {level: 9}
                    }); 
        
                    archive.on('error', function(err: Error){
                        loggerFunction(err.message, State.Failed, '', baseUrl, id)
                        // loggerFunction(baseUrl, err.message, id, '', State.Failed)
                        res.end()
                    });
                    
                    await archive.pipe(output);
                    
                    // append files from a sub-directory, putting its contents at the root of archive
                    await archive.directory('./dump', false);
        
                    await archive.finalize()
        
                    const zipPath= path.resolve('./restore/dump.zip')
                    const zipFile= fs.readFile(zipPath, async(err: any, data: Buffer)=>{
                        if(err){
                            loggerFunction(err.message, State.Failed, '', baseUrl, id)
                            // await axios.post(`${baseUrl}/api/v1/backups/logger`, {id, message: err.message, data: '', state: State.Failed})
                            res.end()
                        }
                        if(data){
                            
                            const params: Params={
                                Bucket: process.env.AWS_S3_BUCKET_NAME!,
                                Key: `${uuidv4()}${path.extname(zipPath)}`,
                                Body: data
                            }
                            s3.upload(params, async function(s3Err: Error, aws: any){
                                if(s3Err){
                                    loggerFunction(s3Err.message, State.Failed, '', baseUrl, id)
                                    // loggerFunction(baseUrl, s3Err.message, id, '', State.Failed)
                                    res.end()
                                }
                                if(aws){
                                    loggerFunction("Backup Completed", State.Success, aws.Location, baseUrl, id)
                                    // loggerFunction(baseUrl, "Backup completed", id, aws.Location, State.Success)
                                fs.rm('dump', {recursive: true}, ()=>{
                                    fs.rm('restore', {recursive: true}, ()=>{
                                        console.log('Removed Folders')
                                        res.end()
                                    })
                                })
                                }
                            })
                        }
                    })
                } catch (e) {
                    loggerFunction(e.message, State.Failed, '', baseUrl, id)
                    // loggerFunction(baseUrl, e.message, id, '', State.Failed)
                    res.end()
                }
    
            }
        })
    }

}

export {createDump as createDumpHandler}