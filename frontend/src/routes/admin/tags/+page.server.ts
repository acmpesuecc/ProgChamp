const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

export async function load({ fetch }) {
  const res = await fetch(`${API_URL}/tags`, { credentials: 'include' });
  const tags = res.ok ? await res.json() : [];
  return { tags };
}