import express from 'express'
import { errorHandler } from '../../common';
import { createDumpRouter } from './dump'
import { createRestoreRouter } from './restore';

const router= express.Router()

router.use(createDumpRouter)
router.use(createRestoreRouter)

router.use(errorHandler);



export {router as indexMongoRouter}