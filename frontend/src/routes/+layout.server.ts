import type { LayoutServerLoad } from './$types.js';

export const load = async ({ locals }) => {
  return {
    session: locals.session,
     user: locals.user,
  };
};
