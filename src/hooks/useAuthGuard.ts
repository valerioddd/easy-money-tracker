/**
 * useAuthGuard Hook
 * 
 * Monitors authentication state and handles revoked permissions.
 * Triggers re-login flow when authentication is lost.
 */

import { useEffect, useCallback, useState } from 'react';
import { isAuthenticated, clearAuthState } from '../services/googleAuth';

interface AuthGuardOptions {
  /** Callback when authentication is revoked */
  onAuthRevoked?: () => void;
  /** Enable polling for auth state changes (default: false) */
  enablePolling?: boolean;
  /** Polling interval in milliseconds (default: 30000) */
  pollingInterval?: number;
}

interface AuthGuardReturn {
  /** Whether user is currently authenticated */
  isAuthenticated: boolean;
  /** Manually trigger auth check */
  checkAuth: () => boolean;
  /** Handle auth error and trigger revoked flow */
  handleAuthError: (error: Error) => void;
}

/**
 * Custom hook for guarding against authentication failures
 * 
 * @param options - Configuration options
 * @returns Auth guard state and handlers
 * 
 * @example
 * ```tsx
 * const { isAuthenticated, handleAuthError } = useAuthGuard({
 *   onAuthRevoked: () => navigation.navigate('Login')
 * });
 * 
 * try {
 *   await someApiCall();
 * } catch (error) {
 *   handleAuthError(error);
 * }
 * ```
 */
export function useAuthGuard(options: AuthGuardOptions = {}): AuthGuardReturn {
  const {
    onAuthRevoked,
    enablePolling = false,
    pollingInterval = 30000,
  } = options;

  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  /**
   * Check current authentication state
   */
  const checkAuth = useCallback((): boolean => {
    const authStatus = isAuthenticated();
    setAuthenticated(authStatus);
    return authStatus;
  }, []);

  /**
   * Handle authentication errors
   * Detects AUTH_REVOKED errors and triggers the re-login flow
   */
  const handleAuthError = useCallback((error: Error) => {
    // Check if error is auth-related
    if (
      error.message === 'AUTH_REVOKED' ||
      error.message === 'Not authenticated' ||
      error.message.includes('401') ||
      error.message.includes('Authentication revoked')
    ) {
      // Clear auth state
      clearAuthState();
      setAuthenticated(false);
      
      // Trigger callback to navigate to login
      if (onAuthRevoked) {
        onAuthRevoked();
      }
    }
  }, [onAuthRevoked]);

  /**
   * Periodic auth state check (if enabled)
   */
  useEffect(() => {
    if (!enablePolling) {
      return;
    }

    const interval = setInterval(() => {
      const authStatus = checkAuth();
      
      // If auth was lost, trigger the revoked callback
      if (!authStatus && authenticated) {
        if (onAuthRevoked) {
          onAuthRevoked();
        }
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [enablePolling, pollingInterval, checkAuth, authenticated, onAuthRevoked]);

  return {
    isAuthenticated: authenticated,
    checkAuth,
    handleAuthError,
  };
}
