import express from 'express'
import { healthController } from '../../controllers/healthController.js'

const router = express.Router()

router.get('/', healthController.healthCheck)

export default router

