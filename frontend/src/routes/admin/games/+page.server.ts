const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

export async function load({ fetch, url }) {
  const cursor = url.searchParams.get('cursor') ?? '';
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(`${API_URL}/admin/games?${params.toString()}`, {
    credentials: 'include',
  });

  const { games, nextCursor } = res.ok
    ? await res.json()
    : { games: [], nextCursor: null };

  return { games, nextCursor };
}