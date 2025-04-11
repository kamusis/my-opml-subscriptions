// src/frontend/islands/FeedListControls.tsx
import { useState } from "preact/hooks";
import FeedList from "../components/FeedList.tsx";
import type { FeedRecord } from "../../backend/types/feed.types.ts";

interface FeedListControlsProps {
  feeds: FeedRecord[];
  isLoading?: boolean;
  _isTransitioning?: boolean;
}

export default function FeedListControls({ feeds, isLoading = false, _isTransitioning = false }: FeedListControlsProps) {
  const [error, setError] = useState<string | null>(null);
  
  const handleRefresh = async () => {
    try {
      setError(null);
      const response = await fetch("/api/feeds", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache"
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to refresh feeds:", errorText);
        setError("Failed to refresh feeds. Please try again later.");
      }
      
      // The parent component will handle updating the feeds
      // This is just to trigger a refresh request
      globalThis.location.reload();
    } catch (error) {
      console.error("Error refreshing feeds:", error);
      setError("An unexpected error occurred. Please try again later.");
    }
  };

  return (
    <div class="feed-list-container transition-all duration-300 ease-in-out relative min-h-[200px]">
      {error && (
        <div class="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm">{error}</p>
            </div>
            <div class="ml-auto pl-3">
              <div class="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setError(null)}
                  class="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <span class="sr-only">Dismiss</span>
                  <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!isLoading && feeds.length > 0 && (
        <div class="mb-4 flex justify-end">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            class={`inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium ${isLoading ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'bg-white hover:bg-slate-50'} text-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300`}
          >
            <svg class={`-ml-1 mr-2 h-5 w-5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      )}
      
      <div class="feed-list-container">
        <FeedList feeds={feeds} isLoading={isLoading} />
      </div>
    </div>
  );
}
