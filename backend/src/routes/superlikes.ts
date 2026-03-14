import { Hono } from 'hono';
import { db } from '../db';
import { users, games, gameSuperlikes } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

const superlikesRouter = new Hono();

superlikesRouter.post('/', async (c) => {
  try {
    const { userId, gameId } = await c.req.json();

    const result = await db.transaction(async (tx) => {
      const userRecord = await tx
        .select({ superlikesRemaining: users.superlikesRemaining })
        .from(users)
        .where(eq(users.id, userId))
        .get();

      if (!userRecord) {
        return { success: false, message: "User not found", status: 404 };
      }

      const remaining = userRecord.superlikesRemaining;

      if (remaining <= 0) {
        return { success: false, message: "No superlikes remaining.", status: 429 };
      }

      await tx.insert(gameSuperlikes).values({
        userId,
        gameId,
      }).run();

      await tx
        .update(users)
        .set({ superlikesRemaining: sql`${users.superlikesRemaining} - 1` })
        .where(eq(users.id, userId))
        .run();

      await tx
        .update(games)
        .set({
          countSuperlikes: sql`${games.countSuperlikes} + 1`,
          score: sql`${games.score} + 3`
        })
        .where(eq(games.id, gameId))
        .run();

      return { success: true, remainingToday: remaining - 1, status: 201 };
    });

    if (!result.success) {
      return c.json({ success: false, message: result.message }, result.status as any);
    }

    return c.json({
      success: true,
      weight: 3,
      remainingToday: result.remainingToday,
    }, 201);

  } catch (error: any) {
    if (error.message?.includes('UNIQUE')) {
      return c.json({ success: false, message: "Already superliked this game" }, 400);
    }
    return c.json({ success: false, message: "Server error" }, 500);
  }
});

export default superlikesRouter;