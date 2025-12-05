/**
 * HomeScreen - Main app screen after sheet selection
 * Displays basic info about the selected sheet
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, typography, borderRadius } from '../theme';
import { getSelectedSheet, clearSelectedSheet } from '../services/googleSheets';
import { getCurrentUser, clearAuthState } from '../services/googleAuth';

export default function HomeScreen({ onChangeSheet, onLogout }) {
  const user = getCurrentUser();
  const selectedSheet = getSelectedSheet();

  const handleChangeSheet = () => {
    clearSelectedSheet();
    if (onChangeSheet) {
      onChangeSheet();
    }
  };

  const handleLogout = () => {
    clearSelectedSheet();
    clearAuthState();
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Easy Money Tracker</Text>
        <Text style={styles.subtitle}>Your personal finance companion</Text>
      </View>

      {/* User Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Signed in as</Text>
        <Text style={styles.cardValue}>{user?.email || 'Unknown'}</Text>
      </View>

      {/* Selected Sheet Card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Current Sheet</Text>
        <Text style={styles.cardValue} numberOfLines={2}>
          {selectedSheet.fileName || 'No sheet selected'}
        </Text>
        <TouchableOpacity 
          style={styles.changeButton} 
          onPress={handleChangeSheet}
          activeOpacity={0.7}
        >
          <Text style={styles.changeButtonText}>Change Sheet</Text>
        </TouchableOpacity>
      </View>

      {/* Coming Soon */}
      <View style={styles.comingSoonContainer}>
        <Text style={styles.comingSoonIcon}>🚀</Text>
        <Text style={styles.comingSoonText}>
          Transaction tracking features coming soon!
        </Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.xl + spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSizeTitle,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSizeMedium,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLabel: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  cardValue: {
    fontSize: typography.fontSizeLarge,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  changeButton: {
    marginTop: spacing.md,
    backgroundColor: colors.surfaceVariant,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  changeButtonText: {
    color: colors.primary,
    fontSize: typography.fontSizeMedium,
    fontWeight: '500',
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  comingSoonIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  comingSoonText: {
    fontSize: typography.fontSizeLarge,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoutButtonText: {
    color: colors.error,
    fontSize: typography.fontSizeLarge,
    fontWeight: '600',
  },
});
