import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.session?.authenticated) {
    throw redirect(302, '/');
  }

  return {
    user: locals.session.user ?? null,
  };
};