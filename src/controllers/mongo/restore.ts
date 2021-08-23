import {Request, response, Response} from 'express'
import {spawn} from 'child_process'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import extract from 'extract-zip'
import axios from 'axios'

enum State{
    Restore_Pending= "restore&pending",
    Restore_Failed= "restore&failed",
    Restore_Success= "restore&success"
}

const createRestore= async(req: Request, res: Response)=>{
    console.log('his')
    const {baseUrl, url, database }= req.body
    
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

    // child.stdout.on('data', (data)=>{
    //     console.log('stdout:', data)
    // })

    child.stderr.on('data', async(data)=>{
        console.log('stdout:', Buffer.from(data).toString())
        await axios.post(`${baseUrl}/logger`, {message: Buffer.from(data).toString(), data: '', state:State.Restore_Pending})
    })

    // child.on('error',(error)=> console.log('error', error))

    child.on('exit', async(code: number, signal: NodeJS.Signals)=>{
        if(code){
            await axios.post(`${baseUrl}/logger`, {message: `Process end: ${code}`, data: '', state: State.Restore_Failed })
            res.end()
        }
        else if(signal){
            await axios.post(`${baseUrl}/logger`, {message: `Process end: ${signal}`, data: '', state: State.Restore_Failed})
            res.end()
        }
        else{
            fs.rm('dump', {recursive: true}, ()=>{
                fs.unlink('zipfile.zip', ()=>{
                    console.log('Removed')
                })
            })
            await axios.post(`${baseUrl}/logger`, {message: "Restore successfull", data: '', state: State.Restore_Success})
            res.end()

            // res.send({
            //     data: "Restore Sucessfull"
            // })
        }
    })
}

export {createRestore as createRestoreHandler}