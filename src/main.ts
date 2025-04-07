import { parseOPML } from "./parseOPML.ts";
import { checkFeedAccessibility } from "./checkFeedAccessibility.ts";
import { getFeedUpdateFrequency } from "./getFeedUpdateFrequency.ts";
import { generateNewOPML } from "./generateNewOPML.ts";
import { generateStatistics } from "./writeStatistics.ts";
import { basename } from "@std/path";

async function main() {
  const args = Deno.args;
  const inputFilePath = args[0] || "./feeds/News-Explorer-Export.opml";
  const baseName = basename(inputFilePath).replace('.opml', '').replace('.xml', '');
  const outputDir = './feeds';

  console.log(`Using input file: ${inputFilePath}`);
  console.log(`Output files will be written to: ${outputDir}/${baseName}-[active|dead|inactive].opml`);

  console.log("Parsing OPML file...");
  const opmlData = await parseOPML(inputFilePath);

  console.log("Validating feeds...");
  for (const [category, feeds] of Object.entries(opmlData.categories)) {
    console.log(`Processing category: ${category}`);
    for (const feed of feeds) {
      console.log(`  Checking feed: ${feed.url}`);
      const isAccessible = await checkFeedAccessibility(feed.url);
      if (isAccessible) {
        console.log(`    Feed is accessible. Fetching update frequency...`);
        const feedStatus = await getFeedUpdateFrequency(feed.url);
        feed.status = feedStatus.status;
        feed.lastUpdate = feedStatus.lastUpdate;
        feed.updatesInLast3Months = feedStatus.updatesInLast3Months;
        console.log(`    Feed status: ${feed.status}, Last update: ${feed.lastUpdate}, Updates in last 3 months: ${feed.updatesInLast3Months}`);
      } else {
        feed.status = "dead";
        console.log(`    Feed is not accessible. Marked as dead.`);
      }
    }
  }

  console.log("Generating new OPML file...");
  await generateNewOPML(opmlData, `${outputDir}/${baseName}`);

  console.log(`New OPML files generated at: ${outputDir}/${baseName}-[active|dead|inactive].opml`);

  console.log("Generating statistics file...");
  await generateStatistics(opmlData, outputDir, baseName);

  console.log("Statistics file generated.");
}

main().catch((error) => {
  console.error("An error occurred:", error);
});