/**
 * Google OAuth Authentication Service
 * Handles Google OAuth flow using Expo AuthSession
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Ensure web browser is properly completed for auth flow
WebBrowser.maybeCompleteAuthSession();

// Google OAuth endpoints
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// Required scopes for Drive and Sheets access
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'openid',
  'profile',
  'email',
];

/**
 * Runtime memory store for auth state
 * This is intentionally not persisted as per requirements
 */
let authState = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  user: null,
};

/**
 * Get the redirect URI for the current platform
 * @param {string} clientId - Google OAuth client ID
 * @returns {string} The redirect URI
 */
export const getRedirectUri = (clientId) => {
  return AuthSession.makeRedirectUri({
    scheme: 'easy-money-tracker',
  });
};

/**
 * Create auth request configuration
 * @param {string} clientId - Google OAuth client ID
 * @returns {Object} Auth request config
 */
export const createAuthConfig = (clientId) => {
  const redirectUri = getRedirectUri(clientId);
  
  return {
    clientId,
    redirectUri,
    scopes: SCOPES,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  };
};

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code from OAuth flow
 * @param {Object} request - Auth request object with code verifier
 * @param {string} clientId - Google OAuth client ID
 * @returns {Promise<Object>} Token response
 */
export const exchangeCodeForToken = async (code, request, clientId) => {
  const redirectUri = getRedirectUri(clientId);
  
  try {
    const tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        clientId,
        code,
        redirectUri,
        extraParams: {
          code_verifier: request.codeVerifier,
        },
      },
      discovery
    );

    // Store tokens in memory
    authState.accessToken = tokenResponse.accessToken;
    authState.refreshToken = tokenResponse.refreshToken;
    authState.expiresAt = tokenResponse.expiresIn
      ? Date.now() + tokenResponse.expiresIn * 1000
      : null;

    return tokenResponse;
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
};

/**
 * Get user info from Google API
 * @returns {Promise<Object>} User info object
 */
export const getUserInfo = async () => {
  if (!authState.accessToken) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${authState.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthState();
        throw new Error('AUTH_REVOKED');
      }
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await response.json();
    authState.user = userInfo;
    return userInfo;
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
};

/**
 * Get current access token
 * @returns {string|null} Current access token or null
 */
export const getAccessToken = () => {
  return authState.accessToken;
};

/**
 * Get current user
 * @returns {Object|null} Current user info or null
 */
export const getCurrentUser = () => {
  return authState.user;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  return !!authState.accessToken && (!authState.expiresAt || Date.now() < authState.expiresAt);
};

/**
 * Clear auth state (logout)
 */
export const clearAuthState = () => {
  authState = {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    user: null,
  };
};

/**
 * Set auth state directly (for testing or restoring from response)
 * @param {Object} state - Auth state to set
 */
export const setAuthState = (state) => {
  if (state.accessToken) {
    authState.accessToken = state.accessToken;
  }
  if (state.refreshToken) {
    authState.refreshToken = state.refreshToken;
  }
  if (state.expiresAt) {
    authState.expiresAt = state.expiresAt;
  }
  if (state.user) {
    authState.user = state.user;
  }
};

export { discovery, SCOPES };
