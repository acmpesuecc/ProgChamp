import { Hono } from "hono";
import { db } from "../db/index";
import { games, gameReactions, gameSuperlikes, gameViews, gameTags, users, tags } from "../db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

type Variables = {
  userId?: string;
};

const gamesRouter = new Hono<{ Variables: Variables }>();

// GET /games - List all active games with pagination and filters
gamesRouter.get("/", async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const sortBy = c.req.query("sort") || "score"; // score, recent, views
  const offset = (page - 1) * limit;

  try {
    let orderClause;
    switch (sortBy) {
      case "recent":
        orderClause = desc(games.createdAt);
        break;
      case "views":
        orderClause = desc(games.viewCount);
        break;
      default:
        orderClause = desc(games.score);
    }

    const gamesList = await db.query.games.findMany({
      where: eq(games.isActive, true),
      limit,
      offset,
      orderBy: orderClause,
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(games)
      .where(eq(games.isActive, true));

    return c.json({
      games: gamesList,
      pagination: {
        page,
        limit,
        total: total[0]?.count ?? 0,
        totalPages: Math.ceil((total[0]?.count ?? 0) / limit),
      },
    });
  } catch (error) {
    console.error("List games error:", error);
    return c.json({ error: "Failed to fetch games" }, 500);
  }
});

// GET /games/:id - Get single game details
gamesRouter.get("/:id", async (c) => {
  const gameId = c.req.param("id");
  const userId = c.req.header("X-User-Id"); // Optional auth

  try {
    const game = await db.query.games.findFirst({
      where: and(eq(games.id, gameId), eq(games.isActive, true)),
    });

    if (!game) {
      return c.json({ error: "Game not found" }, 404);
    }

    // Get user's reaction if authenticated
    let userReaction = null;
    let userSuperliked = false;

    if (userId) {
      const reaction = await db.query.gameReactions.findFirst({
        where: and(
          eq(gameReactions.gameId, gameId),
          eq(gameReactions.userId, userId)
        ),
      });
      userReaction = reaction?.reactionType || null;

      const superlike = await db.query.gameSuperlikes.findFirst({
        where: and(
          eq(gameSuperlikes.gameId, gameId),
          eq(gameSuperlikes.userId, userId)
        ),
      });
      userSuperliked = !!superlike;
    }

    // Get tags - Fixed relation query
    const gameTagsData = await db.query.gameTags.findMany({
      where: eq(gameTags.gameId, gameId),
    });

    const tagIds = gameTagsData.map(gt => gt.tagId);
    const tagsData = tagIds.length > 0 
      ? await db.query.tags.findMany({
          where: inArray(tags.id, tagIds)
        })
      : [];

    return c.json({
      game,
      userReaction,
      userSuperliked,
      tags: tagsData,
    });
  } catch (error) {
    console.error("Get game error:", error);
    return c.json({ error: "Failed to fetch game" }, 500);
  }
});

// POST /games/:id/view - Track a view
gamesRouter.post("/:id/view", async (c) => {
  const gameId = c.req.param("id");
  const userId = c.req.header("X-User-Id");
  const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For");
  const userAgent = c.req.header("User-Agent");

  try {
    const game = await db.query.games.findFirst({
      where: eq(games.id, gameId),
    });

    if (!game) {
      return c.json({ error: "Game not found" }, 404);
    }

    // Create hash for IP-based deduplication
    const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex") : null;

    // Record view
    await db.insert(gameViews).values({
      gameId,
      userId: userId || null,
      ipHash,
      userAgent: userAgent || null,
    });

    // Increment view count
    await db
      .update(games)
      .set({ 
        viewCount: sql`${games.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(games.id, gameId));

    return c.json({ success: true });
  } catch (error) {
    console.error("Track view error:", error);
    return c.json({ error: "Failed to track view" }, 500);
  }
});

// POST /games/:id/react - Like or dislike
const reactionSchema = z.object({
  type: z.enum(["like", "dislike"]),
});

gamesRouter.post("/:id/react", async (c) => {
  const gameId = c.req.param("id");
  const userId = c.req.header("X-User-Id");

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const result = reactionSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: "Invalid reaction type" }, 400);
  }

  const { type } = result.data;

  try {
    const game = await db.query.games.findFirst({
      where: eq(games.id, gameId),
    });

    if (!game) {
      return c.json({ error: "Game not found" }, 404);
    }

    // Check existing reaction
    const existing = await db.query.gameReactions.findFirst({
      where: and(
        eq(gameReactions.gameId, gameId),
        eq(gameReactions.userId, userId)
      ),
    });

    if (existing) {
      if (existing.reactionType === type) {
        // Remove reaction
        await db
          .delete(gameReactions)
          .where(
            and(
              eq(gameReactions.gameId, gameId),
              eq(gameReactions.userId, userId)
            )
          );

        // Update counter - Fixed dynamic field access
        if (type === "like") {
          await db
            .update(games)
            .set({ 
              countLikes: sql`${games.countLikes} - 1`,
              score: sql`${games.countLikes} - ${games.countDislikes}`,
              updatedAt: new Date(),
            })
            .where(eq(games.id, gameId));
        } else {
          await db
            .update(games)
            .set({ 
              countDislikes: sql`${games.countDislikes} - 1`,
              score: sql`${games.countLikes} - ${games.countDislikes}`,
              updatedAt: new Date(),
            })
            .where(eq(games.id, gameId));
        }

        return c.json({ success: true, action: "removed" });
      } else {
        // Change reaction
        await db
          .update(gameReactions)
          .set({ reactionType: type, updatedAt: new Date() })
          .where(
            and(
              eq(gameReactions.gameId, gameId),
              eq(gameReactions.userId, userId)
            )
          );

        // Update counters - Fixed with separate if/else
        if (existing.reactionType === "like" && type === "dislike") {
          await db
            .update(games)
            .set({
              countLikes: sql`${games.countLikes} - 1`,
              countDislikes: sql`${games.countDislikes} + 1`,
              score: sql`${games.countLikes} - ${games.countDislikes}`,
              updatedAt: new Date(),
            })
            .where(eq(games.id, gameId));
        } else {
          await db
            .update(games)
            .set({
              countLikes: sql`${games.countLikes} + 1`,
              countDislikes: sql`${games.countDislikes} - 1`,
              score: sql`${games.countLikes} - ${games.countDislikes}`,
              updatedAt: new Date(),
            })
            .where(eq(games.id, gameId));
        }

        return c.json({ success: true, action: "changed" });
      }
    } else {
      // Add new reaction
      await db.insert(gameReactions).values({
        userId,
        gameId,
        reactionType: type,
      });

      // Update counter - Fixed dynamic field access
      if (type === "like") {
        await db
          .update(games)
          .set({
            countLikes: sql`${games.countLikes} + 1`,
            score: sql`${games.countLikes} - ${games.countDislikes}`,
            updatedAt: new Date(),
          })
          .where(eq(games.id, gameId));
      } else {
        await db
          .update(games)
          .set({
            countDislikes: sql`${games.countDislikes} + 1`,
            score: sql`${games.countLikes} - ${games.countDislikes}`,
            updatedAt: new Date(),
          })
          .where(eq(games.id, gameId));
      }

      return c.json({ success: true, action: "added" });
    }
  } catch (error) {
    console.error("React error:", error);
    return c.json({ error: "Failed to process reaction" }, 500);
  }
});

// POST /games/:id/superlike
gamesRouter.post("/:id/superlike", async (c) => {
  const gameId = c.req.param("id");
  const userId = c.req.header("X-User-Id");

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.isActive) {
      return c.json({ error: "User not found" }, 404);
    }

    if (user.superlikesRemaining <= 0) {
      return c.json({ error: "No superlikes remaining" }, 400);
    }

    const game = await db.query.games.findFirst({
      where: and(eq(games.id, gameId), eq(games.isActive, true)),
    });

    if (!game) {
      return c.json({ error: "Game not found" }, 404);
    }

    // Check if already superliked
    const existing = await db.query.gameSuperlikes.findFirst({
      where: and(
        eq(gameSuperlikes.gameId, gameId),
        eq(gameSuperlikes.userId, userId)
      ),
    });

    if (existing) {
      return c.json({ error: "Already superliked" }, 400);
    }

    // Add superlike
    await db.insert(gameSuperlikes).values({
      userId,
      gameId,
    });

    // Update counters
    await db
      .update(games)
      .set({ 
        countSuperlikes: sql`${games.countSuperlikes} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(games.id, gameId));

    await db
      .update(users)
      .set({ 
        superlikesRemaining: sql`${users.superlikesRemaining} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return c.json({ 
      success: true,
      superlikesRemaining: user.superlikesRemaining - 1,
    });
  } catch (error) {
    console.error("Superlike error:", error);
    return c.json({ error: "Failed to superlike" }, 500);
  }
});

export default gamesRouter;