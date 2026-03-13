import { db } from "../db/index";
import { sessions } from "../db/schema";
import { eq, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Create a new session for a user
 * @param userId - User ID to create session for
 * @param expiresInDays - Number of days until session expires (default: 7)
 * @returns Created session object
 */
export async function createSession(userId: string, expiresInDays: number = 7): Promise<Session> {
  const sessionId = nanoid(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  
  const [session] = await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  }).returning();
  
  return session!;
}

/**
 * Get a session by ID
 * @param sessionId - Session ID
 * @returns Session object or null if not found/expired
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });
  
  if (!session) {
    return null;
  }
  
  // Check if expired
  if (session.expiresAt < new Date()) {
    await deleteSession(sessionId);
    return null;
  }
  
  return session;
}

/**
 * Delete a session
 * @param sessionId - Session ID to delete
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

/**
 * Delete all sessions for a user
 * @param userId - User ID
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

/**
 * Extend session expiration
 * @param sessionId - Session ID
 * @param expiresInDays - Number of days to extend (default: 7)
 */
export async function extendSession(sessionId: string, expiresInDays: number = 7): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  
  await db.update(sessions)
    .set({ expiresAt })
    .where(eq(sessions.id, sessionId));
}