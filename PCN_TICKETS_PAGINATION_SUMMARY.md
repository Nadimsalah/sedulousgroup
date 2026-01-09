# PCN Tickets Pagination Implementation Summary

## Overview

Implemented cursor-based pagination for the PCNs/Tickets page to improve initial load performance. The page now loads 5 tickets initially and allows users to load more incrementally.

## Changes Made

### 1. Backend - Database Layer (`lib/database.tsx`)

**Added `getAllPCNTicketsPaginated()` method:**
- Implements cursor-based pagination using `(created_at DESC, id DESC)` ordering
- Cursor encodes the last item's `created_at` and `id` as base64
- Supports filters: `status` and `searchTerm`
- Returns: `{ items, nextCursor, hasMore }`
- Fetches `limit + 1` to determine if there are more items
- Clamps limit between 1 and 50

**Cursor Implementation:**
- `encodeCursor(createdAt, id)`: Encodes cursor as base64
- `decodeCursor(cursor)`: Decodes cursor to get `createdAt` and `id`
- Uses `created_at <= cursor.createdAt` query, then filters in memory for tie-breaker

### 2. Backend - Action Layer (`app/actions/pcn-tickets.ts`)

**Added `getAllPCNTicketsPaginatedAction()`:**
- Server action wrapper for paginated ticket fetching
- Accepts: `limit` (default 5), `cursor` (optional), `filters` (optional)
- Returns: `PaginatedPCNTicketsResult` with `items`, `nextCursor`, `hasMore`

### 3. Frontend - UI (`app/admin/pcn-tickets/page.tsx`)

**State Management:**
- `allTickets`: Flat list of all loaded tickets
- `nextCursor`: Cursor for next page
- `hasMore`: Boolean indicating if more tickets exist
- `isLoadingMore`: Loading state for "Load More" button

**Key Functions:**
- `loadInitialData()`: Loads bookings, cars, agreements, and first page of tickets
- `loadTicketsPage(cursor?)`: Fetches tickets page (initial or load more)
- `handleLoadMore()`: Handles "Load More" button click
- Maintains backward compatibility with existing UI structure (tickets grouped by agreement)

**UI Updates:**
- "Load More Tickets" button appears when `hasMore === true`
- Button shows loading spinner when `isLoadingMore === true`
- "No more tickets to load" message when `hasMore === false`
- Search term changes trigger reset and reload of first page

### 4. Tests (`app/actions/__tests__/pcn-tickets-pagination.test.ts`)

**Test Coverage:**
- ✅ Initial load returns 5 tickets with nextCursor
- ✅ Load more fetches next 5 tickets
- ✅ hasMore is false when no more tickets
- ✅ Filters are passed correctly
- ✅ Error handling
- ✅ Limit clamping (max 50)

## Performance Improvements

**Before:**
- Loaded ALL tickets for ALL agreements at once
- Could be 100+ tickets loaded on initial page load
- Slow initial render, especially with many bookings

**After:**
- Loads only 5 tickets initially
- Fast initial render (< 300ms target)
- Incremental loading as user scrolls/clicks "Load More"
- Reduces database query size and network payload

## API Design

**Request:**
```typescript
getAllPCNTicketsPaginatedAction(
  limit: number = 5,
  cursor?: string,
  filters?: { status?: string; searchTerm?: string }
)
```

**Response:**
```typescript
{
  items: PCNTicket[],
  nextCursor: string | null,
  hasMore: boolean
}
```

**Cursor Format:**
- Base64 encoded: `createdAt|id`
- Example: `MjAyNC0wMS0xNVQxMjowMDowMC4wMDBafHRpY2tldC0xMjM=`

## Database Indexes

The existing indexes from `scripts/901_add_pcn_tickets_indexes.sql` support this pagination:
- `idx_pcn_tickets_created_at` on `created_at DESC` (for sorting)
- `idx_pcn_tickets_status` (for status filtering)

## Usage

1. **Initial Load:**
   - Page loads with 5 tickets
   - If more exist, "Load More" button appears

2. **Load More:**
   - Click "Load More Tickets" button
   - Fetches next 5 tickets
   - Appends to existing list
   - Button updates based on `hasMore`

3. **Search/Filter:**
   - Changing search term resets to first page
   - Filters are applied to all paginated requests

4. **Create/Update Ticket:**
   - After creating or updating, reloads first page
   - Maintains current view state

## Testing

Run tests:
```bash
npm test -- app/actions/__tests__/pcn-tickets-pagination.test.ts
```

Manual testing:
1. Navigate to `/admin/pcn-tickets`
2. Verify initial load shows 5 tickets (if 5+ exist)
3. Click "Load More" to fetch next 5
4. Verify button disappears when no more tickets
5. Test search functionality resets pagination

## Files Changed

1. `lib/database.tsx` - Added `getAllPCNTicketsPaginated()` method
2. `app/actions/pcn-tickets.ts` - Added `getAllPCNTicketsPaginatedAction()`
3. `app/admin/pcn-tickets/page.tsx` - Updated UI to use pagination
4. `app/actions/__tests__/pcn-tickets-pagination.test.ts` - Tests (NEW)
5. `PCN_TICKETS_PAGINATION_SUMMARY.md` - Documentation (NEW)

## Notes

- Maintains backward compatibility with existing UI structure
- Cursor pagination is more stable than offset (no duplicates on concurrent updates)
- Limit is clamped to prevent abuse (max 50)
- Search/filter changes reset pagination to first page
- All loaded tickets are deduplicated by ID when appending


