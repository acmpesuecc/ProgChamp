import { error } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

export async function load({ fetch, params }) {
  const res = await fetch(`${API_URL}/admin/appeals/${params.id}`, {
    credentials: 'include',
  });

  if (!res.ok) throw error(404, 'Appeal not found');

  const { appeal } = await res.json();
  return { appeal };
}