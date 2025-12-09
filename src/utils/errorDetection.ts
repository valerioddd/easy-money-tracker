/**
 * Error Detection Utilities
 * 
 * Centralized error type detection for consistent error handling
 */

/**
 * Check if an error is authentication-related
 * @param error - The error to check
 * @returns True if the error is auth-related
 */
export function isAuthError(error: Error | string): boolean {
  const message = typeof error === 'string' ? error : error.message;
  
  return (
    message === 'AUTH_REVOKED' ||
    message === 'Not authenticated' ||
    message.includes('401') ||
    message.includes('Authentication revoked')
  );
}

/**
 * Check if an error is sheet-related (not found, deleted, moved)
 * @param error - The error to check
 * @returns True if the error is sheet-related
 */
export function isSheetError(error: Error | string): boolean {
  const message = typeof error === 'string' ? error : error.message;
  
  return (
    message === 'FILE_NOT_FOUND' ||
    message === 'Resource not found' ||
    message.includes('404') ||
    message.includes('not found') ||
    message.includes('No spreadsheet selected')
  );
}

/**
 * Check if an error is template-related
 * @param error - The error to check
 * @returns True if the error is template-related
 */
export function isTemplateError(error: Error | string): boolean {
  const message = typeof error === 'string' ? error : error.message;
  
  return message.includes('TEMPLATE_NOT_FOUND');
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
