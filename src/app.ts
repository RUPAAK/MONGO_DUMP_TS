import express from 'express'
import "express-async-errors";
import cors from 'cors'

import { indexMongoRouter } from './routes/mongo'
// import { NotFoundError, errorHandler, BadRequestError } from './common';

const app: express.Application= express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res)=>{
    res.send('hi')
    // throw new BadRequestError('NO')
})
app.get('/api/v1/mongo/dump', (req, res)=>{
    res.send('dev')
})
app.use('/api/v1/mongo', indexMongoRouter)

// app.use(errorHandler)

export {app}