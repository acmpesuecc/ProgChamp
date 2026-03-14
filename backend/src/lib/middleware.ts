import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "./session";
import { rateLimiter } from "hono-rate-limiter";
import type { MiddlewareHandler } from "hono";

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

/**
 * Middleware: Rate limit Google OAuth initiation by IP address
 *
 * Guarantees after execution:
 * - Request is within the allowed rate limit window
 * - Client IP is correctly resolved behind proxies
 *
 * Returns 429 if:
 * - Client has exceeded 10 requests within a 60 second window
 *
 * Note: Cast as unknown as MiddlewareHandler to bypass hono-rate-limiter
 * type incompatibility with Hono's route-level generics
 */
export const googleAuthRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  limit: 10, // max 10 requests per window 
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    return (
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown"
    );
  },
}) as unknown as MiddlewareHandler;

/**
 * Middleware: Rate limit game reactions by user and game
 *
 * MUST be used after requireSession and requireCompleteProfile middleware
 *
 * Guarantees after execution:
 * - Request is within the allowed rate limit window
 *
 * Returns 429 if:
 * - Client has exceeded 5 reactions within a 20 second window for the same game
 *
 * Note: Cast as unknown as MiddlewareHandler to bypass hono-rate-limiter
 * type incompatibility with Hono's route-level generics
 */
export const reactionRateLimiter = rateLimiter({
  windowMs: 20 * 1000,
  limit: 5,
  standardHeaders: "draft-6",
  keyGenerator: (c) => {
    const gameId = c.req.param("gameId");
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "unknown";
    return gameId ? `reaction:${ip}:${gameId}` : `reaction:${ip}`;
  },
}) as unknown as MiddlewareHandler;