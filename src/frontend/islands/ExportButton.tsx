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
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
        />
        <label for="include-categories" class="ml-2 text-sm text-blue-800">
          Preserve categories
        </label>
      </div>
      <button
        type="button"
        onClick={handleExport}
        disabled={selectedFeeds.size === 0 || isExporting}
        class={`inline-flex items-center px-3 py-1 border text-sm leading-5 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${selectedFeeds.size > 0 && !isExporting ? 'border-transparent text-white bg-blue-600 hover:bg-blue-700' : 'border-slate-300 text-slate-500 bg-slate-100 cursor-not-allowed'}`}
      >
        {isExporting ? (
          <svg class="animate-spin -ml-0.5 mr-1.5 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg class={`-ml-0.5 mr-1.5 h-4 w-4 ${selectedFeeds.size > 0 ? 'text-white' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
        {isExporting ? 'Exporting...' : 'Export Selected'}
      </button>
    </div>
  );
}
