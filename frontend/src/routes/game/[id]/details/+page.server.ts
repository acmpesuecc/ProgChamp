import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.d.ts';

const API = 'http://localhost:3000';

export const load: PageServerLoad = async ({ params, request }) => {
  const res = await fetch(`${API}/games/${params.id}`, {
    headers: { cookie: request.headers.get('cookie') ?? '' },
  }).catch(() => { throw error(502, 'Could not reach game server'); });

  if (res.status === 404) throw error(404, 'Game not found');
  if (!res.ok) throw error(res.status, 'Failed to load game');

  const json = await res.json();
  if (!json?.game) throw error(404, 'Game not found');

  return { game: json.game };
};