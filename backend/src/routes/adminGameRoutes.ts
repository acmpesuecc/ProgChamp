import { Hono } from "hono";
import { db } from "../db/index";
import { gameRequests, userRequests, games, adminActions } from "../db/schema";
import { requireSession, requireAdmin } from "../lib/middleware";
import { eq, and, lt, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  approveGameRequest,
  getPendingGameRequest,
} from "../lib/gameRequestService";
import { getGame } from "../lib/gameService";
import { NotFoundError, InvalidStateError } from "../lib/errors";
import { z } from "zod";

const adminGameRequestRoutes = new Hono();

// Retrieve all game requests
adminGameRequestRoutes.get("/", requireSession, requireAdmin, async (c) => {
  const cursorParam = c.req.query("cursor");
  const pageSize = 20;

  const conditions = [eq(gameRequests.status, "pending")];

  if (cursorParam) {
    try {
      const decoded = JSON.parse(atob(cursorParam));
      const cursorDate = new Date(decoded.createdAt);

      if (isNaN(cursorDate.getTime()) || !decoded.id) {
        return c.json({ error: "Invalid cursor" }, 400);
      }

      // Fetch rows that come after the cursor, using (createdAt, id) as the key.
      // Rows with the same timestamp are ordered by id to avoid skipping/duplicating.
      const cursorCondition = or(
        lt(gameRequests.createdAt, cursorDate),
        and(
          eq(gameRequests.createdAt, cursorDate),
          lt(gameRequests.id, decoded.id),
        ),
      );

      if (cursorCondition) {
        conditions.push(cursorCondition);
      }
    } catch {
      return c.json({ error: "Invalid cursor" }, 400);
    }
  }

  // Fetch one extra record to determine if there's a next page
  const requests = await db.query.gameRequests.findMany({
    where: and(...conditions),
    orderBy: (gameRequests, { desc }) => [
      desc(gameRequests.createdAt),
      desc(gameRequests.id), // tiebreaker
    ],
    limit: pageSize + 1,
  });

  const hasNextPage = requests.length > pageSize;
  const page = hasNextPage ? requests.slice(0, pageSize) : requests;

  const lastRequest = page.at(-1);
  const nextCursor =
    hasNextPage && lastRequest
      ? btoa(
          JSON.stringify({
            createdAt: lastRequest.createdAt,
            id: lastRequest.id,
          }),
        )
      : null;

  return c.json({
    requests: page,
    nextCursor, // null when on the last page
  });
});

// Admin approves games
adminGameRequestRoutes.post(
  "/:id/approve",
  requireSession,
  requireAdmin,
  async (c) => {
    const admin = c.get("user");
    const gameRequestId = c.req.param("id");

    try {
      await approveGameRequest(gameRequestId, admin.id);

      return c.json({
        success: true,
        message: "Game approved successfully",
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof InvalidStateError) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: "Unexpected error" }, 500);
    }
  },
);

// Admin rejects  games
adminGameRequestRoutes.post(
  "/:id/reject",
  requireSession,
  requireAdmin,
  async (c) => {
    const admin = c.get("user");
    const gameRequestId = c.req.param("id");

    try {
      await getPendingGameRequest(gameRequestId);

      await db
        .update(gameRequests)
        .set({
          status: "rejected",
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        })
        .where(eq(gameRequests.id, gameRequestId));

      await db.insert(adminActions).values({
        id: `aa_${nanoid(16)}`,
        adminId: admin.id,
        gameRequestId: gameRequestId,
      });

      return c.json({
        success: true,
        message: "Game rejected successfully",
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof InvalidStateError) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: "Unexpected error" }, 500);
    }
  },
);

//zod schema validation
const deactivateSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

// Admin deactivates games
adminGameRequestRoutes.post(
  "/:id/deactivate",
  requireSession,
  requireAdmin,

  async (c) => {
    const admin = c.get("user");
    const gameId = c.req.param("id");
    const body = await c.req.json();
    const result = deactivateSchema.safeParse(body);
    if (!result.success) {
      return c.json(
        { error: "Validation failed", details: result.error.format() },
        400,
      );
    }
    const { reason } = result.data;

    try {
      await getGame(gameId);

      await db
        .update(games)
        .set({
          isActive: false,
          deactivatedAt: new Date(),
          deactivationReason: reason,
        })
        .where(eq(games.id, gameId));

      // Add admin log for deactivating the game

      return c.json({
        success: true,
        message: "Game deactivated successfully",
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof InvalidStateError) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: "Unexpected error" }, 500);
    }
  },
);

export default adminGameRequestRoutes;
