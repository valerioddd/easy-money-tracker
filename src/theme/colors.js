/**
 * Dark theme color palette for Easy Money Tracker
 * White/Black palette with Red/Green accents
 */

export const colors = {
  // Primary colors - Black and White
  primary: '#FFFFFF',
  primaryLight: '#F5F5F5',
  primaryDark: '#E0E0E0',

  // Background colors - Dark theme
  background: '#000000',
  surface: '#1A1A1A',
  surfaceVariant: '#2D2D2D',

  // Text colors
  text: '#FFFFFF', // Alias for textPrimary (backward compatibility)
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textDisabled: '#666666',

  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#2196F3',

  // Transaction colors - Green for income, Red for expense
  income: '#00C853',
  expense: '#FF1744',

  // Border and divider
  border: '#333333',
  divider: '#404040',
};

export default colors;
