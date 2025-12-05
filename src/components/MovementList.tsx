/**
 * MovementList Component
 *
 * Displays a list of movements with edit and delete functionality.
 * Features:
 * - Grouped by date
 * - Color-coded by income/expense
 * - Swipe or tap to edit/delete
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
import type { Movement, Category } from '../services/models';
import { formatAmount } from '../services/movementService';

interface MovementListProps {
  movements: Movement[];
  categories: Category[];
  onEdit: (movement: Movement) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

interface GroupedMovements {
  date: string;
  dateFormatted: string;
  movements: Movement[];
  totalIncome: number;
  totalExpense: number;
}

export default function MovementList({
  movements,
  categories,
  onEdit,
  onDelete,
  isLoading = false,
  onRefresh,
}: MovementListProps) {
  // Get category by ID
  const getCategoryById = (id: string): Category | undefined => {
    return categories.find((c) => c.id === id);
  };

  // Format date for display
  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (isoDate === today.toISOString().split('T')[0]) {
      return 'Today';
    }
    if (isoDate === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday';
    }

    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Group movements by date
  const groupMovementsByDate = (): GroupedMovements[] => {
    const groups: Map<string, GroupedMovements> = new Map();

    for (const movement of movements) {
      const date = movement.dateISO;
      if (!groups.has(date)) {
        groups.set(date, {
          date,
          dateFormatted: formatDate(date),
          movements: [],
          totalIncome: 0,
          totalExpense: 0,
        });
      }

      const group = groups.get(date)!;
      group.movements.push(movement);

      if (movement.type === 'income') {
        group.totalIncome += movement.amount;
      } else {
        group.totalExpense += movement.amount;
      }
    }

    // Sort by date descending
    return Array.from(groups.values()).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  };

  // Confirm delete
  const confirmDelete = (movement: Movement) => {
    const category = getCategoryById(movement.categoryId);
    Alert.alert(
      'Delete Movement',
      `Are you sure you want to delete this ${movement.type}?\n\n${
        category?.name || 'Unknown'
      }: ${formatAmount(movement.amount)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(movement.id),
        },
      ]
    );
  };

  // Render a single movement item
  const renderMovementItem = (movement: Movement) => {
    const category = getCategoryById(movement.categoryId);
    const isIncome = movement.type === 'income';

    return (
      <TouchableOpacity
        key={movement.id}
        style={styles.movementItem}
        onPress={() => onEdit(movement)}
        onLongPress={() => confirmDelete(movement)}
        activeOpacity={0.7}
      >
        <View style={styles.movementLeft}>
          <View
            style={[
              styles.categoryDot,
              { backgroundColor: category?.color || colors.textSecondary },
            ]}
          />
          <View style={styles.movementDetails}>
            <Text style={styles.categoryName}>
              {category?.name || 'Unknown Category'}
            </Text>
            {movement.description ? (
              <Text style={styles.description} numberOfLines={1}>
                {movement.description}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.movementRight}>
          <Text
            style={[
              styles.amount,
              { color: isIncome ? colors.income : colors.expense },
            ]}
          >
            {isIncome ? '+' : '-'}{formatAmount(movement.amount)}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEdit(movement)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => confirmDelete(movement)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render a date group
  const renderDateGroup = ({ item }: { item: GroupedMovements }) => {
    const netAmount = item.totalIncome - item.totalExpense;
    const netColor =
      netAmount > 0 ? colors.income : netAmount < 0 ? colors.expense : colors.textSecondary;

    return (
      <View style={styles.dateGroup}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{item.dateFormatted}</Text>
          <View style={styles.dateTotals}>
            {item.totalIncome > 0 && (
              <Text style={[styles.totalText, { color: colors.income }]}>
                +{formatAmount(item.totalIncome)}
              </Text>
            )}
            {item.totalExpense > 0 && (
              <Text style={[styles.totalText, { color: colors.expense }]}>
                -{formatAmount(item.totalExpense)}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.movementsList}>
          {item.movements.map(renderMovementItem)}
        </View>
      </View>
    );
  };

  const groupedMovements = groupMovementsByDate();

  if (movements.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyTitle}>No movements yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap the + button to add your first transaction
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={groupedMovements}
      renderItem={renderDateGroup}
      keyExtractor={(item) => item.date}
      style={styles.container}
      contentContainerStyle={styles.listContent}
      refreshing={isLoading}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
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
  dateGroup: {
    marginBottom: spacing.lg,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceVariant,
  },
  dateText: {
    fontSize: typography.fontSizeMedium,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dateTotals: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  totalText: {
    fontSize: typography.fontSizeSmall,
    fontWeight: '500',
  },
  movementsList: {
    backgroundColor: colors.surface,
  },
  movementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  movementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  movementDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: typography.fontSizeMedium,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  description: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  movementRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: typography.fontSizeLarge,
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
