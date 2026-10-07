import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const API = 'http://localhost:9210';

export const load: PageServerLoad = async ({ params, fetch }) => {
  const res = await fetch(`${API}/profile/public/${params.id}`).catch(() => {
    throw error(502, 'Could not reach server');
  });

  if (res.status === 404) throw error(404, 'User not found');
  if (!res.ok) throw error(res.status, 'Failed to load profile');

  const json = await res.json();
  if (!json?.user) throw error(404, 'User not found');

  // Also fetch their games
  const gamesRes = await fetch(`${API}/games?limit=50`).catch(() => null);
  const gamesJson = gamesRes?.ok ? await gamesRes.json() : null;
  const allGames: any[] = gamesJson?.games ?? [];
  const userGames = allGames.filter((g: any) => g.createdBy === params.id);

  return {
    profileUser: json.user,
    games: userGames,
  };
};