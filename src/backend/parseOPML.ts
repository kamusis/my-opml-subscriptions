/**
 * Module for parsing OPML (Outline Processor Markup Language) files
 * Converts OPML XML structure into a structured format for feed processing
 */
import { parse } from "@libs/xml";
import { createLogger } from "../utils/logger.ts";

const logger = createLogger("parseOPML");

/**
 * Represents the status and metadata of a single RSS/Atom feed
 */
export interface FeedStatus {
  /** The URL of the feed */
  url: string;
  /** Current status of the feed (active/inactive/dead/incompatible) */
  status: 'active' | 'inactive' | 'dead' | 'incompatible';
  /** Most recent update time of the feed, null if never updated or inaccessible */
  lastUpdate: Date | null;
  /** Number of updates in the last 3 months */
  updatesInLast3Months: number;
  /** Reason for incompatibility if status is 'incompatible' */
  incompatibleReason?: string;
}

/**
 * Structured representation of OPML data, organized by categories
 */
export interface OPMLData {
  /** Map of category names to arrays of feeds in that category */
  categories: {
    [categoryName: string]: FeedStatus[];
  };
}

interface ParsedOPML {
  opml?: {
    body?: {
      outline: {
        "@text"?: string;
        "@xmlUrl"?: string;
        outline?: unknown;
      } | {
        "@text"?: string;
        "@xmlUrl"?: string;
        outline?: unknown;
      }[];
    };
  };
  [key: string]: unknown;
}

/**
 * Parses an OPML file and converts it into structured data
 * @param filePath Path to the OPML file to parse
 * @returns Promise resolving to structured OPML data
 * @throws Error if OPML structure is invalid
 */
export async function parseOPML(filePath: string): Promise<OPMLData> {
  // Read and parse the OPML file
  const fileContent = await Deno.readTextFile(filePath);
  const parsed = parse(fileContent) as ParsedOPML;

  // Validate basic OPML structure
  if (!parsed.opml || !parsed.opml.body) {
    logger.error("Invalid OPML structure in file:", filePath);
    throw new Error("Invalid OPML structure.");
  }

  const categories: OPMLData["categories"] = {};
  const outlines = parsed.opml.body.outline;

  /**
   * Recursively processes OPML outline elements
   * @param outline The outline element to process
   * @param category The current category name
   */
  // deno-lint-ignore no-explicit-any
  const processOutline = (outline: any, category: string) => {
    if (!outline) {
      logger.warn("Encountered an undefined or null outline.");
      return;
    }

    if (Array.isArray(outline)) {
      // Process array of outlines recursively
      outline.forEach((item) => processOutline(item, category));
    } else if (outline["@xmlUrl"] && typeof outline["@xmlUrl"] === "string") {
      // Initialize category array if needed
      if (!categories[category]) {
        categories[category] = [];
      }
      // Add feed to its category with initial dead status
      categories[category].push({
        url: outline["@xmlUrl"],
        status: "dead",
        lastUpdate: null,
        updatesInLast3Months: 0,
      });
      logger.debug(`Added feed ${outline["@xmlUrl"]} to category ${category}`);
    } else if (outline.outline) {
      // Process nested category
      const newCategory = outline["@text"] || category || "Uncategorized";
      processOutline(outline.outline, newCategory);
    } else {
      logger.warn("Outline does not have a valid structure:", outline);
    }
  };

  // Process top-level outlines
  if (Array.isArray(outlines)) {
    outlines.forEach((outline) => {
      const category = outline["@text"] || "Uncategorized";
      processOutline(outline.outline, category);
    });
  } else {
    const category = outlines["@text"] || "Uncategorized";
    processOutline(outlines.outline, category);
  }

  logger.info(`Parsed OPML file successfully. Found ${Object.keys(categories).length} categories.`);
  return { categories };
}