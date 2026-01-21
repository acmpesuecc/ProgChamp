import { nanoid } from "nanoid";

/**
 * Generate a PKCE code verifier (random 43-128 character string)
 */
export function generateCodeVerifier(): string {
  return nanoid(128);
}

/**
 * Generate PKCE code challenge from verifier using S256 method
 * @param verifier - Code verifier string
 * @returns Base64URL encoded SHA-256 hash
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  
  return base64UrlEncode(hash);
}

/**
 * Generate random state parameter for CSRF protection
 */
export function generateState(): string {
  // Explicitly passing the number to satisfy strict type checks
  return nanoid(32 as number); 
}

/**
 * Base64URL encode an ArrayBuffer
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Build Google OAuth authorization URL
 */
export async function buildGoogleAuthUrl(
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  state: string
): Promise<string> {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email",
    access_type: "offline",
    prompt: "consent",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; id_token: string }> {
  const response = await fetch("https://accounts.google.com/o/oauth2/v2/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }
  
  // FIX: Cast the unknown JSON to the expected type
  return (await response.json()) as { access_token: string; id_token: string };
}

/**
 * Get user info from Google using access token
 */
export async function getGoogleUserInfo(accessToken: string): Promise<{
  sub: string;
  email: string;
  email_verified: boolean;
}> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo.", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch user info: ${error}`);
  }
  
  // FIX: Cast the unknown JSON to the expected type
  return (await response.json()) as {
    sub: string;
    email: string;
    email_verified: boolean;
  };
}