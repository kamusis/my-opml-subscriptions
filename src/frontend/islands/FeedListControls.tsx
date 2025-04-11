// src/frontend/islands/FeedListControls.tsx
import { useSignal } from "@preact/signals";
import type { FeedRecord } from "../../backend/types/feed.types.ts";
import FeedList from "../components/FeedList.tsx";

interface FeedListControlsProps {
  feeds: FeedRecord[];
  isLoading?: boolean;
}

export default function FeedListControls({ feeds, isLoading = false }: FeedListControlsProps) {
  // We'll use this signal for future enhancements like tracking last update time
  const lastUpdateTimestamp = useSignal<number>(Date.now());

  return (
    <div class="w-full max-w-4xl">
      <h2 class="text-xl font-semibold mb-4">Your Feeds</h2>
      
      {/* Feed list container with smooth transitions */}
      <div class="feed-list-container transition-opacity duration-300 ease-in-out relative min-h-[200px]">
        {/* Show loading overlay only during initial load */}
        {isLoading && feeds.length === 0 ? (
          <div class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <p class="text-center text-gray-500">Loading feeds...</p>
          </div>
        ) : null}
        
        {/* Empty state message */}
        {!isLoading && feeds.length === 0 ? (
          <p class="text-center text-gray-500">No feeds found. Upload an OPML file to get started.</p>
        ) : null}
        
        {/* Always render the feed list if we have feeds, with a key for transition */}
        {feeds.length > 0 && (
          <div 
            class="transition-all duration-300 ease-in-out" 
            key={`feed-list-${lastUpdateTimestamp.value}`}
          >
            <FeedList feeds={feeds} />
          </div>
        )}
      </div>
    </div>
  );
}
