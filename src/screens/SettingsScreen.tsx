/**
 * SettingsScreen - Application settings and configuration
 * 
 * Features:
 * - User profile information
 * - Google Sheet management
 * - App preferences
 * - Logout functionality
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, typography, borderRadius } from '../theme';
import { getCurrentUser, clearAuthState } from '../services/googleAuth';
import { getSelectedSheet, clearSelectedSheet } from '../services/googleSheets';

interface SettingsScreenProps {
  onLogout?: () => void;
  onChangeSheet?: () => void;
}

export default function SettingsScreen({ onLogout, onChangeSheet }: SettingsScreenProps) {
  const user = getCurrentUser() as { email?: string; name?: string } | null;
  const sheet = getSelectedSheet() as { fileId?: string | null; name?: string | null } | null;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            clearAuthState();
            clearSelectedSheet();
            onLogout?.();
          },
        },
      ]
    );
  };

  const handleChangeSheet = () => {
    Alert.alert(
      'Change Sheet',
      'Are you sure you want to change the selected sheet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: () => {
            clearSelectedSheet();
            onChangeSheet?.();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* User Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user?.email || 'Not logged in'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{user?.name || 'Unknown'}</Text>
            </View>
          </View>
        </View>

        {/* Sheet Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Google Sheet</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Sheet Name</Text>
              <Text style={styles.value}>{sheet?.name || 'No sheet selected'}</Text>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={handleChangeSheet}
              accessibilityLabel="Change Google Sheet"
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Change Sheet</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
            accessibilityLabel="Logout from application"
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, styles.logoutButtonText]}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Easy Money Tracker v1.0.0</Text>
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
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizeLarge,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.fontSizeLarge,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonText: {
    fontSize: typography.fontSizeLarge,
    fontWeight: '600',
    color: colors.background,
  },
  logoutButton: {
    backgroundColor: colors.expense,
  },
  logoutButtonText: {
    color: colors.textPrimary,
  },
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
  },
});
