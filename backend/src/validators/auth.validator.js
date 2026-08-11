import Joi from 'joi';

const registerSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(80).required().messages({
      'string.min': 'Name must be at least 2 characters.',
      'string.max': 'Name cannot exceed 80 characters.',
      'any.required': 'Name is required.',
    }),
    email: Joi.string().email().lowercase().required().messages({
      'string.email': 'Please provide a valid email address.',
      'any.required': 'Email is required.',
    }),
    password: Joi.string().min(8).max(128).required().messages({
      'string.min': 'Password must be at least 8 characters.',
      'any.required': 'Password is required.',
    }),
  }),
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().required(),
  }),
};

const refreshSchema = {
  body: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required.',
    }),
  }),
};

export { registerSchema, loginSchema, refreshSchema };
