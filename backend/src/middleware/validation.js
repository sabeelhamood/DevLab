/**
 * Validation Middleware
 * Request validation using Joi
 */

import Joi from 'joi';

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation Error',
        details: errors
      });
    }

    req.body = value;
    next();
  };
};

// Validation schemas
export const questionGenerationSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(10).optional(),
  lesson_id: Joi.string().required(),
  course_name: Joi.string().required(),
  lesson_name: Joi.string().required(),
  nano_skills: Joi.array().items(Joi.string()).required(),
  micro_skills: Joi.array().items(Joi.string()).required(),
  question_type: Joi.string().valid('code', 'theoretical').required(),
  programming_language: Joi.string().required()
});

export const codeExecutionSchema = Joi.object({
  code: Joi.string().required().max(1000000),
  programming_language: Joi.string().required(),
  test_cases: Joi.array().items(
    Joi.object({
      input: Joi.string().required(),
      expected_output: Joi.string().required(),
      is_hidden: Joi.boolean().optional()
    })
  ).required(),
  question_id: Joi.string().required()
});

export { validate };




