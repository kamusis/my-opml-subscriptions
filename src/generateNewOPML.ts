/**
 * Module for generating new OPML files from processed feed data
 * Creates separate OPML files for active, inactive, and dead feeds
 */
import { OPMLData } from "./parseOPML.ts";

// TODO: handle rss feed's name: <outline type="rss" text="小武爸爸" title="小武爸爸"

/**
 * Generates OPML content for a specific feed status category
 * @param opmlData The processed feed data containing all categories and feeds
 * @param status The feed status to filter by ('active', 'dead', or 'inactive')
 * @param title The title to use in the OPML header
 * @returns A string containing the formatted OPML XML content
 */
function generateOPMLContent(opmlData: OPMLData, status: 'active' | 'dead' | 'inactive', title: string): string {
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
    // Extract only the feeds matching the requested status (active/dead/inactive)
    const filteredFeeds = feeds.filter((feed) => feed.status === status);
    
    // Skip empty categories to keep output clean and organized
    if (filteredFeeds.length > 0) {
      // Create category outline element
      opmlContent += `    <outline text="${category}">
`;
      
      // For active feeds only: sort by update frequency in descending order
      // This ensures most frequently updated feeds appear first in each category
      if (status === 'active') {
        filteredFeeds.sort((a, b) => b.updatesInLast3Months - a.updatesInLast3Months);
      }
      
      // Generate outline elements for each feed in the category
      // Each feed is represented by an outline element with text and xmlUrl attributes
      filteredFeeds.forEach((feed) => {
        opmlContent += `      <outline text="${feed.url}" xmlUrl="${feed.url}" />
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
 * Generates three separate OPML files for active, dead, and inactive feeds
 * Files are named with suffixes: -active.opml, -dead.opml, -inactive.opml
 * 
 * @param opmlData The processed feed data to generate OPML files from
 * @param outputPath Base path for output files (suffixes will be added)
 */
export async function generateNewOPML(opmlData: OPMLData, outputPath: string): Promise<void> {
  // Set up text encoder for file writing
  const encoder = new TextEncoder();
  
  // Remove any existing filter suffixes from the base path
  const basePath = outputPath.replace('-Filtered.opml', '').replace('-filtered.opml', '');
  
  // Generate and write OPML file for each status category
  // Active feeds (sorted by update frequency)
  const activeContent = generateOPMLContent(opmlData, 'active', 'Active Feeds');
  await Deno.writeFile(`${basePath}-active.opml`, encoder.encode(activeContent));
  
  // Dead feeds (inaccessible)
  const deadContent = generateOPMLContent(opmlData, 'dead', 'Dead Feeds');
  await Deno.writeFile(`${basePath}-dead.opml`, encoder.encode(deadContent));
  
  // Inactive feeds (not updated recently)
  const inactiveContent = generateOPMLContent(opmlData, 'inactive', 'Inactive Feeds');
  await Deno.writeFile(`${basePath}-inactive.opml`, encoder.encode(inactiveContent));
}