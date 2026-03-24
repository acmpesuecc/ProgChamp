import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { games, gameReactions, gameSuperlikes, users } from "../db/schema";
import { z } from "zod";
import {
  requireSession,
  requireCompleteProfile,
  reactionRateLimiter,
} from "../lib/middleware";
import { getGame } from "../lib/gameService";
import { NotFoundError, InvalidStateError } from "../lib/errors";
import { nanoid } from "nanoid";

const reactions = new Hono();

const reactionSchema = z.object({
  type: z.enum(["like", "dislike"]),
});

/**
 * Score formula: likes + (3 * superlikes) - dislikes
 * Score is kept in sync atomically in the same transaction as every
 * reaction / superlike change. Never recomputed from scratch.
 */

/**
 * POST /games/:gameId/react
 * Body: { type: "like" | "dislike" }
 */
reactions.post(
  "/:gameId/react",
  requireSession,
  requireCompleteProfile,
  reactionRateLimiter,
  async (c) => {
    try {
      const currentUser = c.get("user");
      const userId = currentUser.id;
      const gameId = c.req.param("gameId");

      const body = await c.req.json().catch(() => null);
      const parsed = reactionSchema.safeParse(body);
      if (!parsed.success) {
        return c.json(
          {
            error: "Invalid request body",
            details: parsed.error.flatten(),
          },
          400,
        );
      }

      const { type: reactionType } = parsed.data;

      try {
        await getGame(gameId);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return c.json({ error: "Game not found" }, 404);
        }
        if (error instanceof InvalidStateError) {
          return c.json({ error: "Game is deactivated" }, 400);
        }
        throw error;
      }

      const action = await db.transaction(async (tx) => {
        const existing = await tx.query.gameReactions.findFirst({
          where: and(
            eq(gameReactions.userId, userId),
            eq(gameReactions.gameId, gameId),
          ),
        });

        // ADD reaction — no prior reaction exists
        if (!existing) {
          await tx.insert(gameReactions).values({
            userId,
            gameId,
            reactionType,
          });

          if (reactionType === "like") {
            await tx
              .update(games)
              .set({
                countLikes: sql`${games.countLikes} + 1`,
                score: sql`${games.score} + 1`,
              })
              .where(eq(games.id, gameId));
          } else {
            await tx
              .update(games)
              .set({
                countDislikes: sql`${games.countDislikes} + 1`,
                score: sql`${games.score} - 1`,
              })
              .where(eq(games.id, gameId));
          }

          return "added" as const;
        }

        // REMOVE — toggling the same reaction off
        if (existing.reactionType === reactionType) {
          await tx
            .delete(gameReactions)
            .where(
              and(
                eq(gameReactions.userId, userId),
                eq(gameReactions.gameId, gameId),
              ),
            );

          if (reactionType === "like") {
            await tx
              .update(games)
              .set({
                countLikes: sql`${games.countLikes} - 1`,
                score: sql`${games.score} - 1`,
              })
              .where(eq(games.id, gameId));
          } else {
            await tx
              .update(games)
              .set({
                countDislikes: sql`${games.countDislikes} - 1`,
                score: sql`${games.score} + 1`,
              })
              .where(eq(games.id, gameId));
          }

          return "removed" as const;
        }

        // CHANGE — switching between like and dislike
        await tx
          .update(gameReactions)
          .set({ reactionType })
          .where(
            and(
              eq(gameReactions.userId, userId),
              eq(gameReactions.gameId, gameId),
            ),
          );

        if (existing.reactionType === "like") {
          // like → dislike: -1 like, +1 dislike, score -2
          await tx
            .update(games)
            .set({
              countLikes: sql`${games.countLikes} - 1`,
              countDislikes: sql`${games.countDislikes} + 1`,
              score: sql`${games.score} - 2`,
            })
            .where(eq(games.id, gameId));
        } else {
          // dislike → like: +1 like, -1 dislike, score +2
          await tx
            .update(games)
            .set({
              countDislikes: sql`${games.countDislikes} - 1`,
              countLikes: sql`${games.countLikes} + 1`,
              score: sql`${games.score} + 2`,
            })
            .where(eq(games.id, gameId));
        }

        return "changed" as const;
      });

      return c.json({ success: true, action });
    } catch (error) {
      console.error("Reaction error:", error);
      return c.json({ error: "Failed to process reaction" }, 500);
    }
  },
);

/**
 * POST /games/:gameId/superlike
 * Superlike is independent of like/dislike — a user can hold both.
 * Costs 1 superlike credit from the user's balance.
 * Score impact: +3
 */
reactions.post(
  "/:gameId/superlike",
  requireSession,
  requireCompleteProfile,
  reactionRateLimiter,
  async (c) => {
    try {
      const currentUser = c.get("user");
      const userId = currentUser.id;
      const gameId = c.req.param("gameId");

      try {
        await getGame(gameId);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return c.json({ error: "Game not found" }, 404);
        }
        if (error instanceof InvalidStateError) {
          return c.json({ error: "Game is deactivated" }, 400);
        }
        throw error;
      }

      const action = await db.transaction(async (tx) => {
        const existing = await tx.query.gameSuperlikes.findFirst({
          where: and(
            eq(gameSuperlikes.userId, userId),
            eq(gameSuperlikes.gameId, gameId),
          ),
        });

        // REMOVE — toggling superlike off, refund the credit
        if (existing) {
          await tx
            .delete(gameSuperlikes)
            .where(
              and(
                eq(gameSuperlikes.userId, userId),
                eq(gameSuperlikes.gameId, gameId),
              ),
            );

          await tx
            .update(games)
            .set({
              countSuperlikes: sql`${games.countSuperlikes} - 1`,
              score: sql`${games.score} - 3`,
            })
            .where(eq(games.id, gameId));

          // Refund superlike credit
          await tx
            .update(users)
            .set({
              superlikesRemaining: sql`${users.superlikesRemaining} + 1`,
            })
            .where(eq(users.id, userId));

          return "removed" as const;
        }

        // ADD — check user has credits
        const user = await tx.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { superlikesRemaining: true },
        });

        if (!user || user.superlikesRemaining <= 0) {
          throw new InvalidStateError("No superlikes remaining");
        }

        await tx.insert(gameSuperlikes).values({ userId, gameId });

        await tx
          .update(games)
          .set({
            countSuperlikes: sql`${games.countSuperlikes} + 1`,
            score: sql`${games.score} + 3`,
          })
          .where(eq(games.id, gameId));

        // Deduct superlike credit
        await tx
          .update(users)
          .set({
            superlikesRemaining: sql`${users.superlikesRemaining} - 1`,
          })
          .where(eq(users.id, userId));

        return "added" as const;
      });

      return c.json({ success: true, action });
    } catch (error) {
      if (error instanceof InvalidStateError) {
        return c.json({ error: error.message }, 400);
      }
      console.error("Superlike error:", error);
      return c.json({ error: "Failed to process superlike" }, 500);
    }
  },
);

/**
 * GET /games/:gameId/reaction
 * Returns the current user's reaction and superlike status for a game.
 */
reactions.get(
  "/:gameId/reaction",
  requireSession,
  requireCompleteProfile,
  async (c) => {
    const currentUser = c.get("user");
    const userId = currentUser.id;
    const gameId = c.req.param("gameId");

    try {
      await getGame(gameId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: "Game not found" }, 404);
      }
      if (error instanceof InvalidStateError) {
        return c.json({ error: "Game is deactivated" }, 400);
      }
      throw error;
    }

    const [reaction, superlike] = await Promise.all([
      db.query.gameReactions.findFirst({
        where: and(
          eq(gameReactions.userId, userId),
          eq(gameReactions.gameId, gameId),
        ),
        columns: { reactionType: true },
      }),
      db.query.gameSuperlikes.findFirst({
        where: and(
          eq(gameSuperlikes.userId, userId),
          eq(gameSuperlikes.gameId, gameId),
        ),
        columns: { createdAt: true },
      }),
    ]);

    return c.json({
      reaction: reaction?.reactionType ?? null,
      superliked: !!superlike,
    });
  },
);

export default reactions;
