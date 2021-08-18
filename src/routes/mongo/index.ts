import express from 'express'
import { errorHandler } from '../../common/middlewares/error-handler';
import { createDumpRouter } from './dump'
import { createRestoreRoute } from './restore';

const router= express.Router()

router.use(createDumpRouter)
router.use(createRestoreRoute)

router.use(errorHandler);



export {router as indexMongoRouter}