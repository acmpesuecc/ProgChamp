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
  let game = $state<any>(data.game);

  // LOGIN MODAL STATE
  let showLogin = $state(false);

  function goTo(path: string, requiresAuth = false) {
    if (requiresAuth && !isLoggedIn) showLogin = true;
    else goto(path);
  }

  // REACTION STATE — optimistic UI
  let likes          = $state(game?.countLikes      ?? 0);
  let dislikes       = $state(game?.countDislikes   ?? 0);
  let superlikes     = $state(game?.countSuperlikes ?? 0);
  let userReaction   = $state<'like' | 'dislike' | null>(null);
  let userSuperliked = $state(false);
  let reactionLoaded = $state(false);

  // FULLSCREEN STATE
  let isFullscreen = $state(false);
  let iframeWrap: HTMLDivElement | undefined = $state();

  // SIDEBAR STATE
  let sidebarGames  = $state<any[]>([]);

  onMount(async () => {
    // Fetch current user's reaction for this game
    if (isLoggedIn && game?.id) {
      try {
        const res = await fetch(`/api/games/${game.id}/reaction`);
        if (res.ok) {
          const d = await res.json();
          userReaction   = d.reaction   ?? null;
          userSuperliked = d.superliked ?? false;
        }
      } catch {}
      reactionLoaded = true;
    }

    // Fetch sidebar games (a few recent ones, excluding current)
    try {
      const res = await fetch(`/api/games?limit=8`);
      if (res.ok) {
        const d = await res.json();
        sidebarGames = (d.games ?? []).filter((g: any) => g.id !== game?.id).slice(0, 6);
      }
    } catch {}
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

  const iconColors = ['#bf00ff','#00ccff','#ff3300','#00cc44','#ffee00','#ff0066','#ff9900'];
  const icons      = ['⬡','◈','⟁','✦','◉','⟡','◆'];
</script>

<svelte:head>
  <title>{game?.title ?? 'Game'} // PROGCHAMP</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Oxanium:wght@300;400;600;800&display=swap" rel="stylesheet" />
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
      <iframe
        src={game.gameUrl}
        title={game.title}
        class="game-frame"
        allowfullscreen
      ></iframe>
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
    border: 1px solid rgba(0,255,249,.2);
    overflow: hidden;
    clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
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
    background: rgba(0,0,0,.5); border: 1px solid rgba(0,255,249,.2);
    color: var(--neon-cyan); font-size: 1rem; line-height: 1;
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    cursor: none; transition: all .2s;
    clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%);
  }
  .fullscreen-btn:hover {
    background: rgba(0,255,249,.1);
    border-color: var(--neon-cyan);
    box-shadow: 0 0 12px rgba(0,255,249,.2);
  }

  /* ── INFO BLOCK ── */
  .info-block {
    background: rgba(10,0,20,.6);
    border: 1px solid rgba(0,255,249,.1);
    border-top: none;
    padding: 24px 28px 28px;
    clip-path: polygon(0% 0%, 100% 0%, calc(100% - 12px) 100%, 12px 100%);
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
    font-family: 'Share Tech Mono', monospace;
    font-size: .6rem; letter-spacing: .25em;
    color: var(--neon-purple); text-shadow: 0 0 8px var(--neon-purple);
    margin-bottom: 6px;
  }

  .game-title-link { text-decoration: none; color: inherit; }
  .game-title-link:hover .game-title { color: var(--neon-cyan); text-shadow: 0 0 20px rgba(0,255,249,.3); }
  .game-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(2rem, 4vw, 3.2rem);
    letter-spacing: .06em; line-height: 1;
    margin-bottom: 10px; transition: color .2s, text-shadow .2s;
  }

  .game-meta-row {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    font-family: 'Share Tech Mono', monospace;
    font-size: .65rem; letter-spacing: .1em;
    color: rgba(224,224,255,.35);
  }
  .meta-dev-link {
    color: rgba(224,224,255,.35); text-decoration: none; transition: color .2s;
  }
  .meta-dev-link:hover { color: var(--neon-cyan); }
  .meta-dev-link em { font-style: normal; color: rgba(0,255,249,.6); }
  .meta-sep { color: rgba(224,224,255,.15); }
  .meta-rating { color: var(--neon-yellow); text-shadow: 0 0 6px var(--neon-yellow); }
  .meta-players { color: rgba(0,255,249,.5); }

  /* ── REACTIONS ── */
  .reactions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .react-divider {
    width: 1px; height: 36px;
    background: rgba(0,255,249,.12);
    margin: 0 4px;
  }

  .react-btn {
    display: flex; align-items: center; gap: 7px;
    font-family: 'Share Tech Mono', monospace;
    font-size: .65rem; letter-spacing: .12em; text-transform: uppercase;
    background: rgba(0,255,249,.03);
    border: 1px solid rgba(0,255,249,.12);
    color: rgba(224,224,255,.4);
    padding: 8px 14px;
    cursor: none;
    transition: all .25s;
    clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);
  }
  .react-btn:hover { color: rgba(224,224,255,.8); border-color: rgba(0,255,249,.3); }

  .react-icon { font-size: .9rem; line-height: 1; }
  .react-count { font-size: .7rem; }
  .react-label { font-size: .6rem; letter-spacing: .1em; }

  .react-btn--like.active {
    color: var(--neon-cyan); border-color: var(--neon-cyan);
    background: rgba(0,255,249,.08); box-shadow: 0 0 16px rgba(0,255,249,.2);
    text-shadow: 0 0 8px var(--neon-cyan);
  }
  .react-btn--dislike.active {
    color: var(--neon-pink); border-color: var(--neon-pink);
    background: rgba(255,0,110,.08); box-shadow: 0 0 16px rgba(255,0,110,.2);
    text-shadow: 0 0 8px var(--neon-pink);
  }
  .react-btn--superlike {
    border-color: rgba(255,230,0,.2); color: rgba(255,230,0,.5);
  }
  .react-btn--superlike:hover {
    border-color: rgba(255,230,0,.5); color: var(--neon-yellow);
  }
  .react-btn--superlike.active {
    color: var(--neon-yellow); border-color: var(--neon-yellow);
    background: rgba(255,230,0,.08); box-shadow: 0 0 20px rgba(255,230,0,.3);
    text-shadow: 0 0 10px var(--neon-yellow);
  }

  .info-divider {
    height: 1px; background: rgba(0,255,249,.08); margin: 20px 0;
  }

  .info-bottom { display: flex; flex-direction: column; gap: 16px; }

  .dev-card {
    display: flex; align-items: center; gap: 14px;
    text-decoration: none; color: inherit;
    padding: 10px 14px;
    border: 1px solid rgba(0,255,249,.06);
    background: rgba(0,255,249,.02);
    transition: border-color .25s, background .25s;
    clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);
  }
  .dev-card:hover {
    border-color: rgba(0,255,249,.2);
    background: rgba(0,255,249,.05);
  }
  .dev-avatar {
    width: 40px; height: 40px;
    border: 1px solid rgba(0,255,249,.2);
    background: rgba(0,255,249,.05);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.3rem; color: var(--neon-cyan);
    clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);
    flex-shrink: 0; overflow: hidden;
  }
  .dev-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .dev-name {
    font-family: 'Share Tech Mono', monospace;
    font-size: .75rem; letter-spacing: .15em; color: rgba(224,224,255,.7);
  }
  .dev-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: .55rem; letter-spacing: .2em; color: rgba(0,255,249,.4);
    margin-top: 2px;
  }

  .game-desc {
    font-family: 'Share Tech Mono', monospace;
    font-size: .72rem; letter-spacing: .05em; line-height: 1.8;
    color: rgba(224,224,255,.35); margin: 0;
  }

  .tag-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag {
    font-family: 'Share Tech Mono', monospace;
    font-size: .55rem; letter-spacing: .15em;
    color: rgba(191,0,255,.7); border: 1px solid rgba(191,0,255,.2);
    background: rgba(191,0,255,.04); padding: 4px 12px;
    clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%);
  }

  .details-link {
    font-family: 'Share Tech Mono', monospace;
    font-size: .62rem; letter-spacing: .2em;
    color: rgba(0,255,249,.35); text-decoration: none;
    transition: color .2s;
    align-self: flex-start;
  }
  .details-link:hover { color: var(--neon-cyan); text-shadow: 0 0 8px var(--neon-cyan); }

  /* ── SIDEBAR ── */
  .sidebar {
    position: sticky; top: 88px;
    display: flex; flex-direction: column; gap: 16px;
    max-height: calc(100vh - 108px);
    overflow-y: auto; scrollbar-width: none;
  }
  .sidebar::-webkit-scrollbar { display: none; }

  .sidebar-eyebrow {
    font-family: 'Share Tech Mono', monospace;
    font-size: .7rem; letter-spacing: .3em; text-transform: uppercase;
    color: var(--neon-cyan); text-shadow: 0 0 8px var(--neon-cyan);
  }

  .sidebar-list { display: flex; flex-direction: column; gap: 10px; }

  .sidebar-card {
    display: grid; grid-template-columns: 100px 1fr;
    text-decoration: none; color: var(--text);
    background: rgba(10,0,20,.6);
    border: 1px solid rgba(0,255,249,.08); overflow: hidden;
    transition: border-color .25s, transform .25s, box-shadow .25s;
    clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
    cursor: none;
  }
  .sidebar-card:hover {
    border-color: rgba(0,255,249,.3);
    transform: translateX(4px);
    box-shadow: 0 4px 24px rgba(0,255,249,.06);
  }

  .sidebar-thumb {
    aspect-ratio: 16/9;
    display: flex; align-items: center; justify-content: center;
    background: rgba(10,0,20,.8); flex-shrink: 0; overflow: hidden;
  }
  .sidebar-cover { width: 100%; height: 100%; object-fit: cover; }
  .sidebar-icon { font-size: 1.8rem; opacity: .7; }

  .sidebar-info {
    padding: 10px 12px;
    display: flex; flex-direction: column; gap: 3px; min-width: 0;
  }
  .sidebar-genre {
    font-family: 'Share Tech Mono', monospace;
    font-size: .5rem; letter-spacing: .18em;
    color: var(--neon-purple); text-shadow: 0 0 6px var(--neon-purple);
  }
  .sidebar-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1rem; letter-spacing: .06em; line-height: 1.1;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sidebar-meta { display: flex; align-items: center; justify-content: space-between; }
  .sidebar-dev {
    font-family: 'Share Tech Mono', monospace;
    font-size: .52rem; letter-spacing: .06em;
    color: rgba(224,224,255,.25); text-decoration: none;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    transition: color .2s;
  }
  .sidebar-dev:hover { color: var(--neon-cyan); }
  .sidebar-rating {
    font-family: 'Share Tech Mono', monospace; font-size: .55rem;
    color: var(--neon-yellow); text-shadow: 0 0 6px var(--neon-yellow); flex-shrink: 0;
  }
  .sidebar-players {
    font-family: 'Share Tech Mono', monospace;
    font-size: .5rem; letter-spacing: .1em; color: rgba(0,255,249,.35);
  }

  /* Skeleton loading */
  .sidebar-skeleton { pointer-events: none; }
  .skeleton-thumb { width: 100%; height: 100%; background: rgba(0,255,249,.03); animation: shimmer 1.5s ease-in-out infinite; }
  .skeleton-line { height: 8px; border-radius: 2px; background: rgba(224,224,255,.06); animation: shimmer 1.5s ease-in-out infinite; }
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