/**
 * useAuthGuard Hook
 * 
 * Monitors authentication state and handles revoked permissions.
 * Triggers re-login flow when authentication is lost.
 */

import { useEffect, useCallback, useState } from 'react';
import { isAuthenticated, clearAuthState } from '../services/googleAuth';
import { isAuthError } from '../utils/errorDetection';

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
  const [hasNotifiedRevoked, setHasNotifiedRevoked] = useState(false);

  /**
   * Check current authentication state
   */
  const checkAuth = useCallback((): boolean => {
    const authStatus = isAuthenticated();
    setAuthenticated(authStatus);
    
    // Reset notification flag when auth is restored
    if (authStatus) {
      setHasNotifiedRevoked(false);
    }
    
    return authStatus;
  }, []);

  /**
   * Handle authentication errors
   * Detects AUTH_REVOKED errors and triggers the re-login flow
   */
  const handleAuthError = useCallback((error: Error) => {
    // Check if error is auth-related using utility function
    if (isAuthError(error)) {
      // Clear auth state
      clearAuthState();
      setAuthenticated(false);
      
      // Trigger callback to navigate to login (only once)
      if (onAuthRevoked && !hasNotifiedRevoked) {
        setHasNotifiedRevoked(true);
        onAuthRevoked();
      }
    }
  }, [onAuthRevoked, hasNotifiedRevoked]);

  /**
   * Periodic auth state check (if enabled)
   */
  useEffect(() => {
    if (!enablePolling) {
      return;
    }

    const interval = setInterval(() => {
      const authStatus = checkAuth();
      
      // If auth was lost, trigger the revoked callback (only once)
      if (!authStatus && authenticated && !hasNotifiedRevoked) {
        setHasNotifiedRevoked(true);
        if (onAuthRevoked) {
          onAuthRevoked();
        }
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [enablePolling, pollingInterval, checkAuth, authenticated, hasNotifiedRevoked, onAuthRevoked]);

  return {
    isAuthenticated: authenticated,
    checkAuth,
    handleAuthError,
  };
}
