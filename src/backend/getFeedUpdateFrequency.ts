/**
 * RSS/Atom feed parser module that checks feed health and update frequency
 */
import { parseFeed } from "@mikaelporttila/rss";
import { FeedEntry, FeedStatus } from "./types/feed.types.ts";
import { createLogger } from "../utils/logger.ts";

const logger = createLogger("feedUpdateFrequency");

/**
 * Analyzes an RSS/Atom feed to determine its health and update frequency
 * @param feedUrl The URL of the feed to analyze
 * @returns Promise<FeedStatus> Status information about the feed
 */
export async function getFeedUpdateFrequency(feedUrl: string): Promise<FeedEntry> {
  try {
    // Check if feed URL is accessible
    const response = await fetch(feedUrl);
    if (!response.ok) {
      const error = `HTTP ${response.status} ${response.statusText}`;
      logger.error(`Feed was marked as compatible but HTTP request failed for ${feedUrl}: ${error}`);
      return {
        url: feedUrl,
        status: "incompatible",
        lastUpdate: null,
        updatesInLast3Months: 0,
        incompatibleReason: `Feed previously accessible but now returns ${error}`
      };
    }

    // Verify content type is RSS, Atom, or general XML
    const contentType = response.headers.get("content-type");
    // Extract base content type without charset
    const baseContentType = contentType?.split(';')[0].trim();

    if (!baseContentType ||
        (baseContentType !== "application/rss+xml" &&
         baseContentType !== "application/atom+xml" &&
         baseContentType !== "text/xml" &&
         baseContentType !== "application/xml")) {
      const error = `Unexpected content type: ${contentType}`;
      logger.error(`Feed was marked as compatible but returned invalid content type for ${feedUrl}: ${error}`);
      return {
        url: feedUrl,
        status: "incompatible",
        lastUpdate: null,
        updatesInLast3Months: 0,
        incompatibleReason: error
      };
    }

    // Parse feed content
    const feedText = await response.text();
    const feed = await parseFeed(feedText);

    // If feed has no entries, mark as incompatible
    if (!feed.entries || feed.entries.length === 0) {
      const error = "Feed contains no entries";
      logger.error(`Feed was marked as compatible but ${error} for ${feedUrl}`);
      return {
        url: feedUrl,
        status: "incompatible",
        lastUpdate: null,
        updatesInLast3Months: 0,
        incompatibleReason: error
      };
    }

    // Set up time windows for analysis
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    // Initialize counters with default values
    let updatesInLast3Months = 0;
    let lastUpdate: Date | null = null;
    let validDatesFound = false;

    // Analyze each entry's timestamp
    feed.entries.forEach((entry) => {
      const publishedDate = new Date(entry.published || entry.updated || "");
      if (!isNaN(publishedDate.getTime())) {
        validDatesFound = true;
        // Update the most recent entry date if newer
        if (lastUpdate === null || publishedDate > lastUpdate) {
          lastUpdate = publishedDate;
        }
        // Count entries in the last 3 months
        if (publishedDate > threeMonthsAgo) {
          updatesInLast3Months++;
        }
      }
    });

    // If no valid dates found in any entries, mark as incompatible
    if (!validDatesFound) {
      const error = "No valid dates found in feed entries";
      logger.error(`Feed was marked as compatible but ${error} for ${feedUrl}`);
      return {
        url: feedUrl,
        status: "incompatible",
        lastUpdate: null,
        updatesInLast3Months: 0,
        incompatibleReason: error
      };
    }

    // Determine feed status based on last update
    // Active if updated within last 2 years, otherwise inactive
    // If no valid dates found but we got this far, we'll mark as inactive
    let status: FeedStatus = "inactive";
    if (lastUpdate !== null) {
      status = (lastUpdate as Date) > twoYearsAgo ? "active" : "inactive";
    }
    logger.debug(`Feed ${feedUrl} status: ${status}, last update: ${lastUpdate}, updates in last 3 months: ${updatesInLast3Months}`);

    return {
      url: feedUrl,
      status,
      lastUpdate: lastUpdate !== null ? (lastUpdate as Date).toISOString() : null,
      updatesInLast3Months
    };
  } catch (error) {
    // Handle any errors during feed processing with detailed logging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Feed was marked as compatible but failed during update frequency check for ${feedUrl}:`);
    logger.error(`Error type: ${error?.constructor?.name}`);
    logger.error(`Error message: ${errorMessage}`);
    if (error instanceof Error && error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }

    return {
      url: feedUrl,
      status: "incompatible",
      lastUpdate: null,
      updatesInLast3Months: 0,
      incompatibleReason: `Error checking update frequency: ${errorMessage}`
    };
  }
}