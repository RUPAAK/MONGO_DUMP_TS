import {Request, response, Response} from 'express'
import {spawn} from 'child_process'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import extract from 'extract-zip'
import axios from 'axios'
import { loggerFunction } from '../../common/errors/loggerFunction'

export enum Restore_State{
    Restore_Pending= "restore&pending",
    Restore_Failed= "restore&failed",
    Restore_Success= "restore&success"
}

const createRestore= async(req: Request, res: Response)=>{
    const {baseUrl, url, database }= req.body
    if(!url || !database){
        loggerFunction("Empty Field", Restore_State.Restore_Failed, '', baseUrl)
        res.end()
    }else{
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
        
            child.stderr.on('data', async(data)=>{
                console.log('stdout:', Buffer.from(data).toString())
                    loggerFunction(Buffer.from(data).toString(), Restore_State.Restore_Pending, '', baseUrl)
                    res.end()
                // await axios.post(`${baseUrl}/logger`, {message: Buffer.from(data).toString(), data: '', state:State.Restore_Pending})
            })
                
            child.on('exit', async(code: number, signal: NodeJS.Signals)=>{
                if(code){
                        loggerFunction(`Backup Failed with code: ${code}`, Restore_State.Restore_Failed, '', baseUrl)
                        // await axios.post(`${baseUrl}/logger`, {message: `Process end: ${code}`, data: '', state: State.Restore_Failed })
                        res.end()

                }
                else if(signal){
                        loggerFunction(`Backup Failed with signal: ${signal}`, Restore_State.Restore_Failed, '', baseUrl)
                        // await axios.post(`${baseUrl}/logger`, {message: `Process end: ${signal}`, data: '', state: State.Restore_Failed})
                        res.end()

                }
                else{
                    fs.rm('dump', {recursive: true}, ()=>{
                        fs.unlink('zipfile.zip', ()=>{
                            console.log('Restore Successfull')
                        })
                    })
                    loggerFunction("Restore Successfull", Restore_State.Restore_Success, '', baseUrl)
                    // await axios.post(`${baseUrl}/logger`, {message: "Restore successfull", data: '', state: State.Restore_Success})
                    res.end()
                }
            })
    }
}

export {createRestore as createRestoreHandler}