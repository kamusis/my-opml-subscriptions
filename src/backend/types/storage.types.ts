/**
 * Storage-related types used throughout the application
 */

import type { FeedRecord, FeedUpdate, FeedStatus, CategoryStats as FeedCategoryStats } from './feed.types.ts'; // Ensure CategoryStats is imported
import type { ValidationSession, ValidationProgress } from './validation.types.ts';

/**
 * Storage key prefixes for different data types
 */
export const enum StoragePrefix {
    Feed = 'feed:',
    Session = 'session:',
    Category = 'category:',
    Stats = 'stats:' // Assuming stats might be used elsewhere, keep if needed
}

/**
 * Result of a batch operation
 */
export interface BatchResult {
    success: boolean;
    processed: number;
    errors?: Array<{
        feedUrl: string;
        error: string;
    }>;
}

/**
 * Options for listing feeds with cursor-based pagination
 */
export interface ListFeedsOptions {
    filter?: string;
    sort?: 'lastUpdate' | 'status' | 'category' | 'updatesInLast3Months';
    category?: string;
    status?: FeedStatus;
    cursor?: string; // KV cursor for pagination
    limit?: number;
    prefix?: string; // KV prefix for range queries (Keep if used, Deno KV list uses prefix array)
}

/**
 * Result of listing feeds with cursor-based pagination
 */
export interface ListFeedsResult {
    feeds: FeedRecord[];
    total: number;
    cursor: string | null; // Next cursor for pagination
    hasMore: boolean;
}

/**
 * Atomic operation options
 */
export interface AtomicOptions {
    check?: {
        key: string; // Note: Implementation uses Deno.KvKey, consider aligning if needed
        versionstamp: string;
    };
}

/**
 * Atomic batch operations interface
 */
export interface AtomicBatch {
    check(key: string, versionstamp: string): this; // Note: Implementation uses Deno.KvKey, consider aligning if needed
    set(key: string, value: unknown): this; // Note: Implementation uses Deno.KvKey, consider aligning if needed
    delete(key: string): this; // Note: Implementation uses Deno.KvKey, consider aligning if needed
    commit(): Promise<{ success: boolean; versionstamp?: string }>; // Matches implementation return
}


/**
 * Storage service interface specifically for the Deno KV implementation
 * (Renamed from IStorageService)
 */
export interface IKVStorageService {
    // REMOVED: initialize(): Promise<IKVStorageService>; // Initialization is handled by the static factory method

    // Lifecycle
    close(): void;

    // Feed data storage
    /**
     * Saves or updates a feed record for a specific user
     */
    saveFeedData(userId: string, feed: FeedRecord, options?: AtomicOptions): Promise<{ versionstamp: string }>;
    /**
     * Retrieves a feed record for a user by URL
     */
    getFeedData(userId: string, url: string): Promise<{ value: FeedRecord; versionstamp: string } | null>;
    /**
     * Updates specific fields of a feed record for a user
     */
    updateFeedData(userId: string, url: string, data: Partial<FeedRecord>, options?: AtomicOptions): Promise<{ versionstamp: string }>;
    /**
     * Lists feeds for a user with filtering, sorting, and pagination support
     */
    listFeeds(userId: string, options: ListFeedsOptions): Promise<ListFeedsResult>;
    /**
     * Deletes a feed record for a user
     */
    deleteFeedData(userId: string, url: string, options?: AtomicOptions): Promise<void>;

    // Validation session management
    /**
     * Saves a validation session for a user
     */
    saveValidationSession(userId: string, id: string, data: ValidationSession): Promise<{ versionstamp: string }>;
    /**
     * Retrieves a validation session for a user by ID
     */
    getValidationSession(userId: string, id: string): Promise<{ value: ValidationSession; versionstamp: string } | null>;
    /**
     * Updates the progress of an ongoing validation session for a user
     */
    updateValidationProgress(userId: string, id: string, progress: ValidationProgress, options?: AtomicOptions): Promise<{ versionstamp: string }>;
    /**
     * Deletes a validation session for a user
     */
    deleteValidationSession(userId: string, id: string): Promise<void>;

    // Category management
    /**
     * Generates statistics for all feed categories for a user
     */
    getCategoryStats(userId: string): Promise<FeedCategoryStats[]>; // Use imported CategoryStats from feed.types.ts
    /**
     * Updates the list of feeds in a category for a user
     */
    updateCategoryFeeds(userId: string, category: string, feeds: string[], options?: AtomicOptions): Promise<{ versionstamp: string }>;
    /**
     * Lists all unique categories from feed records for a user
     */
    listCategories(userId: string): Promise<string[]>;

    // Batch operations with atomic guarantees
    atomic(): AtomicBatch; // Uses AtomicBatch from this file
    batchUpdateFeeds(userId: string, updates: FeedUpdate[]): Promise<BatchResult>; // Uses BatchResult from this file
}
