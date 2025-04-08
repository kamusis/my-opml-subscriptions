/**
 * Module for checking RSS/Atom feed compatibility
 * Validates if a feed URL returns valid RSS/Atom formatted content
 */
import { FeedStatus } from "./parseOPML.ts";
import { parse } from "@libs/xml";
import { createLogger } from "../utils/logger.ts";

const logger = createLogger("feedCompatibility");

interface ParsedFeed {
  rss?: unknown;
  "rdf:RDF"?: unknown;
  feed?: {
    entry?: unknown[];
    title?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Tests if a string appears to be RSS/Atom XML
 * @param content The content to check for RSS/Atom format
 * @returns true if content appears to be RSS/Atom format
 */
function isRssOrAtomFormat(content: string): boolean {
  try {
    const parsed = parse(content) as ParsedFeed;
    // Check for RSS format
    if (parsed.rss || parsed["rdf:RDF"]) {
      return true;
    }
    // Check for Atom format
    if (parsed.feed && (parsed.feed.entry || parsed.feed.title)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Check if a feed URL returns valid RSS/Atom content
 * @param url The URL to check for feed compatibility
 * @returns Promise resolving to feed compatibility status
 */
export async function checkFeedCompatibility(feedUrl: string): Promise<Pick<FeedStatus, 'status' | 'incompatibleReason'>> {
  try {
    const response = await fetch(feedUrl);
    if (!response.ok) {
      logger.error(`HTTP error when checking feed compatibility: ${response.status} ${response.statusText}`);
      return {
        status: 'dead',
        incompatibleReason: `HTTP error: ${response.status} ${response.statusText}`
      };
    }

    const content = await response.text();
    
    // First try to parse as RSS/Atom
    if (isRssOrAtomFormat(content)) {
      logger.debug(`Feed ${feedUrl} is valid RSS/Atom format`);
      return { status: 'active' };
    }

    // If not RSS/Atom, check content type and provide detailed reason
    const contentType = response.headers.get('content-type') || 'unknown';
    let reason = `Invalid feed format. Content-Type: ${contentType}.`;
    
    // If HTML, add specific message
    if (contentType.includes('text/html')) {
      reason += ' Received HTML page instead of RSS/Atom feed.';
    }
    
    // Truncate reason to 100 chars as specified
    const truncatedReason = reason.length > 100 ? reason.slice(0, 97) + '...' : reason;
    
    logger.error(`Feed ${feedUrl} is incompatible: ${truncatedReason}`);
    return {
      status: 'incompatible',
      incompatibleReason: truncatedReason
    };
    
  } catch (error: unknown) {
    // Network or other errors are considered dead feeds
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logger.error(`Error accessing feed ${feedUrl}: ${errorMessage}`);
    return {
      status: 'dead',
      incompatibleReason: `Error accessing feed: ${errorMessage}`
    };
  }
}