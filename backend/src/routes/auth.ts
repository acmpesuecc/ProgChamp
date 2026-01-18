import { Hono } from "hono";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const auth = new Hono();

// Type helper for Drizzle returning
type User = typeof users.$inferSelect;

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
    return c.json({ error: "Invalid request data", details: result.error.format() }, 400);
  }

  const { googleId, email, name, avatarUrl } = result.data;

  try {
    // Check if user exists by Google ID
    const existingUser = await db.query.users.findFirst({
      where: eq(users.googleId, googleId),
    });

    let user;

    if (existingUser) {
      // Check if account is deactivated
      if (!existingUser.isActive) {
        return c.json({ 
          error: "Account is deactivated",
          message: "Your account has been deactivated. Please contact support to restore access.",
          deactivatedAt: existingUser.deactivatedAt,
        }, 403);
      }

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
        .returning() as User[];
      
      user = updated[0] ?? existingUser;
    } else {
      // Check if email is already in use (different Google account)
      const emailExists = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (emailExists) {
        return c.json({ 
          error: "Email already registered",
          message: "This email is already associated with another account.",
        }, 409);
      }

      // Create new user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUsers = await db
        .insert(users)
        .values({
          id: userId,
          googleId,
          email,
          name,
          avatarUrl,
          userType: "normal",
          superlikesRemaining: 3,
          isActive: true,
        })
        .returning() as User[];
      
      user = newUsers[0]!;
    }

    // TODO: In production, create JWT token here
    // const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '7d' });

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        userType: user.userType,
        superlikesRemaining: user.superlikesRemaining,
        createdAt: user.createdAt,
      },
      // token, // Return this in production
    });
  } catch (error) {
    console.error("Auth error:", error);
    return c.json({ 
      error: "Authentication failed",
      message: "An error occurred during authentication. Please try again.",
    }, 500);
  }
});

// GET /auth/me - Get current user (requires auth middleware)
auth.get("/me", async (c) => {
  // TODO: Add auth middleware to extract userId from JWT
  const userId = c.req.header("X-User-Id"); // Temporary - replace with JWT parsing

  if (!userId) {
    return c.json({ error: "Unauthorized", message: "No authentication provided" }, 401);
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    if (!user.isActive) {
      return c.json({ 
        error: "Account deactivated",
        message: "Your account has been deactivated.",
        deactivatedAt: user.deactivatedAt,
      }, 403);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        userType: user.userType,
        superlikesRemaining: user.superlikesRemaining,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return c.json({ 
      error: "Failed to fetch user",
      message: "An error occurred while fetching user data.",
    }, 500);
  }
});

// POST /auth/logout
auth.post("/logout", async (c) => {
  // TODO: In production, invalidate JWT token (add to blacklist or use short expiry with refresh tokens)
  return c.json({ success: true, message: "Logged out successfully" });
});

// DELETE /auth/account - Deactivate account (soft delete)
auth.delete("/account", async (c) => {
  const userId = c.req.header("X-User-Id");

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const bodySchema = z.object({
    reason: z.string().optional(),
  });

  const body = await c.req.json();
  const result = bodySchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: "Invalid request data" }, 400);
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    if (!user.isActive) {
      return c.json({ error: "Account already deactivated" }, 400);
    }

    // Soft delete - deactivate account
    await db
      .update(users)
      .set({
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: userId,
        deactivationReason: result.data.reason || "User requested deactivation",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return c.json({ 
      success: true,
      message: "Account deactivated. You have 30 days to restore your account.",
    });
  } catch (error) {
    console.error("Deactivate account error:", error);
    return c.json({ error: "Failed to deactivate account" }, 500);
  }
});

export default auth;