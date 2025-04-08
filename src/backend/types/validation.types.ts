/**
 * Validation-related types used throughout the application
 */

import type { FeedStatus } from './feed.types.ts';

/**
 * Represents a validation session
 */
export interface ValidationSession {
    id: string;
    opmlId: string;
    status: ValidationSessionStatus;
    progress: ValidationProgress;
    startTime: string;
    endTime?: string;
    error?: string;
}

/**
 * Possible states for a validation session
 */
export type ValidationSessionStatus = 'pending' | 'processing' | 'completed' | 'error';

/**
 * Validation progress information
 */
export interface ValidationProgress {
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

/**
 * Results of a validation operation
 */
export interface ValidationResults {
    validatedFeeds: number;
    categories: {
        active: number;
        inactive: number;
        dead: number;
        incompatible: number;
    };
    duration: number;
    errors?: ValidationError[];
}

/**
 * Result of validating a single feed
 */
export interface FeedValidationResult {
    url: string;
    status: FeedStatus;
    error?: string;
    lastUpdate?: string;
    updatesInLast3Months?: number;
}

/**
 * Result of a batch validation operation
 */
export interface BatchValidationResult {
    totalProcessed: number;
    results: FeedValidationResult[];
    errors: ValidationError[];
}

/**
 * Represents a validation error
 */
export interface ValidationError {
    feedUrl: string;
    error: string;
    timestamp: string;
}