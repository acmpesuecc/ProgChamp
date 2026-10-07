import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { tags, gameTags, gameRequestTags } from "../db/schema";
import { eq, ne, and, asc, count, sql } from "drizzle-orm";
import { requireSession, requireAdmin, rateLimit } from "../lib/middleware";

const tagsRoute = new Hono();

const tagFields = {
  name: z.string().trim().min(1, "Name is required").max(100),
  category: z.string().trim().min(1, "Category is required").max(100),
};
const createTagSchema = z.object(tagFields);
const updateTagSchema = z
  .object(tagFields)
  .partial()
  .refine((v) => v.name !== undefined || v.category !== undefined, {
    message: "Nothing to update",
  });

// Case-insensitive duplicate check ("RPG" vs "rpg"); exceptId lets a tag keep its own name on edit
const nameTaken = (name: string, exceptId?: string) =>
  db.query.tags.findFirst({
    where: and(
      sql`lower(${tags.name}) = lower(${name})`,
      exceptId ? ne(tags.id, exceptId) : undefined,
    ),
  });

// 1. CREATE (admin only)
tagsRoute.post(
  "/new",
  requireSession,
  requireAdmin,
  rateLimit({ windowMs: 60_000, max: 10 }),
  async (c) => {
    const user = c.get("user");
    const body = await c.req.json().catch(() => null); // bad JSON -> 400, not a 500

    const result = createTagSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: "Validation failed", details: result.error.format() }, 400);
    }
    const { name, category } = result.data;

    if (await nameTaken(name)) {
      return c.json({ error: "Tag already exists" }, 409);
    }

    const [newTag] = await db
      .insert(tags)
      .values({ id: crypto.randomUUID(), name, category, createdBy: user.id })
      .returning();

    return c.json(newTag, 201);
  },
);

// 2. UPDATE (admin only)
tagsRoute.patch(
  "/:tag_id",
  requireSession,
  requireAdmin,
  rateLimit({ windowMs: 60_000, max: 30 }),
  async (c) => {
    const tagId = c.req.param("tag_id");
    const body = await c.req.json().catch(() => null);

    const result = updateTagSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: "Validation failed", details: result.error.format() }, 400);
    }

    const existing = await db.query.tags.findFirst({ where: eq(tags.id, tagId) });
    if (!existing) return c.json({ error: "Tag not found" }, 404);

    if (result.data.name && (await nameTaken(result.data.name, tagId))) {
      return c.json({ error: "Tag already exists" }, 409);
    }

    const [updated] = await db
      .update(tags)
      .set(result.data)
      .where(eq(tags.id, tagId))
      .returning();

    return c.json(updated);
  },
);

// 3. DELETE (admin only) - refuses if the tag is still attached to anything
tagsRoute.delete(
  "/:tag_id",
  requireSession,
  requireAdmin,
  rateLimit({ windowMs: 60_000, max: 30 }),
  async (c) => {
    const tagId = c.req.param("tag_id");

    const existing = await db.query.tags.findFirst({ where: eq(tags.id, tagId) });
    if (!existing) return c.json({ error: "Tag not found" }, 404);

    const [{ n: games }] = await db
      .select({ n: count() })
      .from(gameTags)
      .where(eq(gameTags.tagId, tagId));
    const [{ n: pendingRequests }] = await db
      .select({ n: count() })
      .from(gameRequestTags)
      .where(eq(gameRequestTags.tagId, tagId));

    if (games + pendingRequests > 0) {
      return c.json({ error: "Tag is in use", games, pendingRequests }, 409);
    }

    await db.delete(tags).where(eq(tags.id, tagId));
    return c.json({ success: true });
  },
);

// 4. FILTER GAMES BY TAG - unchanged, still depends on your relations() (see above)
tagsRoute.get("/:tag_id/games", async (c) => {
  const tagId = c.req.param("tag_id");

  const result = await db.query.tags.findFirst({
    where: eq(tags.id, tagId),
    with: { games: { with: { game: true } } },
  });

  if (!result) return c.json({ error: "Tag not found" }, 404);

  const activeGames = result.games
    .map((gt) => gt.game)
    .filter((game) => game && game.isActive);

  return c.json(activeGames);
});

// 5. LIST ALL TAGS - only public fields, grouped by category
tagsRoute.get("/", async (c) => {
  const allTags = await db
    .select({ id: tags.id, name: tags.name, category: tags.category })
    .from(tags)
    .orderBy(asc(tags.category), asc(tags.name));
  return c.json(allTags);
});

export default tagsRoute;