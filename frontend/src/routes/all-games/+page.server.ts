import type { PageServerLoad } from './$types';

const API = 'http://localhost:3000';

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch(`${API}/games?limit=20`);
  if (!res.ok) return { games: [], nextCursor: null };

  const data = await res.json();
  return {
    games: data.games ?? [],
    nextCursor: data.nextCursor ?? null,
  };
};