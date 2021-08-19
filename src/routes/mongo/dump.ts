import express from 'express'
import { createDumpHandler } from '../../controllers/mongo/dump'

const router= express.Router()

router.post('/dump', createDumpHandler)

export {router as createDumpRouter}