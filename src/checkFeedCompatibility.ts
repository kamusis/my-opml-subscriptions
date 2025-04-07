/**
 * Module for checking RSS/Atom feed compatibility
 * Validates if a feed URL returns valid RSS/Atom formatted content
 */
import { FeedStatus } from "./parseOPML.ts";
import { parse } from "@libs/xml";

/**
 * Tests if a string appears to be RSS/Atom XML
 * @param content The content to check for RSS/Atom format
 * @returns true if content appears to be RSS/Atom format
 */
function isRssOrAtomFormat(content: string): boolean {
  try {
    const parsed = parse(content);
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
      return {
        status: 'dead',
        incompatibleReason: `HTTP error: ${response.status} ${response.statusText}`
      };
    }

    const content = await response.text();
    
    // First try to parse as RSS/Atom
    if (isRssOrAtomFormat(content)) {
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
    
    return {
      status: 'incompatible',
      incompatibleReason: truncatedReason
    };
    
  } catch (error: unknown) {
    // Network or other errors are considered dead feeds
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      status: 'dead',
      incompatibleReason: `Error accessing feed: ${errorMessage}`
    };
  }
}