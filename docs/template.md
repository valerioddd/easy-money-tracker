# Google Sheet Template Documentation

This document describes the structure of the Google Sheet template used as the data backend for Easy Money Tracker.

## Overview

Easy Money Tracker uses Google Sheets as its data storage. This approach provides:

- No backend infrastructure required
- Easy data access and editing via Google Sheets
- Automatic cloud backup through Google Drive
- Simple sharing and collaboration options

## Master Template Structure

The master template contains **4 sheets**:

1. **Movements** - All financial transactions (income and expenses)
2. **Categories** - Transaction categories configuration
3. **Assets** - Asset/account definitions (bank accounts, wallets, etc.)
4. **ChartsBase** - Pre-configured data aggregations for charts

---

## Sheet Schemas

### 1. Movements Sheet

Stores all financial transactions.

| Column | Type | Required | Description | Constraints |
|--------|------|----------|-------------|-------------|
| `id` | string | Yes | Unique identifier (UUID v4) | Must be unique |
| `date` | string | Yes | Transaction date in ISO 8601 format | Format: `YYYY-MM-DD` |
| `value` | number | Yes | Transaction amount (positive) | Must be > 0 |
| `type` | string | Yes | Transaction type | **Immutable**. Enum: `income`, `expense` |
| `categoryId` | string | Yes | Reference to category | Must exist in Categories sheet |
| `assetId` | string | Yes | Reference to asset/account | Must exist in Assets sheet |
| `description` | string | No | Optional description/note | Max 500 characters |
| `createdAt` | string | Yes | Creation timestamp | ISO 8601 format |
| `updatedAt` | string | Yes | Last update timestamp | ISO 8601 format |

**Example row:**
```
id,date,value,type,categoryId,assetId,description,createdAt,updatedAt
550e8400-e29b-41d4-a716-446655440000,2024-01-15,150.00,expense,cat-food,asset-bank,Weekly groceries,2024-01-15T10:30:00Z,2024-01-15T10:30:00Z
```

### 2. Categories Sheet

Defines available categories for transactions.

| Column | Type | Required | Description | Constraints |
|--------|------|----------|-------------|-------------|
| `id` | string | Yes | Unique identifier | Must be unique, slug format recommended |
| `name` | string | Yes | Display name | Max 100 characters |
| `type` | string | Yes | Category type | Enum: `income`, `expense` |
| `icon` | string | No | Icon identifier | Valid icon name from icon set |
| `color` | string | No | Category color | 6-digit hex code with `#` prefix (e.g., `#FF5722`). Invalid values ignored. |
| `parentId` | string | No | Parent category for subcategories | Must exist in Categories sheet |
| `isActive` | boolean | Yes | Whether category is active | Default: `true` |
| `createdAt` | string | Yes | Creation timestamp | ISO 8601 format |

**Example rows:**
```
id,name,type,icon,color,parentId,isActive,createdAt
cat-salary,Salary,income,briefcase,#4CAF50,,true,2024-01-01T00:00:00Z
cat-food,Food & Groceries,expense,shopping-cart,#FF5722,,true,2024-01-01T00:00:00Z
cat-restaurant,Restaurants,expense,utensils,#FF7043,cat-food,true,2024-01-01T00:00:00Z
```

### 3. Assets Sheet

Defines financial assets and accounts.

| Column | Type | Required | Description | Constraints |
|--------|------|----------|-------------|-------------|
| `id` | string | Yes | Unique identifier | Must be unique, slug format recommended |
| `name` | string | Yes | Display name | Max 100 characters |
| `type` | string | Yes | Asset type | Enum: `bank`, `cash`, `credit`, `investment`, `other` |
| `currency` | string | Yes | Currency code | ISO 4217 format (e.g., `EUR`, `USD`) |
| `initialBalance` | number | Yes | Starting balance | Can be negative for credit accounts |
| `icon` | string | No | Icon identifier | Valid icon name from icon set |
| `color` | string | No | Asset color | 6-digit hex code with `#` prefix (e.g., `#2196F3`). Invalid values ignored. |
| `isActive` | boolean | Yes | Whether asset is active | Default: `true` |
| `createdAt` | string | Yes | Creation timestamp | ISO 8601 format |

**Example rows:**
```
id,name,type,currency,initialBalance,icon,color,isActive,createdAt
asset-bank,Main Bank Account,bank,EUR,1000.00,bank,#2196F3,true,2024-01-01T00:00:00Z
asset-cash,Cash Wallet,cash,EUR,200.00,wallet,#4CAF50,true,2024-01-01T00:00:00Z
asset-credit,Credit Card,credit,EUR,-500.00,credit-card,#F44336,true,2024-01-01T00:00:00Z
```

### 4. ChartsBase Sheet

Pre-calculated aggregations for dashboard charts.

| Column | Type | Required | Description | Constraints |
|--------|------|----------|-------------|-------------|
| `id` | string | Yes | Unique identifier | Must be unique |
| `period` | string | Yes | Aggregation period | Enum: `daily`, `weekly`, `monthly`, `yearly` |
| `periodStart` | string | Yes | Period start date | ISO 8601 date format |
| `periodEnd` | string | Yes | Period end date | ISO 8601 date format |
| `totalIncome` | number | Yes | Total income for period | Calculated field |
| `totalExpense` | number | Yes | Total expenses for period | Calculated field |
| `netBalance` | number | Yes | Net balance (income - expense) | Calculated field |
| `categoryBreakdown` | string | No | JSON object with category totals | Valid JSON |
| `assetBreakdown` | string | No | JSON object with asset totals | Valid JSON |
| `lastUpdated` | string | Yes | Last calculation timestamp | ISO 8601 format |

**Example row:**
```
id,period,periodStart,periodEnd,totalIncome,totalExpense,netBalance,categoryBreakdown,assetBreakdown,lastUpdated
chart-2024-01-monthly,monthly,2024-01-01,2024-01-31,3000.00,1500.00,1500.00,"{""cat-salary"":3000,""cat-food"":500}","{""asset-bank"":1200,""asset-cash"":300}",2024-02-01T00:00:00Z
```

---

## Data Types Reference

| Type | Format | Example |
|------|--------|---------|
| `string` | UTF-8 text | `"Hello World"` |
| `number` | Decimal number | `150.50` |
| `boolean` | `true` or `false` | `true` |
| `date` | ISO 8601 date | `2024-01-15` |
| `datetime` | ISO 8601 timestamp | `2024-01-15T10:30:00Z` |
| `uuid` | UUID v4 | `550e8400-e29b-41d4-a716-446655440000` |

---

## Type Constraints

### Immutable Fields

The following fields are **immutable** and should not be changed after creation:

- `Movements.type` - Transaction type cannot be changed; delete and recreate instead
- `Movements.id` - Primary identifier
- `Categories.id` - Primary identifier
- `Assets.id` - Primary identifier
- `*.createdAt` - Creation timestamps are set once

### Enum Values

| Field | Valid Values |
|-------|--------------|
| `Movements.type` | `income`, `expense` |
| `Categories.type` | `income`, `expense` |
| `Assets.type` | `bank`, `cash`, `credit`, `investment`, `other` |
| `ChartsBase.period` | `daily`, `weekly`, `monthly`, `yearly` |

---

## Google APIs Reference

The following Google APIs will be used for integration:

### Google Sheets API v4

- **Documentation**: https://developers.google.com/sheets/api
- **Scopes needed**: 
  - `https://www.googleapis.com/auth/spreadsheets` (read/write)
  - `https://www.googleapis.com/auth/spreadsheets.readonly` (read-only)
- **Key endpoints**:
  - `GET /spreadsheets/{spreadsheetId}` - Get spreadsheet metadata
  - `GET /spreadsheets/{spreadsheetId}/values/{range}` - Read data
  - `PUT /spreadsheets/{spreadsheetId}/values/{range}` - Update data
  - `POST /spreadsheets/{spreadsheetId}/values/{range}:append` - Append data

### Google Drive API v3

- **Documentation**: https://developers.google.com/drive/api
- **Scopes needed**:
  - `https://www.googleapis.com/auth/drive.file` (access only files created by app)
- **Key endpoints**:
  - `POST /files/{fileId}/copy` - Copy template to create new tracker
  - `GET /files/{fileId}` - Get file metadata

### Authentication

- **OAuth 2.0**: https://developers.google.com/identity/protocols/oauth2
- **Sign-In for mobile**: https://developers.google.com/identity/sign-in/android (Android) / https://developers.google.com/identity/sign-in/ios (iOS)

---

## Template Export Formats

The template can be exported in the following formats:

- **Google Sheets (.gsheet)** - Native format, recommended
- **Microsoft Excel (.xlsx)** - For backup/import purposes
- **CSV** - Each sheet exported as separate .csv file
- **JSON** - Structured export for development/testing

For programmatic access, use the Google Sheets API to read/write data directly.
