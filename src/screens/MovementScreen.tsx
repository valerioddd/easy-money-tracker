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
import { MovementForm, MovementList } from '../components';
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
} from '../services/movementService';
import { getCurrentUser } from '../services/googleAuth';
import { getSelectedSheet, clearSelectedSheet } from '../services/googleSheets';

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

  const user = getCurrentUser() as UserInfo | null;
  const selectedSheet = getSelectedSheet() as SelectedSheet;

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
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to save movement';
      Alert.alert('Error', errorMessage);
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
});
