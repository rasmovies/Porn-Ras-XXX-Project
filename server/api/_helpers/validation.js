/**
 * Validation helper for Vercel API Routes
 * Simple validation functions (replaces express-validator)
 */

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  return null;
}

function validateArray(value, fieldName, minLength = 1) {
  if (!Array.isArray(value)) {
    return { field: fieldName, message: `${fieldName} must be an array` };
  }
  if (value.length < minLength) {
    return { field: fieldName, message: `${fieldName} must have at least ${minLength} item(s)` };
  }
  return null;
}

function validateBody(body, validations) {
  const errors = [];
  
  for (const validation of validations) {
    const { field, required, email, url, array, arrayMinLength } = validation;
    const value = body[field];
    
    // Required check
    if (required) {
      const error = validateRequired(value, field);
      if (error) {
        errors.push(error);
        continue;
      }
    }
    
    // Email check
    if (email && value) {
      if (!validateEmail(value)) {
        errors.push({ field, message: `${field} must be a valid email` });
      }
    }
    
    // URL check
    if (url && value) {
      if (!validateURL(value)) {
        errors.push({ field, message: `${field} must be a valid URL` });
      }
    }
    
    // Array check
    if (array && value) {
      const error = validateArray(value, field, arrayMinLength);
      if (error) {
        errors.push(error);
      }
    }
  }
  
  return errors.length > 0 ? { errors } : null;
}

module.exports = {
  validateEmail,
  validateURL,
  validateRequired,
  validateArray,
  validateBody,
};

