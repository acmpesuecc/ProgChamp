// src/auth.ts
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

export async function getSession(fetch: typeof globalThis.fetch) {
  const res = await fetch(`${API_URL}/auth/session`, {
    credentials: 'include',
  });
  if (!res.ok) return null;
  return res.json(); // { authenticated, needsProfileSetup, user }
}
