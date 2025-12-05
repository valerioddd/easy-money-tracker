/**
 * AccountList Component
 *
 * Displays a list of accounts with edit and delete functionality.
 * Features:
 * - Shows account name, emoji, and balance
 * - Color-coded balances (positive/negative)
 * - Edit and delete actions
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';
import type { Account } from '../services/models';
import { formatBalance } from '../services/accountService';

interface AccountListProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function AccountList({
  accounts,
  onEdit,
  onDelete,
  isLoading = false,
  onRefresh,
}: AccountListProps) {
  // Confirm delete
  const confirmDelete = (account: Account) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account.name}"?\n\nBalance: ${formatBalance(account.balance)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(account.id),
        },
      ]
    );
  };

  // Render a single account item
  const renderAccountItem = ({ item }: { item: Account }) => {
    const isPositive = item.balance >= 0;

    return (
      <TouchableOpacity
        style={styles.accountItem}
        onPress={() => onEdit(item)}
        onLongPress={() => confirmDelete(item)}
        activeOpacity={0.7}
      >
        <View style={styles.accountLeft}>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{item.emoji}</Text>
          </View>
          <View style={styles.accountDetails}>
            <Text style={styles.accountName}>{item.name}</Text>
          </View>
        </View>
        <View style={styles.accountRight}>
          <Text
            style={[
              styles.balance,
              { color: isPositive ? colors.income : colors.expense },
            ]}
          >
            {formatBalance(item.balance)}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEdit(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => confirmDelete(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Calculate totals
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const positiveAccounts = accounts.filter((a) => a.balance >= 0);
  const negativeAccounts = accounts.filter((a) => a.balance < 0);

  if (accounts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🏦</Text>
        <Text style={styles.emptyTitle}>No accounts yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap the + button to add your first account
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={accounts}
      renderItem={renderAccountItem}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={styles.listContent}
      refreshing={isLoading}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{accounts.length}</Text>
            <Text style={styles.summaryLabel}>Accounts</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryValue,
                { color: totalBalance >= 0 ? colors.income : colors.expense },
              ]}
            >
              {formatBalance(totalBalance)}
            </Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: 100, // Space for FAB
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: typography.fontSizeXLarge,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  emoji: {
    fontSize: 24,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: typography.fontSizeLarge,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  accountRight: {
    alignItems: 'flex-end',
  },
  balance: {
    fontSize: typography.fontSizeXLarge,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  editButton: {
    padding: spacing.xs,
  },
  editButtonText: {
    fontSize: 14,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  deleteButtonText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSizeXLarge,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSizeMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
