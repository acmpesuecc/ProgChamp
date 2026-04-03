import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.session?.authenticated) {
    throw redirect(302, '/');
  }
};

export const actions: Actions = {
  default: async ({ request, fetch }) => {
    const formData = await request.formData();

    console.log('[action] formData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size}b)` : value);
    }

    const res = await fetch(`${API_URL}/game-requests`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    console.log('[action] backend status:', res.status);

    const data = await res.json().catch(() => ({}));
    console.log('[action] backend response:', data);

    if (!res.ok) {
      return { success: false, message: data.message ?? 'Submission failed' };
    }

    return { success: true, message: data.message, requestId: data.requestId };
  },
};
