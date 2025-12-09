/**
 * NetWorthHeader Component
 *
 * Displays the total net worth (sum of all account balances).
 * Features:
 * - Large display of total net worth
 * - Color-coded based on positive/negative
 * - Optional breakdown of accounts count
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';
import { formatBalance } from '../services/accountService';

interface NetWorthHeaderProps {
  netWorth: number;
  accountCount: number;
}

export default function NetWorthHeader({
  netWorth,
  accountCount,
}: NetWorthHeaderProps) {
  const isPositive = netWorth >= 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Net Worth</Text>
      <Text
        style={[
          styles.value,
          { color: isPositive ? colors.income : colors.expense },
        ]}
      >
        {formatBalance(netWorth)}
      </Text>
      <Text style={styles.subtitle}>
        {accountCount} account{accountCount !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: typography.fontSizeMedium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  value: {
    fontSize: typography.fontSizeHeader,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
  },
});
