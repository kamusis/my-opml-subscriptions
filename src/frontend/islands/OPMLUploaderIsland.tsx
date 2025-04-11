// src/frontend/islands/OPMLUploaderIsland.tsx
import { useSignal } from "@preact/signals";
import { JSX } from "preact";
import { useEffect, useRef } from "preact/hooks"; 
import OPMLUploader from "../components/OPMLUploader.tsx";
import FeedListControls from "./FeedListControls.tsx";
import ValidationStatus from "./ValidationStatus.tsx";
import type { FeedRecord } from "../../backend/types/feed.types.ts";
import type { ListFeedsResult } from "../../backend/types/storage.types.ts";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function OPMLUploaderIsland() {
  const selectedFile = useSignal<File | null>(null);
  const selectedFileName = useSignal<string | null>(null);
  const uploadStatus = useSignal<UploadStatus>("idle");
  const uploadErrorMessage = useSignal<string | null>(null);
  const feeds = useSignal<FeedRecord[]>([]);
  const previousFeeds = useSignal<FeedRecord[]>([]);
  const areFeedsLoading = useSignal<boolean>(true);
  // Add a signal for tracking the last update timestamp to enable smooth transitions
  const lastUpdateTimestamp = useSignal<number>(Date.now());
  // We'll keep the previousFeeds signal but remove the visual transition

  /**
   * Check if a file is potentially compatible with OPML format
   * Accepts .opml, .xml, and other potentially compatible formats
   */
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
  
  const handleFileChange = (event: JSX.TargetedEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) {
      if (!isCompatibleFileType(file.name)) {
        uploadStatus.value = "error";
        uploadErrorMessage.value = "File must be an OPML, XML, or other compatible format.";
        selectedFile.value = null;
        selectedFileName.value = null;
        event.currentTarget.value = ""; 
      } else {
        selectedFile.value = file;
        selectedFileName.value = file.name;
        uploadStatus.value = "idle"; 
        uploadErrorMessage.value = null;
      }
    } else {
      selectedFile.value = null;
      selectedFileName.value = null;
    }
  };

  // Keep track of scroll position
  const scrollPositionRef = useRef<number>(0);
  
  // Function to save current scroll position
  const saveScrollPosition = () => {
    // Use globalThis instead of window for Deno compatibility
    scrollPositionRef.current = globalThis.scrollY;
  };
  
  // Function to restore scroll position
  const restoreScrollPosition = () => {
    // Use globalThis instead of window for Deno compatibility
    globalThis.scrollTo({
      top: scrollPositionRef.current,
      behavior: 'auto' // Use 'auto' to prevent animation
    });
  };
  
  const fetchFeeds = async (limit = 500) => {
    // Save current scroll position before fetching
    saveScrollPosition();
    
    // We'll keep using previousFeeds for continuity, but without visual transitions
    
    // Only set loading to true if we don't have any previous data
    // This prevents the component from showing a loading spinner when we already have data to display
    if (feeds.value.length === 0) {
      areFeedsLoading.value = true;
    }
    
    console.log("Fetching feeds...");
    try {
      const response = await fetch(`/api/feeds?limit=${limit}`, {
        headers: {
          "Cache-Control": "no-cache"
        }
      }); 
      if (!response.ok) {
        throw new Error(`Failed to fetch feeds: ${response.statusText}`);
      }
      const result: ListFeedsResult = await response.json();
      
      // Store current feeds as previous before updating
      if (feeds.value.length > 0) {
        previousFeeds.value = [...feeds.value];
      }
      
      // Update with new data
      feeds.value = result.feeds;
      console.log("Feeds fetched:", result.feeds.length);
      
      // Update timestamp for animation triggers
      lastUpdateTimestamp.value = Date.now();
    } catch (error) {
      console.error("Error fetching feeds:", error);
    } finally {
      // End loading state
      areFeedsLoading.value = false;
      
      // No need for transition delay anymore
      
      // Restore scroll position after updating
      setTimeout(restoreScrollPosition, 0);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile.value) {
      uploadErrorMessage.value = "Please select a file first.";
      return;
    }

    uploadStatus.value = "uploading";
    uploadErrorMessage.value = null;

    const formData = new FormData();
    formData.append("file", selectedFile.value);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed. Invalid response." }));
        throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
      }

      uploadStatus.value = "success";
      await fetchFeeds(); 

    } catch (error) {
      console.error("Upload error:", error);
      uploadStatus.value = "error";
      uploadErrorMessage.value = error instanceof Error ? error.message : "An unknown error occurred during upload.";
    }
  };



  useEffect(() => {
    fetchFeeds();
  }, []);

  return (
    <div class="flex flex-col items-center space-y-6 w-full">
      <OPMLUploader
        onFileChange={handleFileChange}
        onUpload={handleUpload}
        uploadStatus={uploadStatus.value}
        errorMessage={uploadErrorMessage.value}
        selectedFileName={selectedFileName.value}
      />

      {/* Validation Status component */}
      <ValidationStatus 
        feedCount={feeds.value.length} 
        onValidationComplete={fetchFeeds} 
      />
      
      {/* Feed list section using the new FeedListControls component */}
      <FeedListControls 
        feeds={areFeedsLoading.value && previousFeeds.value.length > 0 ? previousFeeds.value : feeds.value} 
        isLoading={areFeedsLoading.value}
      />
    </div>
  );
}
