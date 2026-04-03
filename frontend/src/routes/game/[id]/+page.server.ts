import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.d.ts';

const API = 'http://localhost:3000';

export const load: PageServerLoad = async ({ params, request }) => {
  let res: Response;

  try {
    res = await fetch(`${API}/games/${params.id}`, {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
    });
  } catch (e) {
    console.error('[game load] fetch failed:', e);
    throw error(502, 'Could not reach game server');
  }

  if (!res.ok) {
    console.error('[game load] bad response:', res.status, await res.text());
    throw error(res.status, 'Game not found');
  }

  const json = await res.json();
  const gameUrl = json?.game?.gameUrl ?? json?.gameUrl;

  console.log('[game load] gameUrl:', gameUrl);

  if (!gameUrl) {
    throw error(404, 'Game URL not available');
  }

  throw redirect(302, gameUrl);
};
