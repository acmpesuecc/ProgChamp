<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';

  import Navbar     from '$lib/components/Navbar.svelte';
  import Footer     from '$lib/components/Footer.svelte';
  import LoginModal from '$lib/components/LoginModal.svelte';

  // AUTH
  let session    = $derived(page.data.session);
  let user       = $derived(session?.user);
  let isLoggedIn = $derived(session?.authenticated ?? false);
  let isAdmin    = $derived(user?.userType === 'admin');

  let { data } = $props();

  // Game comes from server load — no client fetch needed for initial data
  let game = $derived<any>(data.game);

  // LOGIN MODAL STATE
  let showLogin = $state(false);

  function goTo(path: string, requiresAuth = false) {
    if (requiresAuth && !isLoggedIn) showLogin = true;
    else goto(path);
  }

  // REACTION STATE — optimistic UI
  let likes          = $state(0);
  let dislikes       = $state(0);
  let superlikes     = $state(0);
  let userReaction   = $state<'like' | 'dislike' | null>(null);
  let userSuperliked = $state(false);
  let reactionLoaded = $state(false);

  // FULLSCREEN STATE
  let isFullscreen = $state(false);
  let iframeWrap: HTMLDivElement | undefined = $state();

  // SIDEBAR STATE

  // SIDEBAR STATE
  let allGames = $state<any[]>([]);
  let sidebarGames = $derived(
    allGames.filter((g: any) => g.id !== game?.id).slice(0, 6)
  );

  // Fetch the list once; the filter above re-runs automatically per game
  onMount(async () => {
    try {
      const res = await fetch(`/api/games?limit=8`);
      if (res.ok) allGames = (await res.json()).games ?? [];
    } catch {}
  });

  // Runs on first load AND every time you navigate to another game
  $effect(() => {
    const g = game;
    likes          = g?.countLikes      ?? 0;
    dislikes       = g?.countDislikes   ?? 0;
    superlikes     = g?.countSuperlikes ?? 0;
    userReaction   = null;
    userSuperliked = false;
    reactionLoaded = false;

    if (isLoggedIn && g?.id) {
      fetch(`/api/games/${g.id}/reaction`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && g.id === game?.id) {   // ignore stale responses
            userReaction   = d.reaction   ?? null;
            userSuperliked = d.superliked ?? false;
          }
          reactionLoaded = true;
        })
        .catch(() => {});
    }
  });

  async function react(type: 'like' | 'dislike') {
    if (!isLoggedIn) { showLogin = true; return; }

    // Optimistic update
    const prevReaction = userReaction;
    const prevLikes    = likes;
    const prevDislikes = dislikes;

    if (userReaction === type) {
      // toggle off
      if (type === 'like') likes--; else dislikes--;
      userReaction = null;
    } else {
      // switch or add
      if (userReaction === 'like')    likes--;
      if (userReaction === 'dislike') dislikes--;
      if (type === 'like') likes++; else dislikes++;
      userReaction = type;
    }

    try {
      const res = await fetch(`/api/games/${game.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // revert
      userReaction = prevReaction;
      likes    = prevLikes;
      dislikes = prevDislikes;
    }
  }

  async function handleSuperlike() {
    if (!isLoggedIn) { showLogin = true; return; }

    const prev   = userSuperliked;
    const prevSL = superlikes;

    if (userSuperliked) { superlikes--; userSuperliked = false; }
    else                { superlikes++; userSuperliked = true;  }

    try {
      const res = await fetch(`/api/games/${game.id}/superlike`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      userSuperliked = prev;
      superlikes     = prevSL;
    }
  }

  function toggleFullscreen() {
    if (!iframeWrap) return;
    if (!document.fullscreenElement) {
      iframeWrap.requestFullscreen().catch(() => {});
      isFullscreen = true;
    } else {
      document.exitFullscreen();
      isFullscreen = false;
    }
  }

  function formatCount(n: number) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1000)      return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  function formatPlayers(n: number) {
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n.toString();
  }

  function gameGenre(g: any) {
    return g.tags?.[0]?.tag?.category ?? g.tags?.[0]?.tag?.name ?? 'Game';
  }

  const iconColors = ['#7C4DBF','#E85D82','#C97064','#8FBF8B','#F0899E','#A85F75','#723D51'];
  const icons      = ['⬡','◈','⟁','✦','◉','⟡','◆'];
</script>

<svelte:head>
  <title>{game?.title ?? 'Game'} // PROGCHAMP</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Pixelify+Sans:wght@400;500;600;700&family=Caveat:wght@500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<Navbar
  {isLoggedIn}
  {isAdmin}
  avatarUrl={user?.avatarUrl}
  userName={user?.name}
  onLoginClick={() => (showLogin = true)}
/>

<!-- PAGE BODY -->
<div class="gameplay-page">

  <!-- ── LEFT: PLAYER + INFO ── -->
  <div class="player-col">

    <!-- GAME IFRAME -->
    <div class="player-wrap" bind:this={iframeWrap}>
      <div class="player-corner tl"></div>
      <div class="player-corner br"></div>
      {#key game.id}
      <iframe
        src={game.gameUrl}
        title={game.title}
        class="game-frame"
        allowfullscreen
      ></iframe>
      {/key}
      <div class="player-scanline"></div>
      <button class="fullscreen-btn" onclick={toggleFullscreen} title="Fullscreen">
        {isFullscreen ? '⤡' : '⤢'}
      </button>
    </div>

    <!-- TITLE + REACTIONS -->
    <div class="info-block">
      <div class="info-top">
        <div class="info-left">
          <div class="game-genre-tag">{gameGenre(game).toUpperCase()}</div>
          <!-- Clicking title goes to a dedicated game profile page -->
          <a href="/game/{game.id}/details" class="game-title-link">
            <h1 class="game-title">{game.title}</h1>
          </a>
          <div class="game-meta-row">
            <!-- Clicking dev name goes to their profile -->
            <a href="/user/{game.creator?.id}" class="meta-dev-link">
              by <em>{game.creator?.name ?? 'unknown'}</em>
            </a>
            <span class="meta-sep">·</span>
            <span class="meta-players">{formatPlayers(game.viewCount ?? 0)} PLAYING</span>
            <span class="meta-sep">·</span>
            <span class="meta-rating">★ {game.score ?? '—'}</span>
          </div>
        </div>

        <!-- REACTION BUTTONS -->
        <div class="reactions">
          <button
            class="react-btn react-btn--superlike"
            class:active={userSuperliked}
            onclick={handleSuperlike}
            title="Superlike — boosts score by 3"
          >
            <span class="react-icon">⚡</span>
            <span class="react-label">SUPER</span>
            <span class="react-count">{formatCount(superlikes)}</span>
          </button>

          <div class="react-divider"></div>

          <button
            class="react-btn react-btn--like"
            class:active={userReaction === 'like'}
            onclick={() => react('like')}
            title="Like"
          >
            <span class="react-icon">▲</span>
            <span class="react-count">{formatCount(likes)}</span>
          </button>

          <button
            class="react-btn react-btn--dislike"
            class:active={userReaction === 'dislike'}
            onclick={() => react('dislike')}
            title="Dislike"
          >
            <span class="react-icon">▼</span>
            <span class="react-count">{formatCount(dislikes)}</span>
          </button>
        </div>
      </div>

      <!-- DIVIDER -->
      <div class="info-divider"></div>

      <!-- DESCRIPTION + TAGS -->
      <div class="info-bottom">
        <!-- Clicking dev card navigates to their profile -->
        <a href="/user/{game.creator?.id}" class="dev-card">
          <div class="dev-avatar">
            {#if game.creator?.avatarUrl}
              <img src={game.creator.avatarUrl} alt={game.creator.name} referrerpolicy="no-referrer" />
            {:else}
              <span>{(game.creator?.name?.[0] ?? '?').toUpperCase()}</span>
            {/if}
          </div>
          <div>
            <div class="dev-name">{(game.creator?.name ?? 'unknown').toUpperCase()}</div>
            <div class="dev-label">// DEVELOPER — VIEW PROFILE →</div>
          </div>
        </a>

        {#if game.description}
          <p class="game-desc">{game.description}</p>
        {/if}

        {#if game.tags?.length}
          <div class="tag-row">
            {#each game.tags.map((t: any) => t.tag.name) as tag}
              <span class="tag">{tag.toUpperCase()}</span>
            {/each}
          </div>
        {/if}

        <!-- Link to full game profile page -->
        <a href="/game/{game.id}/details" class="details-link">
          VIEW FULL GAME PAGE →
        </a>
      </div>
    </div>
  </div>

  <!-- ── RIGHT: SIDEBAR ── -->
  <aside class="sidebar">
    <div class="sidebar-eyebrow">// UP NEXT</div>
    <div class="sidebar-list">
      {#if sidebarGames.length === 0}
        {#each Array(5) as _, i}
          <div class="sidebar-card sidebar-skeleton">
            <div class="sidebar-thumb skeleton-thumb"></div>
            <div class="sidebar-info">
              <div class="skeleton-line short"></div>
              <div class="skeleton-line long"></div>
              <div class="skeleton-line medium"></div>
            </div>
          </div>
        {/each}
      {:else}
        {#each sidebarGames as g, i}
          <a href="/game/{g.id}" class="sidebar-card">
            <div class="sidebar-thumb"
              style="background:radial-gradient(circle at 30% 40%,{iconColors[i % iconColors.length]}28,transparent 70%)">
              {#if g.coverMedia?.r2Key}
                <img src="/media/{g.coverMedia.r2Key}" alt={g.title} class="sidebar-cover" />
              {:else}
                <span class="sidebar-icon" style="color:{iconColors[i % iconColors.length]}">{icons[i % icons.length]}</span>
              {/if}
            </div>
            <div class="sidebar-info">
              <div class="sidebar-genre">{gameGenre(g).toUpperCase()}</div>
              <div class="sidebar-title">{g.title}</div>
              <div class="sidebar-meta">
                <span
                  class="sidebar-dev"
                  role="link"
                  tabindex="0"
                  onclick={(e) => { e.preventDefault(); e.stopPropagation(); goto(`/user/${g.creator?.id}`); }}
                  onkeydown={(e) => e.key === 'Enter' && goto(`/user/${g.creator?.id}`)}
                >by {g.creator?.name ?? 'unknown'}</span>
                <span class="sidebar-rating">★ {g.score ?? 0}</span>
              </div>
              {#if (g.viewCount ?? 0) > 0}
                <div class="sidebar-players">{formatPlayers(g.viewCount)} PLAYING</div>
              {/if}
            </div>
          </a>
        {/each}
      {/if}
    </div>
  </aside>

</div>

<Footer {isAdmin} />
<LoginModal open={showLogin} onClose={() => (showLogin = false)} />

<style>
  /* ── PAGE LAYOUT ── */
  .gameplay-page {
    position: relative; z-index: 10;
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 28px;
    padding: 100px 48px 80px;
    max-width: 1400px;
    margin: 0 auto;
    align-items: start;
  }

  /* ── PLAYER ── */
  .player-col { display: flex; flex-direction: column; gap: 0; min-width: 0; }

  .player-wrap {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #000;
    border: 1px solid rgba(232,93,130,0.35);
    overflow: hidden;
    border-radius: 10px;
  }
  .player-corner {
    position: absolute; width: 24px; height: 24px; z-index: 4; pointer-events: none;
  }
  .player-corner.tl { top: 10px; left: 10px; border-top: 2px solid var(--neon-cyan); border-left: 2px solid var(--neon-cyan); }
  .player-corner.br { bottom: 10px; right: 10px; border-bottom: 2px solid var(--neon-cyan); border-right: 2px solid var(--neon-cyan); }

  .game-frame {
    width: 100%; height: 100%;
    border: none; display: block;
    position: relative; z-index: 2;
  }
  .player-scanline {
    position: absolute; inset: 0; z-index: 3; pointer-events: none;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0,0,0,.06) 2px, rgba(0,0,0,.06) 4px
    );
  }

  .fullscreen-btn {
    position: absolute; top: 10px; right: 14px; z-index: 5;
    background: rgba(0,0,0,.5); border: 1px solid rgba(232,93,130,0.35);
    color: var(--neon-cyan); font-size: 1rem; line-height: 1;
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    cursor: var(--cursor-pointer); transition: all .2s;
    border-radius: 10px;
  }
  .fullscreen-btn:hover {
    background: rgba(232,93,130,0.25);
    border-color: var(--neon-cyan);
    
  }

  /* ── INFO BLOCK ── */
  .info-block {
    background: rgba(30,14,30,.6);
    border: 1px solid rgba(232,93,130,0.25);
    border-top: none;
    padding: 24px 28px 28px;
    border-radius: 10px;
    backdrop-filter: blur(8px);
  }

  .info-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
  }
  .info-left { flex: 1; min-width: 0; }

  .game-genre-tag {
    font-family: 'VT323', monospace;
    font-size: 1.1rem; letter-spacing: .25em;
    color: var(--neon-purple); 
    margin-bottom: 6px;
  }

  .game-title-link { text-decoration: none; color: inherit; }
  .game-title-link:hover .game-title { color: var(--neon-cyan);  }
  .game-title {
    font-family: 'Press Start 2P', sans-serif;
    font-size: clamp(2rem, 4vw, 3.2rem);
    letter-spacing: .06em; line-height: 1;
    margin-bottom: 10px; transition: color .2s, text-shadow .2s;
  }

  .game-meta-row {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    font-family: 'VT323', monospace;
    font-size: 1.15rem; letter-spacing: .1em;
    color: rgba(245,205,210,0.6);
  }
  .meta-dev-link {
    color: rgba(245,205,210,0.6); text-decoration: none; transition: color .2s;
  }
  .meta-dev-link:hover { color: var(--neon-cyan); }
  .meta-dev-link em { font-style: normal; color: rgba(232,93,130,0.6); }
  .meta-sep { color: rgba(245,205,210,0.4); }
  .meta-rating { color: var(--neon-yellow);  }
  .meta-players { color: rgba(232,93,130,0.5); }

  /* ── REACTIONS ── */
  .reactions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .react-divider {
    width: 1px; height: 36px;
    background: rgba(232,93,130,0.27);
    margin: 0 4px;
  }

  .react-btn {
    display: flex; align-items: center; gap: 7px;
    font-family: 'VT323', monospace;
    font-size: 1.15rem; letter-spacing: .12em; text-transform: uppercase;
    background: rgba(232,93,130,0.18);
    border: 1px solid rgba(232,93,130,0.27);
    color: rgba(245,205,210,0.65);
    padding: 8px 14px;
    cursor: var(--cursor-pointer);
    transition: all .25s;
    border-radius: 10px;
  }
  .react-btn:hover { color: rgba(245,205,210,0.8); border-color: rgba(232,93,130,0.45); }

  .react-icon { font-size: 1.4rem; line-height: 1; }
  .react-count { font-size: 1.2rem; }
  .react-label { font-size: 1.1rem; letter-spacing: .1em; }

  .react-btn--like.active {
    color: var(--neon-cyan); border-color: var(--neon-cyan);
    background: rgba(232,93,130,0.23); 
    
  }
  .react-btn--dislike.active {
    color: var(--neon-pink); border-color: var(--neon-pink);
    background: rgba(124,77,191,0.23); 
    
  }
  .react-btn--superlike {
    border-color: rgba(240,137,158,0.35); color: rgba(240,137,158,0.5);
  }
  .react-btn--superlike:hover {
    border-color: rgba(240,137,158,0.5); color: var(--neon-yellow);
  }
  .react-btn--superlike.active {
    color: var(--neon-yellow); border-color: var(--neon-yellow);
    background: rgba(240,137,158,0.23); 
    
  }

  .info-divider {
    height: 1px; background: rgba(232,93,130,0.23); margin: 20px 0;
  }

  .info-bottom { display: flex; flex-direction: column; gap: 16px; }

  .dev-card {
    display: flex; align-items: center; gap: 14px;
    text-decoration: none; color: inherit;
    padding: 10px 14px;
    border: 1px solid rgba(232,93,130,0.21);
    background: rgba(232,93,130,0.17);
    transition: border-color .25s, background .25s;
    border-radius: 10px;
  }
  .dev-card:hover {
    border-color: rgba(232,93,130,0.35);
    background: rgba(232,93,130,0.2);
  }
  .dev-avatar {
    width: 40px; height: 40px;
    border: 1px solid rgba(232,93,130,0.35);
    background: rgba(232,93,130,0.2);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Press Start 2P', sans-serif;
    font-size: 1.3rem; color: var(--neon-cyan);
    border-radius: 10px;
    flex-shrink: 0; overflow: hidden;
  }
  .dev-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .dev-name {
    font-family: 'VT323', monospace;
    font-size: 1.25rem; letter-spacing: .15em; color: rgba(245,205,210,0.8);
  }
  .dev-label {
    font-family: 'VT323', monospace;
    font-size: 1.05rem; letter-spacing: .2em; color: rgba(232,93,130,0.4);
    margin-top: 2px;
  }

  .game-desc {
    font-family: 'VT323', monospace;
    font-size: 1.22rem; letter-spacing: .05em; line-height: 1.8;
    color: rgba(245,205,210,0.6); margin: 0;
  }

  .tag-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag {
    font-family: 'VT323', monospace;
    font-size: 1.05rem; letter-spacing: .15em;
    color: rgba(124,77,191,0.7); border: 1px solid rgba(124,77,191,0.35);
    background: rgba(124,77,191,0.19); padding: 4px 12px;
    border-radius: 10px;
  }

  .details-link {
    font-family: 'VT323', monospace;
    font-size: 1.12rem; letter-spacing: .2em;
    color: rgba(232,93,130,0.5); text-decoration: none;
    transition: color .2s;
    align-self: flex-start;
  }
  .details-link:hover { color: var(--neon-cyan);  }

  /* ── SIDEBAR ── */
  .sidebar {
    position: sticky; top: 88px;
    display: flex; flex-direction: column; gap: 16px;
    max-height: calc(100vh - 108px);
    overflow-y: auto; scrollbar-width: none;
  }
  .sidebar::-webkit-scrollbar { display: none; }

  .sidebar-eyebrow {
    font-family: 'VT323', monospace;
    font-size: 1.2rem; letter-spacing: .3em; text-transform: uppercase;
    color:var(--neon-cyan); 
  }

  .sidebar-list { display: flex; flex-direction: column; gap: 10px; }

  .sidebar-card {
    display: grid; grid-template-columns: 100px 1fr;
    text-decoration: none; color: var(--text);
    background: rgba(30,14,30,.6);
    border: 1px solid rgba(232,93,130,0.23); overflow: hidden;
    transition: border-color .25s, transform .25s, box-shadow .25s;
    border-radius: 10px;
    cursor: var(--cursor-pointer);
  }
  .sidebar-card:hover {
    border-color: rgba(232,93,130,0.45);
    transform: translateX(4px);
    box-shadow: 0 4px 24px rgba(232,93,130,0.21);
  }

  .sidebar-thumb {
    aspect-ratio: 16/9;
    display: flex; align-items: center; justify-content: center;
    background: rgba(30,14,30,.8); flex-shrink: 0; overflow: hidden;
  }
  .sidebar-cover { width: 100%; height: 100%; object-fit: cover; }
  .sidebar-icon { font-size: 1.8rem; opacity: .7; }

  .sidebar-info {
    padding: 10px 12px;
    display: flex; flex-direction: column; gap: 3px; min-width: 0;
  }
  .sidebar-genre {
    font-family: 'VT323', monospace;
    font-size: 1rem; letter-spacing: .18em;
    color: var(--neon-purple); 
  }
  .sidebar-title {
    font-family: 'Press Start 2P', sans-serif;
    font-size: 1rem; letter-spacing: .06em; line-height: 1.1;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sidebar-meta { display: flex; align-items: center; justify-content: space-between; }
  .sidebar-dev {
    font-family: 'VT323', monospace;
    font-size: 1.02rem; letter-spacing: .06em;
    color: rgba(245,205,210,0.5); text-decoration: none;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    transition: color .2s;
  }
  .sidebar-dev:hover { color: var(--neon-cyan); }
  .sidebar-rating {
    font-family: 'VT323', monospace; font-size: 1.05rem;
    color: var(--neon-yellow);  flex-shrink: 0;
  }
  .sidebar-players {
    font-family: 'VT323', monospace;
    font-size: 1rem; letter-spacing: .1em; color: rgba(232,93,130,0.5);
  }

  /* Skeleton loading */
  .sidebar-skeleton { pointer-events: none; }
  .skeleton-thumb { width: 100%; height: 100%; background: rgba(232,93,130,0.18); animation: shimmer 1.5s ease-in-out infinite; }
  .skeleton-line { height: 8px; border-radius: 2px; background: rgba(245,205,210,0.31); animation: shimmer 1.5s ease-in-out infinite; }
  .skeleton-line.short  { width: 40%; margin-bottom: 6px; }
  .skeleton-line.long   { width: 85%; margin-bottom: 5px; }
  .skeleton-line.medium { width: 60%; }
  @keyframes shimmer {
    0%, 100% { opacity: .4; }
    50%       { opacity: .8; }
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    .gameplay-page { grid-template-columns: 1fr; padding: 90px 24px 60px; }
    .sidebar { position: static; max-height: none; overflow-y: visible; }
    .sidebar-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
    .sidebar-card { grid-template-columns: 110px 1fr; }
  }
  @media (max-width: 600px) {
    .gameplay-page { padding: 80px 16px 48px; }
    .info-top { flex-direction: column; gap: 16px; }
    .reactions { width: 100%; justify-content: flex-start; }
  }
</style>