import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildGoogleAuthUrl,
  exchangeCodeForTokens,
  getGoogleUserInfo,
} from "../lib/oauth";
import { createSession, deleteSession, getSession } from "../lib/session";
import { requireSession } from "../lib/middleware";

const auth = new Hono();

// Environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
const FRONTEND_URL = process.env.FRONTEND_URL;

/**
 * GET /auth/google
 *
 * Initiates Google OAuth flow with PKCE
 *
 * Flow:
 * 1. Generate code verifier and challenge
 * 2. Generate state for CSRF protection
 * 3. Store verifier and state in httpOnly cookies (short-lived)
 * 4. Redirect to Google OAuth consent screen
 */
auth.get("/google", async (c) => {
  try {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store verifier and state in httpOnly cookies (10 min expiry)
    setCookie(c, "oauth_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    setCookie(c, "oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // Build authorization URL
    const authUrl = await buildGoogleAuthUrl(
      GOOGLE_CLIENT_ID,
      GOOGLE_REDIRECT_URI,
      codeChallenge,
      state,
    );

    return c.redirect(authUrl);
  } catch (error) {
    console.error("OAuth initiation error:", error);
    return c.json(
      {
        error: "OAuth initialization failed",
        message: "Unable to start authentication. Please try again.",
      },
      500,
    );
  }
});

/**
 * GET /auth/google/callback
 *
 * Handles Google OAuth callback
 *
 * Flow:
 * 1. Validate state parameter (CSRF protection)
 * 2. Exchange authorization code for tokens using PKCE verifier
 * 3. Fetch user info from Google
 * 4. Check if user exists by googleId
 * 5. If exists: signin flow
 * 6. If new: signup flow (create user with null name/avatar)
 * 7. Create session and set cookie
 * 8. Redirect appropriately
 */
auth.get("/google/callback", async (c) => {
  try {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");

    // Check for OAuth error
    if (error) {
      return c.redirect(`${FRONTEND_URL}/auth/error?error=${error}`);
    }

    if (!code || !state) {
      return c.json({ error: "Missing code or state parameter" }, 400);
    }

    // Validate state (CSRF protection)
    const storedState = getCookie(c, "oauth_state");
    if (!storedState || storedState !== state) {
      return c.json(
        {
          error: "Invalid state parameter",
          message: "CSRF validation failed. Please try again.",
        },
        400,
      );
    }

    // Retrieve code verifier
    const codeVerifier = getCookie(c, "oauth_verifier");
    if (!codeVerifier) {
      return c.json(
        {
          error: "Missing code verifier",
          message: "OAuth session expired. Please try again.",
        },
        400,
      );
    }

    // Clear OAuth cookies
    deleteCookie(c, "oauth_state");
    deleteCookie(c, "oauth_verifier");

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(
      code,
      codeVerifier,
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI,
    );

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    if (!googleUser.email_verified) {
      return c.redirect(`${FRONTEND_URL}/auth/error?error=email_not_verified`);
    }

    const googleId = googleUser.sub;
    const email = googleUser.email;

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.googleId, googleId),
    });

    let user;
    let isNewUser = false;

    if (existingUser) {
      // SIGNIN FLOW - Existing user

      // Check if account is deactivated
      if (!existingUser.isActive) {
        return c.redirect(
          `${FRONTEND_URL}/auth/error?error=account_deactivated`,
        );
      }

      // Update email if it changed (Google allows email changes)
      if (existingUser.email !== email) {
        await db
          .update(users)
          .set({
            email,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id));
      }

      user = existingUser;
    } else {
      // SIGNUP FLOW - New user

      // Check if email is already used (shouldn't happen, but safety check)
      const emailExists = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (emailExists) {
        return c.redirect(
          `${FRONTEND_URL}/auth/error?error=email_already_exists`,
        );
      }

      // Create new user with NULL name and avatarUrl
      const userId = `user_${nanoid(16)}`;

      const [newUser] = await db
        .insert(users)
        .values({
          id: userId,
          googleId,
          email,
          name: null, // User must set this in profile setup
          avatarUrl: null, // User must set this in profile setup
          profileCompletedAt: null, // Profile not yet complete
          userType: "normal",
          superlikesRemaining: 3,
          isActive: true,
        })
        .returning();

      user = newUser!;
      isNewUser = true;
    }

    // Create session
    const session = await createSession(user.id, 7); // 7 days

    // Set session cookie
    setCookie(c, "session_id", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Redirect based on user state
    if (isNewUser || !user.profileCompletedAt) {
      // New user or incomplete profile -> profile setup
      return c.redirect(`${FRONTEND_URL}/profile/setup`);
    } else {
      // Returning user with complete profile -> home
      return c.redirect(`${FRONTEND_URL}/home`);
    }
  } catch (error) {
    console.error("OAuth callback error:", error);
    return c.redirect(`${FRONTEND_URL}/auth/error?error=authentication_failed`);
  }
});

/**
 * GET /auth/session
 *
 * Returns current authentication state
 *
 * Response:
 * - authenticated: boolean
 * - needsProfileSetup: boolean (true if profileCompletedAt is null)
 * - user: user object (if authenticated)
 */
auth.get("/session", async (c) => {
  const sessionId = getCookie(c, "session_id");

  if (!sessionId) {
    return c.json({
      authenticated: false,
      needsProfileSetup: false,
    });
  }

  try {
    const session = await getSession(sessionId);

    if (!session) {
      deleteCookie(c, "session_id");
      return c.json({
        authenticated: false,
        needsProfileSetup: false,
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user || !user.isActive) {
      deleteCookie(c, "session_id");
      return c.json({
        authenticated: false,
        needsProfileSetup: false,
      });
    }
    console.log(sessionId);
    return c.json({
      authenticated: true,
      needsProfileSetup: !user.profileCompletedAt,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        userType: user.userType,
        superlikesRemaining: user.superlikesRemaining,
        profileCompletedAt: user.profileCompletedAt,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return c.json({
      authenticated: false,
      needsProfileSetup: false,
    });
  }
});

/**
 * POST /auth/logout
 *
 * Destroys session and clears cookie
 *
 * Requires: valid session cookie
 */
auth.post("/logout", async (c) => {
  try {
    const sessionId = getCookie(c, "session_id");

    if (sessionId) {
      // Delete session from database
      await deleteSession(sessionId);
    }

    // Clear session cookie
    deleteCookie(c, "session_id");

    return c.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return c.json(
      {
        error: "Logout failed",
        message: "An error occurred during logout.",
      },
      500,
    );
  }
});

export default auth;
