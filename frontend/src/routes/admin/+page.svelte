<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

  let pendingRequests = $derived(data.pendingRequests ?? []);
  let recentUsers     = $derived(data.recentUsers ?? []);
  let stats           = $derived(data.stats ?? { totalGames: 0, totalUsers: 0, pendingCount: 0 });
  let loading         = $state<string | null>(null);

  let cursorEl = $state<HTMLDivElement | null>(null);
  let dotEl    = $state<HTMLDivElement | null>(null);

  async function reviewRequest(requestId: string, status: 'approved' | 'rejected') {
    loading = requestId;
    await fetch(`${API_URL}/admin/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    loading = null;
    await invalidateAll();
  }

  async function toggleUser(userId: string, isActive: boolean) {
    loading = userId;
    await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: !isActive }),
    });
    loading = null;
    await invalidateAll();
  }

  function timeAgo(date: Date | string | null) {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    const secs = Math.floor((Date.now() - d.getTime()) / 1000);
    if (secs < 60)    return `${secs}s ago`;
    if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  }

  function initials(name: string | null) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  onMount(() => {
    let mx = 0, my = 0, cx = 0, cy = 0;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (dotEl) { dotEl.style.left = mx + 'px'; dotEl.style.top = my + 'px'; }
    };
    document.addEventListener('mousemove', onMove);
    const raf = () => {
      cx += (mx - cx) * 0.12; cy += (my - cy) * 0.12;
      if (cursorEl) { cursorEl.style.left = cx + 'px'; cursorEl.style.top = cy + 'px'; }
      requestAnimationFrame(raf);
    };
    raf();
    const addHover = (el: Element) => {
      el.addEventListener('mouseenter', () => { if (cursorEl) { cursorEl.style.transform = 'translate(-50%,-50%) scale(2)'; cursorEl.style.borderColor = 'var(--neon-pink)'; }});
      el.addEventListener('mouseleave', () => { if (cursorEl) { cursorEl.style.transform = 'translate(-50%,-50%) scale(1)'; cursorEl.style.borderColor = 'var(--neon-cyan)'; }});
    };
    document.querySelectorAll('button, a').forEach(addHover);
    return () => document.removeEventListener('mousemove', onMove);
  });
</script>

<svelte:head>
  <title>PROGCHAMP // Admin Panel</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Oxanium:wght@300;400;600;800&display=swap" rel="stylesheet" />
</svelte:head>

<div class="cursor"     bind:this={cursorEl}></div>
<div class="cursor-dot" bind:this={dotEl}></div>
<div class="grid-bg"></div>
<div class="noise"></div>

<nav>
  <a href="/" class="logo-wrap">
    <span class="logo">PROG<em>CHAMP</em></span>
    <span class="logo-sub">an @ACMpesuecc project</span>
  </a>
  <a href="/" class="nav-back">← Back to Site</a>
  <div class="nav-badge">⚙ ADMIN PANEL</div>
</nav>

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
      <div class="stat-label">Recent Users</div>
      <div class="stat-value">{recentUsers.length}</div>
      <div class="stat-sub">Shown below</div>
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
          {#each pendingRequests as req}
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
                  by @{req.submitter?.name ?? req.submitter?.email} · {timeAgo(req.createdAt)}
                </div>
              </div>
              <div class="game-actions">
                <button class="btn-sm btn-approve" disabled={loading === req.id} onclick={() => reviewRequest(req.id, 'approved')}>
                  {loading === req.id ? '...' : 'Approve'}
                </button>
                <button class="btn-sm btn-reject" disabled={loading === req.id} onclick={() => reviewRequest(req.id, 'rejected')}>
                  {loading === req.id ? '...' : 'Reject'}
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
              {#each recentUsers as user}
                <tr>
                  <td>
                    <div class="user-cell">
                      {#if user.avatarUrl}
                        <img class="user-avatar-img" src={user.avatarUrl} alt={user.name ?? ''} referrerpolicy="no-referrer" />
                      {:else}
                        <div class="user-avatar">{initials(user.name)}</div>
                      {/if}
                      <span>{user.name ?? user.email}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge {user.userType === 'admin' ? 'badge-pink' : 'badge-gray'}">{user.userType}</span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                  <td>
                    <span class="badge {user.isActive ? 'badge-green' : 'badge-pink'}">{user.isActive ? 'Active' : 'Banned'}</span>
                  </td>
                  <td>
                    <button
                      class="btn-sm {user.isActive ? 'btn-reject' : 'btn-approve'}"
                      disabled={loading === user.id}
                      onclick={() => toggleUser(user.id, user.isActive)}
                    >
                      {loading === user.id ? '...' : user.isActive ? 'Ban' : 'Restore'}
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
  :global(body) { background:var(--dark); color:var(--text); font-family:'Oxanium',sans-serif; overflow-x:hidden; cursor:none; }
  :global(body::before) { content:''; position:fixed; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px); pointer-events:none; z-index:100; }
  :root { --neon-cyan:#00fff9; --neon-pink:#ff006e; --neon-purple:#bf00ff; --neon-yellow:#ffe600; --dark:#03000a; --dark2:#0a0018; --text:#e0e0ff; }

  .cursor     { width:16px; height:16px; border:2px solid var(--neon-cyan); border-radius:50%; position:fixed; pointer-events:none; z-index:9999; transform:translate(-50%,-50%); transition:transform .12s ease,border-color .3s; mix-blend-mode:screen; }
  .cursor-dot { width:4px; height:4px; background:var(--neon-pink); border-radius:50%; position:fixed; pointer-events:none; z-index:9999; transform:translate(-50%,-50%); }
  .grid-bg { position:fixed; inset:0; background-image:linear-gradient(rgba(0,255,249,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,249,.04) 1px,transparent 1px); background-size:60px 60px; z-index:0; animation:gridPulse 8s ease-in-out infinite; }
  @keyframes gridPulse { 0%,100%{opacity:.6} 50%{opacity:1} }
  .noise { position:fixed; inset:0; opacity:.03; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size:200px 200px; pointer-events:none; z-index:1; }

  nav { position:fixed; top:0; left:0; right:0; z-index:200; display:flex; align-items:center; gap:22px; padding:14px 48px; border-bottom:1px solid rgba(0,255,249,.15); background:rgba(3,0,10,.92); backdrop-filter:blur(14px); }
  .logo-wrap { display:flex; flex-direction:column; text-decoration:none; flex-shrink:0; gap:2px; }
  .logo { font-family:'Bebas Neue',sans-serif; font-size:2.4rem; letter-spacing:.12em; color:var(--neon-cyan); text-shadow:0 0 20px var(--neon-cyan); }
  .logo em { color:var(--neon-pink); font-style:normal; text-shadow:0 0 20px var(--neon-pink); }
  .logo-sub { font-family:'Share Tech Mono',monospace; font-size:.7rem; letter-spacing:.14em; color:rgba(0,255,249,.4); }
  .nav-back { font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.15em; text-transform:uppercase; color:rgba(224,224,255,.4); text-decoration:none; transition:color .2s; }
  .nav-back:hover { color:var(--neon-cyan); }
  .nav-badge { font-family:'Share Tech Mono',monospace; font-size:.6rem; letter-spacing:.2em; background:rgba(255,0,110,.12); border:1px solid rgba(255,0,110,.4); color:var(--neon-pink); padding:5px 14px; text-transform:uppercase; margin-left:auto; }

  main { position:relative; z-index:10; padding:100px 48px 60px; }
  .page-header { margin-bottom:40px; }
  .page-eyebrow { font-family:'Share Tech Mono',monospace; font-size:.62rem; letter-spacing:.3em; text-transform:uppercase; color:var(--neon-pink); text-shadow:0 0 8px var(--neon-pink); margin-bottom:10px; }
  .page-title { font-family:'Bebas Neue',sans-serif; font-size:4rem; letter-spacing:.05em; line-height:1; }
  .page-title span { color:var(--neon-cyan); text-shadow:0 0 20px var(--neon-cyan); }

  .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:32px; }
  .stat-card { border:1px solid rgba(0,255,249,.15); background:rgba(0,255,249,.02); padding:24px 28px; position:relative; overflow:hidden; }
  .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
  .stat-card.cyan::before   { background:var(--neon-cyan);   box-shadow:0 0 12px var(--neon-cyan); }
  .stat-card.pink::before   { background:var(--neon-pink);   box-shadow:0 0 12px var(--neon-pink); }
  .stat-card.purple::before { background:var(--neon-purple); box-shadow:0 0 12px var(--neon-purple); }
  .stat-card.yellow::before { background:var(--neon-yellow); box-shadow:0 0 12px var(--neon-yellow); }
  .stat-label { font-family:'Share Tech Mono',monospace; font-size:.6rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(224,224,255,.4); margin-bottom:10px; }
  .stat-value { font-family:'Bebas Neue',sans-serif; font-size:3rem; line-height:1; letter-spacing:.05em; }
  .stat-card.cyan   .stat-value { color:var(--neon-cyan);   text-shadow:0 0 20px var(--neon-cyan); }
  .stat-card.pink   .stat-value { color:var(--neon-pink);   text-shadow:0 0 20px var(--neon-pink); }
  .stat-card.purple .stat-value { color:var(--neon-purple); text-shadow:0 0 20px var(--neon-purple); }
  .stat-card.yellow .stat-value { color:var(--neon-yellow); text-shadow:0 0 20px var(--neon-yellow); }
  .stat-sub { font-family:'Share Tech Mono',monospace; font-size:.58rem; color:rgba(224,224,255,.25); margin-top:6px; letter-spacing:.08em; }

  .grid-main { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
  .panel { border:1px solid rgba(0,255,249,.12); background:rgba(10,0,24,.6); }
  .panel-header { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid rgba(0,255,249,.08); }
  .panel-title { font-family:'Bebas Neue',sans-serif; font-size:1.3rem; letter-spacing:.1em; color:rgba(224,224,255,.8); }
  .panel-tag { font-family:'Share Tech Mono',monospace; font-size:.55rem; letter-spacing:.15em; text-transform:uppercase; color:rgba(0,255,249,.4); }
  .panel-body { padding:16px 24px; max-height:600px; overflow-y:auto; }
  .panel-body::-webkit-scrollbar { width:4px; }
  .panel-body::-webkit-scrollbar-track { background:transparent; }
  .panel-body::-webkit-scrollbar-thumb { background:rgba(0,255,249,.2); }

  .empty-state { font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.15em; color:rgba(0,255,249,.3); text-align:center; padding:40px 0; }

  .game-row { display:flex; align-items:center; gap:14px; padding:14px 0; border-bottom:1px solid rgba(255,255,255,.05); }
  .game-row:last-child { border-bottom:none; }
  .game-thumb-mini { width:48px; height:48px; background:linear-gradient(135deg,#0a0020,#2a0060); display:flex; align-items:center; justify-content:center; font-size:1.4rem; flex-shrink:0; border:1px solid rgba(191,0,255,.2); overflow:hidden; }
  .game-thumb-mini img { width:100%; height:100%; object-fit:cover; }
  .game-info-mini { flex:1; min-width:0; }
  .game-name-mini { font-family:'Bebas Neue',sans-serif; font-size:1.05rem; letter-spacing:.06em; color:rgba(224,224,255,.9); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .game-meta-mini { font-family:'Share Tech Mono',monospace; font-size:.57rem; color:rgba(224,224,255,.35); letter-spacing:.06em; margin-top:2px; }
  .game-actions { display:flex; gap:8px; flex-shrink:0; }

  table { width:100%; border-collapse:collapse; }
  th { font-family:'Share Tech Mono',monospace; font-size:.57rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(224,224,255,.3); text-align:left; padding:8px 10px; border-bottom:1px solid rgba(255,255,255,.05); }
  td { font-family:'Share Tech Mono',monospace; font-size:.63rem; padding:11px 10px; border-bottom:1px solid rgba(255,255,255,.04); color:rgba(224,224,255,.7); letter-spacing:.04em; }
  tr:hover td { background:rgba(0,255,249,.02); }

  .user-cell { display:flex; align-items:center; gap:10px; }
  .user-avatar { width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,var(--neon-purple),var(--neon-pink)); display:flex; align-items:center; justify-content:center; font-size:.7rem; font-family:'Bebas Neue',sans-serif; color:white; flex-shrink:0; }
  .user-avatar-img { width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid rgba(0,255,249,.3); flex-shrink:0; }

  .badge { display:inline-block; font-family:'Share Tech Mono',monospace; font-size:.52rem; letter-spacing:.12em; padding:3px 10px; text-transform:uppercase; }
  .badge-green { background:rgba(0,255,100,.1);    border:1px solid rgba(0,255,100,.3);    color:#00ff64; }
  .badge-pink  { background:rgba(255,0,110,.1);    border:1px solid rgba(255,0,110,.3);    color:var(--neon-pink); }
  .badge-gray  { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1);  color:rgba(224,224,255,.4); }

  .btn-sm { font-family:'Share Tech Mono',monospace; font-size:.55rem; letter-spacing:.12em; text-transform:uppercase; padding:5px 14px; cursor:none; border:none; transition:all .2s; }
  .btn-sm:disabled { opacity:.4; }
  .btn-approve { background:rgba(0,255,100,.1); color:#00ff64; border:1px solid rgba(0,255,100,.3); }
  .btn-approve:hover:not(:disabled) { background:rgba(0,255,100,.2); }
  .btn-reject  { background:rgba(255,0,110,.08); color:var(--neon-pink); border:1px solid rgba(255,0,110,.25); }
  .btn-reject:hover:not(:disabled)  { background:rgba(255,0,110,.18); }
</style>
