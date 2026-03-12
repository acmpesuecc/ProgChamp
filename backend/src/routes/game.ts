import { Hono } from "hono";
import { db } from "../db/index";
import { games } from "../db/schema";
import { eq, like, gte, lte, lt, and } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "../lib/middleware";

export const gamesRoute = new Hono();

// ZOD validation
const gamesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  cursor: z.coerce.number().optional(),
  search: z.string().min(1).optional(),
  maxLikes: z.coerce.number().min(0).optional(),
  createdAfter: z.string().date().optional(), 
  createdBefore: z.string().date().optional(), 
});

/**
 * GET /games
 *
 * Returns all active games with cursor-based (scroll) pagination.
 *
 * Requirements:
 * - User must be authenticated
 *
 * Query parameters:
 * - limit          Number of results per page (default: 10, max: 50)
 * - cursor         createdAt timestamp of the last received item; omit for first page
 * - search         Filter by title
 * - minLikes       Filter by minimum like count
 * - maxLikes       Filter by maximum like count
 * - createdAfter   Return games created after this date (YYYY-MM-DD)
 * - createdBefore  Return games created before this date (YYYY-MM-DD)
 *
 * Response:
 * - games[]        Array of game objects
 * - nextCursor     Pass as `cursor` in the next request; null means no more results
 */
gamesRoute.get("/", requireSession, async (c) => {
  try {
    const queryParse = gamesQuerySchema.safeParse(c.req.query());

    if (!queryParse.success) {
      return c.json({ error: "Validation failed", details: queryParse.error.format() }, 400);
    }

    const { limit, cursor, search, maxLikes, createdAfter, createdBefore } = queryParse.data;

    /* Filter conditions */
    const conditions = [eq(games.isActive, true)];

    // cursor pagination - only fetch records older than the last seen item
    if (cursor !== undefined) {
      conditions.push(lt(games.createdAt, cursor));
    }

    if (search) {
      conditions.push(like(games.title, `%${search}%`));
    }

    if (maxLikes !== undefined) {
      conditions.push(lte(games.countLikes, maxLikes));
    }

    if (createdAfter) {
      const afterTimestamp = Math.floor(new Date(createdAfter).getTime() / 1000);
      conditions.push(gte(games.createdAt, afterTimestamp));
    }

    if (createdBefore) {
      const beforeTimestamp = Math.floor(new Date(createdBefore).getTime() / 1000);
      conditions.push(lte(games.createdAt, beforeTimestamp));
    }

    const whereClause = and(...conditions);

    /* Data retrieval - fetch one extra so we can tell if there's a next page */
    const gamesList = await db.query.games.findMany({
      where: whereClause,
      orderBy: (g, { desc }) => [desc(g.createdAt)],
      limit: limit + 1,
      columns: {
        id: true,
        title: true,
        description: true,
        gameUrl: true,
        coverMediaId: true,
        createdBy: true,
        countLikes: true,
        countDislikes: true,
        countSuperlikes: true,
        score: true,
        viewCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasNextPage = gamesList.length > limit;
    const results = hasNextPage ? gamesList.slice(0, limit) : gamesList;
    const nextCursor = hasNextPage ? results[results.length - 1].createdAt : null;

    return c.json({
      success: true,
      limit,
      nextCursor,
      games: results,
    });
  } catch (error) {
    console.error("Get games error:", error);
    return c.json({ error: "Failed to fetch games", message: "An error occurred while retrieving games." }, 500);
  }
});

export default gamesRoute;
