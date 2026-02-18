# ProgChamp API Documentation

## Authentication Endpoints

### POST /auth/google
Google OAuth login/signup endpoint.

**Request Body:**
```json
{
  "googleId": "string (required)",
  "email": "string (required, valid email)",
  "name": "string (required)",
  "avatarUrl": "string (optional)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "avatarUrl": "string | null",
    "userType": "normal",
    "superlikesRemaining": 3,
    "createdAt": "timestamp"
  }
}
```

**Error Responses:**
- `400` - Invalid request data
- `403` - Account is deactivated
- `409` - Email already registered with different Google account
- `500` - Authentication failed

---

### GET /auth/me
Get current authenticated user details.

**Headers:**
- `X-User-Id: string` (required, temporary - will be replaced with JWT)

**Success Response (200):**
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "avatarUrl": "string | null",
    "userType": "normal",
    "superlikesRemaining": number,
    "createdAt": "timestamp"
  }
}
```

**Error Responses:**
- `401` - No authentication provided
- `403` - Account deactivated
- `404` - User not found
- `500` - Failed to fetch user

---

### POST /auth/logout
Logout current user.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### DELETE /auth/account
Deactivate user account (soft delete). User has 30 days to restore.

**Headers:**
- `X-User-Id: string` (required)

**Request Body:**
```json
{
  "reason": "string (optional)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account deactivated. You have 30 days to restore your account."
}
```

**Error Responses:**
- `400` - Invalid request data or account already deactivated
- `401` - Unauthorized
- `404` - User not found
- `500` - Failed to deactivate account

---

## Games Endpoints

### GET /games
Browse and list all active games with pagination and sorting.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `sort` - Sort by: "score" (default), "recent", "views"

**Success Response (200):**
```json
{
  "games": [
    {
      "id": "string",
      "title": "string",
      "gameUrl": "string",
      "coverMedia": {
        "id": "string",
        "mediaType": "image | video",
        "r2Key": "string"
      } | null,
      "countSuperlikes": number,
      "viewCount": number,
      "score": number,
      "createdBy": {
        "id": "string",
        "name": "string",
        "avatarUrl": "string | null"
      },
      "tags": [
        {
          "id": "string",
          "name": "string",
          "category": "string"
        }
      ]
    }
  ],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

**Error Responses:**
- `500` - Failed to fetch games

---

### GET /games/:id
Get detailed information for a single game.

**Headers:**
- `X-User-Id: string` (optional - provides user-specific reaction data if authenticated)

**URL Parameters:**
- `id` - Game ID (required)

**Success Response (200):**
```json
{
  "id": "string",
  "title": "string",
  "description": "string | null",
  "gameUrl": "string",
  "coverMediaId": "string | null",
  "countLikes": number,
  "countDislikes": number,
  "countSuperlikes": number,
  "score": number,
  "viewCount": number,
  "createdBy": {
    "id": "string",
    "name": "string",
    "avatarUrl": "string | null",
    "email": "string"
  },
  "media": [
    {
      "id": "string",
      "mediaType": "image | video",
      "r2Key": "string",
      "sortOrder": number
    }
  ],
  "tags": [
    {
      "id": "string",
      "name": "string",
      "category": "string"
    }
  ],
  "userReaction": "like | dislike | null",
  "userSuperliked": boolean
}
```

**Error Responses:**
- `404` - Game not found
- `500` - Failed to fetch game

---

### GET /games/:id/stats
Get detailed statistics for a game including views, reactions, and superlikes.

**URL Parameters:**
- `id` - Game ID (required)

**Success Response (200):**
```json
{
  "gameId": "string",
  "reactions": {
    "likes": number,
    "dislikes": number,
    "total": number,
    "score": number
  },
  "superlikes": {
    "count": number
  },
  "views": {
    "total": number,
    "uniqueUsers": number
  }
}
```

**Error Responses:**
- `404` - Game not found
- `500` - Failed to fetch game stats

---

### POST /games/:id/view
Track a view for a game. Automatically captures IP and user agent for analytics.

**Headers:**
- `X-User-Id: string` (optional - for authenticated users)
- `CF-Connecting-IP` or `X-Forwarded-For` (automatically captured)
- `User-Agent` (automatically captured)

**URL Parameters:**
- `id` - Game ID (required)

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Responses:**
- `404` - Game not found
- `500` - Failed to track view

---

### POST /games/:id/react
Like or dislike a game. Supports toggling reactions (clicking same reaction removes it, clicking different reaction changes it).

**Headers:**
- `X-User-Id: string` (required)

**URL Parameters:**
- `id` - Game ID (required)

**Request Body:**
```json
{
  "type": "like | dislike"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "action": "added | removed | changed"
}
```

**Response Details:**
- `added` - New reaction added
- `removed` - Existing reaction removed (clicked same reaction again)
- `changed` - Changed from like to dislike or vice versa

**Error Responses:**
- `400` - Invalid reaction type
- `401` - Unauthorized
- `404` - Game not found
- `500` - Failed to process reaction

---

### POST /games/:id/superlike
Superlike a game. Users have limited superlikes (default: 3). Can only superlike a game once.

**Headers:**
- `X-User-Id: string` (required)

**URL Parameters:**
- `id` - Game ID (required)

**Success Response (200):**
```json
{
  "success": true,
  "superlikesRemaining": number
}
```

**Error Responses:**
- `400` - No superlikes remaining or already superliked
- `401` - Unauthorized
- `404` - Game or user not found
- `500` - Failed to superlike

---

## Notes for Frontend Developers

- **Authentication:** Currently uses `X-User-Id` header. This will be replaced with JWT tokens in production.
- **Pagination:** All list endpoints support pagination. Default limit is 20 items per page.
- **Soft Deletes:** Deactivated accounts and games are hidden from queries but not permanently deleted.Will use a cron job when the admin chooses at their descretion to do the cleanup
- **Rate Limiting:** Superlikes are limited per user (starts at 3, decrements on use).
