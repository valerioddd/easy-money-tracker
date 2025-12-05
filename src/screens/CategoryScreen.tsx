/**
 * CategoryScreen - Screen for category management
 *
 * Integrates CategoryForm and CategoryList for full CRUD functionality.
 * Features:
 * - Add new categories
 * - Edit existing categories (name/color only)
 * - Delete categories (blocked if in use)
 * - Type is fixed and cannot be changed
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
import { CategoryForm, CategoryList } from '../components';
import type { Category } from '../services/models';
import {
  loadCategories,
  loadMovements,
  getCategories,
  updateCategory,
  createCategoryRecord,
  deleteCategory,
  getServiceState,
} from '../services/movementService';

interface CategoryScreenProps {
  onBack?: () => void;
}

export default function CategoryScreen({ onBack }: CategoryScreenProps) {
  // State
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load categories and movements (for usage check)
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load categories
      const loadedCategories = await loadCategories();
      setCategories(loadedCategories);

      // Also load movements for usage check
      await loadMovements();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (
    data: Omit<Category, 'id'> | Category
  ) => {
    setIsSubmitting(true);

    try {
      if ('id' in data && data.id) {
        // Update existing category
        await updateCategory(data as Category);
      } else {
        // Create new category
        await createCategoryRecord(data as Omit<Category, 'id'>);
      }

      // Refresh the list
      setCategories(getCategories());
      setShowForm(false);
      setEditingCategory(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save category';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories(getCategories());
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category';
      Alert.alert('Error', errorMessage);
    }
  };

  // Handle cancel form
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  // Handle new category
  const handleNewCategory = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  // Render loading state
  if (isLoading && categories.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {onBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Categories</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Error Banner */}
      {error && (
        <TouchableOpacity style={styles.errorBanner} onPress={loadData}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorRetry}>Tap to retry</Text>
        </TouchableOpacity>
      )}

      {/* Category List */}
      <CategoryList
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
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
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancelForm}
      >
        <CategoryForm
          category={editingCategory}
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
    alignItems: 'center',
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
    width: 40, // Match back button width for centering
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
