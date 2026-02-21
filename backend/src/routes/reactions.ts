import { Hono } from "hono";
import { db } from "../db";
<<<<<<< HEAD
import { gameReactions } from "../db/schema";
import { eq, and } from "drizzle-orm";
=======
import { users, games, gameReactions } from "../db/schema";
import { z } from "zod";
import { requireSession } from "../lib/middleware";
import { sql } from "drizzle-orm";
>>>>>>> 6d90516 (ft: resolved issues flagged in the review)

const reactions = new Hono();
const reactionSchema = z.object({
    type: z.enum(["like", "dislike"]),
});

<<<<<<< HEAD
// to fetch status of like/dislike
reactions.get("/:gameId/reaction", async (c) => {
    const userId = c.req.header("X-User-Id");
    const gameId = c.req.param("gameId");

    if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const reaction = await db
        .select({
            reactionType: gameReactions.reactionType,
        })
        .from(gameReactions)
        .where(
            and(
                eq(gameReactions.userId, userId),
                eq(gameReactions.gameId, gameId)
            )
        )
        .get();
=======
/**
 * POST /reactions/:gameId/react
 * Body: { type: "like" | "dislike" }
 * Middleware: requireSession
 * Description: React to a game
 */

reactions.post("/:gameId/react", requireSession, async (c) => {
    try {
        // read inputs
        const currentUser = c.get("user");
        const userId = currentUser.id;
        const gameId = c.req.param("gameId");

        // input validation using Zod schema
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

        // validate reaction type
        if (reactionType !== "like" && reactionType !== "dislike") {
            return c.json(
                { error: 'Invalid reaction type. Valid types are "like" and "dislike".' },
                400
            );
        }

        // check if game exists
        const game = await db.query.games.findFirst({
            where: eq(games.id, gameId),
            columns: {
                id: true,
            },
        });

        if (!game) {
            return c.json(
                { error: "Game not found" },
                404
            );
        }

        // check for existing reaction
        const existing = await db.query.gameReactions.findFirst({
            where: and(
                eq(gameReactions.userId, userId),
                eq(gameReactions.gameId, gameId),
            ),
        });

        // insert new reaction if no reaction exists yet
        if (!existing) {
            await db.insert(gameReactions).values({
                userId,
                gameId,
                reactionType,
            });

            if (reactionType === "like") {
                await db
                    .update(games)
                    .set({ countLikes: sql`${games.countLikes} + 1` })
                    .where(eq(games.id, gameId));
            } else {
                await db
                    .update(games)
                    .set({ countDislikes: sql`${games.countDislikes} + 1` })
                    .where(eq(games.id, gameId));
            }

            return c.json({ success: true, action: "added" });
        }

        // toggling (removing the same reaction)
        if (existing.reactionType === reactionType) {
            await db
                .delete(gameReactions)
                .where(
                    and(
                        eq(gameReactions.userId, userId),
                        eq(gameReactions.gameId, gameId),
                    )
                );

            if (reactionType === "like") {
                await db
                    .update(games)
                    .set({ countLikes: sql`${games.countLikes} - 1` })
                    .where(eq(games.id, gameId));
            } else {
                await db
                    .update(games)
                    .set({ countDislikes: sql`${games.countDislikes} - 1` })
                    .where(eq(games.id, gameId));
            }

            return c.json({ success: true, action: "removed" });
        }

        // updating different reaction
        await db
            .update(gameReactions)
            .set({ reactionType })
            .where(
                and(
                    eq(gameReactions.userId, userId),
                    eq(gameReactions.gameId, gameId),
                )
            );

        // decrement old counter, increment new counter
        if (existing.reactionType === "like") {
            await db
                .update(games)
                .set({
                    countLikes: sql`${games.countLikes} - 1`,
                    countDislikes: sql`${games.countDislikes} + 1`,
                })
                .where(eq(games.id, gameId));
        } else {
            await db
                .update(games)
                .set({
                    countDislikes: sql`${games.countDislikes} - 1`,
                    countLikes: sql`${games.countLikes} + 1`,
                })
                .where(eq(games.id, gameId));
        }
        return c.json({ success: true, action: "changed" });

    } catch (error) {
        // log the error
        console.error("Reaction error:", error);
        // return error response
        return c.json(
            { error: "Failed to process reaction" },
            500
        );
    }
});

/**
 * GET /reactions/:gameId/reaction
 * Middleware: requireSession
 * Description: Get reaction for a game
 */
reactions.get("/:gameId/reaction", requireSession, async (c) => {
    const currentUser = c.get("user");
    const userId = currentUser.id;
    const gameId = c.req.param("gameId");

    const reaction = await db.query.gameReactions.findFirst({
        where: and(
            eq(gameReactions.userId, userId),
            eq(gameReactions.gameId, gameId),
        ),
        columns: {
            reactionType: true,
        },
    });
>>>>>>> 6d90516 (ft: resolved issues flagged in the review)

    return c.json({
        reaction: reaction?.reactionType ?? null,
    });
});

// to like or dislike a game
reactions.post("/:id/react", async (c) => {
    const userId = c.req.header("X-User-Id");
    const gameId = c.req.param("id");

    if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json().catch(() => null);
    if (!body || !["like", "dislike"].includes(body.type)) {
        return c.json({ error: "Invalid reaction type" }, 400);
    }

    const reactionType = body.type as "like" | "dislike";

    try {
        const existing = await db.query.gameReactions.findFirst({
            where: (gr, { and, eq }) =>
                and(eq(gr.userId, userId), eq(gr.gameId, gameId)),
        });

        if (!existing) {
            await db.insert(gameReactions).values({
                userId,
                gameId,
                reactionType,
            });
            return c.json({ success: true, action: "added" });
        }

        if (existing.reactionType === reactionType) {
            await db
                .delete(gameReactions)
                .where(
                    and(
                        eq(gameReactions.userId, userId),
                        eq(gameReactions.gameId, gameId)
                    )
                );
            return c.json({ success: true, action: "removed" });
        }

        await db
            .update(gameReactions)
            .set({ reactionType })
            .where(
                and(
                    eq(gameReactions.userId, userId),
                    eq(gameReactions.gameId, gameId)
                )
            );

        return c.json({ success: true, action: "changed" });
    } catch (err) {
        console.error(err);
        return c.json({ error: "Failed to process reaction" }, 500);
    }
});

export default reactions;
