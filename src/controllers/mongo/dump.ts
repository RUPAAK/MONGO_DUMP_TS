import {Request, Response} from 'express'
import {spawn} from 'child_process'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk'
import axios from 'axios'


import { BadRequestError } from '../../common'
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
    if(!baseUrl || !id || !url){
        await axios.post(`${baseUrl}/logger`, {id, message: 'Empty Field', data: '', state: State.Failed})
    }
    const child= spawn('mongodump', [
        '--gzip',
        `--uri`, `${url}`,
        '--forceTableScan'
    ])

    child.stderr.on('data', async(data)=>{
        console.log('stdout:', Buffer.from(data).toString())
        await axios.post(`${baseUrl}/logger`, {id, message: Buffer.from(data).toString(), data: '', state: State.Pending})
    })

    child.on('exit', async(code: number, signal:  NodeJS.Signals)=>{
        if(code){
            try {
                await axios.post(`${baseUrl}/logger`, {id, message: "Backup Failed", data: '', state: State.Failed})
                res.end()
            } catch (error) {
                await axios.post(`${baseUrl}/logger`, {id, message: error.message, data: '', state: State.Failed})
            }
        }
        else if(signal){
            try {
                await axios.post(`${baseUrl}/logger`, {id, message: "Backup Failed", data: '', state: State.Failed})
                res.end()
            } catch (error) {
                await axios.post(`${baseUrl}/logger`, {id, message: error.message, data: '', state: State.Failed})
            }
        }
        else{
            try {
                await axios.post(`${baseUrl}/logger`, {id, message: "Backup successfull", data: '', state: State.Success_Pending})
                if(!fs.existsSync('restore')){
                    fs.mkdirSync('restore')
                }
                const output = await fs.createWriteStream('restore/dump.zip');
                const archive = archiver('zip', {
                    zlib: {level: 9}
                }); 
    
                archive.on('error', function(err: Error){
                    throw new BadRequestError('Failed to create Zip folder')
                });
                
                await archive.pipe(output);
                
                // append files from a sub-directory, putting its contents at the root of archive
                await archive.directory('./dump', false);
    
                await archive.finalize()
    
                const zipPath= path.resolve('./restore/dump.zip')
                const zipFile= fs.readFile(zipPath, async(err: any, data: Buffer)=>{
                    if(err){
                        await axios.post(`${baseUrl}/logger`, {id, message: err.message, data: '', state: State.Failed})
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
                                await axios.post(`${baseUrl}/logger`, {id, message: `${s3Err.message}`, data: '', state: State.Failed})
                                res.end()
                            }
                            if(aws){
                                await axios.post(`${baseUrl}/logger`, {id, message: "Backup successfull", data: aws.Location, state: State.Success})
                            fs.rm('dump', {recursive: true}, ()=>{
                                fs.rm('restore', {recursive: true}, ()=>{
                                    res.end()
                                })
                            })
                            }
                        })
                    }
                })
            } catch (e) {
                await axios.post(`${baseUrl}/logger`, {id, message: e.message, data: '', state: State.Failed})
                res.end()
            }

        }
    })
}

export {createDump as createDumpHandler}