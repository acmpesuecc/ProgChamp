import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  // If not logged in OR if the user is not an 'admin', kick them to home
  if (!locals.session?.authenticated || locals.session?.user?.userType !== 'admin') {
    throw redirect(302, '/');
  }
  
  return {
    adminUser: locals.session.user
  };
};