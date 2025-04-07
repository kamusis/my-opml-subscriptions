/**
 * Checks if a feed URL is accessible by making a HEAD request
 * Uses HEAD instead of GET for efficiency since we only need to verify accessibility
 * 
 * @param feedUrl The URL of the feed to check
 * @returns Promise<boolean> true if the feed is accessible, false otherwise
 */
export async function checkFeedAccessibility(feedUrl: string): Promise<boolean> {
  try {
    // Make a lightweight HEAD request to check URL accessibility
    const response = await fetch(feedUrl, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    // Log warning messages if feed is inaccessible
    console.warn(`Unable to access feed at ${feedUrl}. the error is: ${error}`);
    console.warn(`Please check the URL or your network connection.`);
    return false;
  }
}