<script lang="ts">
  import { goto } from '$app/navigation';
  import Navbar     from '$lib/components/Navbar.svelte';
  import Footer     from '$lib/components/Footer.svelte';

  let { data } = $props();

  let user      = $derived(data.user);
  let isAdmin   = $derived(user?.userType === 'admin');
  let isLoggedIn = true; // guarded by server load

  function memberSince(ts: number | string | null): string {
    if (!ts) return '—';
    const d = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function initials(name: string | null): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
</script>

<svelte:head>
  <title>{user?.name ?? 'Profile'} // PROGCHAMP</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Pixelify+Sans:wght@400;500;600;700&family=Caveat:wght@500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<Navbar
  {isLoggedIn}
  {isAdmin}
  avatarUrl={user?.avatarUrl ?? ''}
  userName={user?.name ?? ''}
  onLoginClick={() => {}}
/>

<div class="profile-page">

  <!-- ── HEADER BANNER ── -->
  <div class="banner">
    <div class="banner-inner">
      <div class="banner-eyebrow">// PLAYER PROFILE</div>
      <div class="banner-avatar-wrap">
        {#if user?.avatarUrl}
          <img class="banner-avatar" src={user.avatarUrl} alt={user.name ?? ''} referrerpolicy="no-referrer" />
        {:else}
          <div class="banner-avatar-fallback">{initials(user?.name ?? null)}</div>
        {/if}
        <div class="avatar-ring"></div>
        {#if isAdmin}
          <div class="admin-crown" title="Admin">⚙</div>
        {/if}
      </div>
      <h1 class="banner-name">{user?.name ?? '—'}</h1>
      <div class="banner-email">{user?.email ?? ''}</div>
      <div class="banner-badges">
        <span class="badge badge-cyan">🎮 Player</span>
        <span class="badge badge-pink">⚙ Developer</span>
        {#if isAdmin}
          <span class="badge badge-yellow">★ Admin</span>
        {/if}
      </div>
    </div>
  </div>

  <!-- ── MAIN CONTENT ── -->
  <div class="content">

    <!-- LEFT: Stats -->
    <div class="left-col">

      <!-- Identity card -->
      <div class="card">
        <div class="card-eyebrow">// IDENTITY</div>
        <div class="stat-rows">
          <div class="stat-row">
            <span class="stat-key">Display Name</span>
            <span class="stat-val">{user?.name ?? '—'}</span>
          </div>
          <div class="stat-row">
            <span class="stat-key">Email</span>
            <span class="stat-val email-val">{user?.email ?? '—'}</span>
          </div>
          <div class="stat-row">
            <span class="stat-key">Account Type</span>
            <span class="stat-val {isAdmin ? 'val-yellow' : 'val-cyan'}">{isAdmin ? 'ADMIN' : 'NORMAL'}</span>
          </div>
          <div class="stat-row">
            <span class="stat-key">Member Since</span>
            <span class="stat-val">{memberSince(user?.createdAt ?? null)}</span>
          </div>
        </div>
      </div>

      <!-- Superlikes card -->
      <div class="card card-superlike">
        <div class="card-eyebrow">// SUPERLIKE TOKENS</div>
        <div class="superlike-display">
          <div class="superlike-count">{user?.superlikesRemaining ?? 0}</div>
          <div class="superlike-label">remaining</div>
        </div>
        <div class="superlike-pips">
          {#each Array(3) as _, i}
            <div class="pip {i < (user?.superlikesRemaining ?? 0) ? 'pip-on' : 'pip-off'}">⚡</div>
          {/each}
        </div>
        <p class="superlike-hint">// Superlikes boost a game's score by 3×. They refill periodically.</p>
      </div>

    </div>

    <!-- RIGHT: Actions -->
    <div class="right-col">

      <!-- Quick links -->
      <div class="card">
        <div class="card-eyebrow">// QUICK ACCESS</div>
        <div class="action-list">
          <a href="/my-games" class="action-item">
            <span class="action-icon">◈</span>
            <div class="action-body">
              <div class="action-title">My Submissions</div>
              <div class="action-sub">View your uploaded games and their status</div>
            </div>
            <span class="action-arrow">→</span>
          </a>
          <a href="/upload" class="action-item">
            <span class="action-icon">⊞</span>
            <div class="action-body">
              <div class="action-title">Upload a Game</div>
              <div class="action-sub">Submit a new game for review</div>
            </div>
            <span class="action-arrow">→</span>
          </a>
          <a href="/all-games" class="action-item">
            <span class="action-icon">⬡</span>
            <div class="action-body">
              <div class="action-title">Browse the Vault</div>
              <div class="action-sub">Explore all games in the library</div>
            </div>
            <span class="action-arrow">→</span>
          </a>
          {#if isAdmin}
            <a href="/admin" class="action-item action-item--admin">
              <span class="action-icon">⚙</span>
              <div class="action-body">
                <div class="action-title">Admin Dashboard</div>
                <div class="action-sub">Manage games, users and requests</div>
              </div>
              <span class="action-arrow">→</span>
            </a>
          {/if}
        </div>
      </div>

      <!-- Request admin access — disabled/coming soon -->
      <div class="card card-locked">
        <div class="card-eyebrow">// ACCESS ESCALATION</div>
        <div class="locked-inner">
          <div class="locked-icon">🔒</div>
          <div class="locked-body">
            <div class="locked-title">Request Admin Access</div>
            <div class="locked-sub">
              Submit a request to become a platform admin. Existing admins will review your application.
            </div>
          </div>
        </div>
        <button class="btn-locked" disabled>
          <span>COMING SOON</span>
          <span class="btn-tag">// NOT YET AVAILABLE</span>
        </button>
      </div>

    </div>
  </div>
</div>

<Footer {isAdmin} />

<style>
  .profile-page {
    position: relative; z-index: 10;
    min-height: 100vh;
    padding-bottom: 80px;
  }

  /* ── BANNER ── */
  .banner {
    position: relative; overflow: hidden;
    padding: 120px 60px 60px;
    text-align: center;
  }

  .banner-inner { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 16px; }

  .banner-eyebrow {
    font-family: 'VT323', monospace;
    font-size: 1.12rem; letter-spacing: .35em; text-transform: uppercase;
    color:var(--gold); 
  }

  .banner-avatar-wrap { position: relative; width: 96px; height: 96px; margin: 8px 0; }
  .banner-avatar {
    width: 100%; height: 100%; border-radius: 50%;
    object-fit: cover; border: 2px solid rgba(232,93,130,0.45);
  }
  .banner-avatar-fallback {
    width: 100%; height: 100%; border-radius: 50%;
    background: linear-gradient(135deg, var(--neon-purple), var(--neon-pink));
    display: flex; align-items: center; justify-content: center;
    font-family: 'Press Start 2P', sans-serif; font-size: 2.4rem; color: white;
    border: 2px solid rgba(232,93,130,0.45);
  }
  .avatar-ring {
    position: absolute; inset: -4px; border-radius: 50%;
    border: 1px solid rgba(232,93,130,0.4); pointer-events: none;
    animation: ringPulse 3s ease-in-out infinite;
  }
  @keyframes ringPulse {
    0%, 100% {  }
    50%       {  }
  }
  .admin-crown {
    position: absolute; bottom: -2px; right: -2px;
    width: 24px; height: 24px; border-radius: 50%;
    background: rgba(240,137,158,0.3); border: 1px solid rgba(240,137,158,0.5);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem; color: var(--neon-yellow);
    
  }

  .banner-name {
    font-family: 'Press Start 2P', sans-serif;
    font-size: clamp(2.5rem, 5vw, 4rem); letter-spacing: .06em; line-height: 1; margin: 0;
  }
  .banner-email {
    font-family: 'VT323', monospace;
    font-size: 1.18rem; letter-spacing: .1em; color: rgba(245,205,210,0.55);
  }
  .banner-badges { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
  .badge {
    font-family: 'VT323', monospace;
    font-size: 1.05rem; letter-spacing: .15em; text-transform: uppercase;
    padding: 5px 14px; pointer-events: none;
  }
  .badge-cyan   { background: rgba(232,93,130,0.21);   border: 1px solid rgba(232,93,130,0.35);   color: var(--neon-cyan); }
  .badge-pink   { background: rgba(124,77,191,0.21);   border: 1px solid rgba(124,77,191,0.35);   color: var(--neon-pink); }
  .badge-yellow { background: rgba(240,137,158,0.21);   border: 1px solid rgba(240,137,158,0.4);  color: var(--neon-yellow);  }

  /* ── CONTENT GRID ── */
  .content {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 24px;
    max-width: 1100px;
    margin: 40px auto 0;
    padding: 0 60px;
  }

  .left-col, .right-col { display: flex; flex-direction: column; gap: 20px; }

  /* ── CARDS ── */
  .card {
    background: rgba(30,14,30,.6);
    border: 1px solid rgba(232,93,130,0.25);
    padding: 28px 32px;
    display: flex; flex-direction: column; gap: 20px;
    backdrop-filter: blur(8px);
  }
  .card-eyebrow {
    font-family: 'VT323', monospace;
    font-size: 1.08rem; letter-spacing: .28em; text-transform: uppercase;
    color:rgba(232,93,130,0.45);
  }

  /* Stat rows */
  .stat-rows { display: flex; flex-direction: column; gap: 0; }
  .stat-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,.04);
  }
  .stat-row:last-child { border-bottom: none; }
  .stat-key {
    font-family: 'VT323', monospace;
    font-size: 1.12rem; letter-spacing: .12em; color: rgba(245,205,210,0.55);
  }
  .stat-val {
    font-family: 'VT323', monospace;
    font-size: 1.2rem; letter-spacing: .08em; color: rgba(245,205,210,0.8);
  }
  .email-val { font-size: 1.1rem; color: rgba(245,205,210,0.75); }
  .val-cyan   { color: var(--neon-cyan);    }
  .val-yellow { color: var(--neon-yellow);  }

  /* Superlike card */
  .card-superlike { border-color: rgba(240,137,158,0.27); background: rgba(240,137,158,0.17); }
  .superlike-display { display: flex; align-items: baseline; gap: 10px; }
  .superlike-count {
    font-family: 'Press Start 2P', sans-serif; font-size: 2.6rem; line-height: 1;
    color: var(--neon-yellow); 
  }
  .superlike-label {
    font-family: 'VT323', monospace;
    font-size: 1.15rem; letter-spacing: .15em; color: rgba(240,137,158,0.5);
  }
  .superlike-pips { display: flex; gap: 8px; }
  .pip { font-size: 1.4rem; transition: opacity .2s; }
  .pip-on  { opacity: 1; filter: ); }
  .pip-off { opacity: .15; filter: grayscale(1); }
  .superlike-hint {
    font-family: 'VT323', monospace;
    font-size: 1.07rem; letter-spacing: .08em; line-height: 1.6;
    color: rgba(245,205,210,0.47); margin: 0;
  }

  /* Action list */
  .action-list { display: flex; flex-direction: column; gap: 4px; }
  .action-item {
    display: flex; align-items: center; gap: 16px;
    padding: 14px 16px; text-decoration: none; color: var(--text);
    border: 1px solid rgba(255,255,255,.05);
    background: rgba(255,255,255,.02);
    transition: border-color .25s, background .25s, transform .2s;
    cursor: var(--cursor-pointer);
  }
  .action-item:hover {
    border-color: rgba(232,93,130,0.35);
    background: rgba(232,93,130,0.19);
    transform: translateX(4px);
  }
  .action-item--admin:hover {
    border-color: rgba(124,77,191,0.35);
    background: rgba(124,77,191,0.19);
  }
  .action-icon {
    font-size: 1.2rem; color: rgba(232,93,130,0.5);
    flex-shrink: 0; width: 24px; text-align: center;
  }
  .action-item--admin .action-icon { color: rgba(124,77,191,0.5); }
  .action-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .action-title {
    font-family: 'VT323', monospace;
    font-size: 1.2rem; letter-spacing: .1em; color: rgba(245,205,210,0.8);
  }
  .action-sub {
    font-family: 'VT323', monospace;
    font-size: 1.06rem; letter-spacing: .06em; color: rgba(245,205,210,0.55);
  }
  .action-arrow {
    font-size: 1.3rem; color: rgba(232,93,130,0.45);
    transition: color .2s, transform .2s; flex-shrink: 0;
  }
  .action-item:hover .action-arrow { color: var(--neon-cyan); transform: translateX(3px); }
  .action-item--admin:hover .action-arrow { color: var(--neon-pink); }

  /* Locked card */
  .card-locked {
    border-color: rgba(255,255,255,.06);
    background: rgba(255,255,255,.01);
    opacity: .7;
  }
  .locked-inner { display: flex; align-items: flex-start; gap: 16px; }
  .locked-icon { font-size: 1.8rem; flex-shrink: 0; opacity: .4; }
  .locked-body { display: flex; flex-direction: column; gap: 6px; }
  .locked-title {
    font-family: 'VT323', monospace;
    font-size: 1.22rem; letter-spacing: .12em; color: rgba(245,205,210,0.75);
  }
  .locked-sub {
    font-family: 'VT323', monospace;
    font-size: 1.1rem; letter-spacing: .05em; line-height: 1.7;
    color: rgba(245,205,210,0.5);
  }
  .btn-locked {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; padding: 12px 18px;
    background: transparent; border: 1px solid rgba(255,255,255,.08);
    color: rgba(245,205,210,0.45);
    font-family: 'VT323', monospace;
    font-size: 1.12rem; letter-spacing: .18em; text-transform: uppercase;
    cursor: not-allowed;
  }
  .btn-tag {
    font-size: 1.02rem; letter-spacing: .12em; color: rgba(245,205,210,0.4);
  }

  @media (max-width: 900px) {
    .content { grid-template-columns: 1fr; padding: 0 24px; }
    .banner { padding: 100px 24px 40px; }
  }
</style>