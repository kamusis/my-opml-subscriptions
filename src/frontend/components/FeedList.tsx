// src/frontend/components/FeedList.tsx
import { JSX } from "preact";
import type { FeedRecord } from "../../backend/types/feed.types.ts";

type SortField = 'url' | 'category' | 'status' | 'lastUpdate' | 'updatesInLast3Months' | 'lastValidated';
type SortDirection = 'asc' | 'desc';

interface FeedListProps {
  feeds: FeedRecord[];
  isLoading?: boolean;
  sortField?: SortField;
  sortDirection?: SortDirection;
  onSort?: (field: SortField) => void;
  getSortIcon?: (field: SortField) => JSX.Element;
  // Selection props
  selectedFeeds?: Set<string>;
  onSelectFeed?: (url: string, isSelected: boolean) => void;
  onSelectAll?: (isSelected: boolean) => void;
  selectAllChecked?: boolean;
}

export default function FeedList({
  feeds = [],
  isLoading = false,
  sortField: _sortField = 'url',
  sortDirection: _sortDirection = 'asc',
  onSort,
  getSortIcon,
  // Selection props with defaults
  selectedFeeds = new Set<string>(),
  onSelectFeed = () => {},
  onSelectAll = () => {},
  selectAllChecked = false
}: FeedListProps) {
  // Ensure feeds is always an array
  const feedsArray = Array.isArray(feeds) ? feeds : [];
  // Use an absolute positioned loading indicator that doesn't cause layout shifts
  const loadingIndicator = isLoading ? (
    <div class="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 transition-opacity duration-300 ease-in-out">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-fresh-yellow"></div>
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

  // Helper to create sortable column headers
  const SortableHeader = ({ field, label }: { field: SortField, label: string }) => {
    const isSortable = !!onSort && !!getSortIcon;

    // Define column widths based on field type
    const getColumnClass = () => {
      switch (field) {
        case 'url':
          return 'w-[30%]'; // Reduced URL width to give more space to other columns
        case 'category':
          return 'w-[12%]';
        case 'status':
          return 'w-[10%]';
        case 'lastUpdate':
          return 'w-[19%]'; // Increased to ensure dates are fully visible
        case 'updatesInLast3Months':
          return 'w-[10%]';
        case 'lastValidated':
          return 'w-[19%]'; // Increased to ensure dates are fully visible
        default:
          return '';
      }
    };

    if (!isSortable) {
      return (
        <th scope="col" class={`px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider ${getColumnClass()}`}>
          {label}
        </th>
      );
    }

    return (
      <th
        scope="col"
        class={`px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer group ${getColumnClass()}`}
        onClick={() => onSort(field)}
      >
        <div class="flex items-center space-x-1">
          <span>{label}</span>
          <span class="inline-flex">{getSortIcon(field)}</span>
        </div>
      </th>
    );
  };

  return (
    <div class="w-full relative min-h-[300px] transition-all duration-300 ease-in-out">
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
            <div class="overflow-x-auto" style="scrollbar-width: thin">  {/* Enable horizontal scrolling */}
              <table class="w-full table-fixed divide-y divide-slate-200" style="min-width: 1000px">  {/* Set minimum width to ensure all columns are visible */}
                <thead class="bg-slate-50">
                  <tr>
                    {/* Select All Checkbox */}
                    <th scope="col" class="px-4 py-3 w-[5%]">
                      <div class="flex items-center justify-center">
                        <input
                          type="checkbox"
                          class="h-4 w-4 text-fresh-emerald focus:ring-fresh-emerald border-slate-300 rounded"
                          checked={selectAllChecked}
                          onChange={(e) => onSelectAll(e.currentTarget.checked)}
                        />
                      </div>
                    </th>
                    <SortableHeader field="url" label="Name" />
                    <SortableHeader field="category" label="Category" />
                    <SortableHeader field="status" label="Status" />
                    <SortableHeader field="lastUpdate" label="Last Update" />
                    <SortableHeader field="updatesInLast3Months" label="Updates (3mo)" />
                    <SortableHeader field="lastValidated" label="Last Valid" />
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-slate-200">
                  {feedsArray.map((feed, index) => (
                    <tr key={feed.url} class={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      {/* Row Selection Checkbox */}
                      <td class="px-4 py-4">
                        <div class="flex items-center justify-center">
                          <input
                            type="checkbox"
                            class="h-4 w-4 text-fresh-emerald focus:ring-fresh-emerald border-slate-300 rounded"
                            checked={selectedFeeds.has(feed.url)}
                            onChange={(e) => onSelectFeed(feed.url, e.currentTarget.checked)}
                          />
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm font-medium text-slate-900">
                        <div class="flex items-center">
                          <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <a
                            href="#"
                            class="text-fresh-emerald hover:text-fresh-turquoiseDeep transition-colors duration-200 block overflow-hidden text-ellipsis"
                            title={feed.url}
                            onClick={(e) => {
                              e.preventDefault();
                              globalThis.open(feed.url, '_blank', 'noopener,noreferrer');
                            }}
                            style={{ maxWidth: 'calc(100% - 1.5rem)' }}
                          >
                            {/* Display feed.text, fallback to feed.url if missing */}
                            <span class="truncate">{feed.text || feed.url}</span>
                          </a>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm text-slate-500">
                        <div class="flex items-center">
                          <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span class="truncate" title={feed.category || "Uncategorized"}>{feed.category || "Uncategorized"}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <div class="flex justify-center">
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
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm text-slate-500">
                        <div class="flex items-center">
                          <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span class="truncate">
                            {feed.lastUpdate
                              ? new Date(feed.lastUpdate).toLocaleString(undefined, {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false // Use 24-hour format to save space
                                })
                              : "Never"}
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <div class="flex justify-center">
                          <span
                            class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${feed.updatesInLast3Months > 10 ? 'bg-green-100 text-green-800' : feed.updatesInLast3Months > 3 ? 'bg-blue-100 text-blue-800' : feed.updatesInLast3Months > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'}`}
                          >
                            {feed.updatesInLast3Months}
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm text-slate-500">
                        <div class="flex items-center">
                          <svg class="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span class="truncate">
                            {feed.lastValidated
                              ? new Date(feed.lastValidated).toLocaleString(undefined, {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false // Use 24-hour format to save space
                                })
                              : "Never"}
                          </span>
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
