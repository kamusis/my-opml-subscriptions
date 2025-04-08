/**
 * Module for generating statistics for OPML feed analysis
 * Creates markdown reports for feed status distribution
 */
import { OPMLData } from "./parseOPML.ts";
import { createLogger } from "../utils/logger.ts";

const logger = createLogger("statistics");

/**
 * Statistics gathered from OPML feed analysis
 */
interface Statistics {
  /** Total number of feeds processed */
  totalFeeds: number;
  /** Number of inaccessible feeds */
  deadFeeds: number;
  /** Number of feeds not updated recently */
  inactiveFeeds: number;
  /** Number of active feeds */
  activeFeeds: number;
  /** Number of incompatible feeds */
  incompatibleFeeds: number;
  /** Top categories by number of active feeds */
  topCategories: {name: string; count: number}[];
  /** Most frequently updated feeds */
  mostUpdatedFeeds: {title: string; updates: number}[];
  /** Sample of incompatible feeds with reasons */
  incompatibleSamples: {reason: string; urls: string[]}[];
}

/**
 * Main function to generate statistics
 * @param opmlData Processed OPML data
 * @param outputDir Directory for output files
 * @param inputFileName Name of input file for statistics filename
 */
export async function generateStatistics(
  opmlData: OPMLData,
  outputDir: string,
  inputFileName: string
): Promise<void> {
  logger.info("Starting statistics generation");
  
  // Calculate statistics from OPML data
  const stats = calculateStatistics(opmlData);
  logger.info(`Found ${stats.totalFeeds} total feeds: ${stats.activeFeeds} active, ${stats.inactiveFeeds} inactive, ${stats.deadFeeds} dead, ${stats.incompatibleFeeds} incompatible`);
  
  // Generate and save markdown report
  await generateMarkdown(stats, outputDir, inputFileName);
  logger.info("Statistics generation complete");
}

/**
 * Standardizes error messages, particularly handling Content-Type related errors
 * @param reason The original error message
 * @returns The standardized error message
 */
function standardizeErrorReason(reason: string): string {
  // Handle errors with Content-Type
  if (reason.includes('Content-Type:') || reason.includes('content type:')) {
    const contentTypeMatch = reason.match(/(?:Content-Type:|content type:)\s*([^;]+)/i);
    if (contentTypeMatch) {
      // Get the basic error message with Content-Type
      let standardizedReason = `Invalid feed format. Content-Type: ${contentTypeMatch[1].trim()}`;
      
      // Preserve additional error context if present
      if (reason.includes('Received HTML page instead of RSS/Atom feed')) {
        standardizedReason += '. Received HTML page instead of RSS/Atom feed';
      }
      return standardizedReason;
    }
  }
  
  return reason;
}

/**
 * Calculate statistics from OPML data
 * @param opmlData Processed OPML data
 * @returns Calculated statistics
 */
function calculateStatistics(opmlData: OPMLData): Statistics {
  logger.debug("Calculating feed statistics");
  
  // Get all feeds and count by status
  const allFeeds = Object.values(opmlData.categories).flat();
  const totalFeeds = allFeeds.length;
  const deadFeeds = allFeeds.filter(f => f.status === "dead").length;
  const inactiveFeeds = allFeeds.filter(f => f.status === "inactive").length;
  const activeFeeds = allFeeds.filter(f => f.status === "active").length;
  const incompatibleFeeds = allFeeds.filter(f => f.status === "incompatible").length;
  
  // Find categories with most active feeds
  const categoryCounts = new Map<string, number>();
  Object.entries(opmlData.categories).forEach(([category, feeds]) => {
    const activeCount = feeds.filter(f => f.status === "active").length;
    if (activeCount > 0) {
      categoryCounts.set(category, activeCount);
    }
  });
  
  // Get top 3 categories
  const topCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));
  
  // Get top 5 most frequently updated feeds
  const mostUpdatedFeeds = allFeeds
    .filter(f => f.status === "active")
    .sort((a, b) => (b.updatesInLast3Months || 0) - (a.updatesInLast3Months || 0))
    .slice(0, 5)
    .map(f => ({ 
      title: f.url, 
      updates: f.updatesInLast3Months || 0 
    }));

  // Get all incompatible feeds grouped by reason
  const incompatibleFeedsByReason = new Map<string, { urls: string[] }>();
  allFeeds
    .filter(f => f.status === "incompatible" && f.incompatibleReason)
    .forEach(f => {
      // First standardize the error reason, then truncate to 100 characters
      const standardizedReason = standardizeErrorReason(f.incompatibleReason || 'Unknown reason');
      const reasonKey = standardizedReason.slice(0, 100);
      
      if (!incompatibleFeedsByReason.has(reasonKey)) {
        incompatibleFeedsByReason.set(reasonKey, { urls: [] });
      }
      incompatibleFeedsByReason.get(reasonKey)!.urls.push(f.url);
    });

  // Convert to array format for template use
  const incompatibleSamples = Array.from(incompatibleFeedsByReason.entries())
    .map(([reason, data]) => ({
      reason,
      urls: data.urls
    }));
  
  logger.debug("Statistics calculation complete");
  return {
    totalFeeds,
    deadFeeds,
    inactiveFeeds,
    activeFeeds,
    incompatibleFeeds,
    topCategories,
    mostUpdatedFeeds,
    incompatibleSamples
  };
}

/**
 * Generate markdown report from statistics
 * @param stats Calculated statistics
 * @param outputDir Directory for output files
 * @param inputFileName Name of input file for statistics filename
 */
async function generateMarkdown(stats: Statistics, outputDir: string, inputFileName: string) {
  logger.debug("Generating markdown report");
  
  const markdownContent = `# Processing Statistics

## Summary
- **Total Feeds Processed**: ${stats.totalFeeds}
- **Dead Feeds**: ${stats.deadFeeds} (${((stats.deadFeeds / stats.totalFeeds) * 100).toFixed(1)}%)
- **Inactive Feeds**: ${stats.inactiveFeeds} (${((stats.inactiveFeeds / stats.totalFeeds) * 100).toFixed(1)}%)
- **Active Feeds**: ${stats.activeFeeds} (${((stats.activeFeeds / stats.totalFeeds) * 100).toFixed(1)}%)
- **Incompatible Feeds**: ${stats.incompatibleFeeds} (${((stats.incompatibleFeeds / stats.totalFeeds) * 100).toFixed(1)}%)

## Top Categories
${
  stats.topCategories.map((c, i) => 
    `${i + 1}. **${c.name}**: ${c.count} active feeds`
  ).join("\n")
}

## Most Frequently Updated Feeds
${
  stats.mostUpdatedFeeds.map((f, i) => 
    `${i + 1}. ${f.title} - ${f.updates} updates in the last 3 months`
  ).join("\n")
}

${stats.incompatibleFeeds > 0 ? `
## Incompatible Feeds Analysis

### Summary
Total incompatible feeds: ${stats.incompatibleFeeds}
Number of distinct error categories: ${stats.incompatibleSamples.length}

### Feeds by Error Category
${stats.incompatibleSamples.map((category, i) => `
#### ${i + 1}. Error Category: ${category.reason}
Number of feeds affected: ${category.urls.length}

Affected URLs:
${category.urls.map((url, j) => `${j + 1}. ${url}`).join("\n")}
`).join("\n")}
` : ''}
`;

  await Deno.writeTextFile(`${outputDir}/processing_statistics_${inputFileName}.md`, markdownContent);
  logger.debug("Markdown report generated");
}
