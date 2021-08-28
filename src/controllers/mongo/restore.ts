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
    const {baseUrl, awsLink, databaseUrl }= req.body
    if(!awsLink || !databaseUrl){
        loggerFunction("Empty Field", Restore_State.Restore_Failed, '', baseUrl)
        res.end()
    }else{
        try {
            const response= await fetch(awsLink)
            const bufferData: Buffer= await response.buffer()

            fs.writeFile('zipfile.zip', bufferData, ()=>{
                fs.mkdir('dump', async()=>{
                    try {
                        await extract('zipfile.zip', {dir: path.resolve('dump')})                        
                    } catch (error) {
                        loggerFunction("Aws link failed", Restore_State.Restore_Failed, '', baseUrl)
                        res.end()
                    }
                })
            })
            const child= spawn('mongorestore', [
                '--gzip',
                '--uri', databaseUrl,
                '--drop'
            ])
        
            child.stderr.on('data', async(data)=>{
                console.log('stdout:', Buffer.from(data).toString())
                    loggerFunction(Buffer.from(data).toString(), Restore_State.Restore_Pending, '', baseUrl)
                    res.end()
            })
                
            child.on('exit', async(code: number, signal: NodeJS.Signals)=>{
                if(code){
                        loggerFunction(`Backup Failed with code: ${code}`, Restore_State.Restore_Failed, '', baseUrl)
                        res.end()

                }
                else if(signal){
                        loggerFunction(`Backup Failed with signal: ${signal}`, Restore_State.Restore_Failed, '', baseUrl)
                        res.end()

                }
                else{
                    fs.rm('dump', {recursive: true}, ()=>{
                        fs.unlink('zipfile.zip', ()=>{
                            console.log('Process End')
                        })
                    })
                    loggerFunction("Restore Successfull", Restore_State.Restore_Success, '', baseUrl)
                    res.end()
                }
                
            })  
        } catch (error) {
            loggerFunction('Restore Failed', Restore_State.Restore_Failed, '', baseUrl)
            res.end()
        } 
    }
}

export {createRestore as createRestoreHandler}