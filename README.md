# ProgChamp

## backend-basics (incomplete)

### Auth

POST /auth/google - Google OAuth login/signup
GET /auth/me - Get current user
POST /auth/logout - Logout
DELETE /auth/account - Deactivate account

### Games

GET /games - Browse games
GET /games/:id - View game details
GET /games/:id/stats - View statistics
POST /games/:id/view - Track view
POST /games/:id/react - Like/dislike
POST /games/:id/superlike - Superlike game