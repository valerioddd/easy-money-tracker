/**
 * AccountScreen - Screen for account management
 *
 * Integrates AccountForm, AccountList, and NetWorthHeader.
 * Features:
 * - Add new accounts
 * - Edit existing accounts
 * - Delete accounts
 * - View account list with net worth
 * - Balance changes are tracked in Assets history
 */

import React, { useState, useEffect } from 'react';
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
import { AccountForm, AccountList, NetWorthHeader } from '../components';
import type { Account } from '../services/models';
import {
  loadAccounts,
  loadAssets,
  createAccount,
  updateAccount,
  deleteAccount,
  computeNetWorth,
  getAccounts,
  getAccountServiceState,
  clearAccountState,
} from '../services/accountService';

interface AccountScreenProps {
  onBack?: () => void;
}

export default function AccountScreen({ onBack }: AccountScreenProps) {
  // State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load accounts and assets
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load accounts
      const loadedAccounts = await loadAccounts();
      setAccounts(loadedAccounts);

      // Also load assets for history tracking
      await loadAssets();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (data: Omit<Account, 'id'> | Account) => {
    setIsSubmitting(true);

    try {
      if ('id' in data && data.id) {
        // Update existing account
        await updateAccount(data as Account);
      } else {
        // Create new account
        await createAccount(data as Omit<Account, 'id'>);
      }

      // Refresh the list
      setAccounts(getAccounts());
      setShowForm(false);
      setEditingAccount(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save account';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteAccount(id);
      setAccounts(getAccounts());
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account';
      Alert.alert('Error', errorMessage);
    }
  };

  // Handle cancel form
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  // Handle new account
  const handleNewAccount = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  // Handle back
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  // Calculate net worth
  const netWorth = computeNetWorth();

  // Render loading state
  if (isLoading && accounts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading accounts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Accounts</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Net Worth Header */}
      <NetWorthHeader netWorth={netWorth} accountCount={accounts.length} />

      {/* Error Banner */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={loadData}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorRetry}>Tap to retry</Text>
        </TouchableOpacity>
      )}

      {/* Account List */}
      <AccountList
        accounts={accounts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        onRefresh={loadData}
      />

      {/* FAB - Add New Account */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewAccount}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Account Form Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelForm}
      >
        <AccountForm
          account={editingAccount}
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
  title: {
    fontSize: typography.fontSizeTitle,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
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
