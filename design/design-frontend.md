# Web UI Design Document

## 1. Requirement Analysis
The project needs a web-based user interface to make OPML subscription management more accessible and user-friendly. The interface should support:
- OPML file upload and processing
- Feed validation and status monitoring
- Interactive feed management
- Export functionality
- Real-time status updates

## 2. Technical Architecture

### 2.1 Technology Stack
- **Framework**: Fresh (Deno-based)
  - Provides excellent TypeScript support
  - Server-side rendering capabilities
  - Island architecture for optimal performance
  - Built-in Preact components

### 2.2 Key Components
1. OPML File Upload Component
   - Drag & drop interface
   - File validation
   - Upload progress indicator

2. Feed Validation Dashboard
   - Status overview
   - Processing progress
   - Error reporting

3. Interactive Feed List
   - Filtering capabilities
   - Status indicators
   - Batch operations

4. Export Module
   - OPML generation
   - Download functionality

5. Real-time Status Component
   - WebSocket connection
   - Live updates
   - Progress tracking

## 3. API Design

### 3.1 Endpoints
```
POST /api/upload
- Purpose: OPML file upload
- Request: multipart/form-data
- Response: {
    id: string,
    status: string,
    filename: string
  }

POST /api/validate
- Purpose: Trigger feed validation
- Request: {opmlId: string}
- Response: {
    validationId: string,
    status: string,
    totalFeeds: number
  }

GET /api/status
- Purpose: Check validation progress
- Query: ?validationId=string
- Response: {
    progress: number,
    status: string,
    details: {
      currentFeed?: string,
      processedCount: number,
      totalFeeds: number,
      error?: string
    }
  }

GET /api/feeds
- Purpose: Retrieve feed list
- Query: ?filter=string&sort=string&category=string&status=string&page=number&limit=number
- Response: {
    feeds: Array<FeedRecord>,
    total: number,
    page: number,
    totalPages: number
  }

GET /api/feeds/:feedUrl
- Purpose: Get detailed information about a specific feed
- Response: FeedRecord

POST /api/feeds/revalidate
- Purpose: Revalidate specific feeds
- Request: {
    feedUrls: string[]
  }
- Response: {
    validationId: string,
    totalFeeds: number
  }

POST /api/feeds/batch
- Purpose: Perform batch operations on feeds
- Request: {
    operation: 'revalidate' | 'remove' | 'updateCategory',
    feedUrls: string[],
    data?: {
      newCategory?: string
    }
  }
- Response: {
    success: boolean,
    processed: number,
    errors?: Array<{
      feedUrl: string,
      error: string
    }>
  }

GET /api/export
- Purpose: Download processed OPML
- Query: ?id=string&status=string&category=string
- Response: OPML file

GET /api/categories/stats
- Purpose: Get statistics for feed categories
- Response: {
    categories: Array<{
      name: string,
      totalFeeds: number,
      activeFeeds: number,
      inactiveFeeds: number,
      deadFeeds: number,
      incompatibleFeeds: number,
      mostUpdatedFeeds: Array<{
        url: string,
        updates: number
      }>
    }>,
    total: {
      feeds: number,
      active: number,
      inactive: number,
      dead: number,
      incompatible: number
    }
  }

GET /api/incompatible/reasons
- Purpose: Get list of incompatibility reasons and affected feeds
- Response: {
    reasons: Array<{
      reason: string,
      count: number,
      feeds: Array<{
        url: string,
        lastChecked: string,
        category: string
      }>
    }>
  }
```

### 3.1 Backend Implementation Status

#### Existing Backend Functions
1. File Processing
   - `parseOPML`: OPML file parsing
   - `checkFeedAccessibility`: Feed URL accessibility check
   - `checkFeedCompatibility`: Feed format validation
   - `getFeedUpdateFrequency`: Feed update analysis
   - `generateNewOPML`: OPML file generation
   - `generateStatistics`: Statistics calculation

2. Data Structures
   - `FeedBase`: Base interface with common feed properties
   - `FeedEntry`: Feed entry used in OPML processing
   - `FeedRecord`: Extended feed record used for storage
   - `FeedCollection`: Category-organized collection of feeds
   - `ValidationHistoryEntry`: Records validation attempts

#### Required New Backend Components

1. Data Persistence Layer
   ```typescript
    // Interface reflecting the implemented KVStorageService capabilities
    interface IKVStorageService {
        // Lifecycle (Note: initialize is a static factory method, not part of the instance interface)
        close(): void;
        clearAllData(): Promise<void>; // For testing/utility

        // Feed data storage
        saveFeedData(feed: FeedRecord, options?: AtomicOptions): Promise<{ versionstamp: string }>;
        getFeedData(url: string): Promise<{ value: FeedRecord; versionstamp: string } | null>;
        updateFeedData(url: string, data: Partial<FeedRecord>, options?: AtomicOptions): Promise<{ versionstamp: string }>;
        listFeeds(options: ListFeedsOptions): Promise<ListFeedsResult>; // Added for feed retrieval API
        deleteFeedData(url: string, options?: AtomicOptions): Promise<void>; // Added for feed removal

        // Validation session management
        saveValidationSession(id: string, data: ValidationSession): Promise<{ versionstamp: string }>;
        getValidationSession(id: string): Promise<{ value: ValidationSession; versionstamp: string } | null>;
        updateValidationProgress(id: string, progress: ValidationProgress, options?: AtomicOptions): Promise<{ versionstamp: string }>;
        deleteValidationSession(id: string): Promise<void>; // Added for session cleanup

        // Category management
        getCategoryStats(): Promise<CategoryStats[]>; // Uses CategoryStats from feed types
        updateCategoryFeeds(category: string, feeds: string[], options?: AtomicOptions): Promise<{ versionstamp: string }>;
        listCategories(): Promise<string[]>; // Added for retrieving category names

        // Batch operations with atomic guarantees
        atomic(): AtomicBatch; // Exposes atomic operation builder
        batchUpdateFeeds(updates: FeedUpdate[]): Promise<BatchResult>;
    }

    // Supporting types (defined elsewhere, e.g., storage.types.ts)
    interface FeedRecord { /* ... */ }
    interface ValidationSession { /* ... */ }
    interface ValidationProgress { /* ... */ }
    interface CategoryStats { /* ... */ } // Ensure this matches the implementation's needs
    interface FeedUpdate { /* ... */ }
    interface BatchResult { /* ... */ }
    interface AtomicOptions { /* ... */ }
    interface ListFeedsOptions { /* ... */ }
    interface ListFeedsResult { /* ... */ }
    interface AtomicBatch { /* ... */ }
   ```

2. WebSocket Service
   ```typescript
   interface WebSocketService {
     // Connection management
     handleConnection(client: WebSocket): void;
     handleDisconnection(clientId: string): void; 
     
     // Validation progress broadcasting
     broadcastProgress(validationId: string, progress: ValidationProgress): void;
     broadcastComplete(validationId: string, results: ValidationResults): void;
     broadcastError(validationId: string, error: ValidationError): void;
   }
   ```

3. Validation Service
   ```typescript
   interface ValidationService {
     // Validation session management
     startValidation(opmlId: string): Promise<string>; // Returns validationId
     getValidationStatus(validationId: string): Promise<ValidationSession | null>; 
     
     // Feed validation
     validateFeeds(feeds: string[]): Promise<ValidationResults>; // Now includes detailed feed results
     revalidateFeed(url: string): Promise<FeedValidationResult>;
   }
   ```

Design following directory structure for services
```plaintext
src/backend/
├── services/
│   ├── storage/      # For StorageService and related files
│   ├── websocket/    # For WebSocketService and related files
│   └── validation/   # For ValidationService and related files
└── types/            # For shared TypeScript interfaces and types
```

### 3.2 API Endpoints Implementation Status

```markdown
POST /api/upload
Status: Needs Implementation
Backend Dependencies:
- Existing: parseOPML
- New: StorageService.saveFeedData
Implementation Notes:
- Add file upload handling
- Add file validation
- Integrate with storage service

POST /api/validate
Status: Partial Implementation
Backend Dependencies:
- Existing: All validation functions
- New: ValidationService, WebSocketService
Implementation Notes:
- Convert synchronous process to async
- Add progress tracking
- Implement WebSocket notifications

GET /api/status
Status: Needs Implementation
Backend Dependencies:
- New: ValidationService.getValidationStatus
Implementation Notes:
- Implement progress tracking
- Add validation session management

GET /api/feeds
Status: Needs Implementation
Backend Dependencies:
- Existing: OPMLData structure
- New: StorageService.getFeedData
Implementation Notes:
- Add pagination
- Add filtering
- Add sorting

This endpoint will leverage the existing listFeeds function in the StorageService and support the requested features: pagination, filtering, and sorting.

/api/feeds Response Format:
{
  feeds: FeedRecord[];  // Array of feed records
  total: number;        // Total number of feeds matching filters
  cursor: string | null; // Next cursor for pagination
  hasMore: boolean;     // Whether more results are available
}

//no need for implementation at the moment
GET /api/feeds/:feedUrl
Status: Needs Implementation
Backend Dependencies:
- New: StorageService.getFeedData
Implementation Notes:
- Return single feed validation results
- Include validation history

//no need for implementation at the moment
POST /api/feeds/revalidate
Status: Partial Implementation
Backend Dependencies:
- Existing: Validation functions
- New: ValidationService.revalidateFeed
Implementation Notes:
- Implement selective revalidation
- Add progress tracking

//no need for implementation at the moment
POST /api/feeds/batch
Status: Needs Implementation
Backend Dependencies:
- New: StorageService.batchUpdateFeeds
Implementation Notes:
- Implement batch operations
- Add progress tracking

POST /api/export
- Purpose: For sending selected feed data to generate OPML
- Request Body:
{
  feeds: FeedRecord[]; // Array of selected feed records to export
  options?: {
    includeValidationHistory?: boolean; // Whether to include validation history
    includeCategoryStructure?: boolean; // Whether to maintain category structure
  }
}
- Response: 
Content-Type: application/xml (OPML format)
Headers: 
- Content-Disposition: attachment; filename="export_<timestamp>.opml"
Body: Generated OPML file content

// need to redesign the backend, if call from frontend, no need to write markdown by default.
// perhaps add a new function handle the frontend request
GET /api/categories/stats
Status: Partial Implementation
Backend Dependencies:
- Existing: generateStatistics
- New: StorageService.getCategoryStats
Implementation Notes:
- Convert to real-time stats
- Add caching

GET /api/incompatible/reasons
Status: Partial Implementation
Backend Dependencies:
- Existing: calculateStatistics
- New: StorageService
Implementation Notes:
- Add reason aggregation
- Add caching
```

### 3.3 New Data Structures

```typescript
interface FeedRecord {
    url: string;
    status: 'active' | 'inactive' | 'dead' | 'incompatible';
    lastUpdate: string | null;
    updatesInLast3Months: number;
    incompatibleReason?: string;
    category: string;
    lastValidated: string;
    validationHistory: ValidationHistoryEntry[];
}

interface ValidationSession {
    id: string;
    opmlId: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: ValidationProgress;
    startTime: string;
    endTime?: string;
    error?: string;
}

interface ValidationProgress {
    processedFeeds: number;
    totalFeeds: number;
    currentFeed?: string;
    categoryCounts: {
        active: number;
        inactive: number;
        dead: number;
        incompatible: number;
    };
}

interface ValidationHistoryEntry {
    timestamp: string;
    status: string;
    error?: string;
}

interface BatchResult {
    success: boolean;
    processed: number;
    errors?: Array<{
      feedUrl: string,
      error: string
    }>;
}

interface ValidationResults {
    validatedFeeds: number;
    categories: {
        active: number;
        inactive: number;
        dead: number;
        incompatible: number;
    };
    duration: number;
    errors: ValidationError[];
    feedResults: FeedValidationResult[];
}

interface ValidationError {
    feedUrl: string;
    error: string;
    timestamp: string;
}

interface FeedValidationResult {
    url: string;
    status: 'active' | 'inactive' | 'dead' | 'incompatible';
    error?: string;
    lastUpdate?: string;
    updatesInLast3Months?: number;
}
```

### 3.4 WebSocket Communications
```
Connection: ws://server/ws

Message Types:

1. Client -> Server
  subscribe: { type: 'subscribe', validationId: string }
  unsubscribe: { type: 'unsubscribe', validationId: string }

2. Server -> Client
  connected: { type: 'connected', clientId: string }
  subscribed: { type: 'subscribed', validationId: string }
  unsubscribed: { type: 'unsubscribed', validationId: string }
    
  started: {
    validationId: string,
    totalFeeds: number
  }
  
  progress: {
    validationId: string,
    currentFeed: string,
    processedCount: number,
    totalFeeds: number,
    status: 'active' | 'inactive' | 'dead' | 'incompatible',
    error?: string
  }
  
  complete: {
    validationId: string,
    categories: {
      dead: number,
      active: number,
      inactive: number,
      incompatible: number
    },
    duration: number
  }

  error: {
    validationId: string,
    error: string
  }
```

### 3.5 Progress Tracking
1. File Upload Progress
   - Uses browser's native upload progress events
   - Progress calculation: (bytesLoaded / totalBytes) * 100
   - Real-time updates during file transfer

2. Validation Progress
   - WebSocket-based real-time updates
   - Two-step process:
     * Step 1: OPML parsing
     * Step 2: Feed validation (x/total feeds)
   - Progress calculation per step
   - Current feed URL display
   - Final category distribution

## 4. Interface Design

### 4.1 Layout Structure
```
+------------------+
|      Header      |
+------------------+
|   Upload Zone    |
|  [Upload Button] |
|  [Validate Btn]  |
+------------------+
| Status Dashboard |
| [Category Cards] |
| Dead: X         |
| Active: Y       |
| Inactive: Z     |
| Incompatible: W |
+------------------+
|   Category View  |
|------------------|
| Incompatible    |
| Reasons Panel   |
|  - Reason 1 (n) |
|  - Reason 2 (m) |
+------------------+
|    Feed List     |
| (Selected Type)  |
|                  |
+------------------+
|     Footer       |
+------------------+
```

### 4.2 Component Details
1. Header
   - Project title
   - Navigation menu
   - Action buttons

2. Upload Zone
   - Initial state: Only upload button visible
   - After upload: Validate button appears
   - File selection button
   - Upload progress indicator
   - Validation trigger button

3. Status Dashboard
   - Dynamic state transitions:
     a. Initial State:
        * Empty or minimal information display
        * Ready for file upload
     
     b. Upload Progress State:
        * File upload progress bar
        * Shows current/total size (e.g., "2.4MB / 3MB")
        * Percentage completion indicator
        * Smooth progress animation
     
     c. Validation Progress State:
        * Step indicator (e.g., "Step 2/2")
        * Progress bar for current step
        * Processed feeds counter (e.g., "67/150 feeds")
        * Currently processing feed URL
        * Real-time updates via WebSocket
     
     d. Complete State:
        * Interactive category cards layout
        * Categories: Dead, Active, Inactive, Incompatible
        * Each category shows total feed count
        * Cards are clickable to filter Feed List
        * Desktop: Cards in single row
        * Mobile: Cards in 2x2 grid

4. Category View (Incompatible Feeds Section)
   - Visible only when Incompatible category selected
   - Expandable list of incompatible reasons
   - Each reason shows affected feed count
   - Clickable reasons to filter Feed List
   - Desktop: Can be side panel
   - Mobile: Becomes dropdown/accordion

5. Feed List Section
   - Context-aware display:
     * For Dead/Active/Inactive: Direct feed list
     * For Incompatible: Feeds grouped by selected reason
   - Filter controls
   - Sortable columns
   - Status indicators
   - Batch action toolbar with operations:
     * Re-validate selected feeds
     * Export selected feeds as OPML
     * Remove selected feeds
     * Update feed categories (for manual overrides)
   - Feed Item Display:
     * Feed title and URL
     * Last check timestamp
     * Current status with icon
     * Update frequency (if available)
     * Quick actions (re-validate, remove, details)
   - Feed Details Modal:
     * Complete feed information
     * Validation history
     * Compatibility check results
     * Feed metadata (update frequency, last post date)
     * Raw feed preview
     * Full error logs (if any)
     * Manual category override controls

6. Footer
   - Export controls
   - Additional information
   - Version info

### 4.3 User Interaction Flow
1. Initial State
   - Upload Zone visible with upload button
   - Other sections empty or minimal

2. After OPML Upload
   - Upload Zone shows success
   - Validate button appears
   - Status Dashboard prepared for data

3. After Validation
   - Status Dashboard populates with category cards
   - Each card shows feed count
   - Cards become interactive

4. Category Selection
   - Normal categories (Dead/Active/Inactive):
     * Directly updates Feed List with filtered feeds
   - Incompatible category:
     * Activates Category View
     * Shows reason breakdown
     * User selects specific reason
     * Feed List updates with feeds for selected reason

### 4.4 Responsive Design
1. Desktop Layout
   - Status Dashboard cards in horizontal row
   - Category View as collapsible sidebar
   - Feed List with flexible width
   - Side-by-side view for incompatible feeds and reasons

2. Mobile Layout
   - Status Dashboard cards in 2x2 grid
   - Category View as full-width accordion
   - Reason selection as dropdown
   - Feed List as scrollable full-width section

## 5. State Management

### 5.1 Client-side State
- Use Preact signals for reactive state management
- Local storage for user preferences
- Memory cache for processed feeds

### 5.2 Server-side State
- Processing status tracking
- Validation results storage
- Session management

## 6. Performance Optimizations

### 6.1 Loading Strategies
- Progressive loading for large OPML files
- Lazy loading for feed list
- Client-side caching
- Debounced real-time updates

### 6.2 Responsive Design
- Mobile-first approach
- Adaptive layouts
- Touch-friendly controls
- Optimized asset loading

## 7. Error Handling

### 7.1 User Feedback
- Clear error messages
- Validation feedback
- Progress indicators
- Status notifications

### 7.2 Error Recovery
- Automatic retry mechanism:
  * Configurable retry attempts (default: 3)
  * Exponential backoff between retries
  * Different retry strategies for different error types:
    - Network errors: Quick retries
    - Server errors: Longer delays
    - Parse errors: No automatic retry
- Manual retry options:
  * Individual feed retry button
  * Batch retry for selected feeds
  * "Retry All Failed" action for bulk operations
- Validation failure handling:
  * Detailed error information in feed details view
  * Error categorization (network, parse, compatibility)
  * Suggested actions based on error type
  * Manual category override option
- Recovery workflow:
  1. Automatic retries for transient errors
  2. User notification of persistent failures
  3. Manual intervention options:
     - Retry with different settings
     - Mark as inactive
     - Update feed URL
     - Remove feed
  4. Batch recovery operations:
     - Retry all failed feeds
     - Export failed feeds for external processing
     - Bulk update feed statuses
- Error logging:
  * Client-side error tracking
  * Server-side detailed logs
  * Error correlation with feed metadata
  * Export error logs feature
- Fallback states:
  * Cached data display during API errors
  * Offline mode for previously loaded feeds
  * Graceful degradation of real-time features
  * Recovery state persistence

### 7.3 Validation State Management
- Per-feed validation state:
  * Last validation attempt timestamp
  * Retry count
  * Error history
  * Current status
- Batch validation state:
  * Overall progress
  * Failed feeds count
  * Retry queue management
  * Operation audit log
- Recovery checkpoints:
  * Save partial validation results
  * Resume from last successful check
  * Batch operation progress persistence
  * State restoration after browser refresh

### 7.4 User Recovery Actions
- Individual Feed Level:
  * View detailed error information
  * Manual retry with optional parameters
  * Update feed configuration
  * Override automatic categorization
- Batch Level:
  * Select multiple feeds by status
  * Apply bulk actions:
    - Retry validation
    - Update categories
    - Export for external processing
  * Progress tracking for bulk operations
- Global Level:
  * Retry all failed validations
  * Export error report
  * Reset validation state
  * Configure retry parameters

## 8. Security Considerations

### 8.1 File Upload Security
- File size limits
- Type validation
- Malware scanning
- Rate limiting

### 8.2 Data Protection
- Input sanitization
- XSS prevention
- CSRF protection
- Secure communication

## 9. Logging System

### 9.1 Logging Architecture
- Based on Deno's standard logging module (@std/log)
- Module-based logging with consistent format
- Four standard log levels
- One unified log format for all components

### 9.2 Log Levels
1. DEBUG: Detailed debugging information
2. INFO: General operational information
3. WARN: Warning messages for potential issues
4. ERROR: Error conditions and failures

### 9.3 Log Format
```
${LEVEL} [${ISO_TIMESTAMP}] [${MODULE}] ${MESSAGE}
```

Example log messages:
```
DEBUG [2025-04-08T10:30:15.123Z] [feedAccessibility] Checking feed: http://example.com/feed
INFO [2025-04-08T10:30:16.456Z] [parseOPML] Parsed OPML file successfully
WARN [2025-04-08T10:30:17.789Z] [feedCompatibility] Unexpected content type
ERROR [2025-04-08T10:30:18.012Z] [statistics] Failed to generate chart
```

### 9.4 Implementation
```typescript
const logger = createLogger("moduleName");
logger.debug("Debug message");
logger.info("Info message");
logger.warn("Warning message");
logger.error("Error message");
```

### 9.5 Log Management
1. Development Environment
   - Console output with colors
   - Full debug information

2. Production Environment
   - Console output (can be redirected to files)
   - Configurable log levels