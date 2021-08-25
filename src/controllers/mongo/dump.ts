import {Request, Response} from 'express'
import {spawn} from 'child_process'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk'
import axios from 'axios'
import urlExistSync from "url-exist-sync"

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
        try {
            loggerFunction("Empty Field", State.Failed, '', baseUrl, id)
            res.end()
        } catch (error) {
            console.log(error.message)
            res.end()
        }
    }else{
        const child= spawn('mongodump', [
            '--gzip',
            `--uri`, `${url}`,
            '--forceTableScan'
        ])
    
        child.stderr.on('data', async(data)=>{
                console.log('stdout:', Buffer.from(data).toString())
                loggerFunction(Buffer.from(data).toString(), State.Pending, '', baseUrl, id)
                res.end()
        })
    
        child.on('exit', async(code: number, signal:  NodeJS.Signals)=>{
            if(code){
                    loggerFunction(`Backup Failed with code: ${code}`, State.Failed, '', baseUrl, id )
                    res.end()
            }
            else if(signal){
                    loggerFunction(`Backup Failed with signal: ${signal}`, State.Failed, '', baseUrl, id)
                    res.end()
            }
            else{
                try {
                    loggerFunction("Backup SuccessFull", State.Success_Pending, '', baseUrl, id)
                    if(!fs.existsSync('restore')){
                        fs.mkdirSync('restore')
                    }
                    const output = await fs.createWriteStream('restore/dump.zip');
                    const archive = archiver('zip', {
                        zlib: {level: 9}
                    }); 
        
                    archive.on('error', function(err: Error){
                        loggerFunction(err.message, State.Failed, '', baseUrl, id)
                        res.end()
                    });
                    
                    await archive.pipe(output);
                    
                    await archive.directory('./dump', false);
        
                    await archive.finalize()
        
                    const zipPath= path.resolve('./restore/dump.zip')
                    const zipFile= fs.readFile(zipPath, async(err: any, data: Buffer)=>{
                        if(err){
                            loggerFunction(err.message, State.Failed, '', baseUrl, id)
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
                                    res.end()
                                }
                                if(aws){
                                    loggerFunction("Backup Completed", State.Success, aws.Location, baseUrl, id)
                                fs.rm('dump', {recursive: true}, ()=>{
                                    fs.rm('restore', {recursive: true}, ()=>{
                                        console.log('Process Ends')
                                        res.end()
                                    })
                                })
                                }
                            })
                        }
                    })
                } catch (error) {
                    loggerFunction(error.message, State.Failed, '', baseUrl, id)
                    res.end()
                }
    
            }
        })
    }

}

export {createDump as createDumpHandler}