// src/frontend/islands/FeedListControls.tsx
import { useState, useEffect, useMemo } from "preact/hooks";
// We're using useState for selection state instead of signals
import FeedList from "../components/FeedList.tsx";
import ExportButton from "./ExportButton.tsx";
import type { FeedRecord, FeedStatus } from "../../backend/types/feed.types.ts";

interface FeedListControlsProps {
  feeds: FeedRecord[];
  isLoading?: boolean;
  onSelectionChange?: (selectedFeeds: Set<string>) => void;
}

type SortField = 'url' | 'category' | 'status' | 'lastUpdate' | 'updatesInLast3Months' | 'lastValidated';
type SortDirection = 'asc' | 'desc';

export default function FeedListControls({ feeds, isLoading = false, onSelectionChange }: FeedListControlsProps) {
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<FeedStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selection state
  const [selectedFeeds, setSelectedFeeds] = useState<Set<string>>(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState<boolean>(false);

  // Sorting states
  const [sortField, setSortField] = useState<SortField>('url');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Derived state for unique categories
  const [categories, setCategories] = useState<string[]>([]);

  // Extract unique categories from feeds
  useEffect(() => {
    if (feeds && feeds.length > 0) {
      const uniqueCategories = Array.from(new Set(feeds.map(feed => feed.category || 'Uncategorized')));
      setCategories(['all', ...uniqueCategories.sort()]);
    }
  }, [feeds]);

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply filters and sorting to feeds
  const filteredAndSortedFeeds = useMemo(() => {
    // Start with all feeds
    let result = [...feeds];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(feed => feed.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(feed => (feed.category || 'Uncategorized') === categoryFilter);
    }

    // Apply search filter (case insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(feed =>
        feed.url.toLowerCase().includes(query) ||
        (feed.category || '').toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      // Type for comparison values that handles all possible field types
      type ComparisonValue = string | number | Date | null | undefined;

      let valueA: ComparisonValue;
      let valueB: ComparisonValue;

      // Extract values based on sort field
      switch (sortField) {
        case 'url':
          valueA = a.url.toLowerCase();
          valueB = b.url.toLowerCase();
          break;
        case 'category':
          valueA = (a.category || 'Uncategorized').toLowerCase();
          valueB = (b.category || 'Uncategorized').toLowerCase();
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'lastUpdate':
          valueA = a.lastUpdate ? new Date(a.lastUpdate).getTime() : 0;
          valueB = b.lastUpdate ? new Date(b.lastUpdate).getTime() : 0;
          break;
        case 'updatesInLast3Months':
          valueA = a.updatesInLast3Months;
          valueB = b.updatesInLast3Months;
          break;
        case 'lastValidated':
          valueA = a.lastValidated ? new Date(a.lastValidated).getTime() : 0;
          valueB = b.lastValidated ? new Date(b.lastValidated).getTime() : 0;
          break;
        default:
          valueA = a.url.toLowerCase();
          valueB = b.url.toLowerCase();
      }

      // Compare values based on direction
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [feeds, statusFilter, categoryFilter, searchQuery, sortField, sortDirection]);

  // Update selection and selectAll checkbox state when filters change
  useEffect(() => {
    // Get the set of URLs that are currently visible after filtering
    const visibleFeedUrls = new Set(filteredAndSortedFeeds.map(feed => feed.url));

    // Count how many visible feeds are selected
    let visibleSelectedCount = 0;
    selectedFeeds.forEach(url => {
      if (visibleFeedUrls.has(url)) {
        visibleSelectedCount++;
      }
    });

    // Update the selectAllChecked state based on whether all visible feeds are selected
    const areAllVisibleFeedsSelected =
      visibleSelectedCount === filteredAndSortedFeeds.length &&
      filteredAndSortedFeeds.length > 0;

    setSelectAllChecked(areAllVisibleFeedsSelected);

    // We don't modify the selectedFeeds here to preserve selections when filters change
  // Only depend on the filter states and the current selection
  // This prevents potential infinite loops
  }, [statusFilter, categoryFilter, searchQuery, feeds, selectedFeeds, filteredAndSortedFeeds]);

  // Notify parent component when selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedFeeds);
    }
  }, [selectedFeeds, onSelectionChange]);

  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
    setSortField('url');
    setSortDirection('asc');
  };

  // Selection handlers
  /**
   * Handles individual feed selection/deselection
   * @param url The URL of the feed to select/deselect
   * @param isSelected Whether the feed should be selected
   */
  const handleSelectFeed = (url: string, isSelected: boolean) => {
    setSelectedFeeds(prev => {
      // Create a new Set from the previous selection to maintain immutability
      const newSelection = new Set(prev);

      if (isSelected) {
        // Add the URL to the selection
        newSelection.add(url);
      } else {
        // Remove the URL from the selection
        newSelection.delete(url);
      }

      return newSelection;
    });
  };

  /**
   * Handles the "Select All" checkbox state change
   * @param isSelected Whether all feeds should be selected
   */
  const handleSelectAll = (isSelected: boolean) => {
    // Update the checkbox state
    setSelectAllChecked(isSelected);

    if (isSelected) {
      // Create a new Set from the existing selection to maintain previous selections
      const newSelection = new Set(selectedFeeds);

      // Add all currently visible feeds to the selection
      filteredAndSortedFeeds.forEach(feed => newSelection.add(feed.url));

      // Update the selection state
      setSelectedFeeds(newSelection);
    } else {
      // Create a new Set from the existing selection
      const newSelection = new Set(selectedFeeds);

      // Remove only the currently visible feeds from the selection
      // This preserves selections that aren't currently visible
      filteredAndSortedFeeds.forEach(feed => newSelection.delete(feed.url));

      // Update the selection state
      setSelectedFeeds(newSelection);
    }
  };

  // We're using checkboxes for selection instead of dropdown menu

  // Get sort icon based on current sort state
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div class="feed-list-container transition-all duration-300 ease-in-out relative w-full">
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
        <div class="mb-6 bg-white border border-slate-200 rounded-lg shadow-sm p-4">
          <div class="mb-4">
            <div class="flex items-center mb-2">
              <h3 class="text-sm font-medium text-slate-700">Filter & Sort Feeds</h3>
              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset all filters"
                class="ml-2 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label for="status-filter" class="block text-xs font-medium text-slate-500 mb-1">Status</label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.currentTarget.value as FeedStatus | 'all')}
                  class="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="dead">Dead</option>
                  <option value="incompatible">Incompatible</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label for="category-filter" class="block text-xs font-medium text-slate-500 mb-1">Category</label>
                <select
                  id="category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.currentTarget.value)}
                  class="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Filter */}
              <div>
                <label for="search-filter" class="block text-xs font-medium text-slate-500 mb-1">Search URL</label>
                <div class="relative rounded-md shadow-sm">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="search-filter"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    placeholder="Search by URL or category"
                    class="block w-full rounded-md border-fresh-teal/30 pl-10 focus:border-fresh-yellow focus:ring-fresh-yellow sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filter summary */}
          <div class="flex items-center justify-between text-xs text-slate-500">
            <div>
              <span class="font-medium">{filteredAndSortedFeeds.length}</span> of <span class="font-medium">{feeds.length}</span> feeds shown
            </div>
            {(statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
              <div class="flex items-center space-x-2">
                <span>Active filters:</span>
                {statusFilter !== 'all' && (
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-fresh-mint/30 text-slate-700">
                    Status: {statusFilter}
                  </span>
                )}
                {categoryFilter !== 'all' && (
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-fresh-mint/30 text-slate-700">
                    Category: {categoryFilter}
                  </span>
                )}
                {searchQuery && (
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-fresh-mint/30 text-slate-700">
                    Search: {searchQuery}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div class="feed-list-container">
        {/* Selection summary - always visible when feeds are available */}
        {feeds.length > 0 && (
          <div class="mb-4 bg-white border border-slate-200 shadow-sm rounded-md p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3 max-w-[70%]">
                <div class="flex items-center flex-shrink-0">
                  <svg class="h-5 w-5 text-fresh-emerald mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span class="font-medium text-slate-800">{selectedFeeds.size}</span>&nbsp;<span class="text-slate-600">{selectedFeeds.size === 1 ? 'feed' : 'feeds'} selected</span>
                </div>

                {selectedFeeds.size > 0 && (statusFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
                  <div class="text-xs text-slate-500 flex items-center overflow-hidden">
                    <svg class="h-3.5 w-3.5 text-slate-400 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="truncate">Selections are preserved across filter changes.</span>
                  </div>
                )}
              </div>

              <ExportButton selectedFeeds={selectedFeeds} allFeeds={feeds} />
            </div>
          </div>
        )}

        <FeedList
          feeds={filteredAndSortedFeeds}
          isLoading={isLoading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          getSortIcon={getSortIcon}
          selectedFeeds={selectedFeeds}
          onSelectFeed={handleSelectFeed}
          onSelectAll={handleSelectAll}
          selectAllChecked={selectAllChecked}
        />
      </div>
    </div>
  );
}
