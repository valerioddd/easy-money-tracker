/**
 * Theme.ts - TypeScript theme configuration
 * Provides typed theme values for consistent styling across the app
 */

export interface ThemeColors {
  // Primary colors - Black and White
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Background colors - Dark theme
  background: string;
  surface: string;
  surfaceVariant: string;

  // Text colors
  text: string; // Alias for textPrimary (backward compatibility)
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;

  // Status colors
  success: string;
  error: string;
  warning: string;
  info: string;

  // Transaction colors - Green for income, Red for expense
  income: string;
  expense: string;

  // Border and divider
  border: string;
  divider: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ThemeTypography {
  fontSizeSmall: number;
  fontSizeMedium: number;
  fontSizeLarge: number;
  fontSizeXLarge: number;
  fontSizeTitle: number;
  fontSizeHeader: number;
  
  // Backward compatibility - sizes and weights aliases
  sizes: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  weights: {
    normal: string;
    semibold: string;
    bold: string;
  };
}

export interface ThemeBorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  round: number;
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
}

export const theme: Theme = {
  colors: {
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
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  typography: {
    fontSizeSmall: 12,
    fontSizeMedium: 14,
    fontSizeLarge: 16,
    fontSizeXLarge: 20,
    fontSizeTitle: 24,
    fontSizeHeader: 32,
    
    // Backward compatibility - sizes and weights aliases
    sizes: {
      sm: 12,
      md: 14,
      lg: 16,
      xl: 20,
    },
    weights: {
      normal: '400',
      semibold: '600',
      bold: '700',
    },
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
};

export default theme;
