import { Hono } from "hono";
import { db } from "../db/index";
import { gameRequests, userRequests, games, adminActions } from "../db/schema";
import { requireSession, requireAdmin } from "../lib/middleware";
import { eq, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { approveGameRequest, getPendingGameRequest } from "../lib/gameRequestService";
import { getGame } from "../lib/gameService";
import { NotFoundError, InvalidStateError } from "../lib/errors";
import { z } from "zod"


const adminGameRequestRoutes = new Hono();

// Retrieve all game requests
adminGameRequestRoutes.get(
    "/",
    requireSession,
    requireAdmin,
    async(c) => {
        const page = Number(c.req.query("page")) || 1;
        const pageSize = 20;

        // Page 1: (1 - 1) * 20 = 0 offset
        // Page 2: (2 - 1) * 20 = 20 offset
        const offset = (page - 1) * pageSize;


        const [requests, totalCount] = await Promise.all([
          db.query.gameRequests.findMany({
            where: eq(gameRequests.status, "pending"),
            limit: pageSize,
            offset: offset,
            orderBy: (gameRequests, { desc }) => [desc(gameRequests.createdAt)],
          }),
          db.select({ count: count() }).from(gameRequests).where(eq(gameRequests.status, "pending")),
        ]);

        const total = totalCount[0]?.count ?? 0;
        const totalPages = Math.ceil(total / pageSize);


        return c.json({
          requests, 
          meta : {
            page, pageSize, total, totalPages, 
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        })
    }
);

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
  }
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

      await db.update(gameRequests).set({
          status: "rejected",
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        }).where(eq(gameRequests.id, gameRequestId));

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
  }
);

//zod schema validation
const deactivateSchema = z.object({
  reason: z.string().min(1, "Reason is required")
});

// Admin deactivates games
adminGameRequestRoutes.post (
  "/:id/deactivate",
  requireSession,
  requireAdmin,

  async (c) => {
    const admin = c.get("user");
    const gameId = c.req.param("id");
    const body = await c.req.json();
    const result = deactivateSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: "Validation failed", details: result.error.format() }, 400);
    }
    const { reason } = result.data;

    try {
      await getGame(gameId)

      await db.update(games).set({
          isActive: false,
          deactivatedAt: new Date(),
          deactivationReason: reason
        }).where(eq(games.id, gameId));
        
        // Add admin log for deactivating the game

        return c.json({
            success: true,
            message: "Game deactivated successfully",
          });
    }
    catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof InvalidStateError) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: "Unexpected error" }, 500);
    }
  }
)

export default adminGameRequestRoutes;