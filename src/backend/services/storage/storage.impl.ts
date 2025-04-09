/// <reference lib="deno.unstable" />

import { createLogger } from "../../../utils/logger.ts";
import type {
  AtomicBatch,
  AtomicOptions,
  BatchResult,
  IKVStorageService,
  ListFeedsOptions,
  ListFeedsResult,
} from "../../types/storage.types.ts";
import type { 
  CategoryStats,
  FeedRecord, 
  FeedUpdate 
} from "../../types/feed.types.ts";
import type { 
  ValidationProgress, 
  ValidationSession 
} from "../../types/validation.types.ts";

//TODO: scaling to a multi-user application! [StoragePrefix.Feed, feed.url]->[userId, StoragePrefix.Feed, feed.url]
import { StoragePrefix } from "./storage.constants.ts";

const logger = createLogger("storage");

/**
 * Implementation of the storage service using Deno's built-in Key-Value store (Deno KV).
 * This service provides persistent storage for feed data, validation sessions, and category information.
 * 
 * Key features:
 * - Atomic operations support for data consistency
 * - Cursor-based pagination for efficient data retrieval
 * - Category-based feed organization
 * - Validation session management
 * - Batch operations with rollback support
 * 
 * Data organization:
 * - Feeds are stored with prefix 'feed:'
 * - Validation sessions with prefix 'session:'
 * - Categories with prefix 'category:'
 * - Statistics with prefix 'stats:'
 */
export class KVStorageService implements IKVStorageService {
  /** Instance of Deno KV store */
  private kv: Deno.Kv;
  
  /**
   * Private constructor to enforce singleton pattern and initialization through initialize()
   * @param kv - Initialized Deno KV instance
   */
  private constructor(kv: Deno.Kv) {
    this.kv = kv;
  }

  /**
   * Creates a new instance of KVStorageService with an initialized Deno KV store
   * @returns Promise<KVStorageService> - Initialized storage service
   */
  static async initialize(path?: string): Promise<KVStorageService> {
    const kv = await Deno.openKv(path);
    return new KVStorageService(kv);
  }

  /**
   * Saves or updates a feed record in the store
   * Supports atomic operations through optional version checking
   * 
   * @param feed - The feed record to save
   * @param _options - Optional atomic operation parameters
   * @returns Promise with the operation's versionstamp
   */
  async saveFeedData(feed: FeedRecord, _options?: AtomicOptions): Promise<{ versionstamp: string }> {
    const key = [StoragePrefix.Feed, feed.url];
    // Handle atomic operations if version checking is requested
    if (_options?.check) {
      const result = await this.kv.atomic()
        .check({ key, versionstamp: _options.check.versionstamp })
        .set(key, feed)
        .commit();
      if (!result.ok) {
        throw new Error("Atomic operation failed");
      }
      return { versionstamp: result.versionstamp };
    }
    const result = await this.kv.set(key, feed);
    logger.debug(`Saved feed data for ${feed.url}`);
    return { versionstamp: result.versionstamp };
  }

  /**
   * Retrieves a feed record by its URL
   * Returns null if the feed doesn't exist
   * 
   * @param url - The URL of the feed to retrieve
   * @returns Promise with feed data and versionstamp, or null if not found
   */
  async getFeedData(url: string): Promise<{ value: FeedRecord; versionstamp: string } | null> {
    const key = [StoragePrefix.Feed, url];
    const result = await this.kv.get<FeedRecord>(key);
    if (!result.value) {
      logger.debug(`No feed data found for ${url}`);
      return null;
    }
    return { value: result.value, versionstamp: result.versionstamp };
  }

  /**
   * Updates specific fields of a feed record
   * Performs a partial update while preserving other fields
   * 
   * @param url - The URL of the feed to update
   * @param data - Partial feed data to update
   * @param _options - Optional atomic operation parameters
   * @returns Promise with the operation's versionstamp
   * @throws Error if feed not found
   */
  async updateFeedData(
    url: string, 
    data: Partial<FeedRecord>, 
    _options?: AtomicOptions
  ): Promise<{ versionstamp: string }> {
    const existing = await this.getFeedData(url);
    if (!existing) {
      throw new Error(`Feed ${url} not found`);
    }

    const updatedFeed = { ...existing.value, ...data };
    return await this.saveFeedData(updatedFeed, _options);
  }

  /**
   * Lists feeds with filtering, sorting, and pagination support
   * Uses cursor-based pagination for efficient large dataset handling
   * 
   * @param options - Filtering, sorting, and pagination options
   * @returns Promise with paginated feed list and metadata
   */
 
  async listFeeds(options: ListFeedsOptions): Promise<ListFeedsResult> {
    const prefix = [StoragePrefix.Feed];
    const iter = this.kv.list<FeedRecord>({ prefix });
    const feeds: FeedRecord[] = [];
    let cursor: string | null = null;
    let count = 0;
    
    // Process feed entries with filtering
    for await (const entry of iter) {
      // Apply each filter condition
      if (options.category && entry.value.category !== options.category) continue;
      if (options.status && entry.value.status !== options.status) continue;
      if (options.filter && !entry.value.url.includes(options.filter)) continue;

      count++;
      // Skip entries before cursor position
      if (options.cursor && count <= parseInt(options.cursor)) continue;
      
      feeds.push(entry.value);
      // Check if we've reached the requested limit
      if (feeds.length === (options.limit || 20)) {
        cursor = count.toString();
        break;
      }
    }

    // Apply sorting if requested
    if (options.sort) {
      feeds.sort((a, b) => {
        switch (options.sort) {
          case 'lastUpdate':
            return (b.lastUpdate || '').localeCompare(a.lastUpdate || '');
          case 'status':
            return a.status.localeCompare(b.status);
          case 'category':
            return a.category.localeCompare(b.category);
          case 'updatesInLast3Months':
            return b.updatesInLast3Months - a.updatesInLast3Months;
          default:
            return 0;
        }
      });
    }

    return {
      feeds,
      total: count,
      cursor,
      hasMore: cursor !== null
    };
  }

  /**
   * Deletes a feed record from the store
   * Supports atomic operations for consistent deletions
   * 
   * @param url - The URL of the feed to delete
   * @param _options - Optional atomic operation parameters
   */
  async deleteFeedData(url: string, _options?: AtomicOptions): Promise<void> {
    const key = [StoragePrefix.Feed, url];
    if (_options?.check) {
      const result = await this.kv.atomic()
        .check({ key, versionstamp: _options.check.versionstamp })
        .delete(key)
        .commit();
      if (!result.ok) {
        throw new Error("Atomic operation failed");
      }
    } else {
      await this.kv.delete(key);
    }
    logger.debug(`Deleted feed data for ${url}`);
  }

  /**
   * Saves a validation session with progress information
   * Used to track ongoing feed validation processes
   * 
   * @param id - Unique identifier for the validation session
   * @param data - Validation session data
   * @returns Promise with the operation's versionstamp
   */
  async saveValidationSession(
    id: string, 
    data: ValidationSession
  ): Promise<{ versionstamp: string }> {
    const key = [StoragePrefix.Session, id];
    const result = await this.kv.set(key, data);
    logger.debug(`Saved validation session ${id}`);
    return { versionstamp: result.versionstamp };
  }

  /**
   * Retrieves a validation session by ID
   * 
   * @param id - The ID of the validation session
   * @returns Promise with session data and versionstamp, or null if not found
   */
  async getValidationSession(
    id: string
  ): Promise<{ value: ValidationSession; versionstamp: string } | null> {
    const key = [StoragePrefix.Session, id];
    const result = await this.kv.get<ValidationSession>(key);
    if (!result.value) {
      logger.debug(`No validation session found for ${id}`);
      return null;
    }
    return { value: result.value, versionstamp: result.versionstamp };
  }

  /**
   * Updates the progress of an ongoing validation session
   * 
   * @param id - The ID of the validation session
   * @param progress - Updated progress information
   * @param _options - Optional atomic operation parameters
   * @returns Promise with the operation's versionstamp
   * @throws Error if session not found
   */
  async updateValidationProgress(
    id: string,
    progress: ValidationProgress,
    _options?: AtomicOptions
  ): Promise<{ versionstamp: string }> {
    const session = await this.getValidationSession(id);
    if (!session) {
      throw new Error(`Validation session ${id} not found`);
    }

    const updatedSession = {
      ...session.value,
      progress
    };

    return await this.saveValidationSession(id, updatedSession);
  }

  /**
   * Deletes a validation session
   * Used for cleanup after validation completion
   * 
   * @param id - The ID of the validation session to delete
   */
  async deleteValidationSession(id: string): Promise<void> {
    const key = [StoragePrefix.Session, id];
    await this.kv.delete(key);
    logger.debug(`Deleted validation session ${id}`);
  }

  /**
   * Generates statistics for all feed categories
   * Includes active/inactive/dead feed counts and most updated feeds
   * 
   * @returns Promise with array of category statistics
   */
  async getCategoryStats(): Promise<CategoryStats[]> {
    const categoryCounts = new Map<string, CategoryStats>();
    const iter = this.kv.list<FeedRecord>({ prefix: [StoragePrefix.Feed] });

    // Process each feed and aggregate statistics by category
    for await (const entry of iter) {
      const feed = entry.value;
      let stats = categoryCounts.get(feed.category);
      
      // Initialize category stats if first feed in category
      if (!stats) {
        stats = {
          name: feed.category,
          totalFeeds: 0,
          activeFeeds: 0,
          inactiveFeeds: 0,
          deadFeeds: 0,
          incompatibleFeeds: 0,
          mostUpdatedFeeds: []
        };
        categoryCounts.set(feed.category, stats);
      }

      // Update category statistics based on feed status
      stats.totalFeeds++;
      switch (feed.status) {
        case 'active':
          stats.activeFeeds++;
          if (feed.updatesInLast3Months > 0) {
            stats.mostUpdatedFeeds.push({
              url: feed.url,
              updates: feed.updatesInLast3Months
            });
            // Maintain top 5 most updated feeds
            stats.mostUpdatedFeeds.sort((a, b) => b.updates - a.updates);
            if (stats.mostUpdatedFeeds.length > 5) {
              stats.mostUpdatedFeeds.pop();
            }
          }
          break;
        case 'inactive':
          stats.inactiveFeeds++;
          break;
        case 'dead':
          stats.deadFeeds++;
          break;
        case 'incompatible':
          stats.incompatibleFeeds++;
          break;
      }
    }

    return Array.from(categoryCounts.values());
  }

  /**
   * Updates the list of feeds in a category
   * Supports atomic operations for consistency
   * 
   * @param category - The category name
   * @param feeds - Array of feed URLs in the category
   * @param _options - Optional atomic operation parameters
   * @returns Promise with the operation's versionstamp
   */
  async updateCategoryFeeds(
    category: string,
    feeds: string[],
    _options?: AtomicOptions
  ): Promise<{ versionstamp: string }> {
    const key = [StoragePrefix.Category, category];
    if (_options?.check) {
      const result = await this.kv.atomic()
        .check({ key, versionstamp: _options.check.versionstamp })
        .set(key, feeds)
        .commit();
      if (!result.ok) {
        throw new Error("Atomic operation failed");
      }
      return { versionstamp: result.versionstamp };
    }
    const result = await this.kv.set(key, feeds);
    logger.debug(`Updated category ${category} with ${feeds.length} feeds`);
    return { versionstamp: result.versionstamp };
  }

  /**
   * Lists all unique categories from feed records
   * 
   * @returns Promise with array of category names
   */
  async listCategories(): Promise<string[]> {
    const categories = new Set<string>();
    const iter = this.kv.list<FeedRecord>({ prefix: [StoragePrefix.Feed] });
    
    for await (const entry of iter) {
      categories.add(entry.value.category);
    }

    return Array.from(categories);
  }

  /**
   * Creates a new atomic batch operation
   * Allows multiple operations to be performed atomically
   * 
   * @returns AtomicBatch interface for chaining operations
   */
  atomic(): AtomicBatch {
    const batch = this.kv.atomic();
    const atomicBatch: AtomicBatch = {
      check: (key: string, versionstamp: string): AtomicBatch => {
        // Split the concatenated key back into prefix and value
        const [prefix, ...rest] = key.split(':');
        batch.check({ key: [`${prefix}:`, rest.join(':')], versionstamp });
        return atomicBatch;
      },
      set: (key: string, value: unknown): AtomicBatch => {
        // Split the concatenated key back into prefix and value
        const [prefix, ...rest] = key.split(':');
        batch.set([`${prefix}:`, rest.join(':')], value);
        return atomicBatch;
      },
      delete: (key: string): AtomicBatch => {
        // Split the concatenated key back into prefix and value
        const [prefix, ...rest] = key.split(':');
        batch.delete([`${prefix}:`, rest.join(':')]);
        return atomicBatch;
      },
      commit: async () => {
        const result = await batch.commit();
        if (!result.ok) {
          return { success: false };
        }
        return {
          success: true,
          versionstamp: result.versionstamp
        };
      }
    };
    return atomicBatch;
  }

  /**
   * Performs multiple feed updates in a single atomic operation
   * If any update fails, all changes are rolled back
   * 
   * @param updates - Array of feed updates to perform
   * @returns Promise with batch operation results
   */
  async batchUpdateFeeds(updates: FeedUpdate[]): Promise<BatchResult> {
    const atomic = this.kv.atomic();
    const errors: { feedUrl: string; error: string }[] = [];
    let processed = 0;

    // Process each update in the batch
    for (const update of updates) {
      try {
        const existing = await this.getFeedData(update.url);
        if (!existing) {
          errors.push({
            feedUrl: update.url,
            error: 'Feed not found'
          });
          continue;
        }

        const updatedFeed = { ...existing.value, ...update.data };
        atomic.set([StoragePrefix.Feed, update.url], updatedFeed);
        processed++;
      } catch (error) {
        errors.push({
          feedUrl: update.url,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Commit all changes atomically
    const result = await atomic.commit();
    return {
      success: result.ok,
      processed,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // Close the KV store
  close(): void {
    this.kv.close();
  }

  // Clear all data in the KV store (for testing purposes)
  async clearAllData(): Promise<void> {
    // Clear feeds
    const feedIter = this.kv.list<FeedRecord>({ prefix: [StoragePrefix.Feed] });
    for await (const entry of feedIter) {
      await this.kv.delete([StoragePrefix.Feed, entry.value.url]);
    }

    // Clear sessions
    const sessionIter = this.kv.list<unknown>({ prefix: [StoragePrefix.Session] });
    for await (const entry of sessionIter) {
      const key = entry.key as string[];
      await this.kv.delete(key);
    }

    // Clear categories
    const categoryIter = this.kv.list<unknown>({ prefix: [StoragePrefix.Category] });
    for await (const entry of categoryIter) {
      const key = entry.key as string[];
      await this.kv.delete(key);
    }
  }
}