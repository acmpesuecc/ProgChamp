import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "./session";

export type User = typeof users.$inferSelect;

// Extend Hono context with user and session
declare module "hono" {
  interface ContextVariableMap {
    user: User;
    sessionId: string;
  }
}

/**
 * Middleware: Require valid session and active user
 * 
 * Guarantees after execution:
 * - Request is authenticated
 * - c.get("user") exists and is active
 * - c.get("sessionId") contains the session ID
 * 
 * Returns 401 if:
 * - No session cookie present
 * - Session not found or expired
 * - User not found or inactive
 */
export async function requireSession(c: Context, next: Next) {
  const sessionId = getCookie(c, "session_id");
  
  if (!sessionId) {
    return c.json({ 
      error: "Unauthorized",
      message: "No session found. Please log in.",
    }, 401);
  }
  
  // Verify session exists and is not expired
  const session = await getSession(sessionId);
  
  if (!session) {
    return c.json({ 
      error: "Unauthorized",
      message: "Session expired. Please log in again.",
    }, 401);
  }
  
  // Load user
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });
  
  if (!user) {
    return c.json({ 
      error: "Unauthorized",
      message: "User not found.",
    }, 401);
  }
  
  // Check if user is active
  if (!user.isActive) {
    return c.json({ 
      error: "Account deactivated",
      message: "Your account has been deactivated. Contact support to restore access.",
      deactivatedAt: user.deactivatedAt,
    }, 403);
  }
  
  // Attach user and session to context
  c.set("user", user);
  c.set("sessionId", sessionId);
  
  await next();
}

/**
 * Middleware: Require admin privileges
 * 
 * MUST be used after requireSession middleware
 * 
 * Guarantees after execution:
 * - User is authenticated (from requireSession)
 * - User has admin privileges
 * 
 * Returns 403 if user is not an admin
 */
export async function requireAdmin(c: Context, next: Next) {
  const user = c.get("user");
  
  // This should never happen if requireSession is used first
  if (!user) {
    return c.json({ 
      error: "Unauthorized",
      message: "Authentication required.",
    }, 401);
  }
  
  if (user.userType !== "admin") {
    return c.json({ 
      error: "Forbidden",
      message: "Admin access required.",
    }, 403);
  }
  
  await next();
}

/**
 * Middleware: Require complete profile
 * 
 * MUST be used after requireSession middleware
 * 
 * Returns 403 if user has not completed profile setup
 */
export async function requireCompleteProfile(c: Context, next: Next) {
  const user = c.get("user");
  
  if (!user) {
    return c.json({ 
      error: "Unauthorized",
      message: "Authentication required.",
    }, 401);
  }
  
  if (!user.profileCompletedAt) {
    return c.json({ 
      error: "Profile incomplete",
      message: "Please complete your profile setup first.",
      needsProfileSetup: true,
    }, 403);
  }
  
  await next();
}