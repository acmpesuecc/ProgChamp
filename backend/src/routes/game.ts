import { Hono } from "hono";
import { db } from "../db/index";
import { games } from "../db/schema";
import {
  eq,
  like,
  gte,
  lte,
  and,
  desc,
  count,
} from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "../lib/middleware";

const gamesRoute = new Hono();

// ============================================================================
// ZOD VALIDATION
// ============================================================================

const gamesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  search: z.string().min(1).optional(),
  minLikes: z.coerce.number().min(0).optional(),
  maxLikes: z.coerce.number().min(0).optional(),
  createdAfter: z.string().optional(),
  createdBefore: z.string().optional(),
});

/**
 * GET /games
 *
 * gives all active games
 *
 * Requirements:
 * - User must be authenticated
 *
 * Query parameters
 * - page
 * - limit
 * - search
 * - minLikes
 * - maxLikes
 * - createdAfter (YYYY-MM-DD)
 * - createdBefore (YYYY-MM-DD)
 *

 */
gamesRoute.get("/", requireSession, async (c) => {
  try {
    const queryParse = gamesQuerySchema.safeParse(c.req.query());

    if (!queryParse.success) {
      return c.json(
        {
          error: "Validation failed",
          details: queryParse.error.format(),
        },
        400,
      );
    }

    const {
      page,
      limit,
      search,
      minLikes,
      maxLikes,
      createdAfter,
      createdBefore,
    } = queryParse.data;

    const offset = (page - 1) * limit;
/*Filter conditions*/

    const conditions = [eq(games.isActive, true)];

    if (search) {
      conditions.push(like(games.title, `%${search}%`));
    }

    if (minLikes !== undefined) {
      conditions.push(gte(games.countLikes, minLikes));
    }

    if (maxLikes !== undefined) {
      conditions.push(lte(games.countLikes, maxLikes));
    }

    if (createdAfter) {
      const afterTimestamp = Math.floor(
        new Date(createdAfter).getTime() / 1000,
      );
      conditions.push(gte(games.createdAt, afterTimestamp));
    }

    if (createdBefore) {
      const beforeTimestamp = Math.floor(
        new Date(createdBefore).getTime() / 1000,
      );
      conditions.push(lte(games.createdAt, beforeTimestamp));
    }

    const whereClause = and(...conditions);

/*Data retrival*/

    const gamesList = await db.query.games.findMany({
      where: whereClause,
      orderBy: (g, { desc }) => [desc(g.createdAt)],
      limit,
      offset,
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

    const totalResult = await db
      .select({ value: count() })
      .from(games)
      .where(whereClause);

    const total = totalResult[0]?.value ?? 0;

    return c.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      games: gamesList,
    });
  } catch (error) {
    console.error("Get games error:", error);

    return c.json(
      {
        error: "Failed to fetch games",
        message: "An error occurred while retrieving games.",
      },
      500,
    );
  }
});

export default gamesRoute;
