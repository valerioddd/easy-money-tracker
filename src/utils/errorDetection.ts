/**
 * Error Detection Utilities
 * 
 * Centralized error type detection for consistent error handling
 */

/**
 * Error type constants
 */
export const ERROR_CODES = {
  AUTH_REVOKED: 'AUTH_REVOKED',
  NOT_AUTHENTICATED: 'Not authenticated',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  RESOURCE_NOT_FOUND: 'Resource not found',
  NO_SHEET_SELECTED: 'No spreadsheet selected',
  TEMPLATE_NOT_FOUND: 'TEMPLATE_NOT_FOUND',
} as const;

/**
 * HTTP status codes for error detection
 */
export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
} as const;

/**
 * Check if an error is authentication-related
 * @param error - The error to check
 * @returns True if the error is auth-related
 */
export function isAuthError(error: Error | string): boolean {
  const message = typeof error === 'string' ? error : error.message;
  
  return (
    message === ERROR_CODES.AUTH_REVOKED ||
    message === ERROR_CODES.NOT_AUTHENTICATED ||
    message.includes(String(HTTP_STATUS.UNAUTHORIZED)) ||
    message.toLowerCase().includes('authentication revoked')
  );
}

/**
 * Check if an error is sheet-related (not found, deleted, moved)
 * @param error - The error to check
 * @returns True if the error is sheet-related
 */
export function isSheetError(error: Error | string): boolean {
  const message = typeof error === 'string' ? error : error.message;
  const lowerMessage = message.toLowerCase();
  
  return (
    message === ERROR_CODES.FILE_NOT_FOUND ||
    message === ERROR_CODES.RESOURCE_NOT_FOUND ||
    message === ERROR_CODES.NO_SHEET_SELECTED ||
    message.includes(String(HTTP_STATUS.NOT_FOUND)) ||
    lowerMessage.includes('not found') ||
    lowerMessage.includes('deleted') ||
    lowerMessage.includes('moved')
  );
}

/**
 * Check if an error is template-related
 * @param error - The error to check
 * @returns True if the error is template-related
 */
export function isTemplateError(error: Error | string): boolean {
  const message = typeof error === 'string' ? error : error.message;
  
  return message.includes(ERROR_CODES.TEMPLATE_NOT_FOUND);
}

/**
 * Check if an error should be handled by error guards
 * (i.e., not shown as a generic alert)
 * @param error - The error to check
 * @returns True if the error is handled by guards
 */
export function isHandledByGuard(error: Error | string): boolean {
  return isAuthError(error) || isSheetError(error) || isTemplateError(error);
}
