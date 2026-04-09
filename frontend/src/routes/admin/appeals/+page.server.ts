const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

export async function load({ fetch, url }) {
  const cursor = url.searchParams.get('cursor') ?? '';
  const cursorParam = cursor ? `?cursor=${cursor}` : '';

  const res = await fetch(`${API_URL}/admin/appeals${cursorParam}`, {
    credentials: 'include',
  });

  const { appeals, nextCursor } = res.ok
    ? await res.json()
    : { appeals: [], nextCursor: null };

  return { appeals, nextCursor };
}