# Backend Functionality Summary

This document summarizes the core functionalities implemented in the backend of the OPML Subscription Manager.

## Core Processing Pipeline (`main.ts`)

The backend provides a command-line interface (CLI) that orchestrates the processing of an OPML file:

1.  **OPML Parsing (`parseOPML.ts`)**: Reads an input OPML file and extracts feed URLs, organizing them by category.
2.  **Feed Validation**: For each extracted feed, performs a series of checks:
    *   **Accessibility (`checkFeedAccessibility.ts`)**: Verifies if the feed URL is reachable via HTTP(S).
    *   **Compatibility (`checkFeedCompatibility.ts`)**: Checks if the feed content is valid RSS or Atom format.
    *   **Update Frequency (`getFeedUpdateFrequency.ts`)**: Analyzes the feed content to determine the last update date and frequency of updates in the last 3 months (only for compatible feeds).
3.  **Categorization**: Based on the validation results, feeds are categorized as:
    *   `active`: Accessible, compatible, and recently updated.
    *   `inactive`: Accessible, compatible, but not recently updated.
    *   `dead`: Not accessible.
    *   `incompatible`: Accessible but not in a valid RSS/Atom format, or contains errors during parsing/analysis.
4.  **OPML Generation (`generateNewOPML.ts`)**: Creates new OPML files, separating feeds based on their final status category (active, inactive, dead, incompatible). Also provides a function `generateOPMLForExport` used by the API.
5.  **Statistics Generation (`writeStatistics.ts`)**: Calculates summary statistics (counts per category, top categories, most updated feeds, incompatible feed reasons) and generates a markdown report.

## Core Services

These services provide foundational capabilities used across the backend and potentially by the frontend API:

*   **Storage Service (`services/storage/`)**:
    *   Implemented using Deno KV (`storage.impl.ts`).
    *   Provides persistent storage for feed records (`FeedRecord`), validation session details (`ValidationSession`), category information, and statistics.
    *   Supports atomic operations, batching, and data retrieval with filtering/pagination.
    *   Uses specific key prefixes (`storage.constants.ts`) for organization.
*   **Validation Service (`services/validation/`)**:
    *   Coordinates the multi-step validation process for feeds (`validation.impl.ts`).
    *   Manages validation sessions, tracking progress and results.
    *   Integrates `checkFeedAccessibility`, `checkFeedCompatibility`, and `getFeedUpdateFrequency`.
    *   Interacts with the Storage Service to save session state and results.
    *   Interacts with the WebSocket Service to broadcast progress updates.
*   **WebSocket Service (`services/websocket/`)**:
    *   Manages WebSocket connections from clients (`websocket.impl.ts`).
    *   Handles client subscriptions to specific validation sessions.
    *   Broadcasts real-time validation events (progress, completion, errors) to subscribed clients.

## Type Definitions (`types/`)

A set of TypeScript files define the core data structures and interfaces used throughout the backend, ensuring type safety and consistency (e.g., `FeedEntry`, `FeedRecord`, `ValidationSession`, `IKVStorageService`). A key refactoring established `feed.types.ts` as the central source for feed-related types (Memory: [3c3b7e2f-a695-4569-8be1-69fb8806420a]).
