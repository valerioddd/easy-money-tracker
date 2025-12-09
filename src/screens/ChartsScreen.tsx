/**
 * ChartsScreen - Data visualization and analytics
 * 
 * Features:
 * - Income vs Expense charts
 * - Category breakdown
 * - Monthly trends
 * - Balance history
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, typography } from '../theme';

export default function ChartsScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Charts</Text>
        </View>

        {/* Placeholder content */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>📊</Text>
          <Text style={styles.placeholderTitle}>Charts Coming Soon</Text>
          <Text style={styles.placeholderDescription}>
            Visualizations of your financial data will appear here.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.fontSizeHeader,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl * 2,
  },
  placeholderText: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  placeholderTitle: {
    fontSize: typography.fontSizeTitle,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  placeholderDescription: {
    fontSize: typography.fontSizeLarge,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
