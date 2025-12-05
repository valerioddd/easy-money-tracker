/**
 * Sheet Adapters
 *
 * Adapters for converting between typed objects and sheet rows.
 * Each adapter handles a specific sheet type (Movements, Categories, Assets, ChartsBase).
 */

import type {
  Movement,
  Category,
  Asset,
  ChartsBase,
  SheetRow,
  MovementType,
  CategoryTypeFixed,
  AggregationPeriod,
} from './models';
import {
  createMovement,
  createCategory,
  createAsset,
  createChartsBase,
  validateMovement,
  validateCategory,
  validateAsset,
} from './models';
import {
  readSheet,
  appendRows,
  upsertById,
  findById,
  deleteById,
  batchWrite,
  type BatchWriteRequest,
} from './sheetsClient';

/**
 * Base adapter interface
 */
export interface SheetAdapter<T extends { id: string }> {
  /** Sheet name in the spreadsheet */
  sheetName: string;
  /** Convert a sheet row to a typed object */
  fromRow(row: SheetRow): T;
  /** Convert a typed object to a sheet row */
  toRow(item: T): SheetRow;
  /** Get all items from the sheet */
  getAll(): Promise<T[]>;
  /** Get item by ID */
  getById(id: string): Promise<T | null>;
  /** Create a new item */
  create(item: Omit<T, 'id'>): Promise<T>;
  /** Update an existing item */
  update(item: T): Promise<T>;
  /** Delete an item by ID */
  delete(id: string): Promise<boolean>;
  /** Upsert an item (create or update) */
  upsert(item: T): Promise<T>;
}

/**
 * Movements Sheet Adapter
 *
 * Column order: id, dateISO, amount, categoryId, description, type
 */
export const MovementsAdapter: SheetAdapter<Movement> = {
  sheetName: 'Movements',

  fromRow(row: SheetRow): Movement {
    return {
      id: String(row[0] ?? ''),
      dateISO: String(row[1] ?? ''),
      amount: Number(row[2]) || 0,
      categoryId: String(row[3] ?? ''),
      description: String(row[4] ?? ''),
      type: (String(row[5]) as MovementType) || 'expense',
    };
  },

  toRow(item: Movement): SheetRow {
    return [
      item.id,
      item.dateISO,
      item.amount,
      item.categoryId,
      item.description,
      item.type,
    ];
  },

  async getAll(): Promise<Movement[]> {
    const rows = await readSheet(`${this.sheetName}!A:F`);
    // Skip header row
    return rows.slice(1).map((row) => this.fromRow(row));
  },

  async getById(id: string): Promise<Movement | null> {
    const result = await findById(this.sheetName, id);
    if (!result) return null;
    return this.fromRow(result.row);
  },

  async create(data: Omit<Movement, 'id'>): Promise<Movement> {
    const item = createMovement(data);
    const errors = validateMovement(item);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    const row = this.toRow(item);
    await appendRows(`${this.sheetName}!A:F`, [row]);
    return item;
  },

  async update(item: Movement): Promise<Movement> {
    const errors = validateMovement(item);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    const row = this.toRow(item);
    await upsertById(this.sheetName, item.id, row);
    return item;
  },

  async delete(id: string): Promise<boolean> {
    return deleteById(this.sheetName, id, 6);
  },

  async upsert(item: Movement): Promise<Movement> {
    const errors = validateMovement(item);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    const row = this.toRow(item);
    await upsertById(this.sheetName, item.id, row);
    return item;
  },
};

/**
 * Categories Sheet Adapter
 *
 * Column order: id, name, color, typeFixed
 */
export const CategoriesAdapter: SheetAdapter<Category> = {
  sheetName: 'Categories',

  fromRow(row: SheetRow): Category {
    return {
      id: String(row[0] ?? ''),
      name: String(row[1] ?? ''),
      color: String(row[2] ?? '#000000'),
      typeFixed: (String(row[3]) as CategoryTypeFixed) || 'both',
    };
  },

  toRow(item: Category): SheetRow {
    return [item.id, item.name, item.color, item.typeFixed];
  },

  async getAll(): Promise<Category[]> {
    const rows = await readSheet(`${this.sheetName}!A:D`);
    // Skip header row
    return rows.slice(1).map((row) => this.fromRow(row));
  },

  async getById(id: string): Promise<Category | null> {
    const result = await findById(this.sheetName, id);
    if (!result) return null;
    return this.fromRow(result.row);
  },

  async create(data: Omit<Category, 'id'>): Promise<Category> {
    const item = createCategory(data);
    const errors = validateCategory(item);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    const row = this.toRow(item);
    await appendRows(`${this.sheetName}!A:D`, [row]);
    return item;
  },

  async update(item: Category): Promise<Category> {
    const errors = validateCategory(item);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    const row = this.toRow(item);
    await upsertById(this.sheetName, item.id, row);
    return item;
  },

  async delete(id: string): Promise<boolean> {
    return deleteById(this.sheetName, id, 4);
  },

  async upsert(item: Category): Promise<Category> {
    const errors = validateCategory(item);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    const row = this.toRow(item);
    await upsertById(this.sheetName, item.id, row);
    return item;
  },
};

/**
 * Assets Sheet Adapter
 *
 * Column order: id, dateISO, accountName, value, icon
 */
export const AssetsAdapter: SheetAdapter<Asset> = {
  sheetName: 'Assets',

  fromRow(row: SheetRow): Asset {
    return {
      id: String(row[0] ?? ''),
      dateISO: String(row[1] ?? ''),
      accountName: String(row[2] ?? ''),
      value: Number(row[3]) || 0,
      icon: String(row[4] ?? ''),
    };
  },

  toRow(item: Asset): SheetRow {
    return [item.id, item.dateISO, item.accountName, item.value, item.icon];
  },

  async getAll(): Promise<Asset[]> {
    const rows = await readSheet(`${this.sheetName}!A:E`);
    // Skip header row
    return rows.slice(1).map((row) => this.fromRow(row));
  },

  async getById(id: string): Promise<Asset | null> {
    const result = await findById(this.sheetName, id);
    if (!result) return null;
    return this.fromRow(result.row);
  },

  async create(data: Omit<Asset, 'id'>): Promise<Asset> {
    const item = createAsset(data);
    const errors = validateAsset(item);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    const row = this.toRow(item);
    await appendRows(`${this.sheetName}!A:E`, [row]);
    return item;
  },

  async update(item: Asset): Promise<Asset> {
    const errors = validateAsset(item);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    const row = this.toRow(item);
    await upsertById(this.sheetName, item.id, row);
    return item;
  },

  async delete(id: string): Promise<boolean> {
    return deleteById(this.sheetName, id, 5);
  },

  async upsert(item: Asset): Promise<Asset> {
    const errors = validateAsset(item);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    const row = this.toRow(item);
    await upsertById(this.sheetName, item.id, row);
    return item;
  },
};

/**
 * ChartsBase Sheet Adapter
 *
 * Column order: id, period, startDateISO, endDateISO, totalIncome, totalExpense, netBalance, categoryBreakdown
 */
export const ChartsBaseAdapter: SheetAdapter<ChartsBase> = {
  sheetName: 'ChartsBase',

  fromRow(row: SheetRow): ChartsBase {
    return {
      id: String(row[0] ?? ''),
      period: (String(row[1]) as AggregationPeriod) || 'monthly',
      startDateISO: String(row[2] ?? ''),
      endDateISO: String(row[3] ?? ''),
      totalIncome: Number(row[4]) || 0,
      totalExpense: Number(row[5]) || 0,
      netBalance: Number(row[6]) || 0,
      categoryBreakdown: String(row[7] ?? '{}'),
    };
  },

  toRow(item: ChartsBase): SheetRow {
    return [
      item.id,
      item.period,
      item.startDateISO,
      item.endDateISO,
      item.totalIncome,
      item.totalExpense,
      item.netBalance,
      item.categoryBreakdown,
    ];
  },

  async getAll(): Promise<ChartsBase[]> {
    const rows = await readSheet(`${this.sheetName}!A:H`);
    // Skip header row
    return rows.slice(1).map((row) => this.fromRow(row));
  },

  async getById(id: string): Promise<ChartsBase | null> {
    const result = await findById(this.sheetName, id);
    if (!result) return null;
    return this.fromRow(result.row);
  },

  async create(data: Omit<ChartsBase, 'id'>): Promise<ChartsBase> {
    const item = createChartsBase(data);
    const row = this.toRow(item);
    await appendRows(`${this.sheetName}!A:H`, [row]);
    return item;
  },

  async update(item: ChartsBase): Promise<ChartsBase> {
    const row = this.toRow(item);
    await upsertById(this.sheetName, item.id, row);
    return item;
  },

  async delete(id: string): Promise<boolean> {
    return deleteById(this.sheetName, id, 8);
  },

  async upsert(item: ChartsBase): Promise<ChartsBase> {
    const row = this.toRow(item);
    await upsertById(this.sheetName, item.id, row);
    return item;
  },
};

/**
 * Batch create multiple items across different sheets
 * @param operations Array of operations with adapter and items
 * @returns Results for each operation
 */
export const batchCreate = async <T extends { id: string }>(
  operations: Array<{
    adapter: SheetAdapter<T>;
    items: Array<Omit<T, 'id'>>;
  }>
): Promise<T[][]> => {
  const batchRequests: BatchWriteRequest[] = [];
  const createdItems: T[][] = [];

  for (const op of operations) {
    const items: T[] = [];
    const rows: SheetRow[] = [];

    for (const data of op.items) {
      // Create item with ID based on the adapter's type
      let item: T;
      if (op.adapter.sheetName === 'Movements') {
        item = createMovement(data as unknown as Omit<Movement, 'id'>) as unknown as T;
      } else if (op.adapter.sheetName === 'Categories') {
        item = createCategory(data as unknown as Omit<Category, 'id'>) as unknown as T;
      } else if (op.adapter.sheetName === 'Assets') {
        item = createAsset(data as unknown as Omit<Asset, 'id'>) as unknown as T;
      } else {
        item = createChartsBase(data as unknown as Omit<ChartsBase, 'id'>) as unknown as T;
      }
      items.push(item);
      rows.push(op.adapter.toRow(item));
    }

    createdItems.push(items);

    if (rows.length > 0) {
      batchRequests.push({
        range: `${op.adapter.sheetName}!A:Z`,
        rows,
      });
    }
  }

  // Execute batch write
  if (batchRequests.length > 0) {
    await batchWrite(batchRequests);
  }

  return createdItems;
};

/**
 * Get all adapters
 */
export const getAdapters = () => ({
  movements: MovementsAdapter,
  categories: CategoriesAdapter,
  assets: AssetsAdapter,
  chartsBase: ChartsBaseAdapter,
});
