import type { PageServerLoad } from './$types';

const API = 'http://localhost:3000';

export const load: PageServerLoad = async ({ fetch }) => {
  const [gamesRes, tagsRes] = await Promise.all([
    fetch(`${API}/games?limit=20`),
    fetch(`${API}/tags`),
  ]);

  const tags = tagsRes.ok ? await tagsRes.json() : [];
  if (!gamesRes.ok) return { games: [], nextCursor: null, tags };

  const data = await gamesRes.json();
  return {
    games: data.games ?? [],
    nextCursor: data.nextCursor ?? null,
    tags,
  };
};