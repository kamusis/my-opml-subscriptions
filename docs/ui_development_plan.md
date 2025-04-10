# UI Development Plan

This document outlines the steps to build the user interface components for the OPML Subscription Manager, based on the requirements in `design-frontend.md` and utilizing the existing backend API.

**Technology Stack:** Fresh (Deno, Preact), TypeScript, Tailwind CSS

**Core Principles:**

*   **Incremental Development:** Build and test components one by one.
*   **Component-Based:** Create reusable Preact components where applicable.
*   **Island Architecture:** Use Fresh's island architecture for interactive client-side components.
*   **API Integration:** Connect UI elements to the corresponding `/api/*` endpoints.
*   **State Management:** Utilize Preact Signals for managing component state.

## Phase 1: Foundational Setup & Core Upload & Feeds List

1.  **Basic Layout & Routing (`routes/index.tsx`)**:
    *   Create the main index route file (`src/frontend/routes/index.tsx`).
    *   Set up a basic page structure (header, main content area, footer).
    *   Ensure Tailwind CSS is correctly configured and basic styling works.
2.  **OPML Upload Component (`components/OPMLUploader.tsx`, `islands/OPMLUploaderIsland.tsx`)**:
    *   Create a reusable component for the upload functionality.
    *   Implement a simple file input initially. *Stretch Goal: Add drag & drop.*
    *   Create an interactive island for handling file selection, validation (OPML extension), and form submission.
    *   Integrate the island into `routes/index.tsx`.
    *   Connect the form submission to the `POST /api/upload` endpoint.
    *   Display upload progress (basic indicator first).
    *   Handle success and error responses from the API (e.g., show messages to the user).
    *   On successful upload, list all the feeds and provide a button to call the validation process.
3.  **Feed List Page (`routes/feeds.tsx`)**:
    *   Create a new route for displaying the list of feeds.
    *   Fetch feed data from `GET /api/feeds` on page load.
    *   Display feeds in a table or list format, showing key information (URL, Status, Category, Last Updated).

## Phase 2: Feed Display & Validation Monitoring

4.  **Validation Trigger & Status Component (`islands/ValidationStatus.tsx`)**:
    *   Add a button on the `index.tsx` page (the main page after upload) to trigger the validation process via `POST /api/validate`.
    *   Create an island component to handle the validation state.
    *   Implement WebSocket connection logic within the island to listen for `progress`, `complete`, and `error` events for the triggered `validationId`.
    *   Display real-time validation progress (e.g., "Processing feed X of Y", progress bar).
    *   Update the feed list dynamically (or prompt refresh) as validation completes to show updated statuses.
    *   Display any errors reported during validation.
5.  **Feed List Enhancements (`islands/FeedListControls.tsx`)**:
    *   Create an island for interactive controls for the feed list on `routes/feeds.tsx`.
    *   Implement client-side filtering controls (e.g., dropdowns for Status, Category, text input for URL search).
    *   Implement sorting controls (e.g., clickable table headers).
    *   Update the list by re-fetching data from `GET /api/feeds` with the appropriate query parameters based on user interaction.

## Phase 3: Export & Refinements

6.  **Export Functionality (`islands/ExportButton.tsx`)**:
    *   Add an "Export OPML" button to the `routes/feeds.tsx` page.
    *   Create an island to handle the export logic.
    *   Gather the list of currently displayed/filtered feeds (or implement selection).
    *   Send the feed list to `POST /api/export`.
    *   Handle the file download response initiated by the API.
    *   Provide options (via UI controls) for `includeCategoryStructure`.
7.  **UI Polishing & Error Handling**:
    *   Refine styling using Tailwind CSS for a clean and user-friendly interface.
    *   Improve loading states and feedback messages across all components.
    *   Ensure consistent error handling and display informative error messages.

## Future Enhancements (Post-Core Implementation)

*   **Feed Details View:** A route (`routes/feeds/[url].tsx`) to show detailed info and validation history for a single feed (requires new API endpoint `GET /api/feeds/:feedUrl`).
*   **Batch Operations:** Implement feed selection (checkboxes) in the list and buttons for batch revalidation or deletion (requires new API endpoints like `POST /api/feeds/revalidate` or `POST /api/feeds/batch`).
*   **Dashboard View:** Create a dedicated dashboard (`routes/dashboard.tsx`) integrating statistics components (requires `GET /api/categories/stats`, `GET /api/incompatible/reasons` API endpoints).
*   **Drag & Drop Upload:** Enhance the `OPMLUploader` component.

This plan provides a structured approach to building the UI incrementally. Each phase builds upon the previous one, focusing on delivering core functionality first.
