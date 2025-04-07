/**
 * Checks if a feed URL is accessible by making a HEAD request
 * Falls back to GET if HEAD request fails or returns zero content length
 * 
 * @param feedUrl The URL of the feed to check
 * @returns Promise<boolean> true if the feed is accessible, false otherwise
 */
export async function checkFeedAccessibility(feedUrl: string): Promise<boolean> {
  try {
    // First try a lightweight HEAD request
    const headResponse = await fetch(feedUrl, { method: "HEAD" });
    
    // If HEAD succeeds and returns content length, we're done
    const contentLength = headResponse.headers.get('content-length');
    if (headResponse.ok && contentLength && parseInt(contentLength) > 0) {
      return true;
    }

    // If HEAD fails or returns no content length, try GET
    const getResponse = await fetch(feedUrl);
    return getResponse.ok;
  } catch (error) {
    // Log warning messages if feed is inaccessible
    console.warn(`Unable to access feed at ${feedUrl}. the error is: ${error}`);
    console.warn(`Please check the URL or your network connection.`);
    return false;
  }
}