/**
 * useSheetGuard Hook
 * 
 * Monitors sheet access and handles errors related to sheet deletion/movement.
 * Provides recovery options when sheet access is lost.
 */

import { useCallback, useState, useEffect } from 'react';
import { 
  getSelectedSheet, 
  verifySheetAccess, 
  duplicateMasterTemplate,
  clearSelectedSheet 
} from '../services/googleSheets';
import { isSheetError, isTemplateError } from '../utils/errorDetection';

interface SheetGuardOptions {
  /** Callback when sheet is not found or inaccessible */
  onSheetNotFound?: () => void;
  /** Callback when sheet is successfully recovered */
  onSheetRecovered?: (fileId: string, fileName: string) => void;
}

interface SheetGuardReturn {
  /** Whether a sheet is currently selected */
  hasSheet: boolean;
  /** Current sheet info */
  sheetInfo: {
    fileId: string | null;
    fileName: string | null;
  };
  /** Check if current sheet is accessible */
  verifyAccess: () => Promise<boolean>;
  /** Handle sheet-related errors */
  handleSheetError: (error: Error) => void;
  /** Create new sheet from master template */
  createNewSheet: (name?: string) => Promise<{ id: string; name: string }>;
  /** Retry accessing current sheet */
  retryAccess: () => Promise<boolean>;
  /** Current error state */
  sheetError: string | null;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Custom hook for guarding against sheet access failures
 * 
 * @param options - Configuration options
 * @returns Sheet guard state and handlers
 * 
 * @example
 * ```tsx
 * const { handleSheetError, retryAccess, createNewSheet } = useSheetGuard({
 *   onSheetNotFound: () => showRecoveryDialog()
 * });
 * 
 * try {
 *   await loadMovements();
 * } catch (error) {
 *   handleSheetError(error);
 * }
 * ```
 */
export function useSheetGuard(options: SheetGuardOptions = {}): SheetGuardReturn {
  const { onSheetNotFound, onSheetRecovered } = options;

  const [sheetError, setSheetError] = useState<string | null>(null);
  const [sheetInfo, setSheetInfo] = useState(() => {
    const sheet = getSelectedSheet();
    return {
      fileId: sheet.fileId,
      fileName: sheet.fileName,
    };
  });

  /**
   * Update sheet info when selected sheet changes
   */
  useEffect(() => {
    const sheet = getSelectedSheet();
    setSheetInfo({
      fileId: sheet.fileId,
      fileName: sheet.fileName,
    });
  }, []);

  /**
   * Verify that the current sheet is accessible
   */
  const verifyAccess = useCallback(async (): Promise<boolean> => {
    const sheet = getSelectedSheet();
    
    if (!sheet.fileId) {
      setSheetError('No sheet selected');
      return false;
    }

    try {
      const isAccessible = await verifySheetAccess(sheet.fileId);
      
      if (!isAccessible) {
        setSheetError('Sheet not found or inaccessible');
        if (onSheetNotFound) {
          onSheetNotFound();
        }
        return false;
      }

      setSheetError(null);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setSheetError(message);
      return false;
    }
  }, [onSheetNotFound]);

  /**
   * Handle sheet-related errors
   */
  const handleSheetError = useCallback((error: Error) => {
    const errorMessage = error.message;

    // Check if error is sheet-related using utility functions
    if (isSheetError(error)) {
      setSheetError('Sheet not found or deleted');
      
      // Trigger callback for sheet not found
      if (onSheetNotFound) {
        onSheetNotFound();
      }
    } else if (isTemplateError(error)) {
      setSheetError('Master template not found');
    } else {
      // Generic sheet error
      setSheetError(errorMessage);
    }
  }, [onSheetNotFound]);

  /**
   * Retry accessing the current sheet
   */
  const retryAccess = useCallback(async (): Promise<boolean> => {
    const hadError = sheetError !== null;
    setSheetError(null);
    const isAccessible = await verifyAccess();
    
    // Only trigger recovery callback if we had an error and now recovered
    if (isAccessible && hadError && sheetInfo.fileId && sheetInfo.fileName) {
      if (onSheetRecovered) {
        onSheetRecovered(sheetInfo.fileId, sheetInfo.fileName);
      }
    }
    
    return isAccessible;
  }, [verifyAccess, sheetInfo, sheetError, onSheetRecovered]);

  /**
   * Create a new sheet from the master template
   */
  const createNewSheet = useCallback(async (name?: string): Promise<{ id: string; name: string }> => {
    try {
      setSheetError(null);
      const newSheet = await duplicateMasterTemplate(undefined, name);
      
      // Update local state
      setSheetInfo({
        fileId: newSheet.id,
        fileName: newSheet.name,
      });

      // Notify about recovery
      if (onSheetRecovered) {
        onSheetRecovered(newSheet.id, newSheet.name);
      }

      return newSheet;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create sheet';
      setSheetError(message);
      throw error;
    }
  }, [onSheetRecovered]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setSheetError(null);
  }, []);

  return {
    hasSheet: !!sheetInfo.fileId,
    sheetInfo,
    verifyAccess,
    handleSheetError,
    createNewSheet,
    retryAccess,
    sheetError,
    clearError,
  };
}
