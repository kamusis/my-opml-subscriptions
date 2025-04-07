export async function checkFeedAccessibility(feedUrl: string): Promise<boolean> {
  try {
    const response = await fetch(feedUrl, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    console.warn(`Unable to access feed at ${feedUrl}. the error is: ${error}`);
    console.warn(`Please check the URL or your network connection.`);
    return false;
  }
}