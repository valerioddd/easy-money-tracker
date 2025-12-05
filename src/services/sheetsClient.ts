/**
 * Google Sheets Client
 *
 * Provides typed API for interacting with Google Sheets.
 * Includes rate limiting, batch operations, and row-to-object mapping.
 */

import { getAccessToken, isAuthenticated, clearAuthState } from './googleAuth';
import { getSelectedSheet } from './googleSheets';
import type { SheetRow } from './models';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4';

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  /** Maximum requests per minute */
  maxRequestsPerMinute: number;
  /** Delay between requests in milliseconds */
  requestDelayMs: number;
}

/**
 * Default rate limiting settings (Google Sheets API limits)
 */
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequestsPerMinute: 60,
  requestDelayMs: 100,
};

/**
 * Rate limiter state
 */
interface RateLimiterState {
  requestTimestamps: number[];
  config: RateLimitConfig;
}

const rateLimiterState: RateLimiterState = {
  requestTimestamps: [],
  config: DEFAULT_RATE_LIMIT,
};

/**
 * Wait for rate limit if necessary
 * @returns Promise that resolves when safe to make request
 */
const waitForRateLimit = async (): Promise<void> => {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Clean up old timestamps
  rateLimiterState.requestTimestamps = rateLimiterState.requestTimestamps.filter(
    (ts) => ts > oneMinuteAgo
  );

  // Check if we're at the limit
  if (
    rateLimiterState.requestTimestamps.length >=
    rateLimiterState.config.maxRequestsPerMinute
  ) {
    const oldestTimestamp = rateLimiterState.requestTimestamps[0];
    const waitTime = oldestTimestamp + 60000 - now;
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  // Add minimum delay between requests
  if (rateLimiterState.requestTimestamps.length > 0) {
    const lastRequest =
      rateLimiterState.requestTimestamps[
        rateLimiterState.requestTimestamps.length - 1
      ];
    const timeSinceLastRequest = now - lastRequest;
    if (timeSinceLastRequest < rateLimiterState.config.requestDelayMs) {
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          rateLimiterState.config.requestDelayMs - timeSinceLastRequest
        )
      );
    }
  }

  // Record this request
  rateLimiterState.requestTimestamps.push(Date.now());
};

/**
 * Configure rate limiting
 * @param config Rate limit configuration
 */
export const configureRateLimit = (config: Partial<RateLimitConfig>): void => {
  rateLimiterState.config = {
    ...rateLimiterState.config,
    ...config,
  };
};

/**
 * Sheets API error types
 */
export class SheetsApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string
  ) {
    super(message);
    this.name = 'SheetsApiError';
  }
}

/**
 * Make an authenticated API request to Google Sheets API
 * @param url API endpoint URL
 * @param options Fetch options
 * @returns API response
 */
const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  await waitForRateLimit();

  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new SheetsApiError('Not authenticated', 401, 'NOT_AUTHENTICATED');
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
      throw new SheetsApiError('Authentication revoked', 401, 'AUTH_REVOKED');
    }
    if (response.status === 404) {
      throw new SheetsApiError('Resource not found', 404, 'NOT_FOUND');
    }
    if (response.status === 429) {
      throw new SheetsApiError('Rate limit exceeded', 429, 'RATE_LIMITED');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new SheetsApiError(
      errorData.error?.message || `API error: ${response.status}`,
      response.status,
      'API_ERROR'
    );
  }

  return response;
};

/**
 * Get the current spreadsheet ID
 * @returns Spreadsheet ID or throws if not selected
 */
const getSpreadsheetId = (): string => {
  const sheet = getSelectedSheet() as { fileId: string | null; fileName: string | null; lastModified: string | null };
  if (!sheet.fileId) {
    throw new SheetsApiError(
      'No spreadsheet selected',
      400,
      'NO_SHEET_SELECTED'
    );
  }
  return sheet.fileId;
};

/**
 * Read data from a sheet range
 * @param range The A1 notation range (e.g., "Sheet1!A1:E10" or "Movements!A:F")
 * @param spreadsheetId Optional spreadsheet ID (uses selected sheet if not provided)
 * @returns Array of row arrays
 */
export const readSheet = async (
  range: string,
  spreadsheetId?: string
): Promise<SheetRow[]> => {
  if (!isAuthenticated()) {
    throw new SheetsApiError('Not authenticated', 401, 'NOT_AUTHENTICATED');
  }

  const sheetId = spreadsheetId || getSpreadsheetId();
  const encodedRange = encodeURIComponent(range);

  const response = await authenticatedFetch(
    `${SHEETS_API_BASE}/spreadsheets/${sheetId}/values/${encodedRange}`
  );

  const data = await response.json();
  return (data.values as SheetRow[]) || [];
};

/**
 * Write rows to a sheet range
 * @param range The A1 notation range
 * @param rows Array of row arrays to write
 * @param spreadsheetId Optional spreadsheet ID
 * @returns Updated range information
 */
export const writeRows = async (
  range: string,
  rows: SheetRow[],
  spreadsheetId?: string
): Promise<{ updatedRange: string; updatedRows: number }> => {
  if (!isAuthenticated()) {
    throw new SheetsApiError('Not authenticated', 401, 'NOT_AUTHENTICATED');
  }

  const sheetId = spreadsheetId || getSpreadsheetId();
  const encodedRange = encodeURIComponent(range);

  const response = await authenticatedFetch(
    `${SHEETS_API_BASE}/spreadsheets/${sheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  const data = await response.json();
  return {
    updatedRange: data.updatedRange,
    updatedRows: data.updatedRows || rows.length,
  };
};

/**
 * Append rows to a sheet
 * @param range The A1 notation range (table range)
 * @param rows Array of row arrays to append
 * @param spreadsheetId Optional spreadsheet ID
 * @returns Updated range information
 */
export const appendRows = async (
  range: string,
  rows: SheetRow[],
  spreadsheetId?: string
): Promise<{ updatedRange: string; updatedRows: number }> => {
  if (!isAuthenticated()) {
    throw new SheetsApiError('Not authenticated', 401, 'NOT_AUTHENTICATED');
  }

  const sheetId = spreadsheetId || getSpreadsheetId();
  const encodedRange = encodeURIComponent(range);

  const response = await authenticatedFetch(
    `${SHEETS_API_BASE}/spreadsheets/${sheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      body: JSON.stringify({
        values: rows,
      }),
    }
  );

  const data = await response.json();
  return {
    updatedRange: data.updates?.updatedRange || range,
    updatedRows: data.updates?.updatedRows || rows.length,
  };
};

/**
 * Batch write request item
 */
export interface BatchWriteRequest {
  /** The A1 notation range */
  range: string;
  /** The rows to write */
  rows: SheetRow[];
}

/**
 * Batch write multiple ranges at once
 * @param requests Array of write requests
 * @param spreadsheetId Optional spreadsheet ID
 * @returns Results for each batch request
 */
export const batchWrite = async (
  requests: BatchWriteRequest[],
  spreadsheetId?: string
): Promise<{ totalUpdatedRows: number; totalUpdatedCells: number }> => {
  if (!isAuthenticated()) {
    throw new SheetsApiError('Not authenticated', 401, 'NOT_AUTHENTICATED');
  }

  const sheetId = spreadsheetId || getSpreadsheetId();

  const response = await authenticatedFetch(
    `${SHEETS_API_BASE}/spreadsheets/${sheetId}/values:batchUpdate`,
    {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: requests.map((req) => ({
          range: req.range,
          values: req.rows,
        })),
      }),
    }
  );

  const data = await response.json();
  return {
    totalUpdatedRows: data.totalUpdatedRows || 0,
    totalUpdatedCells: data.totalUpdatedCells || 0,
  };
};

/**
 * Batch get multiple ranges at once
 * @param ranges Array of A1 notation ranges
 * @param spreadsheetId Optional spreadsheet ID
 * @returns Map of range to row arrays
 */
export const batchRead = async (
  ranges: string[],
  spreadsheetId?: string
): Promise<Map<string, SheetRow[]>> => {
  if (!isAuthenticated()) {
    throw new SheetsApiError('Not authenticated', 401, 'NOT_AUTHENTICATED');
  }

  const sheetId = spreadsheetId || getSpreadsheetId();
  const rangesParam = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join('&');

  const response = await authenticatedFetch(
    `${SHEETS_API_BASE}/spreadsheets/${sheetId}/values:batchGet?${rangesParam}`
  );

  const data = await response.json();
  const result = new Map<string, SheetRow[]>();

  if (data.valueRanges) {
    for (const valueRange of data.valueRanges) {
      result.set(valueRange.range, valueRange.values || []);
    }
  }

  return result;
};

/**
 * Find a row by ID in a sheet
 * @param sheetName Name of the sheet (e.g., "Movements")
 * @param id The ID to find
 * @param idColumnIndex Column index where ID is stored (0-based, default 0)
 * @param spreadsheetId Optional spreadsheet ID
 * @returns The row data and row number, or null if not found
 */
export const findById = async <T extends { id: string }>(
  sheetName: string,
  id: string,
  idColumnIndex: number = 0,
  spreadsheetId?: string
): Promise<{ row: SheetRow; rowNumber: number } | null> => {
  const range = `${sheetName}!A:Z`;
  const rows = await readSheet(range, spreadsheetId);

  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[idColumnIndex] === id) {
      return {
        row,
        rowNumber: i + 1, // 1-based row number for A1 notation
      };
    }
  }

  return null;
};

/**
 * Update or insert a row by ID
 * @param sheetName Name of the sheet
 * @param id The ID of the row
 * @param rowData The complete row data
 * @param idColumnIndex Column index where ID is stored (0-based, default 0)
 * @param spreadsheetId Optional spreadsheet ID
 * @returns Whether the operation was an update (true) or insert (false)
 */
export const upsertById = async (
  sheetName: string,
  id: string,
  rowData: SheetRow,
  idColumnIndex: number = 0,
  spreadsheetId?: string
): Promise<{ updated: boolean; rowNumber: number }> => {
  const existing = await findById(sheetName, id, idColumnIndex, spreadsheetId);

  if (existing) {
    // Update existing row
    const range = `${sheetName}!A${existing.rowNumber}`;
    await writeRows(range, [rowData], spreadsheetId);
    return { updated: true, rowNumber: existing.rowNumber };
  } else {
    // Append new row
    const range = `${sheetName}!A:A`;
    const result = await appendRows(range, [rowData], spreadsheetId);
    // Extract row number from updated range
    const match = result.updatedRange.match(/:(\d+)/);
    const rowNumber = match ? parseInt(match[1], 10) : -1;
    return { updated: false, rowNumber };
  }
};

/**
 * Delete a row by ID (sets all values to empty)
 * Note: Google Sheets API doesn't support direct row deletion via values API
 * This clears the row content but doesn't remove the row
 * @param sheetName Name of the sheet
 * @param id The ID of the row to delete
 * @param columnCount Number of columns to clear
 * @param idColumnIndex Column index where ID is stored
 * @param spreadsheetId Optional spreadsheet ID
 * @returns True if row was found and cleared
 */
export const deleteById = async (
  sheetName: string,
  id: string,
  columnCount: number = 10,
  idColumnIndex: number = 0,
  spreadsheetId?: string
): Promise<boolean> => {
  const existing = await findById(sheetName, id, idColumnIndex, spreadsheetId);

  if (!existing) {
    return false;
  }

  // Clear the row by writing empty values
  const emptyRow: SheetRow = new Array(columnCount).fill('');
  const range = `${sheetName}!A${existing.rowNumber}`;
  await writeRows(range, [emptyRow], spreadsheetId);
  return true;
};

/**
 * Clear rate limiter state (for testing)
 */
export const resetRateLimiter = (): void => {
  rateLimiterState.requestTimestamps = [];
  rateLimiterState.config = DEFAULT_RATE_LIMIT;
};
