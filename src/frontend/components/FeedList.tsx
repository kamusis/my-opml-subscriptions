// src/frontend/components/FeedList.tsx
import type { FeedRecord } from "../../backend/types/feed.types.ts";

// Add loading state and empty state components
interface FeedListProps {
  feeds: FeedRecord[];
  isLoading?: boolean;
}

export default function FeedList({ feeds, isLoading = false }: FeedListProps) {
  if (isLoading) {
    return (
      <div class="mt-4 flex justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (!feeds || feeds.length === 0) {
    return <p class="mt-4 text-gray-600">No feeds loaded yet.</p>;
  }

  return (
    <div class="mt-6 w-full overflow-x-auto">
      <h2 class="text-xl font-semibold mb-4">Uploaded Feeds</h2>
      <table class="min-w-full bg-white border rounded shadow-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-2 border-b text-left text-sm font-medium text-gray-700">
              URL
            </th>
            <th class="px-4 py-2 border-b text-left text-sm font-medium text-gray-700">
              Category
            </th>
            <th class="px-4 py-2 border-b text-left text-sm font-medium text-gray-700">
              Status
            </th>
            <th class="px-4 py-2 border-b text-left text-sm font-medium text-gray-700">
              Last Validated
            </th>
          </tr>
        </thead>
        <tbody>
          {feeds.map((feed) => (
            <tr key={feed.url} class="hover:bg-gray-50">
              <td class="px-4 py-2 border-b text-sm text-gray-800 break-all">
                <span class="text-blue-600 cursor-pointer hover:underline" 
                  onClick={() => globalThis.open(feed.url, '_blank', 'noopener,noreferrer')}>
                  {feed.url}
                </span>
              </td>
              <td class="px-4 py-2 border-b text-sm text-gray-800">
                {feed.category || "Uncategorized"}
              </td>
              <td class="px-4 py-2 border-b text-sm text-gray-800">
                <span
                  class={`px-2 py-1 text-xs font-semibold rounded-full ${
                    feed.status === "active"
                      ? "bg-green-100 text-green-800"
                      : feed.status === "inactive"
                      ? "bg-yellow-100 text-yellow-800"
                      : feed.status === "dead"
                      ? "bg-red-100 text-red-800"
                      : feed.status === "incompatible"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-800" // Default/Unknown
                  }`}
                >
                  {feed.status}
                </span>
              </td>
              <td class="px-4 py-2 border-b text-sm text-gray-800">
                {feed.lastValidated
                  ? new Date(feed.lastValidated).toLocaleString()
                  : "Never"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
