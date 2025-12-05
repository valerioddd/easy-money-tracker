/**
 * SheetSelectionScreen - Sheet picker and creation screen
 * Allows users to select an existing sheet or create from master template
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, typography, borderRadius } from '../theme';
import {
  listUserSheets,
  duplicateMasterTemplate,
  storeSelectedSheet,
  verifySheetAccess,
  MASTER_TEMPLATE_ID,
} from '../services/googleSheets';
import { clearAuthState, getCurrentUser } from '../services/googleAuth';

export default function SheetSelectionScreen({ onSheetSelected, onLogout }) {
  const [sheets, setSheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const user = getCurrentUser();

  const loadSheets = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const userSheets = await listUserSheets();
      setSheets(userSheets);
    } catch (err) {
      console.error('Error loading sheets:', err);
      
      if (err.message === 'AUTH_REVOKED') {
        handleAuthError();
        return;
      }
      
      setError('Failed to load your sheets. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSheets();
  }, [loadSheets]);

  const handleAuthError = () => {
    Alert.alert(
      'Session Expired',
      'Your session has expired. Please sign in again.',
      [
        {
          text: 'Sign In',
          onPress: () => {
            clearAuthState();
            if (onLogout) {
              onLogout();
            }
          },
        },
      ]
    );
  };

  const handleSelectSheet = async (sheet) => {
    setIsLoading(true);
    setError(null);

    try {
      // Verify the sheet still exists and is accessible
      const isAccessible = await verifySheetAccess(sheet.id);
      
      if (!isAccessible) {
        showFileNotFoundAlert(sheet);
        return;
      }

      // Store selected sheet in memory
      storeSelectedSheet(sheet.id, sheet.name);
      
      if (onSheetSelected) {
        onSheetSelected(sheet);
      }
    } catch (err) {
      console.error('Error selecting sheet:', err);
      
      if (err.message === 'AUTH_REVOKED') {
        handleAuthError();
        return;
      }
      
      setError('Failed to select sheet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showFileNotFoundAlert = (sheet) => {
    Alert.alert(
      'Sheet Not Found',
      `"${sheet.name}" may have been moved or deleted.`,
      [
        {
          text: 'Retry',
          onPress: () => loadSheets(),
        },
        {
          text: 'Create New',
          onPress: handleCreateFromTemplate,
        },
      ]
    );
    setIsLoading(false);
  };

  const handleCreateFromTemplate = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const newSheet = await duplicateMasterTemplate();
      
      Alert.alert(
        'Sheet Created',
        `"${newSheet.name}" has been created successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSheetSelected) {
                onSheetSelected(newSheet);
              }
            },
          },
        ]
      );
    } catch (err) {
      console.error('Error creating sheet:', err);
      
      if (err.message === 'AUTH_REVOKED') {
        handleAuthError();
        return;
      }
      
      if (err.message === 'TEMPLATE_NOT_FOUND') {
        Alert.alert(
          'Template Not Found',
          'The master template could not be found. Please contact support.',
          [{ text: 'OK' }]
        );
      } else {
        setError('Failed to create sheet from template. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            clearAuthState();
            if (onLogout) {
              onLogout();
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderSheetItem = ({ item }) => (
    <TouchableOpacity
      style={styles.sheetItem}
      onPress={() => handleSelectSheet(item)}
      activeOpacity={0.7}
    >
      <View style={styles.sheetIcon}>
        <Text style={styles.sheetIconText}>📊</Text>
      </View>
      <View style={styles.sheetInfo}>
        <Text style={styles.sheetName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.sheetDate}>
          Modified: {formatDate(item.modifiedTime)}
        </Text>
      </View>
      <View style={styles.chevron}>
        <Text style={styles.chevronText}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No Sheets Found</Text>
      <Text style={styles.emptyText}>
        You don't have any spreadsheets yet. Create one from the template to get started.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.listHeaderText}>Your Sheets</Text>
    </View>
  );

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading your sheets...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'User'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadSheets()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sheet List */}
      <FlatList
        data={sheets}
        renderItem={renderSheetItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={sheets.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadSheets(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      {/* Create from Template Button */}
      <View style={styles.createSection}>
        <TouchableOpacity
          style={[styles.createButton, isCreating && styles.buttonDisabled]}
          onPress={handleCreateFromTemplate}
          disabled={isCreating}
          activeOpacity={0.8}
        >
          {isCreating ? (
            <ActivityIndicator color={colors.textPrimary} size="small" />
          ) : (
            <>
              <Text style={styles.createIcon}>+</Text>
              <Text style={styles.createButtonText}>Create from Master Template</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMedium,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.fontSizeXLarge,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  email: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  logoutText: {
    color: colors.error,
    fontSize: typography.fontSizeMedium,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: colors.surface,
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    margin: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSizeMedium,
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.md,
  },
  retryText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMedium,
  },
  listContainer: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  listHeaderText: {
    fontSize: typography.fontSizeMedium,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetIcon: {
    width: 44,
    height: 44,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  sheetIconText: {
    fontSize: 20,
  },
  sheetInfo: {
    flex: 1,
  },
  sheetName: {
    fontSize: typography.fontSizeLarge,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  sheetDate: {
    fontSize: typography.fontSizeSmall,
    color: colors.textSecondary,
  },
  chevron: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronText: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSizeXLarge,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSizeMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  createSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  createButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    minHeight: 52,
  },
  buttonDisabled: {
    backgroundColor: colors.surfaceVariant,
    opacity: 0.7,
  },
  createIcon: {
    fontSize: 24,
    color: colors.textPrimary,
    marginRight: spacing.sm,
    fontWeight: '300',
  },
  createButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeLarge,
    fontWeight: '600',
  },
});
