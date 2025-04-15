# Implementation Plan: Add Multi-User Support

## Background
Currently, the OPML Subscriptions Manager supports only a single user. Uploading a new OPML file replaces the old one, and feeds with the same URL are overwritten in the key-value (kv) store. The goal is to add multi-user support so that each user's data is isolated and managed independently, without supporting multiple OPML files per user (new feeds from uploads are merged, not replaced).

## Step-by-Step Implementation Plan

### 1. Data Model Updates
- **Feed Records**: Add a `userId` field to `FeedRecord` and related types to associate each feed with a specific user.
- **Category/Session/Other Records**: Update all stored objects (categories, validation sessions, etc.) to include a `userId` field if they are user-specific.
- **Storage Keys**: Update key structure in the kv store to use `[userId, StoragePrefix.<Type>, ...]` for all user-related data. This ensures all data for a user is grouped and isolated. For example:
  - Feed: `[userId, StoragePrefix.Feed, url]`
  - Session: `[userId, StoragePrefix.Session, sessionId]`
  - Category: `[userId, StoragePrefix.Category, categoryName]`
  - Stats: `[userId, StoragePrefix.Stats, statKey]`
  This structure prevents key collisions and makes user data management efficient and secure.

### 2. User Identification System (No Sign-On)
- **UserId Storage**: On first visit, generate a unique `userId` (e.g., UUID) in the browser and store it in `localStorage`.
- **Frontend Logic**: On every app load, retrieve the `userId` from `localStorage` (generate and store one if missing).
- **API Calls**: Include the `userId` in every API request (e.g., as a header or in the request body/query).
- **Backend Handling**: The backend uses the provided `userId` to scope all data operations—no authentication or session management needed.

**Benefits:**
- No sign-up/sign-in required—frictionless for users.
- Each browser/device is isolated.
- Easy to implement and maintain.

**Limitations:**
- Users cannot access their data across browsers/devices.
- Clearing browser storage or using incognito mode will generate a new `userId` (losing access to old data).

### 3. Storage Service Adjustments
- **KVStorageService**:
  - Update all methods to require `userId` as a parameter.
  - Update queries and mutations to use `[userId, StoragePrefix.<Type>, ...]` key structure for all user-related data.
  - Refactor batch and atomic operations to be user-scoped.

### 4. API Endpoint Modifications
- **API Changes**: Update all endpoints to require and handle `userId`.
- **Validation**: Ensure endpoints verify `userId` matches authenticated user.

### 5. Frontend Changes
- **User Context**: Always retrieve the `userId` from `localStorage` and include it with every API call.
- **UI Updates**: No login/logout or registration UI is needed; all user identification is handled via browser localStorage.
- **OPML Upload**: Ensure uploads and all user actions are associated with the current `userId`.

### 6. Testing Plan
- **Unit Tests**: Add/extend tests for storage service, API endpoints, and authentication logic.
- **Integration Tests**: Simulate multiple users uploading, viewing, and managing feeds.
- **Regression Tests**: Ensure existing single-user flows still work for the default/first user.

### 7. Future Enhancements
- Support for multiple OPML files per user.
- Advanced authentication (OAuth, social login).
- User profile management.

---

**References:**
- [GitHub Issue #8](https://github.com/kamusis/my-opml-subscriptions/issues/8)
- Existing codebase and storage service structure

---

This plan ensures a robust and secure transition to multi-user support, with clear steps for data model changes, authentication, storage refactoring, API and UI updates, migration, and testing.
