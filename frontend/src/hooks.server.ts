// src/hooks.server.ts
import type { Handle } from "@sveltejs/kit";

const API_URL = process.env.VITE_API_URL ?? "http://localhost:9210";

export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get("session_id");

  if (sessionId) {
    try {
      const res = await fetch(`${API_URL}/auth/session`, {
        headers: { Cookie: `session_id=${sessionId}` },
      });
      const data = await res.json();
      if (data.authenticated) {
        event.locals.user = data.user;
        event.locals.session = data;
      }
    } catch {
      // backend unreachable, continue as unauthenticated
    }
  }

  return resolve(event);
};
