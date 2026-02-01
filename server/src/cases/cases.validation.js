const { z } = require('zod');

const caseSchema = z
  .object({
    phone: z
      .string()
      .regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format'),
    title: z.string().min(10, 'Title must be at least 10 characters').max(100, 'Title too long'),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(1000, 'Description too long')
  })
  .strict();

const validateCaseInput = (payload) => {
  const result = caseSchema.safeParse(payload);
  if (!result.success) {
    const error = new Error('Invalid request payload');
    error.status = 400;
    error.details = result.error.flatten();
    throw error;
  }

  return result.data;
};

module.exports = {
  validateCaseInput
};
