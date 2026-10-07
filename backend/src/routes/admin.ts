import { Hono } from "hono";
import { db } from "../db/index";
import { games, users, gameRequests, sessions } from "../db/schema";
import { eq, gt, and, count, or, lt, like } from "drizzle-orm";
import { requireSession, requireAdmin } from "../lib/middleware";

const adminRoutes = new Hono();

/**
 * GET /admin/stats
 * Returns platform-wide stats for the admin dashboard.
 */
adminRoutes.get("/stats", requireSession, requireAdmin, async (c) => {
  try {
    const [[totalGames = { count: 0 }], [totalUsers = { count: 0 }], [pendingCount = { count: 0 }], [onlineNow = { count: 0 }]] = await Promise.all([
      db.select({ count: count() }).from(games).where(eq(games.isActive, true)),
      db.select({ count: count() }).from(users).where(eq(users.isActive, true)),
      db.select({ count: count() }).from(gameRequests).where(eq(gameRequests.status, "pending")),
      db.select({ count: count() }).from(sessions).where(gt(sessions.expiresAt, new Date())),
    ]);

    return c.json({
      success: true,
      totalGames: totalGames.count,
      totalUsers: totalUsers.count,
      pendingCount: pendingCount.count,
      onlineNow: onlineNow.count,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

/**
 * GET /admin/users
 * Returns paginated list of users, filterable by isActive.
 */
adminRoutes.get("/users", requireSession, requireAdmin, async (c) => {
  try {
    const search = c.req.query('search') ?? '';
    const cursorParam = c.req.query("cursor");
    const filterActive = c.req.query("isActive");
    const pageSize = 20;

    const conditions = [];

    if (filterActive === "true") conditions.push(eq(users.isActive, true));
    if (filterActive === "false") conditions.push(eq(users.isActive, false));

    if (search) {
      conditions.push(
      or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`)
        )
      );
    }

    if (cursorParam) {
      try {
        const decoded = JSON.parse(atob(cursorParam));
        const cursorDate = new Date(decoded.createdAt);
        if (isNaN(cursorDate.getTime()) || !decoded.id) {
          return c.json({ error: "Invalid cursor" }, 400);
        }
        const { lt, or } = await import("drizzle-orm");
        const cursorCondition = or(
          lt(users.createdAt, cursorDate),
          and(eq(users.createdAt, cursorDate), lt(users.id, decoded.id))
        );
        if (cursorCondition) conditions.push(cursorCondition);
      } catch {
        return c.json({ error: "Invalid cursor" }, 400);
      }
    }

    const usersList = await db.query.users.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: (u, { desc }) => [desc(u.createdAt), desc(u.id)],
      limit: pageSize + 1,
      columns: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        userType: true,
        isActive: true,
        createdAt: true,
      },
    });

    const hasNextPage = usersList.length > pageSize;
    const page = hasNextPage ? usersList.slice(0, pageSize) : usersList;
    const last = page.at(-1);
    const nextCursor = hasNextPage && last
      ? btoa(JSON.stringify({ createdAt: last.createdAt, id: last.id }))
      : null;

    return c.json({ success: true, users: page, nextCursor });
  } catch (error) {
    console.error("Admin users error:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

adminRoutes.get("/games", requireSession, requireAdmin, async (c) => {
  const cursorParam = c.req.query("cursor");
  const pageSize = 20;

  const conditions: any[] = [];

  if (cursorParam) {
    try {
      const decoded = JSON.parse(atob(cursorParam));
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

  const gamesList = await db.query.games.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: (g, { desc }) => [desc(g.createdAt), desc(g.id)],
    limit: pageSize + 1,
    with: {
      creator: {
        columns: { id: true, name: true, avatarUrl: true },
      },
      tags: { with: { tag: true } },
    },
  });

  const hasNextPage = gamesList.length > pageSize;
  const page = hasNextPage ? gamesList.slice(0, pageSize) : gamesList;
  const last = page.at(-1);
  const nextCursor = hasNextPage && last
    ? btoa(JSON.stringify({ createdAt: last.createdAt, id: last.id }))
    : null;

  return c.json({ success: true, games: page, nextCursor });
});


export default adminRoutes;