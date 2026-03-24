import {
  sqliteTable,
  text,
  integer,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

// ============================================================================
// USERS
// ============================================================================

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  googleId: text("google_id").unique().notNull(),
  email: text("email").unique().notNull(),

  // Profile fields — NULL until user completes profile setup
  name: text("name"),
  avatarUrl: text("avatar_url"),

  // Profile completion tracking
  profileCompletedAt: integer("profile_completed_at", { mode: "timestamp" }),

  userType: text("user_type", { enum: ["normal", "admin"] })
    .default("normal")
    .notNull(),

  // Superlike system
  superlikesRemaining: integer("superlikes_remaining").default(3).notNull(),

  // Soft delete (30-day deactivation period before hard delete)
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  deactivatedAt: integer("deactivated_at", { mode: "timestamp" }),
  deactivatedBy: text("deactivated_by").references((): any => users.id),
  deactivationReason: text("deactivation_reason"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// ============================================================================
// SESSIONS
// ============================================================================

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// ============================================================================
// GAMES
// ============================================================================

export const games = sqliteTable("games", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  gameUrl: text("game_url").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),

  // Nullable — set after media is inserted in the same transaction
  coverMediaId: text("cover_media_id"),

  // Interaction counters (denormalized for performance)
  countLikes: integer("count_likes").default(0).notNull(),
  countDislikes: integer("count_dislikes").default(0).notNull(),
  countSuperlikes: integer("count_superlikes").default(0).notNull(),

  // Score = likes + (3 * superlikes) - dislikes
  // Incremented/decremented in the same transaction as the reaction
  score: integer("score").default(0).notNull(),

  viewCount: integer("view_count").default(0).notNull(),

  // Soft delete (30-day deactivation period before hard delete)
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  deactivatedAt: integer("deactivated_at", { mode: "timestamp" }),
  deactivationReason: text("deactivation_reason"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// ============================================================================
// GAME REQUESTS
// ============================================================================

export const gameRequests = sqliteTable("game_requests", {
  id: text("id").primaryKey(),

  requestType: text("request_type", {
    enum: ["new_game", "game_modification", "game_appeal"],
  }).notNull(),

  // NULL for new_game, NOT NULL for game_modification and game_appeal
  gameId: text("game_id").references(() => games.id),

  submittedBy: text("submitted_by")
    .notNull()
    .references(() => users.id),

  // Game data (staged until approval)
  title: text("title").notNull(),
  description: text("description"),
  gameUrl: text("game_url").notNull(),

  // Nullable — set after media is inserted in the same transaction
  coverMediaId: text("cover_media_id"),

  // Moderation
  status: text("status", {
    enum: ["pending", "approved", "rejected"],
  })
    .default("pending")
    .notNull(),

  adminResponse: text("admin_response"),
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),

  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// ============================================================================
// GAME MEDIA
// ============================================================================

export const gameMedia = sqliteTable("game_media", {
  id: text("id").primaryKey(),
  // Always references the originating request
  gameRequestId: text("game_request_id")
    .notNull()
    .references(() => gameRequests.id, { onDelete: "cascade" }),
  // Set when the request is approved and the game is created
  gameId: text("game_id").references(() => games.id, { onDelete: "cascade" }),
  mediaType: text("media_type", { enum: ["image", "video"] }).notNull(),
  r2Key: text("r2_key").notNull(),
  // true = this is the cover for the parent request or game
  isCover: integer("is_cover", { mode: "boolean" }).default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// ============================================================================
// GAME REQUEST TAGS (staged tags before approval)
// ============================================================================

export const gameRequestTags = sqliteTable(
  "game_request_tags",
  {
    gameRequestId: text("game_request_id")
      .notNull()
      .references(() => gameRequests.id, { onDelete: "cascade" }),
    // restrict: cannot delete a tag that is referenced by a pending request
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.gameRequestId, table.tagId] }),
  }),
);

// ============================================================================
// USER REQUESTS
// ============================================================================

export const userRequests = sqliteTable("user_requests", {
  id: text("id").primaryKey(),

  requestType: text("request_type", {
    enum: ["user_unban_appeal", "game_report_appeal"],
  }).notNull(),

  submittedBy: text("submitted_by")
    .notNull()
    .references(() => users.id),

  // For game_report_appeal — which game the appeal is about
  relatedGameId: text("related_game_id").references(() => games.id),

  appealText: text("appeal_text").notNull(),

  status: text("status", {
    enum: ["pending", "approved", "rejected"],
  })
    .default("pending")
    .notNull(),

  adminResponse: text("admin_response"),
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),

  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// ============================================================================
// TAGS (Admin-created only)
// ============================================================================

export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").unique().notNull(),
  category: text("category"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// ============================================================================
// GAME TAGS (Live — links approved games to tags)
// ============================================================================

export const gameTags = sqliteTable(
  "game_tags",
  {
    gameId: text("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "restrict" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.gameId, table.tagId] }),
  }),
);

// ============================================================================
// GAME REACTIONS
// ============================================================================

export const gameReactions = sqliteTable(
  "game_reactions",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: text("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    reactionType: text("reaction_type", {
      enum: ["like", "dislike"],
    }).notNull(),

    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.gameId] }),
  }),
);

// ============================================================================
// GAME SUPERLIKES
// ============================================================================

export const gameSuperlikes = sqliteTable(
  "game_superlikes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: text("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),

    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.gameId] }),
  }),
);

// ============================================================================
// GAME VIEWS
// ============================================================================

export const gameViews = sqliteTable("game_views", {
  // Changed from auto-increment integer to nanoid text for consistency
  id: text("id").primaryKey(),
  gameId: text("game_id")
    .notNull()
    .references(() => games.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id),
  ipHash: text("ip_hash"),
  fingerprint: text("fingerprint"),
  userAgent: text("user_agent"),

  viewedAt: integer("viewed_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// ============================================================================
// ADMIN ACTIONS (Audit log)
// ============================================================================

export const adminActions = sqliteTable("admin_actions", {
  id: text("id").primaryKey(),
  adminId: text("admin_id")
    .notNull()
    .references(() => users.id),

  actionType: text("action_type", {
    enum: [
      "approve_game",
      "reject_game",
      "deactivate_game",
      "approve_appeal",
      "reject_appeal",
      "ban_user",
      "unban_user",
    ],
  }).notNull(),

  decision: text("decision", {
    enum: ["approved", "rejected", "deactivated", "banned", "unbanned"],
  }).notNull(),

  // All nullable — which ones are set depends on actionType
  gameRequestId: text("game_request_id").references(() => gameRequests.id),
  userRequestId: text("user_request_id").references(() => userRequests.id),
  targetUserId: text("target_user_id").references(() => users.id),
  targetGameId: text("target_game_id").references(() => games.id),

  // Optional admin notes / reasoning
  notes: text("notes"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
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

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
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

export const gameRequestsRelations = relations(
  gameRequests,
  ({ one, many }) => ({
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
    tags: many(gameRequestTags),
  }),
);

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

export const gameRequestTagsRelations = relations(
  gameRequestTags,
  ({ one }) => ({
    gameRequest: one(gameRequests, {
      fields: [gameRequestTags.gameRequestId],
      references: [gameRequests.id],
    }),
    tag: one(tags, {
      fields: [gameRequestTags.tagId],
      references: [tags.id],
    }),
  }),
);

export const tagsRelations = relations(tags, ({ one, many }) => ({
  creator: one(users, {
    fields: [tags.createdBy],
    references: [users.id],
  }),
  games: many(gameTags),
  gameRequests: many(gameRequestTags),
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

export const userRequestsRelations = relations(userRequests, ({ one }) => ({
  submitter: one(users, {
    fields: [userRequests.submittedBy],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [userRequests.reviewedBy],
    references: [users.id],
  }),
  relatedGame: one(games, {
    fields: [userRequests.relatedGameId],
    references: [games.id],
  }),
}));

export const adminActionsRelations = relations(adminActions, ({ one }) => ({
  admin: one(users, {
    fields: [adminActions.adminId],
    references: [users.id],
  }),
  gameRequest: one(gameRequests, {
    fields: [adminActions.gameRequestId],
    references: [gameRequests.id],
  }),
  userRequest: one(userRequests, {
    fields: [adminActions.userRequestId],
    references: [userRequests.id],
  }),
  targetUser: one(users, {
    fields: [adminActions.targetUserId],
    references: [users.id],
  }),
  targetGame: one(games, {
    fields: [adminActions.targetGameId],
    references: [games.id],
  }),
}));
