import { Hono } from "hono";
import { db } from "../db/index";
import { games } from "../db/schema";
import { eq, like, gte, lte, lt, and, or } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "../lib/middleware";

export const gamesRoute = new Hono();

const gamesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  cursor: z.string().optional(),          // base64-encoded, same pattern as gameRequests
  search: z.string().min(1).optional(),
  minLikes: z.coerce.number().min(0).optional(),  // was in docs but missing from schema
  maxLikes: z.coerce.number().min(0).optional(),
  createdAfter: z.string().date().optional(),
  createdBefore: z.string().date().optional(),
});

/**
 * GET /games
 *
 * Returns all active games with cursor-based pagination.
 * Cursor is a base64-encoded JSON object: { createdAt: ISO string, id: string }
 *
 * Query parameters:
 * - limit          Number of results per page (default: 10, max: 50)
 * - cursor         Opaque cursor from previous response; omit for first page
 * - search         Filter by title (partial match)
 * - minLikes       Filter by minimum like count
 * - maxLikes       Filter by maximum like count
 * - createdAfter   Return games created after this date (YYYY-MM-DD)
 * - createdBefore  Return games created before this date (YYYY-MM-DD)
 */
gamesRoute.get("/", requireSession, async (c) => {
  try {
    const queryParse = gamesQuerySchema.safeParse(c.req.query());
    if (!queryParse.success) {
      return c.json({ error: "Validation failed", details: queryParse.error.format() }, 400);
    }

    const { limit, cursor, search, minLikes, maxLikes, createdAfter, createdBefore } = queryParse.data;

    const conditions = [eq(games.isActive, true)];

    if (cursor) {
      try {
        const decoded = JSON.parse(atob(cursor));
        const cursorDate = new Date(decoded.createdAt);
        if (isNaN(cursorDate.getTime()) || !decoded.id) {
          return c.json({ error: "Invalid cursor" }, 400);
        }
        const cursorCondition = or(
          lt(games.createdAt, cursorDate),
          and(eq(games.createdAt, cursorDate), lt(games.id, decoded.id))
        );
        if (cursorCondition) conditions.push(cursorCondition);
      } catch {
        return c.json({ error: "Invalid cursor" }, 400);
      }
    }

    if (search) conditions.push(like(games.title, `%${search}%`));
    if (minLikes !== undefined) conditions.push(gte(games.countLikes, minLikes));
    if (maxLikes !== undefined) conditions.push(lte(games.countLikes, maxLikes));

    if (createdAfter) conditions.push(gte(games.createdAt, new Date(createdAfter)));
    if (createdBefore) conditions.push(lte(games.createdAt, new Date(createdBefore)));

    const gamesList = await db.query.games.findMany({
      where: and(...conditions),
      orderBy: (g, { desc }) => [desc(g.createdAt), desc(g.id)],
      limit: limit + 1,
      with: {
        coverMedia: true,
        tags: { with: { tag: true } },
      },
    });

    const hasNextPage = gamesList.length > limit;
    const results = hasNextPage ? gamesList.slice(0, limit) : gamesList;
    const last = results.at(-1);
    const nextCursor = hasNextPage && last
      ? btoa(JSON.stringify({ createdAt: last.createdAt, id: last.id }))
      : null;

    return c.json({ success: true, limit, nextCursor, games: results });

  } catch (error) {
    console.error("Get games error:", error);
    return c.json({ error: "Failed to fetch games" }, 500);
  }
});

/**
 * GET /games/:id
 */
gamesRoute.get("/:id", requireSession, async (c) => {
  try {
    const { id } = c.req.param();
    if (!id) return c.json({ error: "Invalid game ID" }, 400);

    const game = await db.query.games.findFirst({
      where: and(eq(games.id, id), eq(games.isActive, true)),
      with: {
        coverMedia: true,
        tags: { with: { tag: true } },
        creator: {
          columns: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    if (!game) {
      return c.json({ error: "Game not found" }, 404);
    }

    return c.json({ success: true, game });

  } catch (error) {
    console.error("Get game by id error:", error);
    return c.json({ error: "Failed to fetch game" }, 500);
  }
});

export default gamesRoute;