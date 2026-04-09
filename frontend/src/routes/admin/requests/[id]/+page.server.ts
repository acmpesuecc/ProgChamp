import { error } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

export async function load({ fetch, params }) {
  const res = await fetch(`${API_URL}/admin/game-requests/${params.id}`, {
    credentials: 'include',
  });

  if (!res.ok) throw error(404, 'Request not found');

  const { request } = await res.json();
  return { request };
}