import {Request, Response} from 'express'
import {spawn} from 'child_process'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk'
import axios from 'axios'


import { BadRequestError } from '../../common'
import { ProcessFailedError } from '../../common/errors/process-failed-error'



interface Params{
    Bucket: string;
    Key: string;
    Body: Buffer
}


const createDump= async(req: Request, res: Response)=>{
    res.status(200).send(
        "hi"
        // backupId: "id",
        // link: "aws.Location"
        
    )

    // AWS.config.update({
    //     region: process.env.AWS_S3_API_REGION!,
    //     accessKeyId: process.env.AWS_S3_ACCESS_KEY!,
    //     secretAccessKey: process.env.AWS_S3_SECRET_KEY!,
    //     apiVersion: process.env.AWS_S3_API_VERSION!,
    // });

    // const s3= new AWS.S3()

    // const {baseUrl, id, url, database}= req.body
    // const child= spawn('mongodump', [
    //     '--gzip',
    //     `--uri`, `${url}/${database}`,
    //     '--forceTableScan'
    // ])
    // // child.stdout.on('data', async (data)=>{ //no data comes
    // //     console.log('stdouts:', "data")
    // // })
    // child.stderr.on('data', async(data)=>{
    //     console.log('stdout:', Buffer.from(data).toString())
    //     await axios.post(`${baseUrl}/logger?isSuccessfull=false&isFailed=false&isPending=true`, {id, message: Buffer.from(data).toString(), link: ''})
    // })

    // child.on('error',(error: Error)=>{ //if command is not found
    //     res.send('hi')
    // })

    // child.on('exit', async(code: number, signal:  NodeJS.Signals)=>{
    //     if(code) throw new BadRequestError(`Process exit with code: ${code}`)
    //     else if(signal)throw new BadRequestError(`Process killed with signal: ${signal}`)
    //     else{
    //         console.log('Backup successfull')

    //         await axios.post(`${baseUrl}/logger?isSuccessfull=true&isFailed=false&isPending=true`, {id, message: "Backup successfull", link: ''})
    //         if(!fs.existsSync('restore')){
    //             fs.mkdirSync('restore')
    //         }
    //         const output = await fs.createWriteStream('restore/dump.zip');
    //         const archive = archiver('zip', {
    //             zlib: {level: 9}
    //         }); 

    //         archive.on('error', function(err: Error){
    //             throw new BadRequestError('Failed to create Zip folder')
    //         });
            
    //         await archive.pipe(output);
            
    //         // append files from a sub-directory, putting its contents at the root of archive
    //         await archive.directory('./dump', false);

    //         await archive.finalize()

    //         const zipPath= path.resolve('./restore/dump.zip')
    //         const zipFile= fs.readFile(zipPath, (err: any, data: Buffer)=>{
    //             if(err) throw new BadRequestError('Dump\'s zipfile not created')
    //             if(data){
                    
    //                 const params: Params={
    //                     Bucket: process.env.AWS_S3_BUCKET_NAME!,
    //                     Key: `${uuidv4()}${path.extname(zipPath)}`,
    //                     Body: data
    //                 }
    //                 s3.upload(params, async function(s3Err: Error, aws: any){
    //                     if(s3Err){
    //                         res.json({
    //                             message: s3Err.message
    //                         })
    //                     }
    //                     if(aws){
    //                         await axios.post(`${baseUrl}/logger?isSuccessfull=true&isFailed=false&isPending=false`, {id, message: "Backup successfull", link: aws.Location})
    //                     fs.rm('dump', {recursive: true}, ()=>{
    //                         fs.rm('restore', {recursive: true}, ()=>{
    //                             res.status(200).send({
    //                                 backupId: id,
    //                                 link: aws.Location
    //                             })
    //                         })
    //                     })
    //                     }
    //                 })
    //             }
    //         })

    //     }
    // })
}

export {createDump as createDumpHandler}