// src/frontend/islands/ExportButton.tsx
import { useState } from "preact/hooks";
import type { FeedRecord } from "../../backend/types/feed.types.ts";

interface ExportButtonProps {
  selectedFeeds: Set<string>;
  allFeeds: FeedRecord[];
}

export default function ExportButton({ selectedFeeds, allFeeds }: ExportButtonProps) {
  const [includeCategoryStructure, setIncludeCategoryStructure] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (selectedFeeds.size === 0) return;
    
    try {
      setIsExporting(true);
      setError(null);
      
      // Get the selected feeds from the full feeds list
      const feedsToExport = allFeeds.filter(feed => selectedFeeds.has(feed.url));
      
      // Make the API call
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feeds: feedsToExport,
          options: {
            includeCategoryStructure
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export feeds');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger the download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'export.opml';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div class="flex items-center space-x-3">
      {error && (
        <div class="text-red-600 text-sm mr-2">
          {error}
        </div>
      )}
      <div class="flex items-center">
        <input
          id="include-categories"
          type="checkbox"
          checked={includeCategoryStructure}
          onChange={(e) => setIncludeCategoryStructure(e.currentTarget.checked)}
          class="h-4 w-4 text-fresh-teal focus:ring-fresh-yellow border-fresh-teal/30 rounded"
        />
        <label for="include-categories" class="ml-2 text-sm text-slate-700 flex items-center">
          Preserve categories
          <div class="relative ml-1 group">
            <svg class="w-4 h-4 text-fresh-emerald cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 w-48 bg-white p-2 rounded shadow-lg border border-fresh-teal/20 text-xs text-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              If unchecked, all the feeds will export in a single "All" category
              <div class="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-px border-8 border-transparent border-t-white"></div>
            </div>
          </div>
        </label>
      </div>
      <button
        type="button"
        onClick={handleExport}
        disabled={selectedFeeds.size === 0 || isExporting}
        class={`inline-flex items-center px-3 py-1 border text-sm leading-5 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fresh-yellow ${selectedFeeds.size > 0 && !isExporting ? 'border-transparent text-slate-800 bg-fresh-yellow hover:bg-yellow-400' : 'border-slate-300 text-slate-500 bg-slate-100 cursor-not-allowed'}`}
      >
        {isExporting ? (
          <svg class="animate-spin -ml-0.5 mr-1.5 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg class={`-ml-0.5 mr-1.5 h-4 w-4 ${selectedFeeds.size > 0 ? 'text-slate-800' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
        {isExporting ? 'Exporting...' : 'Export Selected'}
      </button>
    </div>
  );
}
