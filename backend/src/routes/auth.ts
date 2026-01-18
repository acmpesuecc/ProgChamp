import { Hono } from "hono";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const auth = new Hono();

// Google OAuth callback schema
const googleAuthSchema = z.object({
  googleId: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().optional(),
});

// POST /auth/google - Handle Google OAuth callback
auth.post("/google", async (c) => {
  const body = await c.req.json();
  const result = googleAuthSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: "Invalid request data" }, 400);
  }

  const { googleId, email, name, avatarUrl } = result.data;

  try {
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.googleId, googleId),
    });

    let user;

    if (existingUser) {
      // Update existing user
      const updated = await db
        .update(users)
        .set({
          email,
          name,
          avatarUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      user = updated[0];
    } else {
      // Create new user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUser = await db
        .insert(users)
        .values({
          id: userId,
          googleId,
          email,
          name,
          avatarUrl,
        })
        .returning();
      user = newUser[0];
    }

    // In production, create JWT token here
    // For now, return user data
    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        userType: user.userType,
        superlikesRemaining: user.superlikesRemaining,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    return c.json({ error: "Authentication failed" }, 500);
  }
});

// GET /auth/me - Get current user (requires auth middleware)
auth.get("/me", async (c) => {
  // TODO: Add auth middleware to extract userId from JWT
  const userId = c.req.header("X-User-Id"); // Temporary

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.isActive) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        userType: user.userType,
        superlikesRemaining: user.superlikesRemaining,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});

// POST /auth/logout
auth.post("/logout", async (c) => {
  // In production, invalidate JWT token
  return c.json({ success: true });
});

export default auth;