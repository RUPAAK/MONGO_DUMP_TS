import {Request, Response} from 'express'
import {spawn} from 'child_process'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk'


import { BadRequestError } from '../../common'
import { ProcessFailedError } from '../../common/errors/process-failed-error'



interface Params{
    Bucket: string;
    Key: string;
    Body: Buffer
}


const createDump= async(req: Request, res: Response)=>{

    AWS.config.update({
        region: process.env.AWS_S3_API_REGION!,
        accessKeyId: process.env.AWS_S3_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_S3_SECRET_KEY!,
        apiVersion: process.env.AWS_S3_API_VERSION!,
    });
    const s3= new AWS.S3()

    const {url, database}= req.body
    const child= spawn('mongodump', [
        '--gzip',
        `--uri`, `${url}/${database}`,
        '--forceTableScan'
    ])
    child.stdout.on('data', async (data)=>{
        console.log('stdouts:', data)
    })
    child.stderr.on('data', (data)=>{
        console.log('stdout:', Buffer.from(data).toString())
    })
    child.on('error',(error: Error)=>{
        throw new ProcessFailedError()
    })
    child.on('exit', async(code: number, signal:  NodeJS.Signals)=>{
        if(code) throw new BadRequestError(`Process exit with code: ${code}`)
        else if(signal)throw new BadRequestError(`Process killed with signal: ${signal}`)
        else{
            console.log('Backup successfull')
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
            const zipFile= fs.readFile(zipPath, (err: any, data: Buffer)=>{
                if(err) throw new BadRequestError('Dump\'s zipfile not created')
                if(data){

                    const params: Params={
                        Bucket: process.env.AWS_S3_BUCKET_NAME!,
                        Key: `${uuidv4()}${path.extname(zipPath)}`,
                        Body: data
                    }
                    s3.upload(params, async function(s3Err: Error, data: any){
                        if(s3Err){
                            res.json({
                                message: s3Err.message
                            })
                        }
                        if(data){
                        fs.rm('dump', {recursive: true}, ()=>{
                            fs.rm('restore', {recursive: true}, ()=>{
                                res.status(200).send({
                                    data: data.Location
                                })
                            })
                        })
                        }
                    })
                }
            })

        }
    })
}

export {createDump as createDumpHandler}