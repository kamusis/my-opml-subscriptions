# Frontend API and UI Summary

This document summarizes the implemented API endpoints and the status of the UI components for the frontend of the OPML Subscription Manager.

## API Endpoints (`src/frontend/routes/api/`)

The following API endpoints have been implemented to interact with the backend services and data:

*   **`POST /api/upload`**:
    *   Accepts an OPML file via multipart/form-data.
    *   Parses the uploaded file using the backend `parseOPML` function.
    *   Saves the extracted feeds as `FeedRecord` objects into the KV storage.
    *   Returns an ID related to the upload and status.
*   **`POST /api/validate`**:
    *   Initiates an asynchronous validation process for *all* feeds currently stored in the KV storage.
    *   Leverages the backend `ValidationServiceImpl`.
    *   Returns a `validationId` immediately (HTTP 202 Accepted) while the validation runs in the background.
    *   Updates feed records in storage upon completion.
*   **`GET /api/validate?id={validationId}`**:
    *   Retrieves the current status and progress of a specific validation session using its `validationId`.
    *   Uses the backend `ValidationServiceImpl` to get session data.
*   **`GET /api/status?id={validationId}`**:
    *   (Similar to `GET /api/validate`) Retrieves the current status and progress of a specific validation session using its `validationId`.
    *   Uses the backend `ValidationServiceImpl` to get session data.
*   **`GET /api/feeds`**:
    *   Lists stored feed records (`FeedRecord`) from the KV storage.
    *   Supports filtering (by text, category, status), sorting (by lastUpdate, status, category, updatesInLast3Months), and pagination (limit, cursor).
*   **`POST /api/export`**:
    *   Accepts a JSON payload containing an array of `FeedRecord` objects.
    *   Generates an OPML file containing these feeds.
    *   Supports an option (`includeCategoryStructure`) to either maintain the original categories or consolidate feeds into a single category.
    *   Returns the generated OPML content as a file download with a filename format `export_yyyymmdd_uuid.opml`.

## UI Components (`src/frontend/routes/`)

Based on the file structure analysis, no specific UI page components (`.ts` or `.tsx` files) have been implemented within the standard `src/frontend/routes/` directory (outside of the `api` subdirectory). Further development is needed to build the user interface elements described in the design documents (e.g., upload component, validation dashboard, feed list).
