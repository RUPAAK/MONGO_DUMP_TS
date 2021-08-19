import {Request, response, Response} from 'express'
import {spawn} from 'child_process'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import extract from 'extract-zip'

const createRestore= async(req: Request, res: Response)=>{
    const {url, database }= req.body

    const response= await fetch(url)
    const bufferData: Buffer= await response.buffer()

    fs.writeFile('zipfile.zip', bufferData, ()=>{
        fs.mkdir('dump', async()=>{
            await extract('zipfile.zip', {dir: path.resolve('dump')})
        })
    })
    const child= spawn('mongorestore', [
        '--gzip',
        '--uri', database,
        '--drop'
    ])
    child.stdout.on('data', (data)=>{
        console.log('stdout:', data)
    })

    child.stderr.on('data', (data)=>{
        console.log('stdout:', Buffer.from(data).toString())
    })

    child.on('error',(error)=> console.log('error', error))

    child.on('exit', (code: number, signal: NodeJS.Signals)=>{
        if(code) console.log('Process exit with code: ', code)
        else if(signal) console.log('Prcess killed with signal: ', signal)
        else{
            fs.rm('dump', {recursive: true}, ()=>{
                fs.unlink('zipfile.zip', ()=>{
                    console.log('Removed')
                })
            })
            res.send({
                data: "sucessfull"
            })
        }
    })
}

export {createRestore as createRestoreHandler}