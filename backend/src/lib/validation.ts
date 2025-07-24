import Joi from 'joi';
import { ExpenseCategory, ExpenseStatus, Role } from '@prisma/client';

// Auth validation schemas
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),
});

export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required',
    }),
  password: Joi.string()
    .min(6)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required',
    }),
  role: Joi.string()
    .valid(...Object.values(Role))
    .optional()
    .default(Role.EMPLOYEE),
});

// Expense validation schemas
export const createExpenseSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .precision(2)
    .max(50000)
    .required()
    .messages({
      'number.positive': 'Amount must be a positive number',
      'number.max': 'Amount cannot exceed $50,000',
      'any.required': 'Amount is required',
    }),
  category: Joi.string()
    .valid(...Object.values(ExpenseCategory))
    .required()
    .messages({
      'any.only': 'Please select a valid category',
      'any.required': 'Category is required',
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
  date: Joi.date()
    .iso()
    .max('now')
    .required()
    .messages({
      'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
      'date.max': 'Date cannot be in the future',
      'any.required': 'Date is required',
    }),
  receiptUrl: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Receipt URL must be a valid URL',
    }),
});

export const updateExpenseSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .precision(2)
    .max(50000)
    .optional()
    .messages({
      'number.positive': 'Amount must be a positive number',
      'number.max': 'Amount cannot exceed $50,000',
    }),
  category: Joi.string()
    .valid(...Object.values(ExpenseCategory))
    .optional()
    .messages({
      'any.only': 'Please select a valid category',
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
  date: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.format': 'Date must be in ISO format (YYYY-MM-DD)',
      'date.max': 'Date cannot be in the future',
    }),
  receiptUrl: Joi.string()
    .uri()
    .optional()
    .allow('', null)
    .messages({
      'string.uri': 'Receipt URL must be a valid URL',
    }),
});

export const expenseApprovalSchema = Joi.object({
  status: Joi.string()
    .valid(ExpenseStatus.APPROVED, ExpenseStatus.REJECTED)
    .required()
    .messages({
      'any.only': 'Status must be either APPROVED or REJECTED',
      'any.required': 'Status is required',
    }),
  rejectionReason: Joi.when('status', {
    is: ExpenseStatus.REJECTED,
    then: Joi.string()
      .min(10)
      .max(500)
      .required()
      .messages({
        'string.min': 'Rejection reason must be at least 10 characters',
        'string.max': 'Rejection reason cannot exceed 500 characters',
        'any.required': 'Rejection reason is required when rejecting an expense',
      }),
    otherwise: Joi.string().optional().allow('', null),
  }),
});

// Query validation schemas with proper type conversion
export const expenseFiltersSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ExpenseStatus))
    .optional(),
  category: Joi.string()
    .valid(...Object.values(ExpenseCategory))
    .optional(),
  userId: Joi.string()
    .optional(),
  dateFrom: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Date from must be in ISO format (YYYY-MM-DD)',
    }),
  dateTo: Joi.date()
    .iso()
    .min(Joi.ref('dateFrom'))
    .optional()
    .messages({
      'date.format': 'Date to must be in ISO format (YYYY-MM-DD)',
      'date.min': 'Date to must be after date from',
    }),
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional(),
});

export const analyticsFiltersSchema = Joi.object({
  dateFrom: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.format': 'Date from must be in ISO format (YYYY-MM-DD)',
    }),
  dateTo: Joi.date()
    .iso()
    .min(Joi.ref('dateFrom'))
    .optional()
    .messages({
      'date.format': 'Date to must be in ISO format (YYYY-MM-DD)',
      'date.min': 'Date to must be after date from',
    }),
  userId: Joi.string()
    .optional(),
});

// Validation middleware helper
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    // Don't modify req.body directly, let the controller handle the validated data
    // Store validated data in a separate property
    req.validatedBody = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true, // This ensures strings are converted to numbers where appropriate
    });

    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors: validationErrors,
      });
    }

    // Store validated and properly typed data separately
    req.validatedQuery = value;
    next();
  };
};