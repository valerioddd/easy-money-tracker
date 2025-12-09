/**
 * ErrorRecoveryDialog Component
 *
 * Modal dialog for handling error recovery scenarios.
 * Features:
 * - Auth revoked: Prompt to re-login
 * - Sheet not found: Retry or Create new from master
 * - Consistent UX with other modals
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';

type ErrorType = 'auth_revoked' | 'sheet_not_found' | 'template_not_found';

interface ErrorRecoveryDialogProps {
  /** Whether the dialog is visible */
  visible: boolean;
  /** Type of error to display */
  errorType: ErrorType;
  /** Error message to display */
  errorMessage?: string;
  /** Loading state for async operations */
  isLoading?: boolean;
  /** Callback when retry is pressed */
  onRetry?: () => void;
  /** Callback when create new is pressed */
  onCreateNew?: () => void;
  /** Callback when re-login is pressed */
  onReLogin?: () => void;
  /** Callback when cancel/dismiss is pressed */
  onCancel?: () => void;
}

export default function ErrorRecoveryDialog({
  visible,
  errorType,
  errorMessage,
  isLoading = false,
  onRetry,
  onCreateNew,
  onReLogin,
  onCancel,
}: ErrorRecoveryDialogProps) {
  /**
   * Get title based on error type
   */
  const getTitle = (): string => {
    switch (errorType) {
      case 'auth_revoked':
        return 'Permission Revoked';
      case 'sheet_not_found':
        return 'Sheet Not Found';
      case 'template_not_found':
        return 'Template Not Available';
      default:
        return 'Error';
    }
  };

  /**
   * Get message based on error type
   */
  const getMessage = (): string => {
    if (errorMessage) {
      return errorMessage;
    }

    switch (errorType) {
      case 'auth_revoked':
        return 'Your Google account permissions have been revoked. Please log in again to continue.';
      case 'sheet_not_found':
        return 'The selected spreadsheet was moved or deleted. You can try to access it again or create a new one from the master template.';
      case 'template_not_found':
        return 'The master template spreadsheet is not available. Please contact support or check your configuration.';
      default:
        return 'An error occurred. Please try again.';
    }
  };

  /**
   * Render action buttons based on error type
   */
  const renderActions = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      );
    }

    switch (errorType) {
      case 'auth_revoked':
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onReLogin}
            >
              <Text style={styles.primaryButtonText}>Re-Login</Text>
            </TouchableOpacity>
          </View>
        );

      case 'sheet_not_found':
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onRetry}
            >
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onCreateNew}
            >
              <Text style={styles.primaryButtonText}>Create New</Text>
            </TouchableOpacity>
          </View>
        );

      case 'template_not_found':
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onCancel}
            >
              <Text style={styles.secondaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onCancel}
            >
              <Text style={styles.secondaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Title */}
          <Text style={styles.title}>{getTitle()}</Text>

          {/* Message */}
          <Text style={styles.message}>{getMessage()}</Text>

          {/* Actions */}
          {renderActions()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
});
