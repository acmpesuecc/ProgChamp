# Syed Ayaan Hasan – Week 1 Report

---

## Overview

This week I built the game submission system, the admin moderation backend, and the user appeals system. The bulk of the learning this week was around structuring routes properly — specifically how to keep route files thin by offloading business logic into dedicated service files. I initially wrote the validation logic directly inside the endpoints, but refactored everything into service layers to keep things cleaner and more maintainable.

---

## Architecture: Routes + Service Files

The pattern I adopted across all features this week was to have route files handle only the HTTP layer — parsing the request, calling middleware, and returning responses — while service files handle all the actual logic: validation, database queries, and error throwing. This made the routes much easier to read and the logic much easier to test or change in isolation.

---

## `gameRequests.ts` — User Game Submission Routes

This file has two endpoints.

### `POST /` — Submit a Game Request

This is the main submission endpoint. It's protected by two middlewares: `requireSession` checks that the user has a valid active session, and `requireCompleteProfile` ensures they've finished setting up their account before they can submit anything.

**Spam protection** — before anything else, `canUserSubmitNewGame()` counts how many `pending` requests the user already has in the `game_requests` table with a type of `new_game`. If that number is 3 or more, the request is rejected with a 429 before any further processing happens.

**Validation** — if the user is under the limit, the body is passed to `validateGameSubmission()` in `gameRequestService.ts`, which does the following:
- Trims all text inputs
- Checks that `title` and `gameUrl` are present
- Enforces a 100 character limit on the title
- Checks the `game_requests` table to make sure the same user hasn't already submitted a pending request with the same URL
- Checks the live `games` table to make sure the game doesn't already exist on the platform

If everything passes, a unique ID is generated with `nanoid` (prefixed `gr_`) and a new row is inserted into the `game_requests` table with a status of `pending`.

**Tables written to:** `game_requests`

**Service functions used:** `canUserSubmitNewGame()`, `validateGameSubmission()`

---

### `GET /my` — Fetch User's Own Submissions

A simple authenticated endpoint that queries the `game_requests` table filtered by the current user's ID and returns all of their submissions regardless of status.

**Tables read:** `game_requests`

---

## `adminGameRoutes.ts` — Admin Moderation Endpoints

This file has four endpoints, all protected by `requireSession` and `requireAdmin`.

### `GET /` — Fetch Pending Game Requests

Returns a paginated list of pending game requests for admins to review. Rather than loading the entire table at once, this endpoint uses lazy loading — it only fetches a small batch of records at a time. Concretely, it fetches 20 rows at a time using SQL `LIMIT` and `OFFSET`. The offset is calculated from a `page` query parameter: page 1 has an offset of 0, page 2 has an offset of 20, and so on. This means the database only ever processes 20 rows per request rather than potentially thousands, which keeps memory usage and response times low regardless of how large the queue grows.

**Tables read:** `game_requests`

---

### `POST /:id/approve` — Approve a Game Request

This was the most involved endpoint to build. Approving a request involves two separate database writes — inserting the new game into the `games` table and updating the request's status in `game_requests` — and both need to succeed or neither should. To handle this, I used a **database transaction**.

A transaction is a way of grouping multiple database operations so they're treated as a single unit. If any step inside the transaction fails, the entire thing is rolled back — nothing is partially written. This prevents situations like a game being inserted but the request still showing as pending, or vice versa.

Inside `approveGameRequest()` in `gameRequestService.ts`, the transaction does the following in order:
1. Looks up the game request by ID — throws `NotFoundError` if it doesn't exist
2. Checks that the request status is `pending` — throws `InvalidStateError` if it's already been reviewed
3. Inserts a new row into `games` with the title, description, URL, and the original submitter as `createdBy`
4. Updates the `game_requests` row to set `status: "approved"`, `reviewedBy` to the admin's ID, and `reviewedAt` to the current timestamp
5. Inserts a row into `admin_actions` recording the admin ID and the game request ID

**Tables written to:** `games`, `game_requests`, `admin_actions`

**Service functions used:** `approveGameRequest()`

---

### `POST /:id/reject` — Reject a Game Request

Similar to approval but simpler — no transaction needed since there's only one write. The endpoint calls `getPendingGameRequest()` first to verify the request exists and is still pending, then updates the `game_requests` row to set `status: "rejected"`, `reviewedBy`, and `reviewedAt`, and inserts a row into `admin_actions`.

**Tables written to:** `game_requests`, `admin_actions`

**Service functions used:** `getPendingGameRequest()`

---

### `POST /:id/deactivate` — Deactivate a Live Game

This endpoint lets admins disable a game without deleting it. It calls `getGame()` from `gameService.ts` to verify the game exists and is currently active, then updates the `games` row to set `isActive: false`, `deactivatedAt`, and `deactivationReason` from the request body. The game stays in the database so the history is preserved — it's just no longer surfaced to users.

While implementing this, I noticed a gap in the existing `adminActions` schema (see Schema Proposal section below). The audit log insert for this endpoint is currently a placeholder pending that schema change being approved.

**Tables written to:** `games`

**Service functions used:** `getGame()`

---

## `userRequests.ts` — User Appeals Route

### `POST /` — Submit an Appeal

This endpoint handles two types of user appeals: `user_unban_appeal` and `game_report_appeal`. It's protected by `requireSession` and `requireCompleteProfile`.

The body is passed to `validateUserRequest()` in `userRequestService.ts`, which handles conditional validation depending on the request type:

- `requestType` is required and must be one of the two valid values
- For `game_report_appeal`, a `relatedGameId` must be present — this links the appeal to a specific game
- For `user_unban_appeal`, `relatedGameId` is not required and defaults to `null`
- In both cases, the service checks the `user_requests` table for an existing pending request of the same type from the same user (and for game reports, the same game) — duplicate appeals are rejected

If validation passes, a unique ID is generated (prefixed `ur_`) and the appeal is inserted into `user_requests` with a status of `pending`.

**Tables written to:** `user_requests`

**Service functions used:** `validateUserRequest()`

---

## Schema Proposal: Revised `adminActions`

While building the deactivation endpoint, I noticed the existing `adminActions` table in `schema.ts` only has two foreign key columns — `gameRequestId` and `userRequestId`. This means it can only log actions that are directly tied to a request record. It can't log things like a game being deactivated, a user being banned, or any other admin action that doesn't go through a request.

I proposed a revised schema in `adminActions.ts` that's more flexible. Instead of storing foreign keys to specific tables, it uses three fields: `actionType` (an enum covering `approve`, `reject`, `deactivate`, `reactivate`, `ban`, `unban`, `warn`, `delete`), `targetType` (an enum covering `game`, `game_request`, `user`, `appeal`), and `targetId` (the ID of whatever entity was affected). It also includes a `reason` field for the public-facing moderation reason and a `note` field for internal admin context. This way a single table can serve as a universal audit log for any admin action across the platform. The proposal is pending review and hasn't been applied to the main schema yet.

---

## Error Handling

Rather than letting service-level failures bubble up as unhandled exceptions, I introduced two custom error classes in `errors.ts`: `NotFoundError` for when a requested record doesn't exist, and `InvalidStateError` for when a record exists but is in the wrong state (e.g. trying to approve something that's already been reviewed). Route handlers catch these specifically and return appropriate HTTP status codes — 404 and 400 respectively — instead of a generic 500.

---

## Files Created

| File | Purpose |
|---|---|
| `gameRequests.ts` | User submission routes |
| `adminGameRoutes.ts` | Admin moderation endpoints |
| `userRequests.ts` | User appeals route |
| `gameRequestService.ts` | Submission, approval, and validation logic |
| `userRequestService.ts` | Appeals validation |
| `gameService.ts` | Game lookup and state checks |
| `adminActions.ts` | Proposed revised audit log schema (pending approval) |
| `errors.ts` | Custom error classes |