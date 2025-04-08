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
    clearAllData(): Promise<void>;

    // Feed data storage
    saveFeedData(feed: FeedRecord, options?: AtomicOptions): Promise<{ versionstamp: string }>;
    getFeedData(url: string): Promise<{ value: FeedRecord; versionstamp: string } | null>;
    updateFeedData(url: string, data: Partial<FeedRecord>, options?: AtomicOptions): Promise<{ versionstamp: string }>;
    listFeeds(options: ListFeedsOptions): Promise<ListFeedsResult>; // Uses ListFeedsResult from this file
    deleteFeedData(url: string, options?: AtomicOptions): Promise<void>;

    // Validation session management
    saveValidationSession(id: string, data: ValidationSession): Promise<{ versionstamp: string }>;
    getValidationSession(id: string): Promise<{ value: ValidationSession; versionstamp: string } | null>;
    updateValidationProgress(id: string, progress: ValidationProgress, options?: AtomicOptions): Promise<{ versionstamp: string }>;
    deleteValidationSession(id: string): Promise<void>;

    // Category management
    getCategoryStats(): Promise<FeedCategoryStats[]>; // Use imported CategoryStats from feed.types.ts
    updateCategoryFeeds(category: string, feeds: string[], options?: AtomicOptions): Promise<{ versionstamp: string }>;
    listCategories(): Promise<string[]>;

    // Batch operations with atomic guarantees
    atomic(): AtomicBatch; // Uses AtomicBatch from this file
    batchUpdateFeeds(updates: FeedUpdate[]): Promise<BatchResult>; // Uses BatchResult from this file
}
