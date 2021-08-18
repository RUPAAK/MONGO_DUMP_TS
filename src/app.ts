import express from 'express'
import cors from 'cors'

import { errorHandler } from './common/middlewares/error-handler'
import { indexMongoRouter } from './routes/mongo'

const app: express.Application= express()

app.use(cors())
app.use(express.json())


app.use('/api/v1/mongo', indexMongoRouter)

app.use(errorHandler)

export {app}