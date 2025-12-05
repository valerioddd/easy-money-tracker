/**
 * LoginScreen - Google OAuth login screen
 * Provides Google Sign-In functionality with dark theme UI
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as AuthSession from 'expo-auth-session';
import { colors, spacing, typography, borderRadius } from '../theme';
import {
  discovery,
  createAuthConfig,
  exchangeCodeForToken,
  getUserInfo,
} from '../services/googleAuth';
import { GOOGLE_CLIENT_ID } from '../config';

export default function LoginScreen({ onLoginSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const config = createAuthConfig(GOOGLE_CLIENT_ID);
  const [request, response, promptAsync] = AuthSession.useAuthRequest(config, discovery);

  useEffect(() => {
    const handleAuthResponse = async () => {
      if (response?.type === 'success' && response.params?.code) {
        setIsLoading(true);
        setError(null);
        
        try {
          await exchangeCodeForToken(response.params.code, request, GOOGLE_CLIENT_ID);
          const userInfo = await getUserInfo();
          
          if (onLoginSuccess) {
            onLoginSuccess(userInfo);
          }
        } catch (err) {
          console.error('Auth error:', err);
          setError('Failed to complete sign in. Please try again.');
          setIsLoading(false);
        }
      } else if (response?.type === 'error') {
        setError(response.error?.message || 'Sign in was cancelled or failed.');
      }
    };

    handleAuthResponse();
  }, [response]);

  const handleSignIn = async () => {
    setError(null);
    try {
      await promptAsync();
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to initiate sign in. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        {/* App Logo/Title Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Easy Money Tracker</Text>
          <Text style={styles.subtitle}>Your personal finance companion</Text>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionSection}>
          <Text style={styles.description}>
            Track your income and expenses easily using Google Sheets as your data storage.
          </Text>
          <Text style={styles.description}>
            Sign in with Google to get started.
          </Text>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Sign In Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.signInButton, (!request || isLoading) && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={!request || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textPrimary} size="small" />
            ) : (
              <>
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.signInButtonText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you grant access to Google Drive and Sheets to store your data.
          </Text>
        </View>
      </View>
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
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSizeHeader,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSizeLarge,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  descriptionSection: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  description: {
    fontSize: typography.fontSizeMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: colors.surface,
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSizeMedium,
    textAlign: 'center',
  },
  buttonSection: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  signInButton: {
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
  googleIcon: {
    width: 24,
    height: 24,
    backgroundColor: colors.textPrimary,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  googleIconText: {
    fontSize: typography.fontSizeLarge,
    fontWeight: 'bold',
    color: colors.primary,
  },
  signInButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeLarge,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    position: 'absolute',
    bottom: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSizeSmall,
    color: colors.textDisabled,
    textAlign: 'center',
    lineHeight: 18,
  },
});
