/**
 * Theme configuration for Easy Money Tracker
 * Exports all theme-related values for consistent styling
 */

export { colors } from './colors';
export { theme } from './Theme';
export type { Theme, ThemeColors, ThemeSpacing, ThemeTypography, ThemeBorderRadius } from './Theme';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
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
    normal: '400' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};
