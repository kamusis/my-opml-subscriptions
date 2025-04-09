/**
 * Core feed-related types used throughout the application
 */

/**
 * Represents a feed record with all its metadata and validation history
 */
export interface FeedRecord {
    url: string;
    status: FeedStatus;
    lastUpdate: string | null;
    updatesInLast3Months: number;
    incompatibleReason?: string;
    category: string;
    lastValidated: string | null;
    validationHistory: ValidationHistoryEntry[];
}

/**
 * Possible states for a feed
 */
export type FeedStatus = 'active' | 'inactive' | 'dead' | 'incompatible';

/**
 * An entry in the feed's validation history
 */
export interface ValidationHistoryEntry {
    timestamp: string;
    status: FeedStatus;
    error?: string;
}

/**
 * Category statistics
 */
export interface CategoryStats {
    name: string;
    totalFeeds: number;
    activeFeeds: number;
    inactiveFeeds: number;
    deadFeeds: number;
    incompatibleFeeds: number;
    mostUpdatedFeeds: Array<{
        url: string;
        updates: number;
    }>;
}

/**
 * Feed update for batch operations
 */
export interface FeedUpdate {
    url: string;
    data: Partial<FeedRecord>;
}