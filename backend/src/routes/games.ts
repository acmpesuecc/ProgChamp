import { Hono } from "hono";
import { db } from "../db/index";
import { games, gameReactions, gameSuperlikes, gameViews, gameTags, users, tags, gameMedia } from "../db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

type Variables = {
  userId?: string;
};

const gamesRouter = new Hono<{ Variables: Variables }>();

// Validation schemas
const reactionSchema = z.object({
  type: z.enum(["like", "dislike"]),
});

// GET /games - List all active games with creator, cover, stats, and tags
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

    // Get games with creator info
    const gamesList = await db
      .select({
        id: games.id,
        title: games.title,
        gameUrl: games.gameUrl,
        coverMediaId: games.coverMediaId,
        countSuperlikes: games.countSuperlikes,
        viewCount: games.viewCount,
        score: games.score,
        createdBy: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(games)
      .leftJoin(users, eq(games.createdBy, users.id))
      .where(eq(games.isActive, true))
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    // Get cover media for all games
    const gameIds = gamesList.map(g => g.id);
    const coverMediaIds = gamesList
      .map(g => g.coverMediaId)
      .filter((id): id is string => id !== null);

    const coverMediaList = coverMediaIds.length > 0
      ? await db.query.gameMedia.findMany({
          where: inArray(gameMedia.id, coverMediaIds),
        })
      : [];

    // Get tags for all games
    const gameTagsList = gameIds.length > 0
      ? await db.query.gameTags.findMany({
          where: inArray(gameTags.gameId, gameIds),
        })
      : [];

    const tagIds = [...new Set(gameTagsList.map(gt => gt.tagId))];
    const tagsList = tagIds.length > 0
      ? await db.query.tags.findMany({
          where: inArray(tags.id, tagIds),
        })
      : [];

    // Map tags to games
    const gamesWithDetails = gamesList.map(game => {
      const coverMedia = coverMediaList.find(m => m.id === game.coverMediaId);
      const gameTags = gameTagsList
        .filter(gt => gt.gameId === game.id)
        .map(gt => tagsList.find(t => t.id === gt.tagId))
        .filter(Boolean);

      return {
        id: game.id,
        title: game.title,
        gameUrl: game.gameUrl,
        coverMedia: coverMedia ? {
          id: coverMedia.id,
          mediaType: coverMedia.mediaType,
          r2Key: coverMedia.r2Key,
        } : null,
        countSuperlikes: game.countSuperlikes,
        viewCount: game.viewCount,
        score: game.score,
        createdBy: game.createdBy,
        tags: gameTags,
      };
    });

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(games)
      .where(eq(games.isActive, true));

    return c.json({
      games: gamesWithDetails,
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

// GET /games/:id - Get single game with all related data (no activation/timestamps)
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

    // Get creator info
    const creator = await db.query.users.findFirst({
      where: eq(users.id, game.createdBy),
      columns: {
        id: true,
        name: true,
        avatarUrl: true,
        email: true,
      },
    });

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

    // Get all media for this game
    const media = await db.query.gameMedia.findMany({
      where: eq(gameMedia.gameId, gameId),
      orderBy: (gameMedia, { asc }) => [asc(gameMedia.sortOrder)],
      columns: {
        id: true,
        mediaType: true,
        r2Key: true,
        sortOrder: true,
      },
    });

    // Get tags
    const gameTagsData = await db.query.gameTags.findMany({
      where: eq(gameTags.gameId, gameId),
    });

    const tagIds = gameTagsData.map(gt => gt.tagId);
    const tagsData = tagIds.length > 0 
      ? await db.query.tags.findMany({
          where: inArray(tags.id, tagIds),
          columns: {
            id: true,
            name: true,
            category: true,
          },
        })
      : [];

    return c.json({
      id: game.id,
      title: game.title,
      description: game.description,
      gameUrl: game.gameUrl,
      coverMediaId: game.coverMediaId,
      countLikes: game.countLikes,
      countDislikes: game.countDislikes,
      countSuperlikes: game.countSuperlikes,
      score: game.score,
      viewCount: game.viewCount,
      createdBy: creator,
      media,
      tags: tagsData,
      userReaction,
      userSuperliked,
    });
  } catch (error) {
    console.error("Get game error:", error);
    return c.json({ error: "Failed to fetch game" }, 500);
  }
});

// GET /games/:id/stats - Get detailed view/reaction/superlike stats
gamesRouter.get("/:id/stats", async (c) => {
  const gameId = c.req.param("id");

  try {
    const game = await db.query.games.findFirst({
      where: and(eq(games.id, gameId), eq(games.isActive, true)),
    });

    if (!game) {
      return c.json({ error: "Game not found" }, 404);
    }

    // Get reaction breakdown
    const reactionStats = await db
      .select({
        reactionType: gameReactions.reactionType,
        count: sql<number>`count(*)`,
      })
      .from(gameReactions)
      .where(eq(gameReactions.gameId, gameId))
      .groupBy(gameReactions.reactionType);

    const likes = reactionStats.find(r => r.reactionType === "like")?.count ?? 0;
    const dislikes = reactionStats.find(r => r.reactionType === "dislike")?.count ?? 0;

    // Get superlike count
    const superlikeCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(gameSuperlikes)
      .where(eq(gameSuperlikes.gameId, gameId));

    // Get view stats
    const viewStats = await db
      .select({ count: sql<number>`count(*)` })
      .from(gameViews)
      .where(eq(gameViews.gameId, gameId));

    // Get unique viewers (users who viewed)
    const uniqueViewers = await db
      .select({ count: sql<number>`count(distinct ${gameViews.userId})` })
      .from(gameViews)
      .where(and(
        eq(gameViews.gameId, gameId),
        sql`${gameViews.userId} IS NOT NULL`
      ));

    return c.json({
      gameId,
      reactions: {
        likes,
        dislikes,
        total: likes + dislikes,
        score: likes - dislikes,
      },
      superlikes: {
        count: superlikeCount[0]?.count ?? 0,
      },
      views: {
        total: viewStats[0]?.count ?? 0,
        uniqueUsers: uniqueViewers[0]?.count ?? 0,
      },
    });
  } catch (error) {
    console.error("Get game stats error:", error);
    return c.json({ error: "Failed to fetch game stats" }, 500);
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

export default gamesRouter;