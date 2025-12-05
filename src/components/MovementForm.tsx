/**
 * MovementForm Component
 *
 * Form for adding/editing movements.
 * Features:
 * - Amount picker with default 10.00€
 * - Category selector (required)
 * - Date picker with default today
 * - Optional description
 * - Type deduced from category
 * - Validations: amount > 0, category required
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';
import type { Movement, Category, MovementType } from '../services/models';
import {
  getTodayISO,
  formatAmount,
  parseAmount,
  validateMovementData,
  deriveTypeFromCategory,
} from '../services/movementService';

interface MovementFormProps {
  categories: Category[];
  movement?: Movement | null;
  onSubmit: (data: Omit<Movement, 'id'> | Movement) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DEFAULT_AMOUNT = 10.0;

export default function MovementForm({
  categories,
  movement,
  onSubmit,
  onCancel,
  isLoading = false,
}: MovementFormProps) {
  const isEditing = !!movement;

  // Form state
  const [amount, setAmount] = useState<string>(
    movement ? movement.amount.toString() : DEFAULT_AMOUNT.toString()
  );
  const [categoryId, setCategoryId] = useState<string>(
    movement?.categoryId || ''
  );
  const [dateISO, setDateISO] = useState<string>(
    movement?.dateISO || getTodayISO()
  );
  const [description, setDescription] = useState<string>(
    movement?.description || ''
  );
  const [errors, setErrors] = useState<string[]>([]);

  // Get the derived type from category
  const derivedType: MovementType = categoryId
    ? deriveTypeFromCategory(categoryId)
    : 'expense';

  // Get selected category details
  const selectedCategory = categories.find((c) => c.id === categoryId);

  // Handle form submission
  const handleSubmit = () => {
    const parsedAmount = parseAmount(amount);
    const validation = validateMovementData({
      amount: parsedAmount,
      categoryId,
      dateISO,
      description,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    setErrors([]);

    if (movement && movement.id) {
      // Update existing movement
      onSubmit({
        id: movement.id,
        dateISO,
        amount: parsedAmount,
        categoryId,
        description,
        type: derivedType,
      });
    } else {
      // Create new movement
      onSubmit({
        dateISO,
        amount: parsedAmount,
        categoryId,
        description,
        type: derivedType,
      });
    }
  };

  // Format date for display
  const formatDateForDisplay = (isoDate: string): string => {
    if (!isoDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return isoDate; // Return as-is for intermediate input
    }
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // Validate date parts ensuring valid day, month, and year ranges
  const isValidDate = (day: string, month: string, year: string): boolean => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    
    // Check for NaN values
    if (isNaN(d) || isNaN(m) || isNaN(y)) return false;
    
    // Validate ranges
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    if (y < 1900 || y > 2100) return false;
    
    // Check days in month (using Date to handle leap years)
    const daysInMonth = new Date(y, m, 0).getDate();
    return d <= daysInMonth;
  };

  // Handle date change (simple text input for cross-platform)
  const handleDateChange = (text: string): void => {
    // Remove all characters except digits and forward slashes for date input
    const dateInputPattern = /[^\d/]/g;
    const cleaned = text.replace(dateInputPattern, '');
    
    // If user types 8 digits, auto-format
    const digitsOnly = cleaned.replace(/\//g, '');
    if (digitsOnly.length === 8) {
      const day = digitsOnly.slice(0, 2);
      const month = digitsOnly.slice(2, 4);
      const year = digitsOnly.slice(4, 8);
      if (isValidDate(day, month, year)) {
        setDateISO(`${year}-${month}-${day}`);
      }
    } else if (cleaned.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = cleaned.split('/');
      if (isValidDate(day, month, year)) {
        setDateISO(`${year}-${month}-${day}`);
      }
    } else {
      // Store as-is for intermediate input
      setDateISO(cleaned);
    }
  };

  // Quick amount adjustments
  const adjustAmount = (delta: number) => {
    const current = parseAmount(amount);
    const newAmount = Math.max(0.01, current + delta);
    setAmount(newAmount.toFixed(2));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {isEditing ? 'Edit Movement' : 'New Movement'}
      </Text>

      {/* Amount Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Amount (€)</Text>
        <View style={styles.amountContainer}>
          <TouchableOpacity
            style={styles.amountButton}
            onPress={() => adjustAmount(-1)}
            disabled={isLoading}
          >
            <Text style={styles.amountButtonText}>−</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textDisabled}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.amountButton}
            onPress={() => adjustAmount(1)}
            disabled={isLoading}
          >
            <Text style={styles.amountButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.quickAmounts}>
          {[5, 10, 20, 50, 100].map((val) => (
            <TouchableOpacity
              key={val}
              style={styles.quickAmountButton}
              onPress={() => setAmount(val.toString())}
              disabled={isLoading}
            >
              <Text style={styles.quickAmountText}>€{val}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Category Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Category *</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    categoryId === cat.id ? cat.color : colors.surfaceVariant,
                  borderColor: cat.color,
                },
              ]}
              onPress={() => setCategoryId(cat.id)}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  { color: categoryId === cat.id ? '#FFFFFF' : colors.textPrimary },
                ]}
              >
                {cat.name}
              </Text>
              <Text
                style={[
                  styles.categoryTypeLabel,
                  { color: categoryId === cat.id ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {cat.typeFixed === 'income'
                  ? '↑'
                  : cat.typeFixed === 'expense'
                  ? '↓'
                  : '↕'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {categoryId && (
          <View style={styles.typeIndicator}>
            <Text
              style={[
                styles.typeText,
                {
                  color: derivedType === 'income' ? colors.income : colors.expense,
                },
              ]}
            >
              Type: {derivedType.toUpperCase()}
            </Text>
          </View>
        )}
        {!categoryId && (
          <Text style={styles.errorHint}>Please select a category</Text>
        )}
      </View>

      {/* Date Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Date</Text>
        <View style={styles.dateContainer}>
          <TextInput
            style={styles.dateInput}
            value={formatDateForDisplay(dateISO)}
            onChangeText={handleDateChange}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.textDisabled}
            keyboardType="number-pad"
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.todayButton}
            onPress={() => setDateISO(getTodayISO())}
            disabled={isLoading}
          >
            <Text style={styles.todayButtonText}>Today</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Description Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={styles.descriptionInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Add a note..."
          placeholderTextColor={colors.textDisabled}
          multiline
          numberOfLines={2}
          editable={!isLoading}
        />
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
            (!categoryId || isLoading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!categoryId || isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Add Movement'}
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountButtonText: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: 'bold',
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginHorizontal: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  quickAmountButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
  },
  quickAmountText: {
    fontSize: typography.fontSizeMedium,
    color: colors.textSecondary,
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
    borderWidth: 2,
  },
  categoryChipText: {
    fontSize: typography.fontSizeMedium,
    fontWeight: '500',
  },
  categoryTypeLabel: {
    fontSize: typography.fontSizeSmall,
    marginLeft: spacing.xs,
  },
  typeIndicator: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  typeText: {
    fontSize: typography.fontSizeMedium,
    fontWeight: 'bold',
  },
  errorHint: {
    marginTop: spacing.xs,
    fontSize: typography.fontSizeSmall,
    color: colors.error,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    fontSize: typography.fontSizeLarge,
    color: colors.textPrimary,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  todayButton: {
    marginLeft: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  todayButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMedium,
    fontWeight: '500',
  },
  descriptionInput: {
    fontSize: typography.fontSizeMedium,
    color: colors.textPrimary,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
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
