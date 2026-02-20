import { Hono } from "hono";
import { db } from "../db";
import { gameReactions } from "../db/schema";
import { eq, and } from "drizzle-orm";

const games = new Hono();

// to fetch status of like/dislike
games.get("/:gameId/reaction", async (c) => {
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

    return c.json({
        reaction: reaction?.reactionType ?? null,
    });
});

// to like or dislike a game
games.post("/:id/react", async (c) => {
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

export default games;
