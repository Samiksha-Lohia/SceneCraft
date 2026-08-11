import { BadRequestError } from '../utilities/custom-errors.js';

/**
 * Factory that returns an Express middleware validating req against a Joi schema.
 *
 * @param {Object} schema - Object with optional keys: body, params, query
 *                          each holding a Joi schema.
 * @returns Express middleware
 */
const validate = (schema) => (req, _res, next) => {
  const parts = ['body', 'params', 'query'];
  const errors = [];

  for (const part of parts) {
    if (!schema[part]) continue;
    const { error, value } = schema[part].validate(req[part], {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      errors.push(...error.details.map((d) => d.message));
    } else {
      req[part] = value; // replace with sanitised/defaulted values
    }
  }

  if (errors.length > 0) {
    return next(new BadRequestError(errors.join('; ')));
  }

  next();
};

export { validate };
