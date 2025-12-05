/**
 * Movement Service
 *
 * Handles movement operations with write-through synchronization
 * and fallback queue for offline scenarios.
 */

import { MovementsAdapter, CategoriesAdapter } from './adapters';
import type { Movement, Category, MovementType } from './models';

/**
 * Queued operation for offline fallback
 */
interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  movement: Movement;
  timestamp: number;
}

/**
 * Service state
 */
interface MovementServiceState {
  categories: Category[];
  movements: Movement[];
  queue: QueuedOperation[];
  isOnline: boolean;
  lastSyncTime: number | null;
  isLoading: boolean;
  error: string | null;
}

const state: MovementServiceState = {
  categories: [],
  movements: [],
  queue: [],
  isOnline: true,
  lastSyncTime: null,
  isLoading: false,
  error: null,
};

/**
 * Generate a unique queue operation ID
 */
const generateQueueId = (): string => {
  return `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Add operation to the fallback queue
 */
const addToQueue = (
  type: 'create' | 'update' | 'delete',
  movement: Movement
): void => {
  state.queue.push({
    id: generateQueueId(),
    type,
    movement,
    timestamp: Date.now(),
  });
};

/**
 * Process queued operations when back online
 */
export const processQueue = async (): Promise<{
  success: number;
  failed: number;
}> => {
  if (state.queue.length === 0) {
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;
  const remainingQueue: QueuedOperation[] = [];

  for (const op of state.queue) {
    try {
      switch (op.type) {
        case 'create':
          await MovementsAdapter.upsert(op.movement);
          break;
        case 'update':
          await MovementsAdapter.update(op.movement);
          break;
        case 'delete':
          await MovementsAdapter.delete(op.movement.id);
          break;
      }
      success++;
    } catch (error) {
      failed++;
      remainingQueue.push(op);
    }
  }

  state.queue = remainingQueue;
  return { success, failed };
};

/**
 * Load categories from the sheet
 */
export const loadCategories = async (): Promise<Category[]> => {
  try {
    const categories = await CategoriesAdapter.getAll();
    state.categories = categories.filter((c) => c.id); // Filter out empty rows
    return state.categories;
  } catch (error) {
    state.error = `Failed to load categories: ${error}`;
    throw error;
  }
};

/**
 * Get cached categories
 */
export const getCategories = (): Category[] => {
  return state.categories;
};

/**
 * Load movements from the sheet
 */
export const loadMovements = async (): Promise<Movement[]> => {
  state.isLoading = true;
  state.error = null;
  try {
    const movements = await MovementsAdapter.getAll();
    state.movements = movements.filter((m) => m.id); // Filter out empty rows
    state.lastSyncTime = Date.now();
    state.isOnline = true;
    return state.movements;
  } catch (error) {
    state.isOnline = false;
    state.error = `Failed to load movements: ${error}`;
    throw error;
  } finally {
    state.isLoading = false;
  }
};

/**
 * Get cached movements
 */
export const getMovements = (): Movement[] => {
  return state.movements;
};

/**
 * Derive movement type from category
 */
export const deriveTypeFromCategory = (categoryId: string): MovementType => {
  const category = state.categories.find((c) => c.id === categoryId);
  if (!category) {
    return 'expense'; // Default to expense
  }
  if (category.typeFixed === 'income') {
    return 'income';
  }
  if (category.typeFixed === 'expense') {
    return 'expense';
  }
  // For 'both', default to expense
  return 'expense';
};

/**
 * Create a new movement (write-through with queue fallback)
 */
export const createMovement = async (
  data: Omit<Movement, 'id'>
): Promise<Movement> => {
  // Derive type from category if not explicitly provided
  const movementData = {
    ...data,
    type: data.type || deriveTypeFromCategory(data.categoryId),
  };

  try {
    // Try write-through first
    const movement = await MovementsAdapter.create(movementData);
    state.movements = [movement, ...state.movements];
    state.isOnline = true;
    return movement;
  } catch (error) {
    // Fallback to queue
    state.isOnline = false;
    const tempMovement: Movement = {
      id: `temp-${Date.now()}`,
      ...movementData,
    };
    addToQueue('create', tempMovement);
    state.movements = [tempMovement, ...state.movements];
    return tempMovement;
  }
};

/**
 * Update an existing movement (write-through with queue fallback)
 */
export const updateMovement = async (movement: Movement): Promise<Movement> => {
  // Derive type from category
  const updatedMovement = {
    ...movement,
    type: deriveTypeFromCategory(movement.categoryId),
  };

  try {
    // Try write-through first
    await MovementsAdapter.update(updatedMovement);
    state.movements = state.movements.map((m) =>
      m.id === updatedMovement.id ? updatedMovement : m
    );
    state.isOnline = true;
    return updatedMovement;
  } catch (error) {
    // Fallback to queue
    state.isOnline = false;
    addToQueue('update', updatedMovement);
    state.movements = state.movements.map((m) =>
      m.id === updatedMovement.id ? updatedMovement : m
    );
    return updatedMovement;
  }
};

/**
 * Delete a movement (write-through with queue fallback)
 */
export const deleteMovement = async (id: string): Promise<boolean> => {
  const movementToDelete = state.movements.find((m) => m.id === id);
  if (!movementToDelete) {
    return false;
  }

  try {
    // Try write-through first
    await MovementsAdapter.delete(id);
    state.movements = state.movements.filter((m) => m.id !== id);
    state.isOnline = true;
    return true;
  } catch (error) {
    // Fallback to queue
    state.isOnline = false;
    addToQueue('delete', movementToDelete);
    state.movements = state.movements.filter((m) => m.id !== id);
    return true;
  }
};

/**
 * Get current service state
 */
export const getServiceState = (): {
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  queueLength: number;
  lastSyncTime: number | null;
} => ({
  isOnline: state.isOnline,
  isLoading: state.isLoading,
  error: state.error,
  queueLength: state.queue.length,
  lastSyncTime: state.lastSyncTime,
});

/**
 * Get today's date in ISO format
 */
export const getTodayISO = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Format amount for display (with € symbol)
 */
export const formatAmount = (amount: number): string => {
  return `€${amount.toFixed(2)}`;
};

/**
 * Parse amount from string input
 */
export const parseAmount = (input: string): number => {
  const cleaned = input.replace(/[^0-9.,]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Validate movement data
 */
export const validateMovementData = (data: {
  amount: number;
  categoryId: string;
  dateISO: string;
  description?: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  if (!data.categoryId) {
    errors.push('Category is required');
  }

  if (!data.dateISO) {
    errors.push('Date is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Clear all state (for logout)
 */
export const clearMovementState = (): void => {
  state.categories = [];
  state.movements = [];
  state.queue = [];
  state.isOnline = true;
  state.lastSyncTime = null;
  state.isLoading = false;
  state.error = null;
};
