const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

export async function load({ fetch, url }) {
  const cursor = url.searchParams.get('cursor') ?? '';
  const status = url.searchParams.get('status') ?? '';

  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (status) params.set('status', status);

  const res = await fetch(`${API_URL}/admin/game-requests/all-games?${params.toString()}`, {
    credentials: 'include',
  });

  const { games, nextCursor } = res.ok
    ? await res.json()
    : { games: [], nextCursor: null };

  return { games, nextCursor, status };
}