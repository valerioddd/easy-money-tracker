# Performance and Batch Operations

This document describes the performance optimizations implemented in Easy Money Tracker, including batch operations and exponential backoff strategies for handling API rate limits and transient errors.

## Overview

The app is optimized to handle approximately 60 movements per month with efficient batch operations and intelligent retry logic. This ensures smooth operation even under network constraints or API rate limits.

## Batch Operations

### batchReadRanges()

Reads multiple ranges from Google Sheets in a single API call, reducing network overhead and API quota usage.

**Usage:**
```typescript
import { batchReadRanges } from '@/services';

// Read multiple sheet ranges at once
const ranges = [
  'Movements!A:F',
  'Categories!A:D',
  'Accounts!A:D'
];

const data = await batchReadRanges(ranges);

// Access data by range
const movements = data.get('Movements!A:F');
const categories = data.get('Categories!A:D');
const accounts = data.get('Accounts!A:D');
```

**Benefits:**
- Single API call instead of multiple calls
- Reduced network latency
- Better API quota utilization
- Atomic operations across sheets

### batchWriteRows()

Writes multiple ranges to Google Sheets in a single API call.

**Usage:**
```typescript
import { batchWriteRows } from '@/services';

// Write to multiple ranges at once
const requests = [
  {
    range: 'Movements!A2:F2',
    rows: [['id-1', '2025-01-01', 50.00, 'cat-1', 'Groceries', 'expense']]
  },
  {
    range: 'Accounts!A2:D2',
    rows: [['acc-1', 'Cash', '💰', 1000.00]]
  }
];

const result = await batchWriteRows(requests);
console.log(`Updated ${result.totalUpdatedRows} rows`);
```

**Benefits:**
- Reduced API calls
- Faster write operations
- Atomic multi-sheet updates
- Lower risk of partial failures

## Exponential Backoff

### Overview

Exponential backoff is a retry strategy that gradually increases the wait time between retries when encountering transient errors or rate limits.

### Implementation

The `exponentialBackoff()` function calculates retry delays:

```typescript
import { exponentialBackoff } from '@/utils';

// Calculate delay for retry attempt
const delayMs = exponentialBackoff(
  retryCount,    // 0-based retry count
  1000,          // Base delay (1 second)
  30000          // Maximum delay (30 seconds)
);

// Delay grows: 1s → 2s → 4s → 8s → 16s → 30s (capped)
```

**Features:**
- Exponential growth: `delay = baseDelay * 2^retryCount`
- Maximum delay cap to prevent excessive waits
- Jitter (±25%) to prevent thundering herd problem
- Configurable base and max delays

### Automatic Retry with Backoff

The `withRetry()` function wraps async operations with automatic retry logic:

```typescript
import { withRetry, isRetryableError } from '@/utils';

const data = await withRetry(
  async () => {
    return await fetchDataFromAPI();
  },
  {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    shouldRetry: isRetryableError,
    onRetry: (error, attempt, delay) => {
      console.log(`Retry ${attempt} after ${delay}ms due to ${error}`);
    }
  }
);
```

### Retryable Errors

The following errors are automatically retried:
- **408** - Request Timeout
- **429** - Too Many Requests (Rate Limit)
- **500** - Internal Server Error
- **502** - Bad Gateway
- **503** - Service Unavailable
- **504** - Gateway Timeout
- Network errors (fetch failures)
- Timeout errors

Non-retryable errors (fail immediately):
- **401** - Authentication errors
- **404** - Resource not found
- **400** - Bad request

## Integration

### Google Sheets API Client

All Google Sheets API calls automatically use exponential backoff:

```typescript
// authenticatedFetch() now includes retry logic
const response = await authenticatedFetch(url, options);
```

This means all operations (read, write, batch) benefit from:
- Automatic retries on transient failures
- Exponential backoff on rate limits
- Intelligent error handling

### Rate Limiting

The rate limiter ensures we stay within Google Sheets API limits:
- Maximum 60 requests per minute
- 100ms minimum delay between requests
- Automatic throttling when approaching limits

Combined with exponential backoff:
1. First, rate limiter prevents exceeding quota
2. If rate limited (429), exponential backoff kicks in
3. Retries with increasing delays until success

## Performance Characteristics

### For ~60 Movements/Month

Typical monthly usage:
- ~60 movements (2 per day average)
- ~10 categories
- ~3 accounts
- ~30 chart data points

**Without batch operations:**
- API calls: ~100+ per month
- Network round trips: ~100+

**With batch operations:**
- API calls: ~30-40 per month (60% reduction)
- Network round trips: ~30-40

**Benefits:**
- Faster load times
- Better user experience
- More reliable under poor network conditions
- Lower API quota usage

## Best Practices

1. **Use batch operations when possible**
   - Loading initial data (categories + movements)
   - Bulk imports
   - Template initialization

2. **Let retry logic handle transient errors**
   - Don't implement custom retry in calling code
   - Trust the exponential backoff strategy
   - Monitor retry callbacks for debugging

3. **Optimize for your use case**
   - For 60 movements/month, batch reads on initial load
   - Individual writes for real-time updates
   - Batch writes for bulk operations (imports, templates)

4. **Monitor performance**
   - Check retry counts in production
   - Adjust base/max delays if needed
   - Watch for excessive retries (may indicate persistent issues)

## Examples

### Loading all data on startup

```typescript
import { batchReadRanges } from '@/services';

async function loadAllData() {
  const ranges = [
    'Movements!A:F',
    'Categories!A:D',
    'Accounts!A:D',
    'Assets!A:E'
  ];
  
  const data = await batchReadRanges(ranges);
  
  return {
    movements: parseMovements(data.get('Movements!A:F')),
    categories: parseCategories(data.get('Categories!A:D')),
    accounts: parseAccounts(data.get('Accounts!A:D')),
    assets: parseAssets(data.get('Assets!A:E'))
  };
}
```

### Bulk import with batch write

```typescript
import { batchWriteRows } from '@/services';

async function bulkImport(movements: Movement[]) {
  const rows = movements.map(m => toRow(m));
  
  // Import in batches of 50
  const batchSize = 50;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const requests = [{
      range: `Movements!A${i + 2}:F${i + 2 + batch.length}`,
      rows: batch
    }];
    
    await batchWriteRows(requests);
  }
}
```

## Future Optimizations

Potential improvements for larger datasets:

1. **Incremental sync** - Only fetch changes since last sync
2. **Client-side caching** - Cache frequently accessed data
3. **Pagination** - Load movements in chunks
4. **Background sync** - Queue operations for background processing
5. **Compression** - Compress large batch payloads

For current scale (~60 movements/month), these optimizations are not necessary.
