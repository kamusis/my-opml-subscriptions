/**
 * Main entry point for the OPML feed validator and analyzer
 * Processes an OPML file containing RSS/Atom feeds and:
 * 1. Validates feed accessibility
 * 2. Checks update frequency
 * 3. Categorizes feeds (active/inactive/dead)
 * 4. Generates statistics and visualizations
 */
import { parseOPML } from "./parseOPML.ts";
import { checkFeedAccessibility } from "./checkFeedAccessibility.ts";
import { getFeedUpdateFrequency } from "./getFeedUpdateFrequency.ts";
import { generateNewOPML } from "./generateNewOPML.ts";
import { generateStatistics } from "./writeStatistics.ts";
import { basename } from "@std/path";

async function main() {
  // Handle command line arguments, default to News-Explorer-Export.opml if none provided
  const args = Deno.args;
  const inputFilePath = args[0] || "./feeds/News-Explorer-Export.opml";
  const baseName = basename(inputFilePath).replace('.opml', '').replace('.xml', '');
  const outputDir = './feeds';

  // Log processing information
  console.log(`Using input file: ${inputFilePath}`);
  console.log(`Output files will be written to: ${outputDir}/${baseName}-[active|dead|inactive].opml`);

  // Step 1: Parse the OPML file into structured data
  console.log("Parsing OPML file...");
  const opmlData = await parseOPML(inputFilePath);

  // Step 2: Process each feed in each category
  console.log("Validating feeds...");
  for (const [category, feeds] of Object.entries(opmlData.categories)) {
    console.log(`Processing category: ${category}`);
    for (const feed of feeds) {
      console.log(`  Checking feed: ${feed.url}`);
      
      // First check if the feed URL is accessible
      const isAccessible = await checkFeedAccessibility(feed.url);
      if (isAccessible) {
        // If accessible, analyze the feed's update frequency
        console.log(`    Feed is accessible. Fetching update frequency...`);
        const feedStatus = await getFeedUpdateFrequency(feed.url);
        feed.status = feedStatus.status;
        feed.lastUpdate = feedStatus.lastUpdate;
        feed.updatesInLast3Months = feedStatus.updatesInLast3Months;
        console.log(`    Feed status: ${feed.status}, Last update: ${feed.lastUpdate}, Updates in last 3 months: ${feed.updatesInLast3Months}`);
      } else {
        // Mark inaccessible feeds as dead
        feed.status = "dead";
        console.log(`    Feed is not accessible. Marked as dead.`);
      }
    }
  }

  // Step 3: Generate new OPML files for each feed status category
  console.log("Generating new OPML file...");
  await generateNewOPML(opmlData, `${outputDir}/${baseName}`);
  console.log(`New OPML files generated at: ${outputDir}/${baseName}-[active|dead|inactive].opml`);

  // Step 4: Generate statistics and visualizations
  console.log("Generating statistics file...");
  await generateStatistics(opmlData, outputDir, baseName);
  console.log("Statistics file generated.");
}

// Error handling for the main process
main().catch((error) => {
  console.error("An error occurred:", error);
});