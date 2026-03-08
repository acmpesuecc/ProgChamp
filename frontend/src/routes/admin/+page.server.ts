const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function load({ fetch, redirect }) {
  // Check if the current user is logged in and is an admin
  const sessionRes = await fetch(`${API_URL}/auth/session`, { credentials: 'include' });
  const session = sessionRes.ok ? await sessionRes.json() : null;

  // If not logged in or not an admin, send them back to the homepage
  if (!session?.authenticated || session?.user?.userType !== 'admin') {
    throw redirect(302, '/');
  }

  // User is confirmed admin — fetch the admin data as normal
  const [statsRes, requestsRes, usersRes] = await Promise.all([
    fetch(`${API_URL}/admin/stats`,            { credentials: 'include' }),
    fetch(`${API_URL}/admin/requests/pending`, { credentials: 'include' }),
    fetch(`${API_URL}/admin/users`,            { credentials: 'include' }),
  ]);

  const stats        = statsRes.ok    ? await statsRes.json()    : { totalGames: 0, totalUsers: 0, pendingCount: 0 };
  const { requests } = requestsRes.ok ? await requestsRes.json() : { requests: [] };
  const { users }    = usersRes.ok    ? await usersRes.json()    : { users: [] };

  return { stats, pendingRequests: requests, recentUsers: users };
}