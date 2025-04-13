// src/frontend/islands/FeedManagementIsland.tsx
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import FeedListControls from "./FeedListControls.tsx";
import ValidationStatus from "./ValidationStatus.tsx";
import type { FeedRecord } from "../../backend/types/feed.types.ts";

/**
 * FeedManagementIsland is responsible for managing feed data, selection, and validation.
 * It contains both the feed list controls and validation status components.
 */
export default function FeedManagementIsland() {
  // Feed data state
  const feeds = useSignal<FeedRecord[]>([]);
  const isLoading = useSignal<boolean>(true);

  // Selection state
  const selectedFeeds = useSignal<Set<string>>(new Set<string>());

  // Fetch feeds from the API
  const fetchFeeds = async () => {
    try {
      isLoading.value = true;

      // Set a high limit to fetch all feeds since we don't have pagination yet
      const response = await fetch("/api/feeds?limit=1000");
      if (!response.ok) {
        throw new Error(`Failed to fetch feeds: ${response.status}`);
      }

      const data = await response.json();
      feeds.value = data.feeds || [];
      console.log(`Fetched ${data.feeds?.length || 0} feeds`);
    } catch (error) {
      console.error("Error fetching feeds:", error);
    } finally {
      isLoading.value = false;
    }
  };

  // Load feeds on component mount
  useEffect(() => {
    fetchFeeds();
  }, []);

  return (
    <div className="space-y-6">
      {/* Validation Status component */}
      <ValidationStatus
        feedCount={feeds.value.length}
        selectedFeeds={selectedFeeds.value}
        allFeeds={feeds.value}
        onValidationComplete={fetchFeeds}
      />

      {/* Feed List Controls component */}
      <FeedListControls
        feeds={feeds.value}
        isLoading={isLoading.value}
        onSelectionChange={(newSelection) => selectedFeeds.value = newSelection}
      />
    </div>
  );
}
