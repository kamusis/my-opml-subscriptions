/**
 * Module for parsing OPML (Outline Processor Markup Language) files
 * Converts OPML XML structure into a structured format for feed processing
 */
import { parse } from "@libs/xml";
import { createLogger } from "../utils/logger.ts";
import { FeedCollection, FeedEntry } from "./types/feed.types.ts";

const logger = createLogger("parseOPML");

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
function parseOpmlXml(xml: string): FeedCollection {
  const parsed = parse(xml) as ParsedOPML;

  // Validate basic OPML structure
  if (!parsed.opml || !parsed.opml.body) {
    logger.error("Invalid OPML structure");
    throw new Error("Invalid OPML structure.");
  }

  const categories: FeedCollection["categories"] = {};
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
      // Extract OPML feed metadata fields with fallbacks
      const text = outline["@text"] || outline["@title"] || outline["@xmlUrl"];
      const title = outline["@title"] || text;
      const type = outline["@type"] || 'rss';
      const htmlUrl = outline["@htmlUrl"] || '';
      const description = outline["@description"] || '';
      categories[category].push({
        url: outline["@xmlUrl"],
        text,
        title,
        type,
        htmlUrl,
        description,
        status: "dead",
        lastUpdate: undefined,
        updatesInLast3Months: 0,
      } as FeedEntry);
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

/**
 * Parses OPML XML from an in-memory buffer or string.
 * Used for API, web, or serverless environments (e.g., Deno Deploy) where file system access is not available.
 * Calls the shared parseOpmlXml logic.
 */
/**
 * Parses OPML XML from an in-memory buffer or string.
 * Used for API, web, or serverless environments (e.g., Deno Deploy) where file system access is not available.
 * Calls the shared parseOpmlXml logic.
 * Synchronous: does not perform any async operations.
 */
export function parseOpmlContents(contents: Uint8Array | ArrayBuffer | string): FeedCollection {
  let xml: string;
  if (typeof contents === "string") {
    xml = contents;
  } else {
    xml = new TextDecoder().decode(contents instanceof ArrayBuffer ? new Uint8Array(contents) : contents);
  }
  return parseOpmlXml(xml);
}

/**
 * Parses OPML XML from a file path on disk.
 * Used for CLI or backend scripts where file system access is available.
 * Calls the shared parseOpmlXml logic.
 */
export async function parseOPML(filePath: string): Promise<FeedCollection> {
  const fileContent = await Deno.readTextFile(filePath);
  return parseOpmlXml(fileContent);
}