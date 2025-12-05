/**
 * Data Models for Easy Money Tracker
 *
 * This module defines the TypeScript interfaces and types for the application's
 * data structures that map to Google Sheets rows.
 */

import * as Crypto from 'expo-crypto';

/**
 * Movement types
 */
export type MovementType = 'income' | 'expense';

/**
 * Category fixed types - indicates what type of movement this category is for
 */
export type CategoryTypeFixed = 'income' | 'expense' | 'both';

/**
 * Movement - represents a financial transaction
 */
export interface Movement {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Date in ISO 8601 format (YYYY-MM-DD) */
  dateISO: string;
  /** Transaction amount (positive number) */
  amount: number;
  /** Reference to the category ID */
  categoryId: string;
  /** Optional description of the transaction */
  description: string;
  /** Type of movement: income or expense */
  type: MovementType;
}

/**
 * Category - represents a transaction category
 */
export interface Category {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Display name of the category */
  name: string;
  /** Hex color code for UI display (e.g., "#FF5733") */
  color: string;
  /** Fixed type: determines if category is for income, expense, or both */
  typeFixed: CategoryTypeFixed;
}

/**
 * Account - represents a financial account
 */
export interface Account {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Display name of the account */
  name: string;
  /** Emoji icon for UI display */
  emoji: string;
  /** Current balance of the account */
  balance: number;
}

/**
 * Asset - represents a financial account or asset snapshot (for history/charts)
 */
export interface Asset {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Date of the snapshot in ISO 8601 format (YYYY-MM-DD) */
  dateISO: string;
  /** Name of the account (e.g., "Checking Account", "Savings") */
  accountName: string;
  /** Current value of the asset */
  value: number;
  /** Icon identifier for UI display */
  icon: string;
}

/**
 * Aggregation period types for charts
 */
export type AggregationPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * ChartsBase - represents base aggregation data for charts
 */
export interface ChartsBase {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Period of aggregation */
  period: AggregationPeriod;
  /** Start date of the period in ISO 8601 format */
  startDateISO: string;
  /** End date of the period in ISO 8601 format */
  endDateISO: string;
  /** Total income for the period */
  totalIncome: number;
  /** Total expenses for the period */
  totalExpense: number;
  /** Net balance (income - expense) */
  netBalance: number;
  /** Category breakdown as JSON string */
  categoryBreakdown: string;
}

/**
 * Generic row type for sheet operations
 */
export type SheetRow = (string | number | boolean | null)[];

/**
 * Mapping configuration for converting between objects and sheet rows
 */
export interface FieldMapping<T> {
  /** Property name in the object */
  field: keyof T;
  /** Column index in the sheet (0-based) */
  columnIndex: number;
  /** Type of the field for conversion */
  type: 'string' | 'number' | 'boolean' | 'date';
}

/**
 * Generate a new UUID v4 for entity IDs
 * Uses expo-crypto for cryptographically secure random values
 * @returns A new UUID v4 string
 */
export const generateId = (): string => {
  return Crypto.randomUUID();
};

/**
 * Create a new Movement with generated ID
 * @param data Partial movement data (without id)
 * @returns Complete Movement object with generated ID
 */
export const createMovement = (
  data: Omit<Movement, 'id'>
): Movement => {
  return {
    id: generateId(),
    ...data,
  };
};

/**
 * Create a new Category with generated ID
 * @param data Partial category data (without id)
 * @returns Complete Category object with generated ID
 */
export const createCategory = (
  data: Omit<Category, 'id'>
): Category => {
  return {
    id: generateId(),
    ...data,
  };
};

/**
 * Create a new Account with generated ID
 * @param data Partial account data (without id)
 * @returns Complete Account object with generated ID
 */
export const createAccountModel = (
  data: Omit<Account, 'id'>
): Account => {
  return {
    id: generateId(),
    ...data,
  };
};

/**
 * Create a new Asset with generated ID
 * @param data Partial asset data (without id)
 * @returns Complete Asset object with generated ID
 */
export const createAsset = (
  data: Omit<Asset, 'id'>
): Asset => {
  return {
    id: generateId(),
    ...data,
  };
};

/**
 * Create a new ChartsBase entry with generated ID
 * @param data Partial charts base data (without id)
 * @returns Complete ChartsBase object with generated ID
 */
export const createChartsBase = (
  data: Omit<ChartsBase, 'id'>
): ChartsBase => {
  return {
    id: generateId(),
    ...data,
  };
};

/**
 * Validate if a string is a valid ISO date format (YYYY-MM-DD)
 * @param dateString The date string to validate
 * @returns True if valid ISO date format
 */
export const isValidISODate = (dateString: string): boolean => {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Validate if a string is a valid hex color code
 * @param color The color string to validate
 * @returns True if valid hex color
 */
export const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

/**
 * Validate a Movement object
 * @param movement The movement to validate
 * @returns Array of validation errors (empty if valid)
 */
export const validateMovement = (movement: Movement): string[] => {
  const errors: string[] = [];

  if (!movement.id) {
    errors.push('Movement ID is required');
  }
  if (!isValidISODate(movement.dateISO)) {
    errors.push('Invalid date format. Expected YYYY-MM-DD');
  }
  if (typeof movement.amount !== 'number' || movement.amount < 0) {
    errors.push('Amount must be a non-negative number');
  }
  if (!movement.categoryId) {
    errors.push('Category ID is required');
  }
  if (!['income', 'expense'].includes(movement.type)) {
    errors.push('Type must be either "income" or "expense"');
  }

  return errors;
};

/**
 * Validate a Category object
 * @param category The category to validate
 * @returns Array of validation errors (empty if valid)
 */
export const validateCategory = (category: Category): string[] => {
  const errors: string[] = [];

  if (!category.id) {
    errors.push('Category ID is required');
  }
  if (!category.name || category.name.trim().length === 0) {
    errors.push('Category name is required');
  }
  if (!isValidHexColor(category.color)) {
    errors.push('Invalid color format. Expected hex color (e.g., #FF5733)');
  }
  if (!['income', 'expense', 'both'].includes(category.typeFixed)) {
    errors.push('Type fixed must be "income", "expense", or "both"');
  }

  return errors;
};

/**
 * Validate an Asset object
 * @param asset The asset to validate
 * @returns Array of validation errors (empty if valid)
 */
export const validateAsset = (asset: Asset): string[] => {
  const errors: string[] = [];

  if (!asset.id) {
    errors.push('Asset ID is required');
  }
  if (!isValidISODate(asset.dateISO)) {
    errors.push('Invalid date format. Expected YYYY-MM-DD');
  }
  if (!asset.accountName || asset.accountName.trim().length === 0) {
    errors.push('Account name is required');
  }
  if (typeof asset.value !== 'number') {
    errors.push('Value must be a number');
  }

  return errors;
};

/**
 * Validate an Account object
 * @param account The account to validate
 * @returns Array of validation errors (empty if valid)
 */
export const validateAccount = (account: Account): string[] => {
  const errors: string[] = [];

  if (!account.id) {
    errors.push('Account ID is required');
  }
  if (!account.name || account.name.trim().length === 0) {
    errors.push('Account name is required');
  }
  if (!account.emoji || account.emoji.trim().length === 0) {
    errors.push('Account emoji is required');
  }
  if (typeof account.balance !== 'number') {
    errors.push('Balance must be a number');
  }

  return errors;
};
