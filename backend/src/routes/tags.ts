import { Hono } from 'hono';
import { db } from '../db';
import { tags, gameTags } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const tagsRoute = new Hono();

// 1. CREATE TAG ENDPOINT (with duplicate check)
tagsRoute.post('/', async (c) => {
  const { name, category } = await c.req.json();

  // Logic: Check if tag exists to avoid duplicates
  const existing = await db.query.tags.findFirst({
    where: eq(tags.name, name)
  });

  if (existing) {
    return c.json({ error: "Tag already exists" }, 400);
  }

  const [newTag] = await db.insert(tags).values({
    id: crypto.randomUUID(),
    name,
    category
  }).returning();

  return c.json(newTag, 201);
});

// 2. FILTERING BY TAG (Get all games for a specific tag)
tagsRoute.get('/:id/games', async (c) => {
  const tagId = c.req.param('id');
  
  // Use Drizzle Relations API to join games and tags
  const result = await db.query.tags.findFirst({
    where: eq(tags.id, tagId),
    with: {
      games: {
        with: {
          game: true 
        }
      }
    }
  });

  return c.json(result?.games.map(gt => gt.game) ?? []);
});

// 3. GET ALL TAGS (The endpoint you tested earlier)
tagsRoute.get('/', async (c) => {
  const allTags = await db.query.tags.findMany();
  return c.json(allTags);
});

export default tagsRoute;