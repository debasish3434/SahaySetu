import { body, validationResult } from 'express-validator';

/**
 * Runs after express-validator chains to collect and format errors.
 * If any validation failed, responds 422 with a list of field errors.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ---------- Auth validation chains ----------

export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('email').optional({ checkFalsy: true }).trim()
    .isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('username').optional({ checkFalsy: true }).trim()
    .matches(/^[a-zA-Z0-9]{3,30}$/).withMessage('Username must be 3-30 letters or numbers only'),
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  body('phone').optional({ checkFalsy: true })
    .matches(/^(?:\+?91[\s-]?)?[6-9]\d{9}$/).withMessage('Please provide a valid Indian mobile number'),
  body('role').optional().isIn(['citizen', 'volunteer', 'coordinator']).withMessage('Public registration is limited to Citizen, Volunteer, or Coordinator'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Please provide a valid email').normalizeEmail()
    .custom((value, { req }) => !['volunteer', 'coordinator'].includes(String(req.body.role || '').toLowerCase()) || value.endsWith('@sahaysetu.com'))
    .withMessage('Volunteers and coordinators must use an email ending in @sahaysetu.com'),
  handleValidationErrors,
];

export const loginValidation = [
  body('email').trim().notEmpty().withMessage('Email or Administrator ID is required').isLength({ max: 254 }).withMessage('Login ID is too long')
    .custom((value) => {
      if (String(value).includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      return /^ADM-\d{4}-\d{6}$/i.test(value);
    }).withMessage('Enter a valid email address or Administrator ID'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

export const forgotPasswordValidation = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Please provide a valid email'),
  handleValidationErrors,
];

export const resetPasswordValidation = [
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  handleValidationErrors,
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  handleValidationErrors,
];

// ---------- User validation chains ----------

export const updateProfileValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('phone').optional({ checkFalsy: true }).matches(/^[1-9]\d{9}$/).withMessage('Please provide a valid 10-digit 10-digit phone number'),
  body('address').optional().trim().isLength({ max: 200 }).withMessage('Address cannot exceed 200 characters'),
  body('bio').optional().trim().isLength({ max: 300 }).withMessage('Bio cannot exceed 300 characters'),
  handleValidationErrors,
];

export const updateSettingsValidation = [
  body('notificationsEnabled').optional().isBoolean().withMessage('notificationsEnabled must be a boolean'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

// ---------- Volunteer validation chains ----------

export const applyVolunteerValidation = [
  body('availability').notEmpty().withMessage('Availability is required').trim(),
  body('skills').optional(),
  handleValidationErrors,
];

export const verifyVolunteerValidation = [
  body('decision').notEmpty().withMessage('Decision is required')
    .isIn(['verified', 'rejected']).withMessage('Decision must be either verified or rejected'),
  handleValidationErrors,
];

// ---------- Incident validation chains ----------

export const createIncidentValidation = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 120 }).withMessage('Title must be 5-120 characters'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ min: 20, max: 2000 }).withMessage('Description must be 20-2000 characters'),
  body('category')
    .isIn(['flood', 'fire', 'earthquake', 'cyclone', 'landslide', 'medical', 'accident', 'building-collapse', 'other'])
    .withMessage('Please select a valid category'),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  body('latitude').notEmpty().withMessage('Location latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').notEmpty().withMessage('Location longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('contactPhone').optional({ checkFalsy: true })
    .matches(/^[1-9]\d{9}$/).withMessage('Please provide a valid 10-digit 10-digit phone number'),
  body('peopleAffected').optional().isInt({ min: 0 }).withMessage('People affected must be a positive number'),
  handleValidationErrors,
];
