import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

// ============================================================================
// USERS
// ============================================================================

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  googleId: text("google_id").unique().notNull(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  userType: text("user_type", { enum: ["normal", "admin"] }).default("normal").notNull(),
  
  // Superlike system
  superlikesRemaining: integer("superlikes_remaining").default(3).notNull(),
  
  // Soft delete (30-day deactivation period before hard delete)
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  deactivatedAt: integer("deactivated_at", { mode: "timestamp" }),
  deactivatedBy: text("deactivated_by"),
  deactivationReason: text("deactivation_reason"),
  
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ============================================================================
// GAME MEDIA (Defined early to avoid circular dependency)
// ============================================================================

export const gameMedia = sqliteTable("game_media", {
  id: text("id").primaryKey(),
  gameRequestId: text("game_request_id").notNull(),
  gameId: text("game_id"),
  mediaType: text("media_type", { enum: ["image", "video"] }).notNull(),
  r2Key: text("r2_key").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ============================================================================
// GAMES (Only live and deactivated games - hard deleted after 30 days)
// ============================================================================

export const games = sqliteTable("games", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  gameUrl: text("game_url").notNull(),
  createdBy: text("created_by").notNull(),
  
  // Cover image/video - references game_media (0 or 1)
  coverMediaId: text("cover_media_id"),
  
  // Interaction counters (denormalized for performance)
  countLikes: integer("count_likes").default(0).notNull(),
  countDislikes: integer("count_dislikes").default(0).notNull(),
  countSuperlikes: integer("count_superlikes").default(0).notNull(),
  score: integer("score").default(0).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  
  // Soft delete (30-day deactivation period before hard delete)
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  deactivatedAt: integer("deactivated_at", { mode: "timestamp" }),
  deactivationReason: text("deactivation_reason"),
  
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ============================================================================
// GAME REQUESTS (New games, modifications, appeals)
// ============================================================================

export const gameRequests = sqliteTable("game_requests", {
  id: text("id").primaryKey(),
  
  requestType: text("request_type", { 
    enum: ["new_game", "game_modification", "game_appeal"] 
  }).notNull(),
  
  // NULL for new_game, NOT NULL for game_modification and game_appeal
  gameId: text("game_id"),
  
  submittedBy: text("submitted_by").notNull(),
  
  // Game data (staged until approval)
  title: text("title").notNull(),
  description: text("description"),
  gameUrl: text("game_url").notNull(),
  
  // Cover image/video for the request - references game_media (0 or 1)
  coverMediaId: text("cover_media_id"),
  
  // Arrays stored as JSON for admin convenience
  mediaIds: text("media_ids"), // JSON array: ["media_1", "media_2"]
  tagIds: text("tag_ids"),     // JSON array: ["tag_1", "tag_2"]
  
  // Moderation
  status: text("status", { 
    enum: ["pending", "approved", "rejected"] 
  }).default("pending").notNull(),
  
  adminResponse: text("admin_response"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ============================================================================
// USER REQUESTS (User appeals - unban, game report appeals)
// ============================================================================

export const userRequests = sqliteTable("user_requests", {
  id: text("id").primaryKey(),
  
  requestType: text("request_type", { 
    enum: ["user_unban_appeal", "game_report_appeal"] 
  }).notNull(),
  
  submittedBy: text("submitted_by").notNull(),
  
  // For game_report_appeal - which game is the appeal about
  relatedGameId: text("related_game_id"),
  
  // Appeal details
  appealText: text("appeal_text").notNull(),
  
  // Moderation
  status: text("status", { 
    enum: ["pending", "approved", "rejected"] 
  }).default("pending").notNull(),
  
  adminResponse: text("admin_response"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ============================================================================
// TAGS (Admin-created only)
// ============================================================================

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").unique().notNull(),
  category: text("category"),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ============================================================================
// GAME TAGS (Live - links approved games to tags)
// ============================================================================

export const gameTags = sqliteTable("game_tags", {
  gameId: text("game_id").notNull(),
  tagId: text("tag_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.gameId, table.tagId] }),
}));


// ============================================================================
// GAME REACTIONS (Unified like/dislike table)
// ============================================================================

export const gameReactions = sqliteTable("game_reactions", {
  userId: text("user_id").notNull(),
  gameId: text("game_id").notNull(),
  reactionType: text("reaction_type", { enum: ["like", "dislike"] }).notNull(),
  
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.gameId] }),
}));

// ============================================================================
// GAME SUPERLIKES (Separate from reactions - user can have both)
// ============================================================================

export const gameSuperlikes = sqliteTable("game_superlikes", {
  userId: text("user_id").notNull(),
  gameId: text("game_id").notNull(),
  
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.gameId] }),
}));

// ============================================================================
// GAME VIEWS (View tracking with fingerprinting support)
// ============================================================================

export const gameViews = sqliteTable("game_views", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: text("game_id").notNull(),
  userId: text("user_id"),
  ipHash: text("ip_hash"),
  fingerprint: text("fingerprint"),
  userAgent: text("user_agent"),
  
  viewedAt: integer("viewed_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ============================================================================
// ADMIN ACTIONS (Audit log - tracks which admin reviewed which request)
// ============================================================================

export const adminActions = sqliteTable("admin_actions", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").notNull(),
  
  // At least one must be NOT NULL (enforced in backend)
  gameRequestId: text("game_request_id"),
  userRequestId: text("user_request_id"),
  
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});

// ============================================================================
// RELATIONS (Define foreign keys via relations to avoid circular dependencies)
// ============================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  games: many(games),
  gameRequests: many(gameRequests),
  userRequests: many(userRequests),
  tags: many(tags),
  reactions: many(gameReactions),
  superlikes: many(gameSuperlikes),
  views: many(gameViews),
  deactivatedByUser: one(users, {
    fields: [users.deactivatedBy],
    references: [users.id],
  }),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  creator: one(users, {
    fields: [games.createdBy],
    references: [users.id],
  }),
  coverMedia: one(gameMedia, {
    fields: [games.coverMediaId],
    references: [gameMedia.id],
  }),
  media: many(gameMedia),
  tags: many(gameTags),
  reactions: many(gameReactions),
  superlikes: many(gameSuperlikes),
  views: many(gameViews),
  requests: many(gameRequests),
}));

export const gameRequestsRelations = relations(gameRequests, ({ one, many }) => ({
  game: one(games, {
    fields: [gameRequests.gameId],
    references: [games.id],
  }),
  submitter: one(users, {
    fields: [gameRequests.submittedBy],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [gameRequests.reviewedBy],
    references: [users.id],
  }),
  coverMedia: one(gameMedia, {
    fields: [gameRequests.coverMediaId],
    references: [gameMedia.id],
  }),
  media: many(gameMedia),
}));

export const gameMediaRelations = relations(gameMedia, ({ one }) => ({
  gameRequest: one(gameRequests, {
    fields: [gameMedia.gameRequestId],
    references: [gameRequests.id],
  }),
  game: one(games, {
    fields: [gameMedia.gameId],
    references: [games.id],
  }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  creator: one(users, {
    fields: [tags.createdBy],
    references: [users.id],
  }),
  games: many(gameTags),
}));

export const gameTagsRelations = relations(gameTags, ({ one }) => ({
  game: one(games, {
    fields: [gameTags.gameId],
    references: [games.id],
  }),
  tag: one(tags, {
    fields: [gameTags.tagId],
    references: [tags.id],
  }),
}));

export const gameReactionsRelations = relations(gameReactions, ({ one }) => ({
  user: one(users, {
    fields: [gameReactions.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [gameReactions.gameId],
    references: [games.id],
  }),
}));

export const gameSuperlikesRelations = relations(gameSuperlikes, ({ one }) => ({
  user: one(users, {
    fields: [gameSuperlikes.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [gameSuperlikes.gameId],
    references: [games.id],
  }),
}));

export const gameViewsRelations = relations(gameViews, ({ one }) => ({
  user: one(users, {
    fields: [gameViews.userId],
    references: [users.id],
  }),
  game: one(games, {
    fields: [gameViews.gameId],
    references: [games.id],
  }),
}));