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
  return nanoid(32);
}

/**
 * Base64URL encode an ArrayBuffer
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const len = bytes.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i] as number);
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

// Define the expected response shape
interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
  scope: string;
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; id_token: string }> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
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

  const responseText = await response.text();

  if (!response.ok) {
    console.error("Token exchange failed. Status:", response.status);
    console.error("Response:", responseText);
    throw new Error(`Token exchange failed (${response.status}): ${responseText}`);
  }

  try {
    const data = JSON.parse(responseText) as GoogleTokenResponse;
    const result: { access_token: string; id_token: string } = {
      access_token: data.access_token,
      id_token: data.id_token,
    };
    return result;
  } catch (e) {
    console.error("Failed to parse token response as JSON");
    console.error("Response text:", responseText);
    throw new Error(`Invalid JSON response from Google: ${responseText.substring(0, 200)}`);
  }
}

/**
 * Get user info from Google using access token
 */
export async function getGoogleUserInfo(accessToken: string): Promise<{
  sub: string;
  email: string;
  email_verified: boolean;
}> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  const responseText = await response.text();
  
  if (!response.ok) {
    console.error("Get user info failed. Status:", response.status);
    console.error("Response:", responseText);
    throw new Error(`Failed to fetch user info (${response.status}): ${responseText}`);
  }
  
  try {
    const parsed = JSON.parse(responseText);
    const result: { sub: string; email: string; email_verified: boolean } = {
      sub: parsed.sub as string,
      email: parsed.email as string,
      email_verified: parsed.email_verified as boolean,
    };
    return result;
  } catch (e) {
    console.error("Failed to parse user info response as JSON");
    console.error("Response text:", responseText);
    throw new Error(`Invalid JSON response from Google: ${responseText.substring(0, 200)}`);
  }
}