/**
 * CategoryForm Component
 *
 * Form for adding/editing categories.
 * Features:
 * - Name input (editable)
 * - Color picker (editable)
 * - Type display (fixed, not editable)
 * - Validations: name required, valid hex color
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';
import type { Category, CategoryTypeFixed } from '../services/models';
import { isValidHexColor } from '../services/models';

interface CategoryFormProps {
  category?: Category | null;
  onSubmit: (data: Omit<Category, 'id'> | Category) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const PRESET_COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7',
  '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
  '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
  '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
  '#795548', '#9E9E9E', '#607D8B',
];

const TYPE_LABELS: Record<CategoryTypeFixed, string> = {
  income: 'Income',
  expense: 'Expense',
  both: 'Both',
};

export default function CategoryForm({
  category,
  onSubmit,
  onCancel,
  isLoading = false,
}: CategoryFormProps) {
  const isEditing = !!category;

  // Form state
  const [name, setName] = useState<string>(category?.name || '');
  const [color, setColor] = useState<string>(category?.color || '#6C63FF');
  const [typeFixed] = useState<CategoryTypeFixed>(
    category?.typeFixed || 'expense'
  );
  const [errors, setErrors] = useState<string[]>([]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!name.trim()) {
      newErrors.push('Category name is required');
    }

    if (!isValidHexColor(color)) {
      newErrors.push('Invalid color format. Expected hex color (e.g., #FF5733)');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validate()) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    if (category && category.id) {
      // Update existing category
      onSubmit({
        id: category.id,
        name: name.trim(),
        color,
        typeFixed: category.typeFixed, // Keep original type
      });
    } else {
      // Create new category
      onSubmit({
        name: name.trim(),
        color,
        typeFixed,
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {isEditing ? 'Edit Category' : 'New Category'}
      </Text>

      {/* Name Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Category name"
          placeholderTextColor={colors.textDisabled}
          editable={!isLoading}
          autoCapitalize="words"
        />
      </View>

      {/* Type Section (Display Only) */}
      <View style={styles.section}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeContainer}>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor:
                  typeFixed === 'income'
                    ? colors.income
                    : typeFixed === 'expense'
                    ? colors.expense
                    : colors.primary,
              },
            ]}
          >
            <Text style={styles.typeBadgeText}>
              {TYPE_LABELS[typeFixed]}
            </Text>
          </View>
          {isEditing && (
            <Text style={styles.typeNote}>
              Type cannot be changed after creation
            </Text>
          )}
        </View>
      </View>

      {/* Color Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colorPreview}>
          <View
            style={[
              styles.colorSwatch,
              { backgroundColor: isValidHexColor(color) ? color : '#000000' },
            ]}
          />
          <TextInput
            style={styles.colorInput}
            value={color}
            onChangeText={setColor}
            placeholder="#000000"
            placeholderTextColor={colors.textDisabled}
            editable={!isLoading}
            autoCapitalize="characters"
            maxLength={7}
          />
        </View>
        <View style={styles.colorPalette}>
          {PRESET_COLORS.map((presetColor) => (
            <TouchableOpacity
              key={presetColor}
              style={[
                styles.paletteColor,
                { backgroundColor: presetColor },
                color === presetColor && styles.paletteColorSelected,
              ]}
              onPress={() => setColor(presetColor)}
              disabled={isLoading}
            />
          ))}
        </View>
      </View>

      {/* Error Messages */}
      {errors.length > 0 && (
        <View style={styles.errorContainer}>
          {errors.map((error, index) => (
            <Text key={index} style={styles.errorText}>
              • {error}
            </Text>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!name.trim() || isLoading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!name.trim() || isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Add Category'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizeTitle,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSizeMedium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    fontSize: typography.fontSizeLarge,
    color: colors.textPrimary,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  typeBadgeText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMedium,
    fontWeight: 'bold',
  },
  typeNote: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    fontStyle: 'italic',
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  colorInput: {
    flex: 1,
    fontSize: typography.fontSizeLarge,
    color: colors.textPrimary,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  paletteColor: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paletteColorSelected: {
    borderColor: colors.textPrimary,
  },
  errorContainer: {
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSizeSmall,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeLarge,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.surfaceVariant,
  },
  submitButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeLarge,
    fontWeight: '600',
  },
});
