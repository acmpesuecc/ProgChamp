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
    // Forward the FormData directly to your Hono backend
    const formData = await request.formData();

    const res = await fetch(`${API_URL}/game-requests`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        message: data.message ?? 'Submission failed',
      };
    }

    return {
      success: true,
      message: data.message,
      requestId: data.requestId,
    };
  },
};
