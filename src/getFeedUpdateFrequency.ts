import { parseFeed } from "@mikaelporttila/rss";

export interface FeedStatus {
  url: string;
  status: 'active' | 'inactive' | 'dead';
  lastUpdate: Date | null;
  updatesInLast3Months: number;
}

export async function getFeedUpdateFrequency(feedUrl: string): Promise<FeedStatus> {
  try {
    const response = await fetch(feedUrl);
    if (!response.ok) {
      return { url: feedUrl, status: "dead", lastUpdate: null, updatesInLast3Months: 0 };
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || (!contentType.includes("application/rss+xml") && !contentType.includes("application/atom+xml"))) {
      console.warn(`Feed URL ${feedUrl} returned unsupported content type: ${contentType}`);
      return { url: feedUrl, status: "dead", lastUpdate: null, updatesInLast3Months: 0 };
    }

    const feedText = await response.text();
    const feed = await parseFeed(feedText);

    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    let updatesInLast3Months = 0;
    let lastUpdate: Date | null = null;

    feed.entries.forEach((entry) => {
      const publishedDate = new Date(entry.published || entry.updated || "");
      if (!isNaN(publishedDate.getTime())) {
        if (!lastUpdate || publishedDate > lastUpdate) {
          lastUpdate = publishedDate;
        }
        if (publishedDate > threeMonthsAgo) {
          updatesInLast3Months++;
        }
      }
    });

    const status = lastUpdate && lastUpdate > new Date(now.setFullYear(now.getFullYear() - 2))
      ? "active"
      : "inactive";

    return { url: feedUrl, status, lastUpdate, updatesInLast3Months };
  } catch (error) {
    console.error(`Error fetching feed data for ${feedUrl}:`, error);
    return { url: feedUrl, status: "dead", lastUpdate: null, updatesInLast3Months: 0 };
  }
}