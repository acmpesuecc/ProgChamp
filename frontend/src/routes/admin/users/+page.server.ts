const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

export async function load({ fetch, url }) {
  const cursor = url.searchParams.get('cursor') ?? '';
  const isActive = url.searchParams.get('isActive') ?? 'true';
  const search = url.searchParams.get('search') ?? '';

  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (isActive) params.set('isActive', isActive);
  if (search) params.set('search', search);

  const res = await fetch(`${API_URL}/admin/users?${params.toString()}`, {
    credentials: 'include',
  });

  const { users, nextCursor } = res.ok
    ? await res.json()
    : { users: [], nextCursor: null };

  return { users, nextCursor, isActive, search };
}