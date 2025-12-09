/**
 * MovementScreen - Main screen for movement management
 *
 * Integrates MovementForm and MovementList for full CRUD functionality.
 * Features:
 * - Add new movements
 * - Edit existing movements
 * - Delete movements
 * - View movement list
 * - Sync status indicator
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, typography, borderRadius } from '../theme';
import { MovementForm, MovementList, CategoryForm, CategoryList, ErrorRecoveryDialog } from '../components';
import type { Movement, Category } from '../services/models';
import {
  loadCategories,
  loadMovements,
  createMovement,
  updateMovement,
  deleteMovement,
  getServiceState,
  processQueue,
  getCategories,
  getMovements,
  clearMovementState,
  updateCategory,
  createCategoryRecord,
  deleteCategory,
  clearQueue,
} from '../services/movementService';
import { getCurrentUser } from '../services/googleAuth';
import { getSelectedSheet, clearSelectedSheet } from '../services/googleSheets';
import { useAuthGuard, useSheetGuard } from '../hooks';

interface UserInfo {
  email?: string;
  name?: string;
  picture?: string;
}

interface SelectedSheet {
  fileId: string | null;
  fileName: string | null;
  lastModified: string | null;
}

interface MovementScreenProps {
  onChangeSheet?: () => void;
  onLogout?: () => void;
}

export default function MovementScreen({
  onChangeSheet,
  onLogout,
}: MovementScreenProps) {
  // State
  const [movements, setMovements] = useState<Movement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [syncStatus, setSyncStatus] = useState(getServiceState());
  const [error, setError] = useState<string | null>(null);
  
  // Category management state
  const [showCategories, setShowCategories] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Error recovery state
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorType, setErrorType] = useState<'auth_revoked' | 'sheet_not_found' | 'template_not_found'>('auth_revoked');
  const [errorDialogMessage, setErrorDialogMessage] = useState<string | undefined>(undefined);
  const [isRecovering, setIsRecovering] = useState(false);

  const user = getCurrentUser() as UserInfo | null;
  const selectedSheet = getSelectedSheet() as SelectedSheet;

  // Auth guard hook
  const { handleAuthError } = useAuthGuard({
    onAuthRevoked: () => {
      setErrorType('auth_revoked');
      setShowErrorDialog(true);
    },
  });

  // Sheet guard hook
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

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Update sync status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(getServiceState());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load categories and movements
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load categories first
      const loadedCategories = await loadCategories();
      setCategories(loadedCategories);

      // Then load movements
      const loadedMovements = await loadMovements();
      setMovements(loadedMovements);

      // Try to process any queued operations
      if (getServiceState().queueLength > 0) {
        await processQueue();
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to load data');
      const errorMessage = error.message;
      setError(errorMessage);
      
      // Handle specific error types
      handleAuthError(error);
      handleSheetError(error);
      
      // Only show alert if not handled by recovery dialogs
      if (
        !errorMessage.includes('AUTH_REVOKED') &&
        !errorMessage.includes('FILE_NOT_FOUND') &&
        !errorMessage.includes('not found')
      ) {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
      setSyncStatus(getServiceState());
    }
  };

  // Handle form submission
  const handleFormSubmit = async (
    data: Omit<Movement, 'id'> | Movement
  ) => {
    setIsSubmitting(true);

    try {
      if ('id' in data && data.id) {
        // Update existing movement
        await updateMovement(data as Movement);
      } else {
        // Create new movement
        await createMovement(data as Omit<Movement, 'id'>);
      }

      // Refresh the list
      setMovements(getMovements());
      setShowForm(false);
      setEditingMovement(null);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to save movement');
      const errorMessage = error.message;
      
      // Handle specific error types
      handleAuthError(error);
      handleSheetError(error);
      
      // Only show alert if not handled by recovery dialogs
      if (
        !errorMessage.includes('AUTH_REVOKED') &&
        !errorMessage.includes('FILE_NOT_FOUND') &&
        !errorMessage.includes('not found')
      ) {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsSubmitting(false);
      setSyncStatus(getServiceState());
    }
  };

  // Handle edit
  const handleEdit = (movement: Movement) => {
    setEditingMovement(movement);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteMovement(id);
      setMovements(getMovements());
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete movement';
      Alert.alert('Error', errorMessage);
    }
    setSyncStatus(getServiceState());
  };

  // Handle cancel form
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingMovement(null);
  };

  // Handle new movement
  const handleNewMovement = () => {
    setEditingMovement(null);
    setShowForm(true);
  };

  // Handle sheet change
  const handleChangeSheet = () => {
    // Clear queue on sheet switching
    clearQueue();
    clearMovementState();
    clearSelectedSheet();
    if (onChangeSheet) {
      onChangeSheet();
    }
  };

  // Handle logout
  const handleLogout = () => {
    clearMovementState();
    if (onLogout) {
      onLogout();
    }
  };

  // Error recovery handlers
  const handleReLogin = () => {
    setShowErrorDialog(false);
    handleLogout();
  };

  const handleRetrySheet = async () => {
    setIsRecovering(true);
    try {
      const success = await retryAccess();
      if (success) {
        setShowErrorDialog(false);
        await loadData();
      } else {
        setErrorDialogMessage('Sheet is still not accessible. Please try creating a new one.');
      }
    } catch (err) {
      setErrorDialogMessage('Failed to access sheet. Please try again.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleCreateNewSheet = async () => {
    setIsRecovering(true);
    try {
      await createNewSheet();
      setShowErrorDialog(false);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create new sheet';
      if (message.includes('TEMPLATE_NOT_FOUND')) {
        setErrorType('template_not_found');
        setErrorDialogMessage('The master template is not available. Please check your configuration.');
      } else {
        setErrorDialogMessage(message);
      }
    } finally {
      setIsRecovering(false);
    }
  };

  const handleDismissErrorDialog = () => {
    setShowErrorDialog(false);
    setErrorDialogMessage(undefined);
  };

  // Category management handlers
  const handleShowCategories = () => {
    setShowCategories(true);
  };

  const handleHideCategories = () => {
    setShowCategories(false);
    setShowCategoryForm(false);
    setEditingCategory(null);
    // Refresh categories after closing
    setCategories(getCategories());
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories(getCategories());
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleCategoryFormSubmit = async (
    data: Omit<Category, 'id'> | Category
  ) => {
    setIsSubmitting(true);
    try {
      if ('id' in data && data.id) {
        await updateCategory(data as Category);
      } else {
        await createCategoryRecord(data as Omit<Category, 'id'>);
      }
      setCategories(getCategories());
      setShowCategoryForm(false);
      setEditingCategory(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save category';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    setShowCategoryForm(true);
  };

  // Render sync status badge
  const renderSyncStatus = () => {
    if (syncStatus.queueLength > 0) {
      return (
        <View style={[styles.syncBadge, styles.syncPending]}>
          <Text style={styles.syncText}>
            {syncStatus.queueLength} pending
          </Text>
        </View>
      );
    }
    if (!syncStatus.isOnline) {
      return (
        <View style={[styles.syncBadge, styles.syncOffline]}>
          <Text style={styles.syncText}>Offline</Text>
        </View>
      );
    }
    return null;
  };

  // Render loading state
  if (isLoading && movements.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading movements...</Text>
      </View>
    );
  }

  // Calculate totals
  const totalIncome = movements
    .filter((m) => m.type === 'income')
    .reduce((sum, m) => sum + m.amount, 0);
  const totalExpense = movements
    .filter((m) => m.type === 'expense')
    .reduce((sum, m) => sum + m.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>
              Hello, {user?.name?.split(' ')[0] || 'User'}
            </Text>
            <Text style={styles.sheetName} numberOfLines={1}>
              {selectedSheet.fileName || 'My Tracker'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {renderSyncStatus()}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShowCategories}
            >
              <Text style={styles.headerButtonText}>📂</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleChangeSheet}
            >
              <Text style={styles.headerButtonText}>📄</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleLogout}
            >
              <Text style={styles.headerButtonText}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, { color: colors.income }]}>
              €{totalIncome.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Text style={styles.summaryLabel}>Expense</Text>
            <Text style={[styles.summaryValue, { color: colors.expense }]}>
              €{totalExpense.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.balanceCard]}>
            <Text style={styles.summaryLabel}>Balance</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: balance >= 0 ? colors.income : colors.expense },
              ]}
            >
              €{balance.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Error Banner */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={loadData}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorRetry}>Tap to retry</Text>
        </TouchableOpacity>
      )}

      {/* Movement List */}
      <MovementList
        movements={movements}
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        onRefresh={loadData}
      />

      {/* FAB - Add New Movement */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewMovement}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Movement Form Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelForm}
      >
        <MovementForm
          categories={categories}
          movement={editingMovement}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Categories Management Modal */}
      <Modal
        visible={showCategories}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleHideCategories}
      >
        <View style={styles.categoriesModal}>
          <StatusBar style="light" />
          
          {/* Categories Header */}
          <View style={styles.categoriesHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleHideCategories}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.categoriesTitle}>Categories</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Category List */}
          <CategoryList
            categories={categories}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
            isLoading={isLoading}
            onRefresh={loadData}
          />

          {/* FAB - Add New Category */}
          <TouchableOpacity
            style={styles.fab}
            onPress={handleNewCategory}
            activeOpacity={0.8}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>

          {/* Category Form Modal */}
          <Modal
            visible={showCategoryForm}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleCancelCategoryForm}
          >
            <CategoryForm
              category={editingCategory}
              onSubmit={handleCategoryFormSubmit}
              onCancel={handleCancelCategoryForm}
              isLoading={isSubmitting}
            />
          </Modal>
        </View>
      </Modal>

      {/* Error Recovery Dialog */}
      <ErrorRecoveryDialog
        visible={showErrorDialog}
        errorType={errorType}
        errorMessage={errorDialogMessage}
        isLoading={isRecovering}
        onRetry={handleRetrySheet}
        onCreateNew={handleCreateNewSheet}
        onReLogin={handleReLogin}
        onCancel={handleDismissErrorDialog}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSizeMedium,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: spacing.xl + spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.fontSizeXLarge,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  sheetName: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 200,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
  },
  headerButtonText: {
    fontSize: 18,
  },
  syncBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  syncPending: {
    backgroundColor: colors.warning,
  },
  syncOffline: {
    backgroundColor: colors.error,
  },
  syncText: {
    fontSize: typography.fontSizeSmall,
    color: colors.background,
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
  },
  incomeCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.income,
  },
  expenseCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.expense,
  },
  balanceCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  summaryLabel: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: typography.fontSizeMedium,
    fontWeight: 'bold',
  },
  errorBanner: {
    backgroundColor: colors.error,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMedium,
    flex: 1,
  },
  errorRetry: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSmall,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 32,
    color: colors.textPrimary,
    fontWeight: '300',
    lineHeight: 36,
  },
  categoriesModal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingTop: spacing.xl + spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  categoriesTitle: {
    fontSize: typography.fontSizeTitle,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
});
