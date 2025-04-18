# Implementation Plan: Add Feed Metadata Fields (title, text, type, htmlUrl) to FeedBase

## Overview
This plan outlines the steps to enhance the feed data model by adding additional metadata fields (title, text, type, htmlUrl, description) to the `FeedBase` interface. This will enable richer feed representation in storage, API, and UI, and align with standard OPML export/import formats.

---

## Steps

### 1. Update Type Definitions
- **Refactor** type definitions in `src/backend/types/feed.types.ts` to clarify the domain model:
  - **FeedBase**: only static, descriptive fields (do not include status or runtime info)
  - **FeedEntry**: extends FeedBase, adds dynamic/runtime fields (status, lastUpdate, etc.)
  - **FeedRecord**: extends FeedEntry, adds validation workflow specific fields (userId, lastValidated, category, etc.)

- The interfaces will be:
```typescript
export interface FeedBase {
    /** The URL of the feed (corresponds to xmlUrl in OPML) */
    url: string;
    /** Display name from OPML (the 'text' attribute, mandatory in OPML) */
    text: string;
    /** Feed's human-readable title (from RSS or OPML, optional but often simply duplicate the value of 'text') */
    title?: string;
    /** Feed type, usually 'rss' (optional, from OPML) */
    type?: string;
    /** Website URL for the feed (optional, from OPML) */
    htmlUrl?: string;
    /** Description from RSS/OPML (optional) */
    description?: string;
}

export interface FeedEntry extends FeedBase {
    /** Current status of the feed (active/inactive/dead/incompatible) */
    status: FeedStatus;
    /** Most recent update time of the feed, null if never updated or inaccessible */
    lastUpdate: string | null;
    /** Number of updates in the last 3 months */
    updatesInLast3Months: number;
    /** Reason for incompatibility if status is 'incompatible' */
    incompatibleReason?: string;
}

export interface FeedRecord extends FeedEntry {
    /** User this feed belongs to */
    userId: string;
    /** Category the feed belongs to */
    category: string;
    /** When the feed was last validated */
    lastValidated: string | null;
    /** History of validation attempts and results */
    validationHistory: ValidationHistory[];
    // ...other storage-specific fields
}
```


### 2. Update Feed Parsing and Data Population
- **In** `getFeedUpdateFrequency.ts`:
  - When parsing the RSS feed XML, extract the `text` (and any other available fields).
  - Populate the new fields in the returned `FeedEntry` object.
- **In** `parseOPML.ts`:
  - When importing feeds from OPML, extract and store `text`, `title`, `type`, and `htmlUrl`, `description` from each `<outline>` element.
  - If `title` is missing, use the `text` value as a fallback.
  - If `type` is missing, use 'rss' as a fallback.
  - If `htmlUrl` is missing, just leave it blank.
  - If `description` is missing, just leave it blank.

### 3. Update Storage Layer
- Ensure that the KV storage (and any other persistence layer) saves and retrieves the new fields as part of the feed record.

### 4. Update OPML Generation
- **In** `generateNewOPML.ts`:
  - Include the new fields (`title`, `text`, `type`, `htmlUrl`, `description`) when generating `<outline>` elements for export.
  - Ensure the output matches standard OPML structure for compatibility with other readers.

### 5. Update API and Data Flow
- Update API endpoints (if needed) to support the new fields in requests and responses.

### 6. Update Frontend UI
- **Feed List:**
  - Display the new fields (prefer `text` for display; fallback to `url` if missing).
  - Use `url` as the `text` hover display.
- **Feed Details/Export:**
  - Ensure the new fields are included in exported OPML files and any detailed feed views.

### 7. Testing & Validation
- Add/extend unit and integration tests to cover:
  - Feed import (OPML/XML parsing)
  - Feed export (OPML generation)
  - API responses
  - UI display of new fields

### 8. Migration (Optional)
- For existing feeds in storage, consider a migration script or background job to backfill `title` and other fields by re-parsing feeds if necessary.

---

## Notes
- Avoid adding `xmlUrl` since `url` already fulfills this role.
- Make new fields optional if some feeds may not have all metadata available.
- This plan ensures richer, more user-friendly feed data throughout the application.
