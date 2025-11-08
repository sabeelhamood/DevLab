import express from 'express'
import { authenticateService } from '../../middleware/auth.js'
import { contentStudioController } from '../../controllers/external/contentStudioController.js'

const router = express.Router()
router.use(authenticateService)

router.get('/:courseId/skills', contentStudioController.getCourseSkills)
router.get('/:courseId/type', contentStudioController.getQuestionType)
router.post('/questions/validate', contentStudioController.validateQuestion)

export default router

