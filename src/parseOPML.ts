import { parse } from "@libs/xml";

export interface FeedStatus {
  url: string;
  status: 'active' | 'inactive' | 'dead';
  lastUpdate: Date | null;
  updatesInLast3Months: number;
}

export interface OPMLData {
  categories: {
    [categoryName: string]: FeedStatus[];
  };
}

export async function parseOPML(filePath: string): Promise<OPMLData> {
  const fileContent = await Deno.readTextFile(filePath);
  const parsed = parse(fileContent);

  if (!parsed.opml || !parsed.opml.body) {
    throw new Error("Invalid OPML structure.");
  }

  const categories: OPMLData["categories"] = {};
  const outlines = parsed.opml.body.outline;

  // deno-lint-ignore no-explicit-any
  const processOutline = (outline: any, category: string) => {
    if (!outline) {
      console.warn("Encountered an undefined or null outline.");
      return;
    }

    if (Array.isArray(outline)) {
      outline.forEach((item) => processOutline(item, category));
    } else if (outline["@xmlUrl"] && typeof outline["@xmlUrl"] === "string") {
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push({
        url: outline["@xmlUrl"],
        status: "dead",
        lastUpdate: null,
        updatesInLast3Months: 0,
      });
    } else if (outline.outline) {
      const newCategory = outline["@text"] || category || "Uncategorized";
      processOutline(outline.outline, newCategory);
    } else {
      console.warn("Outline does not have a valid structure:", outline);
    }
  };

  if (Array.isArray(outlines)) {
    outlines.forEach((outline) => {
      const category = outline["@text"] || "Uncategorized";
      processOutline(outline.outline, category);
    });
  } else {
    const category = outlines["@text"] || "Uncategorized";
    processOutline(outlines.outline, category);
  }

  return { categories };
}