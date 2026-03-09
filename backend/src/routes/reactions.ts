import { Hono } from "hono";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db";
import { games, gameReactions } from "../db/schema";
import { z } from "zod";
import { requireSession } from "../lib/middleware";

const reactions = new Hono();

const reactionSchema = z.object({
    type: z.enum(["like", "dislike"]),
});

/**
 * POST /reactions/:gameId/react
 * Body: { type: "like" | "dislike" }
 * Middleware: requireSession
 * Description: React to a game
 */
reactions.post("/:gameId/react", requireSession, async (c) => {
    try {
        const currentUser = c.get("user");
        const userId = currentUser.id;
        const gameId = c.req.param("gameId");

        // Validate body with Zod
        const body = await c.req.json().catch(() => null);
        const parsed = reactionSchema.safeParse(body);
        if (!parsed.success) {
            return c.json(
                {
                    error: "Invalid request body",
                    details: parsed.error.flatten(),
                },
                400
            );
        }

        const { type: reactionType } = parsed.data;

        // Ensure game exists
        const game = await db.query.games.findFirst({
            where: eq(games.id, gameId),
            columns: { id: true },
        });

        if (!game) {
            return c.json({ error: "Game not found" }, 404);
        }

        // Transaction to avoid race conditions
        const action = await db.transaction(async (tx) => {
            const existing = await tx.query.gameReactions.findFirst({
                where: and(
                    eq(gameReactions.userId, userId),
                    eq(gameReactions.gameId, gameId)
                ),
            });

            // ADD reaction
            if (!existing) {
                await tx.insert(gameReactions).values({
                    userId,
                    gameId,
                    reactionType,
                });

                if (reactionType === "like") {
                    await tx
                        .update(games)
                        .set({ countLikes: sql`${games.countLikes} + 1` })
                        .where(eq(games.id, gameId));
                } else {
                    await tx
                        .update(games)
                        .set({ countDislikes: sql`${games.countDislikes} + 1` })
                        .where(eq(games.id, gameId));
                }

                return "added" as const;
            }

            // REMOVE (toggle same reaction)
            if (existing.reactionType === reactionType) {
                await tx
                    .delete(gameReactions)
                    .where(
                        and(
                            eq(gameReactions.userId, userId),
                            eq(gameReactions.gameId, gameId)
                        )
                    );

                if (reactionType === "like") {
                    await tx
                        .update(games)
                        .set({ countLikes: sql`${games.countLikes} - 1` })
                        .where(eq(games.id, gameId));
                } else {
                    await tx
                        .update(games)
                        .set({ countDislikes: sql`${games.countDislikes} - 1` })
                        .where(eq(games.id, gameId));
                }

                return "removed" as const;
            }

            // CHANGE reaction
            await tx
                .update(gameReactions)
                .set({ reactionType })
                .where(
                    and(
                        eq(gameReactions.userId, userId),
                        eq(gameReactions.gameId, gameId)
                    )
                );

            if (existing.reactionType === "like") {
                await tx
                    .update(games)
                    .set({
                        countLikes: sql`${games.countLikes} - 1`,
                        countDislikes: sql`${games.countDislikes} + 1`,
                    })
                    .where(eq(games.id, gameId));
            } else {
                await tx
                    .update(games)
                    .set({
                        countDislikes: sql`${games.countDislikes} - 1`,
                        countLikes: sql`${games.countLikes} + 1`,
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
});

/**
 * GET /reactions/:gameId/reaction
 * Middleware: requireSession
 * Description: Get current user's reaction to a game
 */
reactions.get("/:gameId/reaction", requireSession, async (c) => {
    const currentUser = c.get("user");
    const userId = currentUser.id;
    const gameId = c.req.param("gameId");

    const reaction = await db.query.gameReactions.findFirst({
        where: and(
            eq(gameReactions.userId, userId),
            eq(gameReactions.gameId, gameId)
        ),
        columns: {
            reactionType: true,
        },
    });

    return c.json({
        reaction: reaction?.reactionType ?? null,
    });
});

export default reactions;