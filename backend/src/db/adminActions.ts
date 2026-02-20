import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";
export const adminActions = sqliteTable("admin_actions", {
  id: text("id").primaryKey(),

  adminId: text("admin_id").notNull().references(() => users.id),

  // What kind of action is being performed
  actionType: text("action_type", {
    enum: ["approve", "reject", "deactivate", "reactivate", "ban", "unban", "warn", "delete",]
  }).notNull(),

  // What entity was affected
  targetType: text("target_type", {
    enum: ["game", "game_request", "user", "appeal",]
  }).notNull(),

  // ID of the affected entity
  targetId: text("target_id").notNull(),

  // Optional moderation reason (can be shown to user)
  reason: text("reason"),

  // Internal admin-only context
  note: text("note"),

  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
});