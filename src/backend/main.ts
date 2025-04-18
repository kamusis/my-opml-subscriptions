/**
 * Main entry point for the OPML feed validator and analyzer
 * Processes an OPML file containing RSS/Atom feeds and:
 * 1. Validates feed accessibility
 * 2. Checks feed format compatibility
 * 3. Checks update frequency
 * 4. Categorizes feeds (active/inactive/dead/incompatible)
 * 5. Generates statistics and visualizations
 */
import { parseOPML } from "./parseOPML.ts";
import { checkFeedAccessibility } from "./checkFeedAccessibility.ts";
import { checkFeedCompatibility } from "./checkFeedCompatibility.ts";
import { getFeedUpdateFrequency } from "./getFeedUpdateFrequency.ts";
import { generateNewOPML } from "./generateNewOPML.ts";
import { generateStatistics } from "./writeStatistics.ts";
import { basename } from "@std/path";
import { createLogger } from "../utils/logger.ts";

const logger = createLogger("main");

async function main() {
  // Handle command line arguments, default to News-Explorer-Export.opml if none provided
  const args = Deno.args;
  const inputFilePath = args[0] || "./feeds/News-Explorer-Export.opml";
  const baseName = basename(inputFilePath).replace('.opml', '').replace('.xml', '');
  const outputDir = './feeds';

  // Log processing information
  logger.info(`Using input file: ${inputFilePath}`);
  logger.info(`Output files will be written to: ${outputDir}/${baseName}-[active|dead|inactive|incompatible].opml`);

  // Step 1: Parse the OPML file into structured data
  logger.info("Parsing OPML file...");
  const opmlData = await parseOPML(inputFilePath);

  // Step 2: Process each feed in each category
  logger.info("Validating feeds...");
  for (const [category, feeds] of Object.entries(opmlData.categories)) {
    logger.info(`Processing category: ${category}`);
    for (const feed of feeds) {
      logger.debug(`Checking feed: ${feed.url}`);
      
      // First check if the feed URL is accessible
      const isAccessible = await checkFeedAccessibility(feed.url);
      if (!isAccessible) {
        feed.status = "dead";
        feed.incompatibleReason = "Feed URL is not accessible";
        logger.info(`Feed is not accessible. Marked as dead.`);
        continue;
      }

      // If accessible, check feed format compatibility
      logger.debug(`Feed is accessible. Checking format compatibility...`);
      const compatibilityCheck = await checkFeedCompatibility(feed.url);
      feed.status = compatibilityCheck.status;
      feed.incompatibleReason = compatibilityCheck.incompatibleReason;

      // Only check update frequency for compatible feeds
      if (feed.status === 'active') {
        logger.debug(`Feed format is valid. Fetching update frequency...`);
        const feedStatus = await getFeedUpdateFrequency(feed.url);
        feed.status = feedStatus.status;
        feed.lastUpdate = feedStatus.lastUpdate;
        feed.updatesInLast3Months = feedStatus.updatesInLast3Months;
        feed.text = feedStatus.text;
        feed.title = feedStatus.title;
        feed.type = feedStatus.type;
        feed.htmlUrl = feedStatus.htmlUrl;
        feed.description = feedStatus.description;
        feed.incompatibleReason = feedStatus.incompatibleReason;
        logger.info(`Feed status: ${feed.status}${feedStatus.incompatibleReason ? ': ' + feedStatus.incompatibleReason : ''}`);
      } else {
        logger.info(`Feed marked as ${feed.status}${feed.incompatibleReason ? ': ' + feed.incompatibleReason : ''}`);
      }
    }
  }

  // Step 3: Generate new OPML files for each feed status category
  logger.info("Generating new OPML file...");
  await generateNewOPML(opmlData, `${outputDir}/${baseName}`);
  logger.info(`New OPML files generated at: ${outputDir}/${baseName}-[active|dead|inactive|incompatible].opml`);

  // Step 4: Generate statistics and visualizations
  logger.info("Generating statistics file...");
  await generateStatistics(opmlData, outputDir, baseName);
  logger.info("Statistics file generated.");
}

// Error handling for the main process
main().catch((error) => {
  logger.error("An error occurred:", error);
});