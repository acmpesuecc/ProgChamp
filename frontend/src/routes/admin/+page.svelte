<script lang="ts">
  import { invalidateAll } from "$app/navigation";

  let { data } = $props();

  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:9210";

  let pendingRequests = $derived(data.pendingRequests ?? []);
  let recentUsers = $derived(data.recentUsers ?? []);
  let stats = $derived(
    data.stats ?? { totalGames: 0, totalUsers: 0, pendingCount: 0 },
  );
  let loading = $state<string | null>(null);

  async function reviewRequest(
    requestId: string,
    status: "approved" | "rejected",
  ) {
    loading = requestId;
    await fetch(
      `${API_URL}/admin/game-requests/${requestId}/${status === "approved" ? "approve" : "reject"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      },
    );
    loading = null;
    await invalidateAll();
  }

  async function toggleUser(userId: string, isActive: boolean) {
    loading = userId;
    await fetch(`${API_URL}/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !isActive }),
    });
    loading = null;
    await invalidateAll();
  }

  function timeAgo(date: Date | string | null) {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    const secs = Math.floor((Date.now() - d.getTime()) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  }

  function initials(name: string | null) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
</script>

<svelte:head>
  <title>PROGCHAMP // Admin Panel</title>
</svelte:head>

<main>
  <div class="page-header">
    <div class="page-eyebrow">// SYSTEM ACCESS GRANTED</div>
    <h1 class="page-title">ADMIN <span>CONTROL</span></h1>
  </div>

  <div class="stats-row">
    <div class="stat-card cyan">
      <div class="stat-label">Total Games</div>
      <div class="stat-value">{stats.totalGames.toLocaleString()}</div>
      <div class="stat-sub">Live in vault</div>
    </div>
    <div class="stat-card pink">
      <div class="stat-label">Pending Review</div>
      <div class="stat-value">{stats.pendingCount}</div>
      <div class="stat-sub">Awaiting approval</div>
    </div>
    <div class="stat-card purple">
      <div class="stat-label">Total Users</div>
      <div class="stat-value">{stats.totalUsers.toLocaleString()}</div>
      <div class="stat-sub">Active accounts</div>
    </div>
    <div class="stat-card yellow">
      <div class="stat-label">Online Now</div>
      <div class="stat-value">{stats.onlineNow ?? 0}</div>
      <div class="stat-sub">Active sessions</div>
    </div>
  </div>

  <div class="grid-main">
    <!-- Pending game requests -->
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Pending Game Requests</div>
        <div class="panel-tag">// {pendingRequests.length} queued</div>
      </div>
      <div class="panel-body">
        {#if pendingRequests.length === 0}
          <div class="empty-state">// NO PENDING REQUESTS — ALL CLEAR</div>
        {:else}
          {#each pendingRequests.slice(0, 5) as req}
            <div class="game-row">
              <div class="game-thumb-mini">
                {#if req.coverMedia?.r2Key}
                  <img src={req.coverMedia.r2Key} alt={req.title} />
                {:else}
                  🎮
                {/if}
              </div>
              <div class="game-info-mini">
                <div class="game-name-mini">{req.title}</div>
                <div class="game-meta-mini">
                  by @{req.submitter?.name ?? req.submitter?.email} · {timeAgo(
                    req.createdAt,
                  )}
                </div>
              </div>
              <div class="game-actions">
                <button
                  class="btn-sm btn-approve"
                  disabled={loading === req.id}
                  onclick={() => reviewRequest(req.id, "approved")}
                >
                  {loading === req.id ? "..." : "Approve"}
                </button>
                <button
                  class="btn-sm btn-reject"
                  disabled={loading === req.id}
                  onclick={() => reviewRequest(req.id, "rejected")}
                >
                  {loading === req.id ? "..." : "Reject"}
                </button>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Recent users -->
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Recent Users</div>
        <div class="panel-tag">// {stats.totalUsers.toLocaleString()} total</div>
      </div>
      <div class="panel-body">
        {#if recentUsers.length === 0}
          <div class="empty-state">// NO USERS FOUND</div>
        {:else}
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {#each recentUsers.slice(0, 5) as user}
                <tr>
                  <td>
                    <div class="user-cell">
                      {#if user.avatarUrl}
                        <img
                          class="user-avatar-img"
                          src={user.avatarUrl}
                          alt={user.name ?? ""}
                          referrerpolicy="no-referrer"
                        />
                      {:else}
                        <div class="user-avatar">{initials(user.name)}</div>
                      {/if}
                      <span>{user.name ?? user.email}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      class="badge {user.userType === 'admin'
                        ? 'badge-pink'
                        : 'badge-gray'}">{user.userType}</span
                    >
                  </td>
                  <td
                    >{new Date(user.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}</td
                  >
                  <td>
                    <span
                      class="badge {user.isActive
                        ? 'badge-green'
                        : 'badge-pink'}"
                      >{user.isActive ? "Active" : "Banned"}</span
                    >
                  </td>
                  <td>
                    <button
                      class="btn-sm {user.isActive
                        ? 'btn-reject'
                        : 'btn-approve'}"
                      disabled={loading === user.id}
                      onclick={() => toggleUser(user.id, user.isActive)}
                    >
                      {loading === user.id
                        ? "..."
                        : user.isActive
                          ? "Ban"
                          : "Restore"}
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    </div>
  </div>
</main>

<style>
  .page-header {
    margin-bottom: 40px;
  }
  .page-eyebrow {
    font-family: "VT323", monospace;
    font-size: 1.12rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color:var(--gold);
    
    margin-bottom: 10px;
  }
  .page-title {
    font-family: "Press Start 2P", sans-serif;
    font-size: 4rem;
    letter-spacing: 0.05em;
    line-height: 1;
  }
  .page-title span {
    color: var(--neon-cyan);
    
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }
  .stat-card {
    border: 1px solid rgba(232,93,130,0.3);
    background: rgba(232,93,130,0.17);
    padding: 24px 28px;
    position: relative;
    overflow: hidden;
  }
  .stat-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
  }
  .stat-card.cyan::before {
    background: var(--neon-cyan);
    
  }
  .stat-card.pink::before {
    background: var(--neon-pink);
    
  }
  .stat-card.purple::before {
    background: var(--neon-purple);
    
  }
  .stat-card.yellow::before {
    background: var(--neon-yellow);
    
  }
  .stat-label {
    font-family: "VT323", monospace;
    font-size: 1.1rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(245,205,210,0.65);
    margin-bottom: 10px;
  }
  .stat-value {
    font-family: "Press Start 2P", sans-serif;
    font-size: 3rem;
    line-height: 1;
    letter-spacing: 0.05em;
  }
  .stat-card.cyan .stat-value {
    color: var(--neon-cyan);
    
  }
  .stat-card.pink .stat-value {
    color: var(--neon-pink);
    
  }
  .stat-card.purple .stat-value {
    color: var(--neon-purple);
    
  }
  .stat-card.yellow .stat-value {
    color: var(--neon-yellow);
    
  }
  .stat-sub {
    font-family: "VT323", monospace;
    font-size: 1.08rem;
    color: rgba(245,205,210,0.5);
    margin-top: 6px;
    letter-spacing: 0.08em;
  }

  .grid-main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .panel {
    border: 1px solid rgba(232,93,130,0.27);
    background: rgba(30,14,30,0.6);
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
  }
  .panel-title {
    font-family: "Press Start 2P", sans-serif;
    font-size: 1.3rem;
    letter-spacing: 0.1em;
    color: rgba(245,205,210,0.8);
  }
  .panel-tag {
    font-family: "VT323", monospace;
    font-size: 1.05rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(232,93,130,0.4);
  }
  .panel-body {
    padding: 16px 24px;
    max-height: 600px;
    overflow-y: auto;
  }
  .panel-body::-webkit-scrollbar {
    width: 4px;
  }
  .panel-body::-webkit-scrollbar-track {
    background: transparent;
  }
  .panel-body::-webkit-scrollbar-thumb {
    background: rgba(232,93,130,0.35);
  }

  .empty-state {
    font-family: "VT323", monospace;
    font-size: 1.15rem;
    letter-spacing: 0.15em;
    color: rgba(232,93,130,0.45);
    text-align: center;
    padding: 40px 0;
  }

  .game-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  .game-row:last-child {
    border-bottom: none;
  }
  .game-thumb-mini {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #1E0E1E, #341F3A);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    flex-shrink: 0;
    border: 1px solid rgba(124,77,191,0.35);
    overflow: hidden;
  }
  .game-thumb-mini img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .game-info-mini {
    flex: 1;
    min-width: 0;
  }
  .game-name-mini {
    font-family: "Press Start 2P", sans-serif;
    font-size: 1.05rem;
    letter-spacing: 0.06em;
    color: rgba(245,205,210,0.9);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .game-meta-mini {
    font-family: "VT323", monospace;
    font-size: 1.07rem;
    color: rgba(245,205,210,0.6);
    letter-spacing: 0.06em;
    margin-top: 2px;
  }
  .game-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }
  th {
    font-family: "VT323", monospace;
    font-size: 1.07rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(245,205,210,0.55);
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  td {
    font-family: "VT323", monospace;
    font-size: 1.13rem;
    padding: 11px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    color: rgba(245,205,210,0.8);
    letter-spacing: 0.04em;
  }
  tr:hover td {
    background: rgba(232,93,130,0.17);
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--neon-purple), var(--neon-pink));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-family: "Press Start 2P", sans-serif;
    color: white;
    flex-shrink: 0;
  }
  .user-avatar-img {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid rgba(232,93,130,0.45);
    flex-shrink: 0;
  }

  .badge {
    display: inline-block;
    font-family: "VT323", monospace;
    font-size: 1.02rem;
    letter-spacing: 0.12em;
    padding: 3px 10px;
    text-transform: uppercase;
  }
  .badge-green {
    background: rgba(143,191,139,0.1);
    border: 1px solid rgba(143,191,139,0.3);
    color: #8FBF8B;
  }
  .badge-pink {
    background: rgba(124,77,191,0.25);
    border: 1px solid rgba(124,77,191,0.45);
    color: var(--neon-pink);
  }
  .badge-gray {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(245,205,210,0.65);
  }

  .btn-sm {
    font-family: "VT323", monospace;
    font-size: 1.05rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 5px 14px;
    cursor: var(--cursor-pointer);
    border: none;
    transition: all 0.2s;
  }
  .btn-sm:disabled {
    opacity: 0.4;
  }
  .btn-approve {
    background: rgba(143,191,139,0.1);
    color: #8FBF8B;
    border: 1px solid rgba(143,191,139,0.3);
  }
  .btn-approve:hover:not(:disabled) {
    background: rgba(143,191,139,0.2);
  }
  .btn-reject {
    background: rgba(124,77,191,0.23);
    color: var(--neon-pink);
    border: 1px solid rgba(124,77,191,0.4);
  }
  .btn-reject:hover:not(:disabled) {
    background: rgba(124,77,191,0.33);
  }
</style>
