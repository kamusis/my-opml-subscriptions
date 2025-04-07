/**
 * RSS/Atom feed parser module that checks feed health and update frequency
 */
import { parseFeed } from "@mikaelporttila/rss";

/**
 * Represents the status and update information of a feed
 * @interface FeedStatus
 * @property {string} url - The feed's URL
 * @property {'active' | 'inactive' | 'dead'} status - Current status of the feed
 * @property {Date | null} lastUpdate - Date of the most recent entry
 * @property {number} updatesInLast3Months - Count of updates in past 3 months
 */
export interface FeedStatus {
  url: string;
  status: 'active' | 'inactive' | 'dead';
  lastUpdate: Date | null;
  updatesInLast3Months: number;
}

/**
 * Analyzes an RSS/Atom feed to determine its health and update frequency
 * @param feedUrl The URL of the feed to analyze
 * @returns Promise<FeedStatus> Status information about the feed
 */
export async function getFeedUpdateFrequency(feedUrl: string): Promise<FeedStatus> {
  try {
    // Check if feed URL is accessible
    const response = await fetch(feedUrl);
    if (!response.ok) {
      return { url: feedUrl, status: "dead", lastUpdate: null, updatesInLast3Months: 0 };
    }

    // Verify content type is RSS or Atom
    const contentType = response.headers.get("content-type");
    if (!contentType || (!contentType.includes("application/rss+xml") && !contentType.includes("application/atom+xml"))) {
      console.warn(`Feed URL ${feedUrl} returned unsupported content type: ${contentType}`);
      return { url: feedUrl, status: "dead", lastUpdate: null, updatesInLast3Months: 0 };
    }

    // Parse feed content
    const feedText = await response.text();
    const feed = await parseFeed(feedText);

    // Set up time windows for analysis
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    // Initialize counters with default values
    let updatesInLast3Months = 0;
    let lastUpdate = new Date(twoYearsAgo);

    // Analyze each entry's timestamp
    feed.entries.forEach((entry) => {
      const publishedDate = new Date(entry.published || entry.updated || "");
      if (!isNaN(publishedDate.getTime())) {
        // Update the most recent entry date if newer
        if (!lastUpdate || publishedDate > lastUpdate) {
          lastUpdate = publishedDate;
        }
        // Count entries in the last 3 months
        if (publishedDate > threeMonthsAgo) {
          updatesInLast3Months++;
        }
      }
    });

    // Determine feed status based on last update
    // Active if updated within last 2 years, otherwise inactive
    const status = lastUpdate > twoYearsAgo ? "active" : "inactive";

    return { url: feedUrl, status, lastUpdate, updatesInLast3Months };
  } catch (error) {
    // Handle any errors during feed processing
    console.error(`Error fetching feed data for ${feedUrl}:`, error);
    return { url: feedUrl, status: "dead", lastUpdate: null, updatesInLast3Months: 0 };
  }
}