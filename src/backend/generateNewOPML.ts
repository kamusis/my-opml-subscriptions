/**
 * Module for generating new OPML files from processed feed data
 * Creates separate OPML files for active, inactive, dead, and incompatible feeds
 */
import { FeedCollection, FeedEntry, FeedStatus } from "./types/feed.types.ts";
import { createLogger } from "../utils/logger.ts";

const logger = createLogger("generateOPML");

/**
 * Generates OPML content for a specific feed status category
 * @param opmlData The processed feed data containing all categories and feeds
 * @param status The feed status to filter by ('active', 'dead', 'inactive', or 'incompatible')
 * @param title The title to use in the OPML header
 * @returns A string containing the formatted OPML XML content
 */
function generateOPMLContent(opmlData: FeedCollection, status: FeedStatus, title: string): string {
  logger.debug(`Generating OPML content for ${status} feeds`);
  
  // Generate standard OPML XML header with UTF-8 encoding and version 2.0
  let opmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${title}</title>
  </head>
  <body>
`;

  // Iterate through each category and its associated feeds
  for (const [category, feeds] of Object.entries(opmlData.categories)) {
    // Extract only the feeds matching the requested status
    const filteredFeeds = feeds.filter((feed: FeedEntry) => feed.status === status);
    
    // Skip empty categories to keep output clean and organized
    if (filteredFeeds.length > 0) {
      logger.debug(`Processing category ${category} with ${filteredFeeds.length} ${status} feeds`);
      
      // Create category outline element
      opmlContent += `    <outline text="${category}">
`;
      
      // For active feeds only: sort by update frequency in descending order
      if (status === 'active') {
        filteredFeeds.sort((a: FeedEntry, b: FeedEntry) => b.updatesInLast3Months - a.updatesInLast3Months);
      }
      
      // Generate outline elements for each feed in the category
      filteredFeeds.forEach((feed: FeedEntry) => {
        // For incompatible feeds, include the reason in a comment attribute
        // Fallback logic for each field
        const text = feed.text || feed.title || feed.url;
        const title = text;
        const type = feed.type || 'rss';
        const htmlUrl = feed.htmlUrl || '';
        const description = feed.description || '';
        const commentAttr = feed.incompatibleReason ? ` comment="${feed.incompatibleReason}"` : '';
        opmlContent += `      <outline text="${text}"
        title="${title}"
        type="${type}"
        htmlUrl="${htmlUrl}"
        description="${description}"
        xmlUrl="${feed.url}"${commentAttr} />
`;
      });

      // Close the category outline element
      opmlContent += `    </outline>
`;
    }
  }

  // Add closing tags to complete the OPML structure
  opmlContent += `  </body>
</opml>`;
  return opmlContent;
}

/**
 * Generates separate OPML files for active, dead, inactive, and incompatible feeds
 * Files are named with suffixes: -active.opml, -dead.opml, -inactive.opml, -incompatible.opml
 * 
 * @param opmlData The processed feed data to generate OPML files from
 * @param outputPath Base path for output files (suffixes will be added)
 */
export async function generateNewOPML(opmlData: FeedCollection, outputPath: string): Promise<void> {
  logger.info("Starting OPML file generation");
  
  // Set up text encoder for file writing
  const encoder = new TextEncoder();
  
  // Remove any existing filter suffixes from the base path
  const basePath = outputPath.replace('-Filtered.opml', '').replace('-filtered.opml', '');
  
  // Generate and write OPML file for each status category
  // Active feeds (sorted by update frequency)
  logger.info("Generating active feeds OPML file");
  const activeContent = generateOPMLContent(opmlData, 'active', 'Active Feeds');
  await Deno.writeFile(`${basePath}-active.opml`, encoder.encode(activeContent));
  
  // Dead feeds (inaccessible)
  logger.info("Generating dead feeds OPML file");
  const deadContent = generateOPMLContent(opmlData, 'dead', 'Dead Feeds');
  await Deno.writeFile(`${basePath}-dead.opml`, encoder.encode(deadContent));
  
  // Inactive feeds (not updated recently)
  logger.info("Generating inactive feeds OPML file");
  const inactiveContent = generateOPMLContent(opmlData, 'inactive', 'Inactive Feeds');
  await Deno.writeFile(`${basePath}-inactive.opml`, encoder.encode(inactiveContent));

  // Incompatible feeds (not valid RSS/Atom format)
  logger.info("Generating incompatible feeds OPML file");
  const incompatibleContent = generateOPMLContent(opmlData, 'incompatible', 'Incompatible Feeds');
  await Deno.writeFile(`${basePath}-incompatible.opml`, encoder.encode(incompatibleContent));
  
  logger.info("OPML file generation complete");
}

/**
 * Generates a single OPML file content for API export
 * @param opmlData The processed feed data to generate OPML from
 * @param options Export options
 * @returns A string containing the formatted OPML XML content
 */
export function generateOPMLForExport(
  opmlData: FeedCollection, 
  options?: { 
    title?: string;
    includeAllStatuses?: boolean;
  }
): string {
  const title = options?.title || "Exported Feeds";
  
  // Always output a single OPML file with all feeds, including all fields
  let combinedContent = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${title}</title>
  </head>
  <body>
`;

  // Process each category
  for (const [category, feeds] of Object.entries(opmlData.categories)) {
    if (feeds.length > 0) {
      combinedContent += `    <outline text="${category}">
`;
      
      // Add all feeds in this category
      feeds.forEach((feed) => {
        const text = feed.text || feed.title || feed.url;
        const titleAttr = feed.title ? ` title="${feed.title}"` : '';
        const typeAttr = feed.type ? ` type="${feed.type}"` : '';
        const htmlUrlAttr = feed.htmlUrl ? ` htmlUrl="${feed.htmlUrl}"` : '';
        const descriptionAttr = feed.description ? ` description="${feed.description}"` : '';
        const commentAttr = feed.incompatibleReason ? ` comment="${feed.incompatibleReason}"` : '';
        combinedContent += `      <outline text="${text}" xmlUrl="${feed.url}"${titleAttr}${typeAttr}${htmlUrlAttr}${descriptionAttr}${commentAttr} />
`;
      });
      
      combinedContent += `    </outline>
`;
    }
  }
  
  combinedContent += `  </body>
</opml>`;
  
  return combinedContent;
}