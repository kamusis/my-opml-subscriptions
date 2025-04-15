import { Handlers } from "$fresh/server.ts";
import { createLogger } from "../../../utils/logger.ts";
import { extractUserIdFromRequest } from "../../../utils/user.ts";
import { parseOPML } from "../../../backend/parseOPML.ts";
import { KVStorageService } from "../../../backend/services/storage/index.ts";
import type { FeedRecord } from "../../../backend/types/feed.types.ts";

const logger = createLogger("api:upload");

export const handler: Handlers = {
  async POST(req) {
    // Multi-user support: extract userId from headers
    const [userId, errorResponse] = extractUserIdFromRequest(req);
    if (errorResponse) return errorResponse;

    try {
      // Check if the request is multipart/form-data
      const contentType = req.headers.get("content-type");
      if (!contentType?.includes("multipart/form-data")) {
        return new Response(JSON.stringify({
          error: "Content-Type must be multipart/form-data"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Parse the form data
      const formData = await req.formData();
      const file = formData.get("file");

      // Validate file
      if (!file || !(file instanceof File)) {
        return new Response(JSON.stringify({
          error: "No file uploaded or invalid file"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Validate file type
      const isCompatibleFileType = (fileName: string): boolean => {
        const lowerCaseName = fileName.toLowerCase();
        // Accept .opml files (primary format)
        if (lowerCaseName.endsWith(".opml")) return true;
        
        // Accept .xml files (potentially compatible)
        if (lowerCaseName.endsWith(".xml")) return true;
        
        // Accept .rss and .atom files (feed formats that might be convertible)
        if (lowerCaseName.endsWith(".rss") || lowerCaseName.endsWith(".atom")) return true;
        
        // Accept .txt files (might contain feed URLs)
        if (lowerCaseName.endsWith(".txt")) return true;
        
        return false;
      };
      
      if (!isCompatibleFileType(file.name)) {
        return new Response(JSON.stringify({
          error: "File must be an OPML, XML, or other compatible format"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Generate unique ID and save file
      const uploadId = crypto.randomUUID();
      // Preserve the original file extension
      const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
      const fileName = `${uploadId}${fileExtension}`;
      const filePath = `feeds/${fileName}`;

      try {
        // Save uploaded file content
        const arrayBuffer = await file.arrayBuffer();
        await Deno.writeFile(filePath, new Uint8Array(arrayBuffer));
      } catch (error) {
        logger.error(`Error saving file: ${error}`);
        return new Response(JSON.stringify({
          error: "Error saving file"
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Parse OPML
      let opmlData;
      try {
        opmlData = await parseOPML(filePath);
      } catch (error) {
        // Clean up file if parsing fails
        try {
          await Deno.remove(filePath);
        } catch (cleanupError) {
          logger.error(`Error cleaning up file after parse failure: ${cleanupError}`);
        }

        logger.error(`Error parsing OPML: ${error}`);
        return new Response(JSON.stringify({
          error: "Invalid OPML file format"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (!opmlData) {
        return new Response(JSON.stringify({
          error: "Invalid OPML file content"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Save to storage OPML data into feed records
      const storage = await KVStorageService.initialize();
      
      // Process each category and its feeds
      for (const [category, feeds] of Object.entries(opmlData.categories)) {
        for (const feed of feeds) {
          const feedRecord: FeedRecord = {
            userId: userId!, // Multi-user: associate feed with user
            url: feed.url,
            status: feed.status,
            lastUpdate: feed.lastUpdate ?? null,
            updatesInLast3Months: feed.updatesInLast3Months,
            incompatibleReason: feed.incompatibleReason,
            category,
            lastValidated: null as string | null,
            validationHistory: []
          };
          await storage.saveFeedData(userId!, feedRecord);
        }
      }

      // Return success response
      return new Response(JSON.stringify({
        id: uploadId,
        status: "uploaded",
        filename: file.name
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      logger.error(`Error processing upload: ${error}`);
      return new Response(JSON.stringify({
        error: "Internal server error while processing upload"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
