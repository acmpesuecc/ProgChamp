import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session as {
    authenticated: boolean;
    needsProfileSetup: boolean;
    user?: {
      id: string;
      email: string;
      name: string | null;
      avatarUrl: string | null;
      userType: string;
      superlikesRemaining: number;
      profileCompletedAt: number | null;
      createdAt: number;
    };
  } | undefined;

  if (!session?.authenticated) {
    throw redirect(302, '/');
  }

  if (!session.needsProfileSetup) {
    throw redirect(302, '/');
  }

  return { user: session.user ?? null };
};

export const actions: Actions = {
  setup: async ({ request, fetch }) => {
    const formData = await request.formData();

    const name      = formData.get('name')?.toString().trim() ?? '';
    const avatarUrl = formData.get('avatarUrl')?.toString().trim() ?? '';

    if (!name) {
      return fail(400, { error: 'Display name is required.', field: 'name' });
    }
    if (name.length > 100) {
      return fail(400, { error: 'Display name must be under 100 characters.', field: 'name' });
    }

    const res = await fetch(`${API_URL}/profile/setup`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatarUrl }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return fail(res.status, { error: body?.message ?? 'Something went wrong. Please try again.' });
    }

    throw redirect(302, '/');
  },
};