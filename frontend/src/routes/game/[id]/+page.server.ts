import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.d.ts';

const API = 'http://localhost:3000'; // replace with your backend base URL or env var

export const load: PageServerLoad = async ({ params, fetch, locals }) => {
  const res = await fetch(`${API}/games/${params.id}`);
    console.log('status:', res.status);
  console.log('game id:', params.id);
  
  if (res.status === 404) throw error(404, 'Game not found');
  if (!res.ok) throw error(500, 'Failed to load game');

  if (res.status === 404) throw error(404, 'Game not found');
  if (!res.ok) throw error(500, 'Failed to load game');

  const game = await res.json();

  let userReaction: 'like' | 'dislike' | null = null;
  let userSuperliked = false;

  if (locals.session?.authenticated) {
    const rRes = await fetch(`${API}/games/${params.id}/reaction`);
    if (rRes.ok) {
      const r = await rRes.json();
      userReaction = r.reaction ?? null;
      userSuperliked = r.superliked ?? false;
    }
  }
  return { game, userReaction, userSuperliked };
  
};



