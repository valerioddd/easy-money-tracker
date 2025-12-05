/**
 * Account Service
 *
 * Handles account operations with asset history tracking.
 * Every balance change is recorded in the Assets sheet for charts and trends.
 */

import { AccountsAdapter, AssetsAdapter } from './adapters';
import type { Account, Asset } from './models';

/**
 * Service state
 */
interface AccountServiceState {
  accounts: Account[];
  assets: Asset[];
  isOnline: boolean;
  lastSyncTime: number | null;
  isLoading: boolean;
  error: string | null;
}

const state: AccountServiceState = {
  accounts: [],
  assets: [],
  isOnline: true,
  lastSyncTime: null,
  isLoading: false,
  error: null,
};

/**
 * Get today's date in ISO format
 */
export const getTodayISO = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Load accounts from the sheet
 */
export const loadAccounts = async (): Promise<Account[]> => {
  state.isLoading = true;
  state.error = null;
  try {
    const accounts = await AccountsAdapter.getAll();
    state.accounts = accounts.filter((a) => a.id); // Filter out empty rows
    state.lastSyncTime = Date.now();
    state.isOnline = true;
    return state.accounts;
  } catch (error) {
    state.isOnline = false;
    state.error = `Failed to load accounts: ${error}`;
    throw error;
  } finally {
    state.isLoading = false;
  }
};

/**
 * Get cached accounts
 */
export const getAccounts = (): Account[] => {
  return state.accounts;
};

/**
 * Load assets history from the sheet
 */
export const loadAssets = async (): Promise<Asset[]> => {
  try {
    const assets = await AssetsAdapter.getAll();
    state.assets = assets.filter((a) => a.id); // Filter out empty rows
    return state.assets;
  } catch (error) {
    state.error = `Failed to load assets: ${error}`;
    throw error;
  }
};

/**
 * Get cached assets
 */
export const getAssets = (): Asset[] => {
  return state.assets;
};

/**
 * Record a balance snapshot in Assets history
 * If an entry already exists for today and this account, update it instead
 * @param account The account to record
 */
const recordBalanceHistory = async (account: Account): Promise<Asset> => {
  const todayISO = getTodayISO();
  
  // Check if there's already an entry for today and this account
  const existingAsset = state.assets.find(
    (a) => a.dateISO === todayISO && a.accountName === account.name
  );

  if (existingAsset) {
    // Update existing entry
    const updatedAsset: Asset = {
      ...existingAsset,
      value: account.balance,
      icon: account.emoji,
    };
    await AssetsAdapter.update(updatedAsset);
    state.assets = state.assets.map((a) =>
      a.id === existingAsset.id ? updatedAsset : a
    );
    return updatedAsset;
  } else {
    // Create new entry
    const assetData: Omit<Asset, 'id'> = {
      dateISO: todayISO,
      accountName: account.name,
      value: account.balance,
      icon: account.emoji,
    };
    const asset = await AssetsAdapter.create(assetData);
    state.assets = [asset, ...state.assets];
    return asset;
  }
};

/**
 * Create a new account
 * Records initial balance in Assets history (best-effort)
 */
export const createAccount = async (
  data: Omit<Account, 'id'>
): Promise<Account> => {
  try {
    const account = await AccountsAdapter.create(data);
    state.accounts = [...state.accounts, account];
    state.isOnline = true;

    // Record initial balance in history (best-effort)
    try {
      await recordBalanceHistory(account);
    } catch (historyError) {
      console.warn('Failed to record initial balance history:', historyError);
    }

    return account;
  } catch (error) {
    state.isOnline = false;
    throw error;
  }
};

/**
 * Update an account's balance
 * Records the new balance in Assets history (best-effort)
 */
export const updateAccountBalance = async (
  accountId: string,
  newBalance: number
): Promise<Account> => {
  const account = state.accounts.find((a) => a.id === accountId);
  if (!account) {
    throw new Error('Account not found');
  }

  const updatedAccount: Account = {
    ...account,
    balance: newBalance,
  };

  try {
    await AccountsAdapter.update(updatedAccount);
    state.accounts = state.accounts.map((a) =>
      a.id === accountId ? updatedAccount : a
    );
    state.isOnline = true;

    // Record new balance in history (best-effort)
    try {
      await recordBalanceHistory(updatedAccount);
    } catch (historyError) {
      console.warn('Failed to record balance history:', historyError);
    }

    return updatedAccount;
  } catch (error) {
    state.isOnline = false;
    throw error;
  }
};

/**
 * Update an account (name, emoji, and optionally balance)
 * If balance changes, records in Assets history
 * Note: History recording is best-effort; account update is prioritized
 */
export const updateAccount = async (account: Account): Promise<Account> => {
  const existingAccount = state.accounts.find((a) => a.id === account.id);
  if (!existingAccount) {
    throw new Error('Account not found');
  }

  const balanceChanged = existingAccount.balance !== account.balance;

  try {
    await AccountsAdapter.update(account);
    state.accounts = state.accounts.map((a) =>
      a.id === account.id ? account : a
    );
    state.isOnline = true;

    // Record new balance in history if it changed (best-effort)
    if (balanceChanged) {
      try {
        await recordBalanceHistory(account);
      } catch (historyError) {
        // Log error but don't fail the account update
        console.warn('Failed to record balance history:', historyError);
      }
    }

    return account;
  } catch (error) {
    state.isOnline = false;
    throw error;
  }
};

/**
 * Delete an account
 */
export const deleteAccount = async (id: string): Promise<boolean> => {
  const account = state.accounts.find((a) => a.id === id);
  if (!account) {
    return false;
  }

  try {
    await AccountsAdapter.delete(id);
    state.accounts = state.accounts.filter((a) => a.id !== id);
    state.isOnline = true;
    return true;
  } catch (error) {
    state.isOnline = false;
    throw error;
  }
};

/**
 * Compute total net worth (sum of all account balances)
 */
export const computeNetWorth = (): number => {
  return state.accounts.reduce((sum, account) => sum + account.balance, 0);
};

/**
 * Get assets history for a specific account
 */
export const getAccountHistory = (accountName: string): Asset[] => {
  return state.assets
    .filter((a) => a.accountName === accountName)
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
};

/**
 * Get the latest asset snapshot for each account
 */
export const getLatestSnapshots = (): Asset[] => {
  const latestByAccount = new Map<string, Asset>();

  for (const asset of state.assets) {
    const existing = latestByAccount.get(asset.accountName);
    if (!existing || asset.dateISO > existing.dateISO) {
      latestByAccount.set(asset.accountName, asset);
    }
  }

  return Array.from(latestByAccount.values());
};

/**
 * Get current service state
 */
export const getAccountServiceState = (): {
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  accountCount: number;
  lastSyncTime: number | null;
} => ({
  isOnline: state.isOnline,
  isLoading: state.isLoading,
  error: state.error,
  accountCount: state.accounts.length,
  lastSyncTime: state.lastSyncTime,
});

/**
 * Format amount for display (with € symbol)
 */
export const formatBalance = (amount: number): string => {
  return `€${amount.toFixed(2)}`;
};

/**
 * Clear all state (for logout)
 */
export const clearAccountState = (): void => {
  state.accounts = [];
  state.assets = [];
  state.isOnline = true;
  state.lastSyncTime = null;
  state.isLoading = false;
  state.error = null;
};

/**
 * Default accounts to seed a new sheet with
 */
export const DEFAULT_ACCOUNTS: Array<Omit<Account, 'id'>> = [
  { name: 'Cash', emoji: '💵', balance: 0 },
  { name: 'Checking Account', emoji: '🏦', balance: 0 },
  { name: 'Savings', emoji: '🐷', balance: 0 },
];
