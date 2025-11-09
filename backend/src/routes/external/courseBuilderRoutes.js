import express from 'express'
import { authenticateService } from '../../middleware/auth.js'
import { courseBuilderController } from '../../controllers/external/courseBuilderController.js'

const router = express.Router()
router.use(authenticateService)

router.post('/course-completion', courseBuilderController.handleCourseCompletion)

export default router



