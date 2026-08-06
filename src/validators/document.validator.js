import Joi from 'joi';
import { STAGE_LIST } from '../constants/stages.js';

const objectIdPattern = /^[a-f\d]{24}$/i;

const documentIdParamSchema = {
  params: Joi.object({
    documentId: Joi.string().pattern(objectIdPattern).required().messages({
      'string.pattern.base': 'documentId must be a valid MongoDB ObjectId.',
    }),
  }),
};

const sceneIdParamSchema = {
  params: Joi.object({
    documentId: Joi.string().pattern(objectIdPattern).required(),
    sceneId: Joi.string().pattern(objectIdPattern).required().messages({
      'string.pattern.base': 'sceneId must be a valid MongoDB ObjectId.',
    }),
  }),
};

const characterIdParamSchema = {
  params: Joi.object({
    documentId: Joi.string().pattern(objectIdPattern).required(),
    characterId: Joi.string().pattern(objectIdPattern).required().messages({
      'string.pattern.base': 'characterId must be a valid MongoDB ObjectId.',
    }),
  }),
};

const stageParamSchema = {
  params: Joi.object({
    documentId: Joi.string().pattern(objectIdPattern).required(),
    stage: Joi.string()
      .valid(...STAGE_LIST)
      .required()
      .messages({
        'any.only': `stage must be one of: ${STAGE_LIST.join(', ')}.`,
      }),
  }),
};

const searchQuerySchema = {
  query: Joi.object({
    q: Joi.string().min(1).max(200).required().messages({
      'any.required': 'Search query parameter "q" is required.',
    }),
  }),
};

export {
  documentIdParamSchema,
  sceneIdParamSchema,
  characterIdParamSchema,
  stageParamSchema,
  searchQuerySchema,
};
