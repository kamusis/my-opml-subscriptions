// src/frontend/components/FeedList.tsx
import type { FeedRecord } from "../../backend/types/feed.types.ts";

interface FeedListProps {
  feeds: FeedRecord[];
  isLoading?: boolean;
}

export default function FeedList({ feeds = [], isLoading = false }: FeedListProps) {
  // Ensure feeds is always an array
  const feedsArray = Array.isArray(feeds) ? feeds : [];
  // Use an absolute positioned loading indicator that doesn't cause layout shifts
  const loadingIndicator = isLoading ? (
    <div class="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 transition-opacity duration-300 ease-in-out">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ) : null;
  
  // Empty state content
  const emptyState = (!feedsArray || feedsArray.length === 0) && !isLoading ? (
    <div class="py-12 text-center transition-opacity duration-300 ease-in-out">
      <svg class="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
          d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7M6 17a1 1 0 011 1" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-slate-900">No feeds</h3>
      <p class="mt-1 text-sm text-slate-500">Upload an OPML file to get started.</p>
    </div>
  ) : null;

  return (
    <div class="mt-6 w-full relative min-h-[200px] transition-all duration-300 ease-in-out">
      {loadingIndicator}
      {emptyState}
      
      {/* Only show the feed list if we have feeds */}
      {feedsArray.length > 0 && (
        <div class="transition-opacity duration-300 ease-in-out" style={{ opacity: isLoading ? '0.6' : '1' }}>
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-lg font-medium text-slate-900">Feed Subscriptions</h2>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {feedsArray.length} {feedsArray.length === 1 ? 'feed' : 'feeds'}
            </span>
          </div>
          
          <div class="overflow-hidden border border-slate-200 rounded-lg shadow-sm">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      URL
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Last Update
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Updates (3mo)
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Last Validated
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-slate-200">
                  {feedsArray.map((feed, index) => (
                    <tr key={feed.url} class={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        <div class="flex items-center">
                          <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <a 
                            href="#" 
                            class="text-blue-600 hover:text-blue-900 truncate max-w-xs" 
                            title={feed.url}
                            onClick={(e) => {
                              e.preventDefault();
                              globalThis.open(feed.url, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            {feed.url}
                          </a>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div class="flex items-center">
                          <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span>{feed.category || "Uncategorized"}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        feed.status === "active"
                          ? "bg-green-100 text-green-800"
                          : feed.status === "inactive"
                          ? "bg-yellow-100 text-yellow-800"
                          : feed.status === "dead"
                          ? "bg-red-100 text-red-800"
                          : feed.status === "incompatible"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-slate-100 text-slate-800" // Default/Unknown
                      }`}
                    >
                          {feed.status === "active" && (
                            <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="3" />
                            </svg>
                          )}
                          {feed.status === "inactive" && (
                            <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-yellow-400" fill="currentColor" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="3" />
                            </svg>
                          )}
                          {feed.status === "dead" && (
                            <svg class="-ml-0.5 mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                              <circle cx="4" cy="4" r="3" />
                            </svg>
                          )}
                          {feed.status}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div class="flex items-center">
                          <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {feed.lastUpdate
                            ? new Date(feed.lastUpdate).toLocaleString()
                            : "Never"}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <span 
                            class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${feed.updatesInLast3Months > 10 ? 'bg-green-100 text-green-800' : feed.updatesInLast3Months > 3 ? 'bg-blue-100 text-blue-800' : feed.updatesInLast3Months > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'}`}
                          >
                            {feed.updatesInLast3Months}
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div class="flex items-center">
                          <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {feed.lastValidated
                            ? new Date(feed.lastValidated).toLocaleString()
                            : "Never"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
