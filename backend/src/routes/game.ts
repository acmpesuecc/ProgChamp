import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { games } from "../db/schema";



const requireSession = async (c: any, next: any) => {
  return await next();
};

const gamesRoute = new Hono();

/**
 * GET /games
 *
 * Authenticated users only.
 * Returns all ACTIVE games.
 * Pagination needs to be added
 *Filtering system needs to be added
 */
gamesRoute.get("/", requireSession, async (c) => {
  try {
    const gamesList = await db.query.games.findMany({
      where: eq(games.isActive, true),
      orderBy: (g, { desc }) => [desc(g.createdAt)],
      columns: {
        id: true,
        title: true,
        description: true,
        gameUrl: true,
        coverMediaId: true,
        countLikes: true,
        countDislikes: true,
        countSuperlikes: true,
        score: true,
        viewCount: true,
        createdBy: true,
      },
    });

    return c.json({
      success: true,
      count: gamesList.length,
      games: gamesList,
    });
  } catch (error) {
    console.error("Get games error:", error);

    return c.json(
      {
        error: "Failed to fetch games",
        message: "An error occurred while retrieving games.",
      },
      500
    );
  }
});

export default gamesRoute;

