/**
 * Core feed-related types used throughout the application
 */

/**
 * Possible states for a feed
 */
export type FeedStatus = 'active' | 'inactive' | 'dead' | 'incompatible';

/**
 * Base feed interface with common properties shared across the application
 */
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

/**
 * Represents a feed entry specifically for OPML processing
 * This is equivalent to the previous FeedStatus interface in parseOPML.ts
 */
export interface FeedEntry extends FeedBase {
    /** Current status of the feed (active/inactive/dead/incompatible) */
    status: FeedStatus;
    /** Most recent update time of the feed, null if never updated or inaccessible */
    lastUpdate: string | undefined;
    /** Number of updates in the last 3 months */
    updatesInLast3Months: number;
    /** Reason for incompatibility if status is 'incompatible' */
    incompatibleReason?: string;
}

/**
 * Represents a feed record with all its metadata and validation history
 * Used primarily by the storage service
 */
export interface FeedRecord extends FeedEntry {
    /** User this feed belongs to */
    userId: string;
    /** Category the feed belongs to */
    category: string;
    /** When the feed was last validated */
    lastValidated: string | null;
    /** History of validation attempts and results */
    validationHistory: ValidationHistoryEntry[];
}

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

/**
 * Structured representation of OPML data, organized by categories
 * This is equivalent to the previous OPMLData interface in parseOPML.ts
 */
export interface FeedCollection {
    /** Map of category names to arrays of feeds in that category */
    categories: {
        [categoryName: string]: FeedEntry[];
    };
}