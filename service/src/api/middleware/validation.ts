/**
 * Request validation middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AskRequest, ApiException, ApiErrorCode, ValidationError } from '../../types';

export interface ValidationSchema {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
  };
}

export class RequestValidator {
  private static validateField(
    fieldName: string,
    value: any,
    rules: ValidationSchema[string]
  ): ValidationError | null {
    // Required field validation
    if (rules.required && (value === undefined || value === null || value === '')) {
      return {
        field: fieldName,
        message: `${fieldName} is required`,
        value
      };
    }

    // Skip further validation if field is not provided and not required
    if (value === undefined || value === null) {
      return null;
    }

    // Type validation
    if (rules.type) {
      const actualType = typeof value;
      if (actualType !== rules.type) {
        return {
          field: fieldName,
          message: `${fieldName} must be of type ${rules.type}, got ${actualType}`,
          value
        };
      }
    }

    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return {
          field: fieldName,
          message: `${fieldName} must be at least ${rules.minLength} characters long`,
          value
        };
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        return {
          field: fieldName,
          message: `${fieldName} must be no more than ${rules.maxLength} characters long`,
          value
        };
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        return {
          field: fieldName,
          message: `${fieldName} format is invalid`,
          value
        };
      }
    }

    // Number validations
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return {
          field: fieldName,
          message: `${fieldName} must be at least ${rules.min}`,
          value
        };
      }

      if (rules.max !== undefined && value > rules.max) {
        return {
          field: fieldName,
          message: `${fieldName} must be no more than ${rules.max}`,
          value
        };
      }
    }

    // Custom validation
    if (rules.custom) {
      const result = rules.custom(value);
      if (result !== true) {
        return {
          field: fieldName,
          message: typeof result === 'string' ? result : `${fieldName} is invalid`,
          value
        };
      }
    }

    return null;
  }

  public static validate(data: any, schema: ValidationSchema): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const [fieldName, rules] of Object.entries(schema)) {
      const error = this.validateField(fieldName, data[fieldName], rules);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }
}

// URL validation regex
const URL_PATTERN = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)$/;
const GIT_URL_PATTERN = /^(?:https?:\/\/(?:www\.)?(?:github\.com|gitlab\.com|bitbucket\.org)\/[\w\-\.]+\/[\w\-\.]+(?:\.git)?(?:\/)?|git@(?:github\.com|gitlab\.com|bitbucket\.org):[\w\-\.]+\/[\w\-\.]+(?:\.git)?)$/;

// Validation schema for ask request
export const askRequestSchema: ValidationSchema = {
  repository_url: {
    required: true,
    type: 'string',
    minLength: 10,
    maxLength: 500,
    custom: (value: string) => {
      if (!GIT_URL_PATTERN.test(value)) {
        return 'repository_url must be a valid Git repository URL (GitHub, GitLab, or Bitbucket)';
      }
      return true;
    }
  },
  question: {
    required: true,
    type: 'string',
    minLength: 5,
    maxLength: 2000
  },
  branch: {
    required: false,
    type: 'string',
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9][a-zA-Z0-9\-_\/\.]*$/
  },
  timeout: {
    required: false,
    type: 'number',
    min: 10,
    max: 3600
  }
};

export function validateAskRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = RequestValidator.validate(req.body, askRequestSchema);

  if (errors.length > 0) {
    const apiError = new ApiException(
      ApiErrorCode.INVALID_REQUEST,
      'Request validation failed',
      { validation_errors: errors },
      400
    );

    res.status(apiError.statusCode).json({
      status: 'error',
      error_code: apiError.code,
      message: apiError.message,
      details: apiError.details
    });
    return;
  }

  next();
} 