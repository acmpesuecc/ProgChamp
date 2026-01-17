import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { user } from '../../lib/stores/user.js';

export function load() {
  const currentUser = get(user);

  if (currentUser.role !== 'dev') {
    throw redirect(302, '/');
  }
}
