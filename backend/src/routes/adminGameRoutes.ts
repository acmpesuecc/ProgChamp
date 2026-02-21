import { Hono } from "hono";
import { db } from "../db/index";
import { gameRequests, userRequests, games, adminActions } from "../db/schema";
import { requireSession, requireAdmin } from "../lib/middleware";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { approveGameRequest, getPendingGameRequest } from "../lib/gameRequestService";
import { getGame } from "../lib/gameService";
import { NotFoundError, InvalidStateError } from "../lib/errors";


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


        const requests = await db.query.gameRequests.findMany({
            where: eq(gameRequests.status, "pending"),
            limit: pageSize,
            offset: offset,
            orderBy: (gameRequests, { desc }) => [desc(gameRequests.createdAt)],
        });

        return c.json({requests})
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

// Admin deactivates games
adminGameRequestRoutes.post (
  ":id/deactivate",
  requireSession,
  requireAdmin,

  async (c) => {
    const admin = c.get("user");
    const gameId = c.req.param("id");
    const body = await c.req.json();
    const reason = body.reason;

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