import express from 'express'
import { createRestoreHandler } from '../../controllers/mongo/restore'

const router= express.Router()

router.post("/restore", createRestoreHandler)

export {router as createRestoreRouter}