/**
 * Google Sheets Service
 * Handles Google Sheets and Drive operations
 */

import { getAccessToken, isAuthenticated, clearAuthState } from './googleAuth';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

// Master template file ID - this should be configured per environment
// In production, this would come from environment config
export const MASTER_TEMPLATE_ID = '1A2B3C4D5E6F7G8H9I0J'; // Placeholder - to be configured

/**
 * Runtime memory store for selected sheet
 * This is intentionally not persisted as per requirements
 */
let selectedSheet = {
  fileId: null,
  fileName: null,
  lastModified: null,
};

/**
 * Make an authenticated API request to Google APIs
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} API response
 */
const authenticatedFetch = async (url, options = {}) => {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthState();
      throw new Error('AUTH_REVOKED');
    }
    if (response.status === 404) {
      throw new Error('FILE_NOT_FOUND');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status}`);
  }

  return response;
};

/**
 * List user's Google Sheets files
 * Filters to only show spreadsheet files that the user owns or has access to
 * @returns {Promise<Array>} List of sheet files with id, name, modifiedTime
 */
export const listUserSheets = async () => {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated');
  }

  try {
    const query = encodeURIComponent(
      "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
    );
    const fields = encodeURIComponent('files(id,name,modifiedTime,iconLink)');
    
    const response = await authenticatedFetch(
      `${DRIVE_API_BASE}/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc&pageSize=50`
    );

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing sheets:', error);
    
    if (error.message === 'AUTH_REVOKED') {
      throw error;
    }
    
    throw new Error(`Failed to list sheets: ${error.message}`);
  }
};

/**
 * Duplicate the master template to create a new tracker spreadsheet
 * @param {string} templateId - ID of the master template (optional, uses default)
 * @param {string} newName - Name for the new spreadsheet (optional)
 * @returns {Promise<Object>} New file object with id, name
 */
export const duplicateMasterTemplate = async (templateId = MASTER_TEMPLATE_ID, newName = null) => {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated');
  }

  const fileName = newName || `Easy Money Tracker - ${new Date().toLocaleDateString()}`;

  try {
    const response = await authenticatedFetch(
      `${DRIVE_API_BASE}/files/${templateId}/copy`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: fileName,
        }),
      }
    );

    const newFile = await response.json();
    
    // Automatically select the newly created file
    storeSelectedSheet(newFile.id, newFile.name);
    
    return {
      id: newFile.id,
      name: newFile.name,
    };
  } catch (error) {
    console.error('Error duplicating template:', error);
    
    if (error.message === 'FILE_NOT_FOUND') {
      throw new Error('TEMPLATE_NOT_FOUND');
    }
    
    throw new Error(`Failed to create from template: ${error.message}`);
  }
};

/**
 * Store selected sheet in runtime memory (no persistence)
 * @param {string} fileId - Google Drive file ID
 * @param {string} fileName - File name for display
 */
export const storeSelectedSheet = (fileId, fileName = null) => {
  selectedSheet = {
    fileId,
    fileName,
    lastModified: new Date().toISOString(),
  };
};

/**
 * Get currently selected sheet info
 * @returns {Object} Selected sheet info or object with null values
 */
export const getSelectedSheet = () => {
  return { ...selectedSheet };
};

/**
 * Clear selected sheet from memory
 */
export const clearSelectedSheet = () => {
  selectedSheet = {
    fileId: null,
    fileName: null,
    lastModified: null,
  };
};

/**
 * Check if a sheet still exists and is accessible
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<boolean>} True if file exists and is accessible
 */
export const verifySheetAccess = async (fileId) => {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await authenticatedFetch(
      `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,trashed`
    );

    const file = await response.json();
    return !file.trashed;
  } catch (error) {
    if (error.message === 'FILE_NOT_FOUND' || error.message === 'AUTH_REVOKED') {
      return false;
    }
    throw error;
  }
};

/**
 * Get spreadsheet metadata
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<Object>} Spreadsheet metadata
 */
export const getSpreadsheetMetadata = async (fileId) => {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated');
  }

  try {
    const response = await authenticatedFetch(
      `${SHEETS_API_BASE}/spreadsheets/${fileId}?fields=properties,sheets.properties`
    );

    return await response.json();
  } catch (error) {
    console.error('Error getting spreadsheet metadata:', error);
    throw error;
  }
};
