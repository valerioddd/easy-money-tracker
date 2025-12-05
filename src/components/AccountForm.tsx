/**
 * AccountForm Component
 *
 * Form for adding/editing accounts.
 * Features:
 * - Name input
 * - Emoji picker
 * - Balance input
 * - Validations: name required
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
import type { Account } from '../services/models';

interface AccountFormProps {
  account?: Account | null;
  onSubmit: (data: Omit<Account, 'id'> | Account) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const PRESET_EMOJIS = [
  '💵', '💰', '🏦', '💳', '🐷', '💎', '🪙', '📊',
  '🏠', '🚗', '✈️', '🎓', '💼', '🎁', '🛒', '📱',
  '💊', '🔧', '🎨', '📚', '🎮', '🏋️', '🍔', '☕',
];

const DEFAULT_BALANCE = 0;

export default function AccountForm({
  account,
  onSubmit,
  onCancel,
  isLoading = false,
}: AccountFormProps) {
  const isEditing = !!account;

  // Form state
  const [name, setName] = useState<string>(account?.name || '');
  const [emoji, setEmoji] = useState<string>(account?.emoji || '💰');
  const [balance, setBalance] = useState<string>(
    account ? account.balance.toString() : DEFAULT_BALANCE.toString()
  );
  const [errors, setErrors] = useState<string[]>([]);

  // Parse balance from string
  const parseBalance = (input: string): number => {
    const cleaned = input.replace(/[^0-9.,-]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (!name.trim()) {
      newErrors.push('Account name is required');
    }

    if (!emoji.trim()) {
      newErrors.push('Account emoji is required');
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

    const parsedBalance = parseBalance(balance);

    if (account && account.id) {
      // Update existing account
      onSubmit({
        id: account.id,
        name: name.trim(),
        emoji,
        balance: parsedBalance,
      });
    } else {
      // Create new account
      onSubmit({
        name: name.trim(),
        emoji,
        balance: parsedBalance,
      });
    }
  };

  // Quick balance adjustments
  const adjustBalance = (delta: number) => {
    const current = parseBalance(balance);
    const newBalance = current + delta;
    setBalance(newBalance.toFixed(2));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {isEditing ? 'Edit Account' : 'New Account'}
      </Text>

      {/* Name Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Account name"
          placeholderTextColor={colors.textDisabled}
          editable={!isLoading}
          autoCapitalize="words"
        />
      </View>

      {/* Emoji Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Icon</Text>
        <View style={styles.emojiPreview}>
          <View style={styles.selectedEmoji}>
            <Text style={styles.selectedEmojiText}>{emoji}</Text>
          </View>
          <TextInput
            style={styles.emojiInput}
            value={emoji}
            onChangeText={setEmoji}
            placeholder="Enter emoji"
            placeholderTextColor={colors.textDisabled}
            editable={!isLoading}
            maxLength={2}
          />
        </View>
        <View style={styles.emojiPalette}>
          {PRESET_EMOJIS.map((presetEmoji) => (
            <TouchableOpacity
              key={presetEmoji}
              style={[
                styles.paletteEmoji,
                emoji === presetEmoji && styles.paletteEmojiSelected,
              ]}
              onPress={() => setEmoji(presetEmoji)}
              disabled={isLoading}
            >
              <Text style={styles.paletteEmojiText}>{presetEmoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Balance Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Balance (€)</Text>
        <View style={styles.balanceContainer}>
          <TouchableOpacity
            style={styles.balanceButton}
            onPress={() => adjustBalance(-100)}
            disabled={isLoading}
          >
            <Text style={styles.balanceButtonText}>−100</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.balanceInput}
            value={balance}
            onChangeText={setBalance}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={colors.textDisabled}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.balanceButton}
            onPress={() => adjustBalance(100)}
            disabled={isLoading}
          >
            <Text style={styles.balanceButtonText}>+100</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.quickBalances}>
          {[0, 100, 500, 1000, 5000].map((val) => (
            <TouchableOpacity
              key={val}
              style={styles.quickBalanceButton}
              onPress={() => setBalance(val.toString())}
              disabled={isLoading}
            >
              <Text style={styles.quickBalanceText}>€{val}</Text>
            </TouchableOpacity>
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
            {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Add Account'}
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
  emojiPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  selectedEmoji: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  selectedEmojiText: {
    fontSize: 32,
  },
  emojiInput: {
    flex: 1,
    fontSize: typography.fontSizeLarge,
    color: colors.textPrimary,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
  },
  emojiPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  paletteEmoji: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paletteEmojiSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  paletteEmojiText: {
    fontSize: 24,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
  },
  balanceButtonText: {
    fontSize: typography.fontSizeMedium,
    color: colors.primary,
    fontWeight: 'bold',
  },
  balanceInput: {
    flex: 1,
    fontSize: 32,
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
  quickBalances: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.md,
  },
  quickBalanceButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
  },
  quickBalanceText: {
    fontSize: typography.fontSizeMedium,
    color: colors.textSecondary,
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
