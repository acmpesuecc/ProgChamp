const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

export async function load({ fetch, url }) {
  const cursor = url.searchParams.get('cursor') ?? '';
  const cursorParam = cursor ? `?cursor=${cursor}` : '';

  const res = await fetch(`${API_URL}/admin/game-requests${cursorParam}`, {
    credentials: 'include',
  });

  const { requests, nextCursor } = res.ok
    ? await res.json()
    : { requests: [], nextCursor: null };

  return { requests, nextCursor };
}