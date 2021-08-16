import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

import {app} from './app'

const server= require('http').createServer(app)

dotenv.config()

mongoose
  .connect(process.env.MONGO_URL!, {
    authSource: "admin",
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log("CONNECTION TO DATABASE SUCCESSFUL"))


server.listen(process.env.PORT, ()=> console.log('SERVER UP AND RUNNING'))