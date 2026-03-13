import { games } from '$lib/data/games.js';
import type { PageLoad } from './$types.js';
import {error} from '@sveltejs/kit';

export const load: PageLoad = ({ params }) => {
  const game = games.find(g => g.id === params.id);

  if (!game) {
    throw error(404, 'Game not found')
  }

  return { game };
};
