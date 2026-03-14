import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { tags, games } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession, requireAdmin, rateLimit } from "../lib/middleware";

const tagsRoute = new Hono();

const createTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category: z.string().min(1, "Category is required").max(100),
});

// 1. CREATE TAG ENDPOINT (admin only, rate limited to 10/min)
tagsRoute.post(
  "/new",
  requireSession,
  requireAdmin,
  rateLimit({ windowMs: 60_000, max: 10 }),
  async (c) => {
    const user = c.get("user");
    const body = await c.req.json();

    const result = createTagSchema.safeParse(body);
    if (!result.success) {
      return c.json(
        { error: "Validation failed", details: result.error.format() },
        400,
      );
    }

    const { name, category } = result.data;

    // Check if tag exists to avoid duplicates
    const existing = await db.query.tags.findFirst({
      where: eq(tags.name, name),
    });

    if (existing) {
      return c.json({ error: "Tag already exists" }, 400);
    }

    const [newTag] = await db
      .insert(tags)
      .values({
        id: crypto.randomUUID(),
        name,
        category,
        createdBy: user.id,
      })
      .returning();

    return c.json(newTag, 201);
  },
);

// 2. FILTERING BY TAG — only returns active games
tagsRoute.get("/:tag_id/games", async (c) => {
  const tagId = c.req.param("tag_id");

  const result = await db.query.tags.findFirst({
    where: eq(tags.id, tagId),
    with: {
      games: {
        with: {
          game: true,
        },
      },
    },
  });

  if (!result) {
    return c.json({ error: "Tag not found" }, 404);
  }

  const activeGames = result.games
    .map((gt) => gt.game)
    .filter((game) => game && game.isActive);

  return c.json(activeGames);
});

// 3. GET ALL TAGS
tagsRoute.get("/", async (c) => {
  const allTags = await db.query.tags.findMany();
  return c.json(allTags);
});

export default tagsRoute;
