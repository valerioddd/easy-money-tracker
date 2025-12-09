/**
 * useSheetGuard Hook
 * 
 * Monitors sheet access and handles errors related to sheet deletion/movement.
 * Provides recovery options when sheet access is lost.
 */

import { useCallback, useState } from 'react';
import { 
  getSelectedSheet, 
  verifySheetAccess, 
  duplicateMasterTemplate,
  clearSelectedSheet 
} from '../services/googleSheets';

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

    // Check if error is sheet-related
    if (
      errorMessage === 'FILE_NOT_FOUND' ||
      errorMessage === 'Resource not found' ||
      errorMessage.includes('404') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('No spreadsheet selected')
    ) {
      setSheetError('Sheet not found or deleted');
      
      // Trigger callback for sheet not found
      if (onSheetNotFound) {
        onSheetNotFound();
      }
    } else if (errorMessage.includes('TEMPLATE_NOT_FOUND')) {
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
    setSheetError(null);
    const isAccessible = await verifyAccess();
    
    if (isAccessible && sheetInfo.fileId && sheetInfo.fileName) {
      if (onSheetRecovered) {
        onSheetRecovered(sheetInfo.fileId, sheetInfo.fileName);
      }
    }
    
    return isAccessible;
  }, [verifyAccess, sheetInfo, onSheetRecovered]);

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
