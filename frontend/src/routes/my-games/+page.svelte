<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import Navbar     from '$lib/components/Navbar.svelte';
  import Footer     from '$lib/components/Footer.svelte';
  import LoginModal from '$lib/components/LoginModal.svelte';

  // AUTH
  let session    = $derived(page.data.session);
  let user       = $derived(session?.user);
  let isLoggedIn = $derived(session?.authenticated ?? false);
  let isAdmin    = $derived(user?.userType === 'admin');
  let { data } = $props();

  // LOGIN MODAL STATE
  let showLogin = $state(false);

  function goTo(path: string, requiresAuth = false) {
    if (requiresAuth && !isLoggedIn) showLogin = true;
    else goto(path);
  }

  // REQUESTS STATE
  let requests   = $state(data.requests ?? []);
  let nextCursor = $state(data.nextCursor ?? null);
  let loading    = $state(false);

  async function loadMore() {
    if (!nextCursor || loading) return;
    loading = true;
    try {
      const res = await fetch(`/api/game-requests/my?limit=20&cursor=${encodeURIComponent(nextCursor)}`);
      if (res.ok) {
        const d = await res.json();
        requests   = [...requests, ...(d.requests ?? [])];
        nextCursor = d.nextCursor ?? null;
      }
    } finally {
      loading = false;
    }
  }

  // map backend request to display shape
  function mapRequest(r: any) {
    return {
      id:            r.id,
      title:         r.title,
      description:   r.description ?? '',
      genre:         (r.tags ?? []).map((t: any) => t.tag?.name).filter(Boolean).join(' · ') || 'Uncategorised',
      url:           r.gameUrl,
      gameId:        r.game?.id ?? null,
      gameActive:    r.game?.isActive ?? false,
      status:        r.status,
      adminResponse: r.adminResponse ?? null,
      thumbnail:     null, // R2 signed URLs not wired yet
    };
  }
  
  let mappedRequests = $derived(requests.map(mapRequest));
  
  // An approved request whose game was deleted has no linked game, so it's hidden
  let visibleRequests = $derived(mappedRequests.filter((r: any) => r.status !== 'approved' || r.gameId));
  let pending     = $derived(visibleRequests.filter((r: any) => r.status === 'pending'));
  let approved    = $derived(visibleRequests.filter((r: any) => r.status === 'approved' && r.gameActive));
  let deactivated = $derived(visibleRequests.filter((r: any) => r.status === 'approved' && !r.gameActive));
  let rejected    = $derived(visibleRequests.filter((r: any) => r.status === 'rejected'));

  const statusConfig: Record<string, { label: string; color: string; glow: string; icon: string; border: string; bg: string }> = {
    pending:  { label: 'AWAITING REVIEW', color: 'var(--neon-yellow)', glow: 'rgba(240,137,158,0.45)',  icon: '◌', border: 'rgba(240,137,158,0.4)',  bg: 'rgba(240,137,158,0.19)' },
    approved: { label: 'LIVE',            color: 'var(--neon-cyan)',   glow: 'rgba(232,93,130,0.45)',  icon: '◉', border: 'rgba(232,93,130,0.4)',  bg: 'rgba(232,93,130,0.19)' },
    rejected: { label: 'REJECTED',        color: 'var(--neon-pink)',   glow: 'rgba(124,77,191,0.45)',  icon: '✕', border: 'rgba(124,77,191,0.4)',  bg: 'rgba(124,77,191,0.19)' },
    deactivated: { label: 'DEACTIVATED', color: 'var(--neon-purple)', glow: 'rgba(124,77,191,0.45)', icon: '◍', border: 'rgba(124,77,191,0.4)', bg: 'rgba(124,77,191,0.19)' },
  };
</script>

<svelte:head>
  <title>MY GAMES // PROGCHAMP</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Pixelify+Sans:wght@400;500;600;700&family=Caveat:wght@500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<!-- NAV -->
<Navbar
  {isLoggedIn}
  {isAdmin}
  avatarUrl={user?.avatarUrl}
  userName={user?.name}
  onLoginClick={() => (showLogin = true)}
/>

<!-- HEADER -->
<header class="page-header">
  <div class="header-inner">
    <div class="header-eyebrow">// DEVELOPER DASHBOARD</div>
    <h1 class="header-title">MY <span>GAMES</span></h1>
    <p class="header-sub">
      {#if isLoggedIn}
        {mappedRequests.length} submission{mappedRequests.length !== 1 ? 's' : ''} · {approved.length} live · {pending.length} under review
      {:else}
        Log in to view your submitted games.
      {/if}
    </p>
  </div>
</header>

<!-- CONTENT -->
<main class="page-main">
  {#if !isLoggedIn}
    <div class="empty-state">
      <div class="empty-icon">⬡</div>
      <div class="empty-title">ACCESS DENIED</div>
      <div class="empty-sub">You need to be logged in to view your games.</div>
      <button class="btn-cta" onclick={() => showLogin = true}>LOGIN TO CONTINUE</button>
    </div>

  {:else if mappedRequests.length === 0}
    <div class="empty-state">
      <div class="empty-icon">◌</div>
      <div class="empty-title">NO SUBMISSIONS YET</div>
      <div class="empty-sub">You haven't uploaded any games. Ready to publish?</div>
      <a href="/upload" class="btn-cta">UPLOAD YOUR FIRST GAME ↗</a>
    </div>

  {:else}
    {#if pending.length > 0}
      <section class="game-section">
        <div class="section-header">
          <div class="section-eyebrow">// AWAITING ADMIN REVIEW</div>
          <h2 class="section-title">UNDER <span class="yellow">REVIEW</span></h2>
          <p class="section-sub">These games have been submitted and are waiting for approval.</p>
        </div>
        <div class="games-list">
          {#each pending as s}
            {@const cfg = statusConfig.pending}
            <div class="game-card" style="border-color:{cfg.border};background:{cfg.bg}">
              <div class="card-thumb">
                {#if s.thumbUrl}
                  <img src={s.thumbUrl} alt={s.title} class="thumb-img" />
                {:else}
                  <div class="thumb-placeholder"><span class="thumb-icon">◌</span></div>
                {/if}
                <div class="status-badge" style="color:{cfg.color};border-color:{cfg.border};background:{cfg.bg}">
                  <span class="status-icon">{cfg.icon}</span> {cfg.label}
                </div>
              </div>
              <div class="card-body">
                <div class="card-genre">{(s.genre ?? 'Uncategorised').toUpperCase()}</div>
                <div class="card-title">{s.title}</div>
                <div class="card-meta"><span class="card-url">↗ {s.url}</span></div>
                <p class="card-desc">{s.description}</p>
                <div class="card-notice" style="border-color:{cfg.border};color:{cfg.color}">◌ &nbsp;Submission is in queue.</div>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if approved.length > 0}
      <section class="game-section">
        <div class="section-header">
          <div class="section-eyebrow">// PUBLISHED</div>
          <h2 class="section-title">LIVE <span class="cyan">GAMES</span></h2>
          <p class="section-sub">These are live in the Vault and available to all players.</p>
        </div>
        <div class="games-list">
          {#each approved as s}
            {@const cfg = statusConfig.approved}
            <div
              class="game-card game-card--clickable"
              role="link"
              tabindex="0"
              style="border-color:{cfg.border};background:{cfg.bg}"
              onclick={() => goto(`/game/${s.gameId}/details`)}
              onkeydown={(e) => e.target === e.currentTarget && e.key === 'Enter' && goto(`/game/${s.gameId}/details`)}
            >
              <div class="card-thumb">
                {#if s.thumbUrl}
                  <img src={s.thumbUrl} alt={s.title} class="thumb-img" />
                {:else}
                  <div class="thumb-placeholder"><span class="thumb-icon" style="color:var(--neon-cyan)">◉</span></div>
                {/if}
                <div class="status-badge" style="color:{cfg.color};border-color:{cfg.border};background:{cfg.bg}">
                  <span class="status-icon">{cfg.icon}</span> {cfg.label}
                </div>
              </div>
              <div class="card-body">
                <div class="card-genre">{(s.genre ?? 'Uncategorised').toUpperCase()}</div>
                <div class="card-title">{s.title}</div>
                <div class="card-meta">
                  <a href="/game/{s.gameId}" class="card-url card-url--link" onclick={(e) => e.stopPropagation()}>↗ VIEW IN VAULT</a>
                </div>
                <p class="card-desc">{s.description}</p>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if deactivated.length > 0}
      <section class="game-section">
        <div class="section-header">
          <div class="section-eyebrow">// HIDDEN</div>
          <h2 class="section-title">DEACTIVATED <span class="pink">GAMES</span></h2>
          <p class="section-sub">These were approved but have been deactivated by an admin, so players can't see them.</p>
        </div>
        <div class="games-list">
          {#each deactivated as s}
            {@const cfg = statusConfig.deactivated}
            <div class="game-card" style="border-color:{cfg.border};background:{cfg.bg}">
              <div class="card-thumb">
                <div class="thumb-placeholder"><span class="thumb-icon" style="color:var(--neon-purple)">◍</span></div>
                <div class="status-badge" style="color:{cfg.color};border-color:{cfg.border};background:{cfg.bg}">
                  <span class="status-icon">{cfg.icon}</span> {cfg.label}
                </div>
              </div>
              <div class="card-body">
                <div class="card-genre">{(s.genre ?? 'Uncategorised').toUpperCase()}</div>
                <div class="card-title">{s.title}</div>
                <p class="card-desc">{s.description}</p>
                <div class="card-notice" style="border-color:{cfg.border};color:{cfg.color}">◍ &nbsp;Hidden from the Vault.</div>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    {#if rejected.length > 0}
      <section class="game-section">
        <div class="section-header">
          <div class="section-eyebrow">// NOT APPROVED</div>
          <h2 class="section-title">REJECTED <span class="pink">SUBMISSIONS</span></h2>
          <p class="section-sub">These submissions were not approved. Review the feedback below and resubmit if you've made changes.</p>
        </div>
        <div class="games-list">
          {#each rejected as s}
            {@const cfg = statusConfig.rejected}
            <div class="game-card" style="border-color:{cfg.border};background:{cfg.bg}">
              <div class="card-thumb">
                {#if s.thumbUrl}
                  <img src={s.thumbUrl} alt={s.title} class="thumb-img" />
                {:else}
                  <div class="thumb-placeholder"><span class="thumb-icon" style="color:var(--neon-pink)">✕</span></div>
                {/if}
                <div class="status-badge" style="color:{cfg.color};border-color:{cfg.border};background:{cfg.bg}">
                  <span class="status-icon">{cfg.icon}</span> {cfg.label}
                </div>
              </div>
              <div class="card-body">
                <div class="card-genre">{(s.genre ?? 'Uncategorised').toUpperCase()}</div>
                <div class="card-title">{s.title}</div>
                <p class="card-desc">{s.description}</p>
                <div class="card-notice" style="border-color:{cfg.border};color:{cfg.color}">
                  ✕ &nbsp;{s.adminResponse ?? 'This submission did not meet our content guidelines.'}
                </div>
                <a href="/upload" class="btn-resubmit">RESUBMIT ↗</a>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}
    
    {#if nextCursor}
      <div class="load-more-wrap">
        <button class="load-more-btn" onclick={loadMore} disabled={loading}>
          {loading ? 'LOADING...' : 'LOAD MORE'}
        </button>
      </div>
    {/if}

    <div class="upload-cta">
      <div class="upload-cta-inner">
        <div>
          <div class="cta-eyebrow">// GOT MORE?</div>
          <div class="cta-title">PUBLISH ANOTHER <span>GAME</span></div>
        </div>
        <a href="/upload" class="btn-upload">UPLOAD ↗</a>
      </div>
    </div>
  {/if}
</main>

<!-- FOOTER -->
<Footer {isAdmin} />

<!-- LOGIN MODAL -->
<LoginModal open={showLogin} onClose={() => (showLogin = false)} />

<style>
  .page-header{position:relative;z-index:10;padding:140px 60px 60px;border-bottom:1px solid rgba(124,77,191,0.23);overflow:hidden;}
  .header-inner{position:relative;z-index:2;max-width:800px;margin:0 auto;text-align:center;}
  .header-eyebrow{font-family:'VT323',monospace;font-size:1.3rem;letter-spacing:.35em;text-transform:uppercase;color:var(--gold);margin-bottom:16px;}
  .header-title{font-family:'Press Start 2P',sans-serif;font-size:clamp(1.8rem,4.5vw,3.4rem);letter-spacing:.04em;line-height:.95;margin-bottom:20px;}
  .header-title span{color:var(--neon-pink);}
  .header-sub{font-family:'VT323',monospace;font-size:1.28rem;color:rgba(245,205,210,0.65);letter-spacing:.08em;line-height:1.8;margin:0 auto;max-width:500px;}

  .page-main{position:relative;z-index:10;padding:60px;max-width:1100px;margin:0 auto;}

  .empty-state{text-align:center;padding:100px 20px;display:flex;flex-direction:column;align-items:center;gap:16px;}
  .empty-icon{font-size:4rem;color:rgba(232,93,130,0.3);}
  .empty-title{font-family:'Press Start 2P',sans-serif;font-size:2.5rem;letter-spacing:.1em;color:rgba(245,205,210,0.55);}
  .empty-sub{font-family:'VT323',monospace;font-size:1.4rem;letter-spacing:.1em;color:rgba(245,205,210,0.45);margin-bottom:8px;}
  .btn-cta{font-family:'VT323',monospace;font-size:1.4rem;letter-spacing:.2em;text-transform:uppercase;background:transparent;color:var(--neon-cyan);border:1px solid var(--neon-cyan);padding:14px 32px;cursor: var(--cursor-pointer);transition:all .3s;text-decoration:none;display:inline-block;border-radius: 10px;margin-top:8px;}
  .btn-cta:hover{background:rgba(232,93,130,0.23);}

  .game-section{margin-bottom:60px;}
  .section-header{margin-bottom:28px;}
  .section-eyebrow{font-family:'VT323',monospace;font-size:1.1rem;letter-spacing:.3em;text-transform:uppercase;color:rgba(245,205,210,0.6);margin-bottom:8px;}
  .section-title{font-family:'Press Start 2P',sans-serif;font-size:2.4rem;letter-spacing:.05em;margin-bottom:8px;}
  .section-title .cyan{color:var(--neon-cyan);}
  .section-title .yellow{color:var(--neon-yellow);}
  .section-title .pink{color:var(--neon-pink);}
  .section-sub{font-family:'VT323',monospace;font-size:1.18rem;letter-spacing:.06em;color:rgba(245,205,210,0.55);line-height:1.7;max-width:600px;}

  .games-list{display:flex;flex-direction:column;gap:16px;}
  .game-card{display:grid;grid-template-columns:220px 1fr;border:1px solid;overflow:hidden;border-radius: 10px;transition:transform .3s,box-shadow .3s;}
  .game-card:hover{transform:translateY(-2px);box-shadow: 0 8px 40px rgba(0,0,0,.4);}
  .card-thumb{position:relative;aspect-ratio:16/9;overflow:hidden;}
  .thumb-img{width:100%;height:100%;object-fit:cover;}
  .thumb-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(30,14,30,.8);}
  .thumb-icon{font-size:2.5rem;opacity:.5;}
  .status-badge{position:absolute;bottom:10px;left:10px;font-family:'VT323',monospace;font-size:1.05rem;letter-spacing:.15em;text-transform:uppercase;border:1px solid;padding:4px 10px;display:flex;align-items:center;gap:6px;backdrop-filter: blur(4px);border-radius: 10px;}
  .status-icon{font-size:1.3rem;}
  .card-body{padding:20px 24px;display:flex;flex-direction:column;gap:8px;}
  .card-genre{font-family:'VT323',monospace;font-size:1.05rem;letter-spacing:.2em;color:var(--neon-purple);}
  .card-title{font-family:'Press Start 2P',sans-serif;font-size:1.8rem;letter-spacing:.05em;line-height:1;}
  .card-meta{display:flex;align-items:center;gap:16px;}
  .card-url{font-family:'VT323',monospace;font-size:1.12rem;letter-spacing:.08em;color:rgba(245,205,210,0.55);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:300px;}
  .card-url--link{color:var(--neon-cyan);transition:text-shadow .2s;}
  .card-url--link:hover{}
  .card-desc{font-family:'VT323',monospace;font-size:1.3rem;letter-spacing:.04em;color:rgba(245,205,210,0.55);line-height:1.7;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-clamp:2;overflow:hidden;}
  .card-notice{font-family:'VT323',monospace;font-size:1.12rem;letter-spacing:.1em;line-height:1.6;border-left:2px solid;padding:8px 12px;margin-top:4px;background:rgba(0,0,0,.2);}
  .btn-resubmit{font-family:'VT323',monospace;font-size:1.3rem;letter-spacing:.2em;text-transform:uppercase;background:transparent;color:var(--neon-pink);border:1px solid rgba(124,77,191,0.4);padding:8px 20px;cursor: var(--cursor-pointer);transition:all .3s;text-decoration:none;display:inline-block;border-radius: 10px;margin-top:4px;align-self:flex-start;}
  .btn-resubmit:hover{background:rgba(124,77,191,0.23);}

  .upload-cta{margin-top:40px;}
  .upload-cta-inner{display:flex;align-items:center;justify-content:space-between;gap:40px;border:1px solid rgba(240,137,158,0.35);padding:40px 50px;background:rgba(240,137,158,0.17);border-radius: 10px;}
  .cta-eyebrow{font-family:'VT323',monospace;font-size:1.1rem;letter-spacing:.3em;text-transform:uppercase;color:var(--neon-yellow);margin-bottom:8px;}
  .cta-title{font-family:'Press Start 2P',sans-serif;font-size:2rem;letter-spacing:.05em;}
  .cta-title span{color:var(--neon-yellow);}
  .btn-upload{font-family:'VT323',monospace;font-size:1.4rem;letter-spacing:.15em;text-transform:uppercase;background:transparent;color:var(--neon-yellow);border:1px solid var(--neon-yellow);padding:16px 36px;cursor: var(--cursor-pointer);transition:all .3s;flex-shrink:0;text-decoration:none;display:inline-block;border-radius: 10px;}
  .btn-upload:hover{background:rgba(240,137,158,0.23);transform:translateY(-2px);}
  .load-more-wrap{display:flex;justify-content:center;margin-bottom:40px;}
  .load-more-btn{font-family:'VT323',monospace;font-size:1.2rem;letter-spacing:.2em;color:var(--neon-cyan);border:1px solid rgba(232,93,130,0.45);background:rgba(232,93,130,0.18);padding:14px 40px;cursor: var(--cursor-pointer);transition:all .25s;border-radius: 10px;}
  .load-more-btn:hover:not(:disabled){border-color:var(--neon-cyan);}
  .load-more-btn:disabled{opacity:.4;}
  .game-card--clickable{cursor: var(--cursor-pointer);}
</style>