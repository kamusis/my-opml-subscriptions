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
    feeds: Array<{
      url: string,
      status: 'active' | 'inactive' | 'dead' | 'incompatible',
      lastUpdate: string | null,
      updatesInLast3Months: number,
      incompatibleReason?: string,
      category: string
    }>,
    total: number,
    page: number,
    totalPages: number
  }

GET /api/feeds/:feedUrl
- Purpose: Get detailed information about a specific feed
- Response: {
    url: string,
    status: 'active' | 'inactive' | 'dead' | 'incompatible',
    lastUpdate: string | null,
    updatesInLast3Months: number,
    incompatibleReason?: string,
    category: string,
    validationHistory: Array<{
      timestamp: string,
      status: string,
      error?: string
    }>
  }

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
   - `FeedStatus`: Basic feed information structure
   - `OPMLData`: Category-organized feed data structure

#### Required New Backend Components

1. Data Persistence Layer
   ```typescript
   interface StorageService {
     // Feed data storage
     saveFeedData(feed: FeedRecord): Promise<void>;
     getFeedData(url: string): Promise<FeedRecord | null>;
     updateFeedData(url: string, data: Partial<FeedRecord>): Promise<void>;
     
     // Validation session management
     saveValidationSession(id: string, data: ValidationSession): Promise<void>;
     getValidationSession(id: string): Promise<ValidationSession | null>;
     updateValidationProgress(id: string, progress: ValidationProgress): Promise<void>;
     
     // Category management
     getCategoryStats(): Promise<CategoryStats[]>;
     updateCategoryFeeds(category: string, feeds: string[]): Promise<void>;
     
     // Batch operations
     batchUpdateFeeds(updates: FeedUpdate[]): Promise<BatchResult>;
   }
   ```

2. WebSocket Service
   ```typescript
   interface WebSocketService {
     // Connection management
     handleConnection(client: WebSocket): void;
     handleDisconnection(client: WebSocket): void;
     
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
     getValidationStatus(validationId: string): Promise<ValidationStatus>;
     
     // Feed validation
     validateFeeds(feeds: string[]): Promise<ValidationResults>;
     revalidateFeed(url: string): Promise<FeedValidationResult>;
     
     // Batch operations
     batchValidate(urls: string[]): Promise<BatchValidationResult>;
   }
   ```

### 3.2 API Endpoints Implementation Status

```
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

GET /api/feeds/:feedUrl
Status: Needs Implementation
Backend Dependencies:
- New: StorageService.getFeedData
Implementation Notes:
- Return cached validation results
- Include validation history

POST /api/feeds/revalidate
Status: Partial Implementation
Backend Dependencies:
- Existing: Validation functions
- New: ValidationService.revalidateFeed
Implementation Notes:
- Implement selective revalidation
- Add progress tracking

POST /api/feeds/batch
Status: Needs Implementation
Backend Dependencies:
- New: StorageService.batchUpdateFeeds
Implementation Notes:
- Implement batch operations
- Add progress tracking

GET /api/export
Status: Implemented
Backend Dependencies:
- Existing: generateNewOPML
Implementation Notes:
- Already fully implemented

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
        feedUrl: string;
        error: string;
    }>;
}
```

### 3.4 WebSocket Communications
```
Connection: ws://server/ws

Message Types:

1. Client -> Server
   SUBSCRIBE_VALIDATION: {
     validationId: string
   }

   UNSUBSCRIBE_VALIDATION: {
     validationId: string
   }

2. Server -> Client
   VALIDATION_STARTED: {
     validationId: string,
     totalFeeds: number
   }
   
   FEED_PROCESSED: {
     validationId: string,
     currentFeed: string,
     processedCount: number,
     totalFeeds: number,
     status: 'active' | 'inactive' | 'dead' | 'incompatible',
     error?: string
   }
   
   VALIDATION_COMPLETE: {
     validationId: string,
     categories: {
       dead: number,
       active: number,
       inactive: number,
       incompatible: number
     },
     duration: number
   }

   VALIDATION_ERROR: {
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

## 9. Logging System Design

### 9.1 Logging Architecture
- Based on Deno's standard logging module (@std/log)
- Structured logging with consistent format
- Multiple log levels for different environments
- Separate loggers for different components

### 9.2 Log Levels
1. DEBUG
   - Detailed information for debugging
   - Feed validation steps
   - WebSocket message details
   - State transitions
   
2. INFO
   - General operational information
   - User actions (file upload, validation start)
   - Successful operations
   - Category changes
   
3. WARNING
   - Potential issues that don't stop operation
   - Slow feed responses
   - Retry attempts
   - Performance degradation
   
4. ERROR
   - Operation failures
   - Feed validation errors
   - API errors
   - WebSocket connection issues

### 9.3 Log Categories
1. Operation Logs
   - File upload operations
   - OPML processing
   - Feed validation
   - Export operations

2. Performance Logs
   - API response times
   - Feed check durations
   - WebSocket performance
   - UI rendering metrics

3. Error Logs
   - Validation failures
   - Network errors
   - Parser errors
   - System errors

4. Security Logs
   - File validation results
   - Rate limit warnings
   - Invalid access attempts
   - Security-related events

### 9.4 Log Format
```typescript
{
  timestamp: string;    // ISO format
  level: LogLevel;      // DEBUG|INFO|WARNING|ERROR
  category: string;     // Operation|Performance|Error|Security
  component: string;    // UI component or service name
  message: string;      // Human-readable message
  details?: {           // Additional structured data
    feedUrl?: string;
    duration?: number;
    errorCode?: string;
    stackTrace?: string;
    userId?: string;
    // ... other contextual data
  }
}
```

### 9.5 Log Storage and Rotation
1. Development Environment
   - Console output with colors
   - Full debug information
   - Local file storage optional

2. Production Environment
   - File-based logging
   - Log rotation (size/time based)
   - Compression of old logs
   - Retention policy management

### 9.7 Privacy and Security
1. Data Protection
   - PII (Personally Identifiable Information) filtering
   - Sensitive data masking
   - Access control to logs
   - Secure log storage

2. Compliance
   - Log retention policies
   - Data minimization
   - Audit trail requirements
   - Geographic restrictions