import { Hono } from "hono";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireSession, requireAdmin } from "../lib/middleware";

const profile = new Hono();

// Validation schemas
const profileSetupSchema = z.object({
  name: z.string().min(1).max(100),
  avatarUrl: z.string().url().max(500),
});

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().max(500).optional(),
}).refine((data) => data.name || data.avatarUrl, {
  message: "At least one field (name or avatarUrl) must be provided",
});

/**
 * PATCH /profile/setup
 * 
 * Complete initial profile setup
 * 
 * Requirements:
 * - User must be authenticated
 * - Profile must NOT be complete (profileCompletedAt must be null)
 * - Both name and avatarUrl must be provided
 * 
 * After success:
 * - Sets name and avatarUrl
 * - Sets profileCompletedAt to current timestamp
 */
profile.patch("/setup", requireSession, async (c) => {
  try {
    const user = c.get("user");
    
    // Check if profile is already complete
    if (user.profileCompletedAt) {
      return c.json({ 
        error: "Profile already completed",
        message: "Your profile has already been set up. Use /profile/update to modify it.",
      }, 400);
    }
    
    const body = await c.req.json();
    const result = profileSetupSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({ 
        error: "Validation failed",
        details: result.error.format(),
      }, 400);
    }
    
    const { name, avatarUrl } = result.data;
    
    // Update user profile
    const [updatedUser] = await db.update(users)
      .set({
        name,
        avatarUrl,
        profileCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();
    
    return c.json({
      success: true,
      message: "Profile setup completed successfully",
      user: {
        id: updatedUser!.id,
        email: updatedUser!.email,
        name: updatedUser!.name,
        avatarUrl: updatedUser!.avatarUrl,
        userType: updatedUser!.userType,
        profileCompletedAt: updatedUser!.profileCompletedAt,
      },
    });
  } catch (error) {
    console.error("Profile setup error:", error);
    return c.json({ 
      error: "Profile setup failed",
      message: "An error occurred while setting up your profile.",
    }, 500);
  }
});

/**
 * PATCH /profile/update
 * 
 * Update existing profile
 * 
 * Requirements:
 * - User must be authenticated
 * - Profile must be complete (profileCompletedAt must NOT be null)
 * - At least one field (name or avatarUrl) must be provided
 */
profile.patch("/update", requireSession, async (c) => {
  try {
    const user = c.get("user");
    
    // Check if profile is complete
    if (!user.profileCompletedAt) {
      return c.json({ 
        error: "Profile not set up",
        message: "Please complete profile setup first at /profile/setup.",
        needsProfileSetup: true,
      }, 403);
    }
    
    const body = await c.req.json();
    const result = profileUpdateSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({ 
        error: "Validation failed",
        details: result.error.format(),
      }, 400);
    }
    
    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };
    
    if (result.data.name !== undefined) {
      updateData.name = result.data.name;
    }
    
    if (result.data.avatarUrl !== undefined) {
      updateData.avatarUrl = result.data.avatarUrl;
    }
    
    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning();
    
    return c.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser!.id,
        email: updatedUser!.email,
        name: updatedUser!.name,
        avatarUrl: updatedUser!.avatarUrl,
        userType: updatedUser!.userType,
        profileCompletedAt: updatedUser!.profileCompletedAt,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return c.json({ 
      error: "Profile update failed",
      message: "An error occurred while updating your profile.",
    }, 500);
  }
});

/**
 * GET /profile/public/:userId
 * 
 * Get public profile information
 * 
 * Requirements:
 * - No authentication required
 * 
 * Returns ONLY:
 * - id
 * - email
 * - name
 * - avatarUrl
 * 
 * Does NOT return sensitive fields like:
 * - googleId
 * - userType
 * - superlikesRemaining
 * - deactivation info
 */
profile.get("/public/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });
    
    if (!user) {
      return c.json({ 
        error: "User not found",
      }, 404);
    }
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Get public profile error:", error);
    return c.json({ 
      error: "Failed to fetch profile",
    }, 500);
  }
});

/**
 * GET /profile/privileged/:userId
 * 
 * Get complete user data (admin only)
 * 
 * Requirements:
 * - User must be authenticated
 * - User must be an admin
 * 
 * Returns entire user row including:
 * - All fields from users table
 */
profile.get("/privileged/:userId", requireSession, requireAdmin, async (c) => {
  try {
    const userId = c.req.param("userId");
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    
    if (!user) {
      return c.json({ 
        error: "User not found",
      }, 404);
    }
    
    return c.json({
      user: {
        id: user.id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        userType: user.userType,
        superlikesRemaining: user.superlikesRemaining,
        isActive: user.isActive,
        deactivatedAt: user.deactivatedAt,
        deactivatedBy: user.deactivatedBy,
        deactivationReason: user.deactivationReason,
        profileCompletedAt: user.profileCompletedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get privileged profile error:", error);
    return c.json({ 
      error: "Failed to fetch profile",
    }, 500);
  }
});

export default profile;