import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

import {app} from './app'

const server= require('http').createServer(app)

dotenv.config()

server.listen(process.env.PORT, ()=> console.log('SERVER UP AND RUNNING'))