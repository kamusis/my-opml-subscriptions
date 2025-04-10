// src/frontend/routes/api/export.ts
import { Handlers } from "$fresh/server.ts";
import { generateOPMLForExport } from "../../../backend/generateNewOPML.ts";
import type { FeedRecord } from "../../../backend/types/feed.types.ts";

// Import crypto for UUID generation
const crypto = globalThis.crypto;

interface ExportRequest {
  feeds: FeedRecord[];
  options?: {
    includeValidationHistory?: boolean;
    includeCategoryStructure?: boolean; 
  };
}

export const handler: Handlers = {
  async POST(req) {
    try {
      const { feeds, options }: ExportRequest = await req.json();
      
      // Generate OPML content
      let feedCollection;
      
      if (options?.includeCategoryStructure) {
        // Organize feeds by their original categories
        const categorizedFeeds: Record<string, FeedRecord[]> = {};
        
        // Group feeds by category
        feeds.forEach(feed => {
          if (!categorizedFeeds[feed.category]) {
            categorizedFeeds[feed.category] = [];
          }
          categorizedFeeds[feed.category].push(feed);
        });
        
        feedCollection = { categories: categorizedFeeds };
      } else {
        // Place all feeds in a single "All" category
        feedCollection = { categories: { "All": feeds } };
      }
      
      const opmlContent = generateOPMLForExport(feedCollection, { 
        title: "Exported Feeds",
        includeAllStatuses: true 
      });
      
      // Create download response with simplified filename format
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const uuid = crypto.randomUUID().split('-')[0]; // Using just the first segment of UUID for brevity
      const filename = `export_${dateStr}_${uuid}.opml`;
      return new Response(opmlContent, {
        headers: {
          "Content-Type": "application/xml",
          "Content-Disposition": `attachment; filename="${filename}"`
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: "Failed to generate OPML export",
        message: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};