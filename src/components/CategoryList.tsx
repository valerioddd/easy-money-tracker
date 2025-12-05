/**
 * CategoryList Component
 *
 * Displays a list of categories with edit and delete functionality.
 * Features:
 * - Color-coded categories
 * - Type indicator (income/expense/both)
 * - Delete blocked if in use (with alert)
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
import type { Category, CategoryTypeFixed } from '../services/models';
import { canDeleteCategory } from '../services/movementService';

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const TYPE_ICONS: Record<CategoryTypeFixed, string> = {
  income: '↑',
  expense: '↓',
  both: '↕',
};

const TYPE_LABELS: Record<CategoryTypeFixed, string> = {
  income: 'Income',
  expense: 'Expense',
  both: 'Both',
};

export default function CategoryList({
  categories,
  onEdit,
  onDelete,
  isLoading = false,
  onRefresh,
}: CategoryListProps) {
  // Confirm delete with usage check
  const confirmDelete = (category: Category) => {
    const usageCheck = canDeleteCategory(category.id);

    if (!usageCheck.canDelete) {
      Alert.alert(
        'Cannot Delete Category',
        `"${category.name}" is used by ${usageCheck.usageCount} movement(s).\n\nPlease edit those movements to use a different category before deleting this one.`,
        [
          {
            text: 'Edit Category Instead',
            onPress: () => onEdit(category),
          },
          { text: 'OK', style: 'cancel' },
        ]
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(category.id),
        },
      ]
    );
  };

  // Render a single category item
  const renderCategoryItem = ({ item }: { item: Category }) => {
    const usageCheck = canDeleteCategory(item.id);
    const isInUse = !usageCheck.canDelete;

    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => onEdit(item)}
        onLongPress={() => confirmDelete(item)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryLeft}>
          <View
            style={[
              styles.colorIndicator,
              { backgroundColor: item.color },
            ]}
          />
          <View style={styles.categoryDetails}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <View style={styles.categoryMeta}>
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor:
                      item.typeFixed === 'income'
                        ? colors.income + '30'
                        : item.typeFixed === 'expense'
                        ? colors.expense + '30'
                        : colors.primary + '30',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typeText,
                    {
                      color:
                        item.typeFixed === 'income'
                          ? colors.income
                          : item.typeFixed === 'expense'
                          ? colors.expense
                          : colors.primary,
                    },
                  ]}
                >
                  {TYPE_ICONS[item.typeFixed]} {TYPE_LABELS[item.typeFixed]}
                </Text>
              </View>
              {isInUse && (
                <Text style={styles.usageText}>
                  {usageCheck.usageCount} movement{usageCheck.usageCount !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
        </View>
        <View style={styles.categoryRight}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deleteButton,
              isInUse && styles.deleteButtonDisabled,
            ]}
            onPress={() => confirmDelete(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={[
                styles.deleteButtonText,
                isInUse && styles.deleteButtonTextDisabled,
              ]}
            >
              🗑️
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Group categories by type
  const incomeCategories = categories.filter((c) => c.typeFixed === 'income');
  const expenseCategories = categories.filter((c) => c.typeFixed === 'expense');
  const bothCategories = categories.filter((c) => c.typeFixed === 'both');

  if (categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📂</Text>
        <Text style={styles.emptyTitle}>No categories yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap the + button to add your first category
        </Text>
      </View>
    );
  }

  // Render section header
  const renderSectionHeader = (title: string, count: number) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
    </View>
  );

  return (
    <FlatList
      data={categories}
      renderItem={renderCategoryItem}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={styles.listContent}
      refreshing={isLoading}
      onRefresh={onRefresh}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.income }]}>
              {incomeCategories.length}
            </Text>
            <Text style={styles.summaryLabel}>Income</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.expense }]}>
              {expenseCategories.length}
            </Text>
            <Text style={styles.summaryLabel}>Expense</Text>
          </View>
          {bothCategories.length > 0 && (
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {bothCategories.length}
              </Text>
              <Text style={styles.summaryLabel}>Both</Text>
            </View>
          )}
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
  },
  summaryLabel: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceVariant,
  },
  sectionTitle: {
    fontSize: typography.fontSizeMedium,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionCount: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 16,
    height: 40,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: typography.fontSizeLarge,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 4,
  },
  categoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    fontSize: typography.fontSizeSmall,
    fontWeight: '500',
  },
  usageText: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  editButton: {
    padding: spacing.xs,
  },
  editButtonText: {
    fontSize: 18,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  deleteButtonTextDisabled: {
    opacity: 0.5,
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
