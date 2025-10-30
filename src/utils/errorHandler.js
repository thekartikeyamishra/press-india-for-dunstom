// E:\press-india\src\utils\errorHandler.js
// ============================================
// Centralized Error Handler for Press India
// Handles all application errors with proper logging and user feedback
// Complete, Error-Free, Production Ready
// ============================================

/**
 * Centralized Error Handler Class
 */
class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Store last 100 errors
    this.isDevelopment = import.meta.env.DEV;
  }

  /**
   * Main error handling method
   */
  handle(error, context = '') {
    const errorObj = this.parseError(error, context);
    this.logError(errorObj);
    this.storeError(errorObj);
    return this.getUserMessage(errorObj);
  }

  /**
   * Parse error into standardized format
   */
  parseError(error, context) {
    const timestamp = new Date().toISOString();
    
    // Firebase errors
    if (error?.code) {
      return {
        type: 'firebase',
        code: error.code,
        message: error.message,
        context,
        timestamp,
        stack: error.stack
      };
    }

    // Network errors
    if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
      return {
        type: 'network',
        message: error.message,
        context,
        timestamp,
        stack: error.stack
      };
    }

    // Generic errors
    return {
      type: 'generic',
      message: error?.message || String(error),
      context,
      timestamp,
      stack: error?.stack
    };
  }

  /**
   * Log error to console (only in development)
   */
  logError(errorObj) {
    if (this.isDevelopment) {
      console.error(`[${errorObj.context}]`, errorObj.message);
      if (errorObj.stack) {
        console.error(errorObj.stack);
      }
    }
  }

  /**
   * Store error in memory
   */
  storeError(errorObj) {
    this.errors.push(errorObj);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(errorObj) {
    const errorMessages = {
      // Firebase Auth Errors
      'auth/email-already-in-use': 'This email is already registered. Please login instead.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
      'auth/weak-password': 'Please choose a stronger password (at least 6 characters).',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/invalid-credential': 'Invalid login credentials. Please try again.',
      
      // Firestore Errors
      'permission-denied': 'You do not have permission to perform this action.',
      'not-found': 'The requested resource was not found.',
      'already-exists': 'This resource already exists.',
      'resource-exhausted': 'Service quota exceeded. Please try again later.',
      'failed-precondition': 'Operation failed. Please try again.',
      'aborted': 'Operation was aborted. Please try again.',
      'out-of-range': 'Invalid input range.',
      'unimplemented': 'This feature is not yet available.',
      'internal': 'Internal server error. Please try again.',
      'unavailable': 'Service temporarily unavailable. Please try again.',
      'data-loss': 'Data error occurred. Please contact support.',
      'unauthenticated': 'Please login to continue.',
      
      // Storage Errors
      'storage/unauthorized': 'You do not have permission to upload files.',
      'storage/canceled': 'Upload was cancelled.',
      'storage/unknown': 'An unknown error occurred during upload.',
      'storage/object-not-found': 'File not found.',
      'storage/bucket-not-found': 'Storage bucket not found.',
      'storage/project-not-found': 'Project not found.',
      'storage/quota-exceeded': 'Storage quota exceeded.',
      'storage/invalid-checksum': 'File upload failed. Please try again.',
      'storage/retry-limit-exceeded': 'Upload failed after multiple retries.',
      
      // Network Errors
      'network': 'Network error. Please check your internet connection.',
      
      // Generic
      'generic': 'An unexpected error occurred. Please try again.'
    };

    // Check for specific Firebase error code
    if (errorObj.code && errorMessages[errorObj.code]) {
      return errorMessages[errorObj.code];
    }

    // Check for error type
    if (errorMessages[errorObj.type]) {
      return errorMessages[errorObj.type];
    }

    // Check if message contains permission-related keywords
    if (errorObj.message?.toLowerCase().includes('permission')) {
      return errorMessages['permission-denied'];
    }

    // Default message
    return errorMessages['generic'];
  }

  /**
   * Get all stored errors
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Clear all stored errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Export errors as JSON
   */
  exportErrors() {
    return JSON.stringify(this.errors, null, 2);
  }

  /**
   * Handle async operations with error handling
   */
  async handleAsync(promise, context = '') {
    try {
      const result = await promise;
      return [null, result];
    } catch (error) {
      const message = this.handle(error, context);
      return [message, null];
    }
  }

  /**
   * Wrap a function with error handling
   */
  wrap(fn, context = '') {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        throw new Error(this.handle(error, context));
      }
    };
  }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// ============================================
// GLOBAL ERROR HANDLERS SETUP
// ============================================

/**
 * Setup global error handlers for unhandled errors
 * This catches errors that slip through try-catch blocks
 */
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    errorHandler.handle(event.reason, 'UnhandledPromiseRejection');
    event.preventDefault(); // Prevent default browser error handling
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    errorHandler.handle(event.error, 'GlobalError');
    event.preventDefault(); // Prevent default browser error handling
  });

  // Log that error handlers are setup
  if (import.meta.env.DEV) {
    console.log('✅ Global error handlers initialized');
  }
};

// ============================================
// EXPORTS
// ============================================

export default errorHandler;

// Export convenience methods
export const handleError = (error, context) => errorHandler.handle(error, context);
export const handleAsync = (promise, context) => errorHandler.handleAsync(promise, context);
export const wrapAsync = (fn, context) => errorHandler.wrap(fn, context);