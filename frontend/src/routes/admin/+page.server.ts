import { redirect } from '@sveltejs/kit';

const API_URL = process.env.VITE_API_URL ?? 'http://localhost:9210';
export async function load({ fetch, request }) {
  const headers = { cookie: request.headers.get('cookie') ?? '' };

  const sessionRes = await fetch(`${API_URL}/auth/session`, { headers });
  const session = sessionRes.ok ? await sessionRes.json() : null;

  if (!session?.authenticated || session?.user?.userType !== 'admin') {
    throw redirect(302, '/');
  }

  const [statsRes, requestsRes, usersRes] = await Promise.all([
    fetch(`${API_URL}/admin/stats`,                                    { headers }),
    fetch(`${API_URL}/admin/game-requests?status=pending&limit=5`,    { headers }),
    fetch(`${API_URL}/admin/users?limit=5&sort=createdAt&order=desc`, { headers }),
  ]);
  
  const statsText = await statsRes.text();
  console.log('stats status:', statsRes.status, statsText);   // <-- add this
  const stats = statsRes.ok ? JSON.parse(statsText) : { totalGames: 0, totalUsers: 0, pendingCount: 0, onlineNow: 0 };
  const { requests = [] } = requestsRes.ok ? await requestsRes.json() : {};
  const { users = [] }    = usersRes.ok    ? await usersRes.json()    : {};

  return {
    stats: {
      totalGames:   stats.totalGames   ?? 0,
      totalUsers:   stats.totalUsers   ?? 0,
      pendingCount: stats.pendingCount ?? 0,
      onlineNow:    stats.onlineNow    ?? 0,
    },
    pendingRequests: requests,
    recentUsers:     users,
  };
}
