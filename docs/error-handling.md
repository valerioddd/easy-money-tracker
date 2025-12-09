# Error Handling and Recovery Documentation

This document describes the error handling and recovery mechanisms implemented in Easy Money Tracker.

## Overview

The application implements robust error handling to gracefully manage common failure scenarios:

1. **Authentication Errors** - When Google permissions are revoked
2. **Sheet Access Errors** - When the selected spreadsheet is moved or deleted
3. **Network/API Errors** - When connectivity or API limits are encountered

## Features

### 1. Authentication Guard (`useAuthGuard`)

Monitors authentication state and handles permission revocation.

#### Usage

```typescript
import { useAuthGuard } from '../hooks';

const { handleAuthError } = useAuthGuard({
  onAuthRevoked: () => {
    // Navigate to login or show re-login dialog
    showReLoginDialog();
  },
});

// In your data fetching code
try {
  await loadMovements();
} catch (error) {
  handleAuthError(error); // Automatically detects auth errors
}
```

#### Detection

The auth guard detects the following error conditions:
- Error message contains `"AUTH_REVOKED"`
- Error message contains `"Not authenticated"`
- HTTP 401 status codes
- Message contains `"Authentication revoked"`

#### Behavior

When authentication is revoked:
1. Clears the in-memory auth state
2. Triggers the `onAuthRevoked` callback
3. Shows a re-login dialog prompting the user to authenticate again

### 2. Sheet Guard (`useSheetGuard`)

Monitors sheet access and provides recovery options when sheets are moved or deleted.

#### Usage

```typescript
import { useSheetGuard } from '../hooks';

const { 
  handleSheetError, 
  retryAccess, 
  createNewSheet 
} = useSheetGuard({
  onSheetNotFound: () => {
    // Show recovery options dialog
    showSheetRecoveryDialog();
  },
  onSheetRecovered: (fileId, fileName) => {
    // Reload data with recovered/new sheet
    loadData();
  },
});

// In your data fetching code
try {
  await loadMovements();
} catch (error) {
  handleSheetError(error); // Automatically detects sheet errors
}
```

#### Detection

The sheet guard detects the following error conditions:
- Error message contains `"FILE_NOT_FOUND"`
- Error message contains `"Resource not found"`
- HTTP 404 status codes
- Message contains `"not found"`
- Message contains `"No spreadsheet selected"`

#### Recovery Options

**Option 1: Retry Access**
```typescript
const success = await retryAccess();
if (success) {
  // Sheet is accessible again, reload data
  await loadData();
}
```

**Option 2: Create New Sheet**
```typescript
const newSheet = await createNewSheet('My New Tracker');
// Automatically selects the new sheet
// onSheetRecovered callback is triggered
```

### 3. Error Recovery Dialog

A modal dialog component that provides a consistent UX for error recovery scenarios.

#### Error Types

**Auth Revoked**
- **Title**: "Permission Revoked"
- **Message**: "Your Google account permissions have been revoked. Please log in again to continue."
- **Actions**: 
  - Re-Login button (primary)

**Sheet Not Found**
- **Title**: "Sheet Not Found"
- **Message**: "The selected spreadsheet was moved or deleted. You can try to access it again or create a new one from the master template."
- **Actions**: 
  - Retry button (secondary)
  - Create New button (primary)

**Template Not Found**
- **Title**: "Template Not Available"
- **Message**: "The master template spreadsheet is not available. Please contact support or check your configuration."
- **Actions**: 
  - Close button (secondary)

#### Usage Example

```typescript
import { ErrorRecoveryDialog } from '../components';

<ErrorRecoveryDialog
  visible={showErrorDialog}
  errorType="sheet_not_found"
  errorMessage="Custom error message"
  isLoading={isRecovering}
  onRetry={handleRetrySheet}
  onCreateNew={handleCreateNewSheet}
  onReLogin={handleReLogin}
  onCancel={handleDismiss}
/>
```

## Queue Management

### Clearing Queue on Sheet Switch

When users switch to a different spreadsheet, the temporary operation queue is cleared to prevent operations from being applied to the wrong sheet.

```typescript
import { clearQueue } from '../services/movementService';

const handleChangeSheet = () => {
  // Clear queue to prevent operations on wrong sheet
  clearQueue();
  clearMovementState();
  clearSelectedSheet();
  navigateToSheetSelection();
};
```

### Queue State

The queue stores pending operations when offline:
- `create` - New movements to be created
- `update` - Movement updates to be applied
- `delete` - Movements to be deleted

**Important**: The queue is intentionally cleared when:
1. User switches to a different sheet
2. User logs out
3. Application is restarted (no persistence)

## Security Considerations

### Token Storage

Tokens are stored **in-memory only** (not persisted):

```javascript
// googleAuth.js
let authState = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  user: null,
};
```

**Why in-memory only?**
- Reduces security risk - tokens are cleared when app is closed
- Follows principle of least persistence
- Forces re-authentication on app restart for better security

### No Data Persistence

User data (movements, categories, etc.) is **not persisted locally**:
- All data lives in Google Sheets
- In-memory cache only for current session
- Queue is temporary and cleared on logout/sheet switch

## Error Handling Best Practices

### 1. Always Use Error Guards

```typescript
// ✅ Good - Uses error guards
try {
  await loadMovements();
} catch (error) {
  handleAuthError(error);
  handleSheetError(error);
  // Only show generic alert if not handled by guards
  if (!isHandledByGuard(error)) {
    Alert.alert('Error', error.message);
  }
}

// ❌ Bad - No error guards
try {
  await loadMovements();
} catch (error) {
  Alert.alert('Error', error.message);
}
```

### 2. Provide Clear User Feedback

```typescript
// ✅ Good - Clear, actionable message
setErrorDialogMessage(
  'The selected spreadsheet was moved or deleted. ' +
  'You can try to access it again or create a new one.'
);

// ❌ Bad - Technical error message
setErrorDialogMessage('HTTP 404 NOT_FOUND');
```

### 3. Handle Loading States

```typescript
const [isRecovering, setIsRecovering] = useState(false);

const handleRetry = async () => {
  setIsRecovering(true);
  try {
    await retryAccess();
  } finally {
    setIsRecovering(false);
  }
};
```

## Testing Error Scenarios

### Simulating Auth Revocation

1. Revoke app access in Google Account settings
2. Try to perform an operation in the app
3. Verify re-login dialog appears

### Simulating Sheet Deletion

1. Delete or move the selected spreadsheet in Google Drive
2. Try to load data in the app
3. Verify recovery dialog with Retry/Create New options

### Simulating Template Missing

1. Configure an invalid `MASTER_TEMPLATE_ID`
2. Try to create a new sheet
3. Verify appropriate error message

## Integration Guide

To integrate error handling in a new screen:

```typescript
import { useAuthGuard, useSheetGuard } from '../hooks';
import { ErrorRecoveryDialog } from '../components';

function MyScreen() {
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorType, setErrorType] = useState('auth_revoked');

  const { handleAuthError } = useAuthGuard({
    onAuthRevoked: () => {
      setErrorType('auth_revoked');
      setShowErrorDialog(true);
    },
  });

  const { handleSheetError, retryAccess, createNewSheet } = useSheetGuard({
    onSheetNotFound: () => {
      setErrorType('sheet_not_found');
      setShowErrorDialog(true);
    },
    onSheetRecovered: () => {
      setShowErrorDialog(false);
      loadData();
    },
  });

  const loadData = async () => {
    try {
      await someOperation();
    } catch (error) {
      handleAuthError(error);
      handleSheetError(error);
    }
  };

  return (
    <View>
      {/* Your screen content */}
      
      <ErrorRecoveryDialog
        visible={showErrorDialog}
        errorType={errorType}
        onRetry={retryAccess}
        onCreateNew={createNewSheet}
        onReLogin={() => { /* navigate to login */ }}
        onCancel={() => setShowErrorDialog(false)}
      />
    </View>
  );
}
```

## API Reference

### `useAuthGuard(options)`

**Options:**
- `onAuthRevoked?: () => void` - Callback when auth is revoked
- `enablePolling?: boolean` - Enable periodic auth checks (default: false)
- `pollingInterval?: number` - Polling interval in ms (default: 30000)

**Returns:**
- `isAuthenticated: boolean` - Current auth state
- `checkAuth: () => boolean` - Manual auth check
- `handleAuthError: (error: Error) => void` - Error handler

### `useSheetGuard(options)`

**Options:**
- `onSheetNotFound?: () => void` - Callback when sheet not found
- `onSheetRecovered?: (fileId: string, fileName: string) => void` - Callback on recovery

**Returns:**
- `hasSheet: boolean` - Whether sheet is selected
- `sheetInfo: { fileId: string | null; fileName: string | null }` - Current sheet
- `verifyAccess: () => Promise<boolean>` - Check sheet accessibility
- `handleSheetError: (error: Error) => void` - Error handler
- `createNewSheet: (name?: string) => Promise<{ id: string; name: string }>` - Create new
- `retryAccess: () => Promise<boolean>` - Retry access
- `sheetError: string | null` - Current error
- `clearError: () => void` - Clear error

### `clearQueue()`

Clears the temporary operation queue.

**Usage:**
```typescript
import { clearQueue } from '../services/movementService';

clearQueue(); // Clears all pending operations
```

## Troubleshooting

### Dialog Not Showing

Check that:
1. Error handlers are being called
2. Error type is being set correctly
3. `visible` prop is set to `true`

### Errors Not Being Detected

Verify that:
1. Error messages match detection patterns
2. Error is actually an Error instance
3. Guards are being called in catch blocks

### Queue Not Clearing

Ensure:
1. `clearQueue()` is called before sheet switch
2. No errors in the clear operation
3. State is properly reset
