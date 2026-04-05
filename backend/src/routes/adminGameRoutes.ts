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

adminGameRequestRoutes.get("/all-games", requireSession, requireAdmin, async (c) => {
  const cursorParam = c.req.query("cursor");
  const statusParam = c.req.query("status"); // "active" | "deactivated" | undefined = all
  const pageSize = 20;

  const conditions = [];

  if (statusParam === "active") conditions.push(eq(games.isActive, true));
  else if (statusParam === "deactivated") conditions.push(eq(games.isActive, false));

  if (cursorParam) {
    try {
      const decoded = JSON.parse(atob(cursorParam));
      const cursorDate = new Date(decoded.createdAt);
      if (isNaN(cursorDate.getTime()) || !decoded.id) {
        return c.json({ error: "Invalid cursor" }, 400);
      }
      const cursorCondition = or(
        lt(games.createdAt, cursorDate),
        and(eq(games.createdAt, cursorDate), lt(games.id, decoded.id)),
      );
      if (cursorCondition) conditions.push(cursorCondition);
    } catch {
      return c.json({ error: "Invalid cursor" }, 400);
    }
  }

  const result = await db.query.games.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: (games, { desc }) => [desc(games.createdAt), desc(games.id)],
    limit: pageSize + 1,
    with: {
      creator: { columns: { id: true, name: true, avatarUrl: true } },
      tags: { with: { tag: true } },
      coverMedia: true,
    },
  });

  const hasNextPage = result.length > pageSize;
  const page = hasNextPage ? result.slice(0, pageSize) : result;
  const lastGame = page.at(-1);
  const nextCursor = hasNextPage && lastGame
    ? btoa(JSON.stringify({ createdAt: lastGame.createdAt, id: lastGame.id }))
    : null;

  return c.json({ games: page, nextCursor });
});

adminGameRequestRoutes.get("/game-detail/:id", requireSession, requireAdmin, async (c) => {
  const gameId = c.req.param("id");
  console.log("Fetching game:", gameId);

  try {
    const game = await db.query.games.findFirst({
      where: eq(games.id, gameId),
      with: {
        coverMedia: true,
        tags: { with: { tag: true } },
        creator: { columns: { id: true, name: true, avatarUrl: true } },
      },
    });
     console.log("Result:", game); 

    if (!game) throw new NotFoundError("Game not found");

    return c.json({ success: true, game });
  } catch (error) {
    if (error instanceof NotFoundError) return c.json({ error: error.message }, 404);
    console.error("Get game by id error:", error);
    return c.json({ error: "Failed to fetch game" }, 500);
  }
});

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

  const requests = await db.query.gameRequests.findMany({
    where: and(...conditions),
    orderBy: (gameRequests, { desc }) => [
      desc(gameRequests.createdAt),
      desc(gameRequests.id),
    ],
    limit: pageSize + 1,
    with: {
      media: true,
      tags: {
        with: {
          tag: true,
        },
      },
      submitter: {
        columns: { id: true, name: true, avatarUrl: true },
      },
    },
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
    nextCursor,
  });
});

// Retreive a specific game request
adminGameRequestRoutes.get("/:id", requireSession, requireAdmin, async (c) => {
  const gameRequestId = c.req.param("id");

  try {
    const request = await db.query.gameRequests.findFirst({
      where: eq(gameRequests.id, gameRequestId),
      with: {
        media: true,
        tags: { with: { tag: true } },
        submitter: {
          columns: { id: true, name: true, avatarUrl: true, email: true },
        },
        reviewer: {
          columns: { id: true, name: true },
        },
      },
    });

    if (!request) throw new NotFoundError("Game request not found");

    return c.json({ success: true, request });
  } catch (error) {
    if (error instanceof NotFoundError) return c.json({ error: error.message }, 404);
    console.error("Get game request error:", error);
    return c.json({ error: "Failed to fetch game request" }, 500);
  }
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

// Admin rejects games
adminGameRequestRoutes.post(
  "/:id/reject",
  requireSession,
  requireAdmin,
  async (c) => {
    const admin = c.get("user");
    const gameRequestId = c.req.param("id");

    try {
      await db.transaction(async (tx) => {
        const request = await tx.query.gameRequests.findFirst({
          where: eq(gameRequests.id, gameRequestId),
        });

        if (!request) {
          throw new NotFoundError("Game request not found");
        }

        if (request.status !== "pending") {
          throw new InvalidStateError("Invalid request status");
        }

        await tx.update(gameRequests).set({
          status: "rejected",
          reviewedBy: admin.id,
          reviewedAt: new Date(),
        }).where(eq(gameRequests.id, gameRequestId));

        await tx.insert(adminActions).values({
          id: `aa_${nanoid(16)}`,
          adminId: admin.id,
          actionType: "reject_game",
          decision: "rejected",
          gameRequestId: gameRequestId,
        });
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
      await db.transaction(async (tx) => {
        const game = await tx.query.games.findFirst({
          where: eq(games.id, gameId),
        });

        if (!game) {
          throw new NotFoundError("Game not found");
        }

        if (!game.isActive) {
          throw new InvalidStateError("Game is already deactivated");
        }

        await tx.update(games).set({
          isActive: false,
          deactivatedAt: new Date(),
          deactivationReason: reason,
        }).where(eq(games.id, gameId));

        await tx.insert(adminActions).values({
          id: `aa_${nanoid(16)}`,
          adminId: admin.id,
          actionType: "deactivate_game",
          decision: "deactivated",
          targetGameId: gameId,
          notes: reason,
        });
      });

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

// Admin reactivates a game
adminGameRequestRoutes.post(
  "/:id/reactivate",
  requireSession,
  requireAdmin,
  async (c) => {
    const admin = c.get("user");
    const gameId = c.req.param("id");

    try {
      await db.transaction(async (tx) => {
        const game = await tx.query.games.findFirst({
          where: eq(games.id, gameId),
        });

        if (!game) throw new NotFoundError("Game not found");
        if (game.isActive) throw new InvalidStateError("Game is already active");

        await tx.update(games).set({
          isActive: true,
          deactivatedAt: null,
          deactivationReason: null,
        }).where(eq(games.id, gameId));

        await tx.insert(adminActions).values({
          id: `aa_${nanoid(16)}`,
          adminId: admin.id,
          actionType: "reactivate_game",
          decision: "reactivated",
          targetGameId: gameId,
        });
      });

      return c.json({ success: true, message: "Game reactivated successfully" });
    } catch (error) {
      if (error instanceof NotFoundError) return c.json({ error: error.message }, 404);
      if (error instanceof InvalidStateError) return c.json({ error: error.message }, 400);
      return c.json({ error: "Unexpected error" }, 500);
    }
  }
);

export default adminGameRequestRoutes;