/**
 * Validation-related types used throughout the application
 */

import { FeedStatus } from './feed.types.ts';

/**
 * Status of a validation session
 */
export type ValidationSessionStatus = 'pending' | 'processing' | 'completed' | 'error';

/**
 * Represents the progress of a validation session
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
 * Error information for a feed validation
 */
export interface ValidationError {
  feedUrl: string;
  error: string;
  timestamp: string;
}

/**
 * Overall results of a validation process
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
  errors: ValidationError[];
  feedResults: FeedValidationResult[];
}

/**
 * Results of a batch validation process
 */
export interface BatchValidationResult {
  totalProcessed: number;
  results: FeedValidationResult[];
  errors: ValidationError[];
}