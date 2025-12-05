/**
 * Application Configuration
 * 
 * This module provides configuration values that should be set before using the app.
 * For production use, replace the placeholder values with actual credentials.
 * 
 * IMPORTANT: Never commit actual credentials to source control.
 * Use environment variables or a secure configuration system in production.
 */

/**
 * Google OAuth Client ID
 * 
 * To get a client ID:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create or select a project
 * 3. Enable the Google Sheets API and Google Drive API
 * 4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
 * 5. For Expo/React Native:
 *    - Create a "Web application" client for Expo Go development
 *    - Create "Android" and "iOS" clients for production builds
 * 6. Add the redirect URIs shown when starting the app
 * 
 * For development with Expo Go, use the Web client ID.
 * For standalone builds, configure platform-specific client IDs.
 */
export const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

/**
 * Master Template Spreadsheet ID
 * 
 * This is the ID of the Google Sheets template that will be duplicated
 * when users create a new tracker.
 * 
 * To get the template ID:
 * 1. Create the master template spreadsheet in Google Sheets
 * 2. The ID is in the URL: https://docs.google.com/spreadsheets/d/{TEMPLATE_ID}/edit
 * 3. Make sure the template is shared with "Anyone with the link can view"
 *    or is owned by the same account that created the OAuth credentials
 */
export const MASTER_TEMPLATE_ID = 'YOUR_MASTER_TEMPLATE_ID';

/**
 * Check if configuration is properly set
 * @returns {boolean} True if all required config is set
 */
export const isConfigured = () => {
  return (
    GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com' &&
    MASTER_TEMPLATE_ID !== 'YOUR_MASTER_TEMPLATE_ID'
  );
};

/**
 * Get configuration status for debugging
 * @returns {Object} Configuration status object
 */
export const getConfigStatus = () => ({
  googleClientId: GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  masterTemplateId: MASTER_TEMPLATE_ID !== 'YOUR_MASTER_TEMPLATE_ID',
});
