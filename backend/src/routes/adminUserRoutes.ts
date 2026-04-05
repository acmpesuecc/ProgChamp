import { Hono } from "hono";
import { db } from "../db/index";
import { userRequests, adminActions, users } from "../db/schema";
import { requireSession, requireAdmin } from "../lib/middleware";
import { eq, and, lt, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NotFoundError, InvalidStateError, ForbiddenError } from "../lib/errors";

const adminUserRoutes = new Hono();

// retrieve all user appeals
adminUserRoutes.get("/", requireSession, requireAdmin, async (c) => {
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
        lt(userRequests.createdAt, cursorDate),
        and(
          eq(userRequests.createdAt, cursorDate),
          lt(userRequests.id, decoded.id),
        ),
      );
      if (cursorCondition) conditions.push(cursorCondition);
    } catch {
      return c.json({ error: "Invalid cursor" }, 400);
    }
  }

  const appeals = await db.query.userRequests.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: (userRequests, { desc }) => [
      desc(userRequests.createdAt),
      desc(userRequests.id),
    ],
    limit: pageSize + 1,
    with: {
      submitter: {
        columns: { id: true, name: true, avatarUrl: true, email: true },
      },
      relatedGame: {
        columns: { id: true, title: true },
      },
    },
  });

  const hasNextPage = appeals.length > pageSize;
  const page = hasNextPage ? appeals.slice(0, pageSize) : appeals;
  const last = page.at(-1);
  const nextCursor =
    hasNextPage && last
      ? btoa(JSON.stringify({ createdAt: last.createdAt, id: last.id }))
      : null;

  return c.json({ success: true, appeals: page, nextCursor });
});

// Get specific user appeal
adminUserRoutes.get("/:id", requireSession, requireAdmin, async (c) => {
  const appealId = c.req.param("id");

  try {
    const appeal = await db.query.userRequests.findFirst({
      where: eq(userRequests.id, appealId),
      with: {
        submitter: {
          columns: { id: true, name: true, avatarUrl: true, email: true },
        },
        relatedGame: {
          columns: { id: true, title: true },
        },
        reviewer: {
          columns: { id: true, name: true },
        },
      },
    });

    if (!appeal) throw new NotFoundError("Appeal not found");

    return c.json({ success: true, appeal });
  } catch (error) {
    if (error instanceof NotFoundError) return c.json({ error: error.message }, 404);
    console.error("Get appeal error:", error);
    return c.json({ error: "Failed to fetch appeal" }, 500);
  }
});

//admin approves user appeal
adminUserRoutes.post("/:id/approve", requireSession, requireAdmin, async (c) => {
  const admin = c.get("user");
  const appealId = c.req.param("id");

  try {
    await db.transaction(async (tx) => {
      const appeal = await tx.query.userRequests.findFirst({
        where: eq(userRequests.id, appealId),
      });

      if (!appeal) throw new NotFoundError("Appeal not found");
      if (appeal.status !== "pending") throw new InvalidStateError("Appeal is not pending");

      await tx.update(userRequests).set({
        status: "approved",
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      }).where(eq(userRequests.id, appealId));

      await tx.insert(adminActions).values({
        id: `aa_${nanoid(16)}`,
        adminId: admin.id,
        actionType: "approve_appeal",
        decision: "approved",
        userRequestId: appealId,
      });
    });

    return c.json({ success: true, message: "Appeal approved successfully" });
  } catch (error) {
    if (error instanceof NotFoundError) return c.json({ error: error.message }, 404);
    if (error instanceof InvalidStateError) return c.json({ error: error.message }, 400);
    console.error("Approve appeal error:", error);
    return c.json({ error: "Failed to approve appeal" }, 500);
  }
});

// admin rejects user appeal
adminUserRoutes.post("/:id/reject", requireSession, requireAdmin, async (c) => {
  const admin = c.get("user");
  const appealId = c.req.param("id");

  try {
    await db.transaction(async (tx) => {
      const appeal = await tx.query.userRequests.findFirst({
        where: eq(userRequests.id, appealId),
      });

      if (!appeal) throw new NotFoundError("Appeal not found");
      if (appeal.status !== "pending") throw new InvalidStateError("Appeal is not pending");

      await tx.update(userRequests).set({
        status: "rejected",
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      }).where(eq(userRequests.id, appealId));

      await tx.insert(adminActions).values({
        id: `aa_${nanoid(16)}`,
        adminId: admin.id,
        actionType: "reject_appeal",
        decision: "rejected",
        userRequestId: appealId,
      });
    });

    return c.json({ success: true, message: "Appeal rejected successfully" });
  } catch (error) {
    if (error instanceof NotFoundError) return c.json({ error: error.message }, 404);
    if (error instanceof InvalidStateError) return c.json({ error: error.message }, 400);
    console.error("Reject appeal error:", error);
    return c.json({ error: "Failed to reject appeal" }, 500);
  }
});


/**
 * PATCH /admin/users/:id
 * Ban or restore a user.
 */
adminUserRoutes.patch("/users/:id", requireSession, requireAdmin, async (c) => {
  try {
    const admin = c.get("user");
    const userId = c.req.param("id");
    const body = await c.req.json();

    if (typeof body.isActive !== "boolean") {
      return c.json({ error: "isActive (boolean) is required" }, 400);
    }

    const target = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, isActive: true, userType: true },
    });

    if (!target) throw new NotFoundError("User not found");
    if (target.id === admin.id) throw new ForbiddenError("Cannot ban yourself");
    if (target.isActive === body.isActive) throw new InvalidStateError(`User is already ${body.isActive ? "active" : "banned"}`);

    await db.transaction(async (tx) => {
      await tx.update(users).set({
        isActive: body.isActive,
        deactivatedAt: body.isActive ? null : new Date(),
        deactivatedBy: body.isActive ? null : admin.id,
      }).where(eq(users.id, userId));

      await tx.insert(adminActions).values({
        id: `aa_${nanoid(16)}`,
        adminId: admin.id,
        actionType: body.isActive ? "unban_user" : "ban_user",
        decision: body.isActive ? "unbanned" : "banned",
        targetUserId: userId,
      });
    });

    return c.json({ success: true, message: `User ${body.isActive ? "restored" : "banned"} successfully` });
  } catch (error) {
    if (error instanceof NotFoundError) return c.json({ error: error.message }, 404);
    if (error instanceof ForbiddenError) return c.json({ error: error.message }, 403);
    if (error instanceof InvalidStateError) return c.json({ error: error.message }, 400);
    console.error("Admin toggle user error:", error);
    return c.json({ error: "Failed to update user" }, 500);
  }
});

export default adminUserRoutes;