import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const API = 'http://localhost:3000';

export const load: PageServerLoad = async ({ locals, fetch }) => {
  if (!locals.session?.authenticated) {
    throw redirect(302, '/');
  }

  const res = await fetch(`${API}/game-requests/my?limit=20`);
  if (!res.ok) return { requests: [], nextCursor: null };

  const data = await res.json();
  return {
    requests: data.requests ?? [],
    nextCursor: data.nextCursor ?? null,
  };
};