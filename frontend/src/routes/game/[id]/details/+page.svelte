<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import Navbar     from '$lib/components/Navbar.svelte';
  import Footer     from '$lib/components/Footer.svelte';
  import LoginModal from '$lib/components/LoginModal.svelte';

  let session    = $derived(page.data.session);
  let user       = $derived(session?.user);
  let isLoggedIn = $derived(session?.authenticated ?? false);
  let isAdmin    = $derived(user?.userType === 'admin');

  let { data } = $props();
  let game = $state<any>(data.game);

  let showLogin = $state(false);

  // REACTIONS
  let likes          = $state(game?.countLikes      ?? 0);
  let dislikes       = $state(game?.countDislikes   ?? 0);
  let superlikes     = $state(game?.countSuperlikes ?? 0);
  let userReaction   = $state<'like' | 'dislike' | null>(null);
  let userSuperliked = $state(false);

  onMount(async () => {
    if (isLoggedIn && game?.id) {
      try {
        const res = await fetch(`/api/games/${game.id}/reaction`);
        if (res.ok) {
          const d = await res.json();
          userReaction   = d.reaction   ?? null;
          userSuperliked = d.superliked ?? false;
        }
      } catch {}
    }
  });

  async function react(type: 'like' | 'dislike') {
    if (!isLoggedIn) { showLogin = true; return; }
    const prevReaction = userReaction;
    const prevLikes    = likes;
    const prevDislikes = dislikes;
    if (userReaction === type) {
      if (type === 'like') likes--; else dislikes--;
      userReaction = null;
    } else {
      if (userReaction === 'like')    likes--;
      if (userReaction === 'dislike') dislikes--;
      if (type === 'like') likes++; else dislikes++;
      userReaction = type;
    }
    try {
      const res = await fetch(`/api/games/${game.id}/react`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error();
    } catch {
      userReaction = prevReaction; likes = prevLikes; dislikes = prevDislikes;
    }
  }

  async function handleSuperlike() {
    if (!isLoggedIn) { showLogin = true; return; }
    const prev = userSuperliked; const prevSL = superlikes;
    if (userSuperliked) { superlikes--; userSuperliked = false; }
    else                { superlikes++; userSuperliked = true;  }
    try {
      const res = await fetch(`/api/games/${game.id}/superlike`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch { userSuperliked = prev; superlikes = prevSL; }
  }

  function formatCount(n: number) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  function gameGenre(g: any) {
    return g.tags?.[0]?.tag?.category ?? g.tags?.[0]?.tag?.name ?? 'Game';
  }

  function initials(name: string | null) {
    if (!name) return '?';
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }
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

<div class="details-page">

  <!-- HERO -->
  <div class="hero">
    <div class="hero-orb orb1"></div>
    <div class="hero-orb orb2"></div>

    <div class="hero-inner">
      <!-- Cover art -->
      <div class="cover-wrap">
        {#if game.coverMedia?.r2Key}
          <img src="/media/{game.coverMedia.r2Key}" alt={game.title} class="cover-img" />
        {:else}
          <div class="cover-placeholder">
            <span class="cover-icon">⬡</span>
          </div>
        {/if}
        <div class="cover-glow"></div>
      </div>

      <!-- Title block -->
      <div class="hero-text">
        <div class="hero-eyebrow">// {gameGenre(game).toUpperCase()}</div>
        <h1 class="hero-title">{game.title}</h1>
        <a href="/user/{game.creator?.id}" class="creator-link">
          <div class="creator-avatar">
            {#if game.creator?.avatarUrl}
              <img src={game.creator.avatarUrl} alt={game.creator.name} referrerpolicy="no-referrer" />
            {:else}
              <span>{initials(game.creator?.name ?? null)}</span>
            {/if}
          </div>
          <div>
            <div class="creator-name">{(game.creator?.name ?? 'unknown').toUpperCase()}</div>
            <div class="creator-label">// DEVELOPER — VIEW PROFILE →</div>
          </div>
        </a>

        <!-- Stats row -->
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-val">{formatCount(game.viewCount ?? 0)}</span>
            <span class="stat-key">PLAYS</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-val">{formatCount(likes)}</span>
            <span class="stat-key">LIKES</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-val">{formatCount(game.score ?? 0)}</span>
            <span class="stat-key">SCORE</span>
          </div>
        </div>

        <!-- REACTIONS -->
        <div class="reactions">
          <button
            class="react-btn react-btn--superlike"
            class:active={userSuperliked}
            onclick={handleSuperlike}
          >
            <span>⚡</span>
            <span>SUPERLIKE</span>
            <span class="react-count">{formatCount(superlikes)}</span>
          </button>
          <button
            class="react-btn react-btn--like"
            class:active={userReaction === 'like'}
            onclick={() => react('like')}
          >
            <span>▲</span>
            <span>LIKE</span>
            <span class="react-count">{formatCount(likes)}</span>
          </button>
          <button
            class="react-btn react-btn--dislike"
            class:active={userReaction === 'dislike'}
            onclick={() => react('dislike')}
          >
            <span>▼</span>
            <span>DISLIKE</span>
            <span class="react-count">{formatCount(dislikes)}</span>
          </button>
        </div>

        <!-- Play button -->
        <a href="/game/{game.id}" class="play-btn">
          <span class="play-icon">▶</span>
          PLAY NOW
        </a>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div class="body-section">

    <!-- Description -->
    {#if game.description}
      <div class="info-card">
        <div class="card-eyebrow">// ABOUT THIS GAME</div>
        <p class="description">{game.description}</p>
      </div>
    {/if}

    <!-- Tags -->
    {#if game.tags?.length}
      <div class="info-card">
        <div class="card-eyebrow">// TAGS</div>
        <div class="tag-row">
          {#each game.tags.map((t: any) => t.tag.name) as tag}
            <span class="tag">{tag.toUpperCase()}</span>
          {/each}
        </div>
      </div>
    {/if}

  </div>

</div>

<Footer {isAdmin} />
<LoginModal open={showLogin} onClose={() => (showLogin = false)} />

<style>
  .details-page { position: relative; z-index: 10; min-height: 100vh; padding-bottom: 80px; }

  /* HERO */
  .hero {
    position: relative; overflow: hidden;
    padding: 100px 60px 60px;
    border-bottom: 1px solid rgba(0,255,249,.08);
  }
  .hero-orb { position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; }
  .hero-orb.orb1 { width: 600px; height: 600px; background: rgba(0,255,249,.05); top: -200px; right: -100px; }
  .hero-orb.orb2 { width: 400px; height: 400px; background: rgba(191,0,255,.05); bottom: -100px; left: 10%; }

  .hero-inner {
    position: relative; z-index: 2;
    display: grid; grid-template-columns: 380px 1fr;
    gap: 48px; align-items: center;
    max-width: 1200px; margin: 0 auto;
  }

  /* Cover */
  .cover-wrap {
    position: relative;
    aspect-ratio: 16/9;
    border: 1px solid rgba(0,255,249,.2);
    overflow: hidden;
    clip-path: polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);
  }
  .cover-img { width: 100%; height: 100%; object-fit: cover; }
  .cover-placeholder {
    width: 100%; height: 100%;
    background: radial-gradient(circle at 40% 40%, rgba(0,255,249,.08), transparent 70%);
    display: flex; align-items: center; justify-content: center;
  }
  .cover-icon { font-size: 4rem; color: rgba(0,255,249,.2); }
  .cover-glow {
    position: absolute; inset: 0; pointer-events: none;
    box-shadow: inset 0 0 40px rgba(0,255,249,.05);
  }

  /* Hero text */
  .hero-text { display: flex; flex-direction: column; gap: 20px; }

  .hero-eyebrow {
    font-family: 'Share Tech Mono', monospace;
    font-size: .62rem; letter-spacing: .3em;
    color: var(--neon-purple); text-shadow: 0 0 8px var(--neon-purple);
  }
  .hero-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(3rem, 6vw, 5.5rem);
    letter-spacing: .05em; line-height: .95; margin: 0;
  }

  .creator-link {
    display: flex; align-items: center; gap: 14px;
    text-decoration: none; color: inherit;
    padding: 12px 16px;
    border: 1px solid rgba(0,255,249,.06);
    background: rgba(0,255,249,.02);
    transition: border-color .25s, background .25s;
    clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);
    align-self: flex-start;
  }
  .creator-link:hover { border-color: rgba(0,255,249,.2); background: rgba(0,255,249,.05); }
  .creator-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    border: 1px solid rgba(0,255,249,.2);
    background: rgba(0,255,249,.05);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem;
    color: var(--neon-cyan); flex-shrink: 0; overflow: hidden;
  }
  .creator-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .creator-name {
    font-family: 'Share Tech Mono', monospace;
    font-size: .72rem; letter-spacing: .15em; color: rgba(224,224,255,.7);
  }
  .creator-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: .52rem; letter-spacing: .18em; color: rgba(0,255,249,.4); margin-top: 2px;
  }

  /* Stats */
  .stats-row { display: flex; align-items: center; gap: 24px; }
  .stat-item { display: flex; flex-direction: column; gap: 2px; }
  .stat-val {
    font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; line-height: 1;
    color: var(--neon-cyan); text-shadow: 0 0 12px var(--neon-cyan);
  }
  .stat-key {
    font-family: 'Share Tech Mono', monospace;
    font-size: .52rem; letter-spacing: .2em; color: rgba(224,224,255,.3);
  }
  .stat-divider { width: 1px; height: 36px; background: rgba(0,255,249,.1); }

  /* Reactions */
  .reactions { display: flex; gap: 8px; flex-wrap: wrap; }
  .react-btn {
    display: flex; align-items: center; gap: 8px;
    font-family: 'Share Tech Mono', monospace;
    font-size: .62rem; letter-spacing: .12em;
    background: rgba(0,255,249,.03); border: 1px solid rgba(0,255,249,.12);
    color: rgba(224,224,255,.4); padding: 10px 18px;
    cursor: none; transition: all .25s;
    clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);
  }
  .react-btn:hover { color: rgba(224,224,255,.8); border-color: rgba(0,255,249,.3); }
  .react-count { font-size: .7rem; opacity: .7; }
  .react-btn--like.active  { color: var(--neon-cyan);   border-color: var(--neon-cyan);   background: rgba(0,255,249,.08);  box-shadow: 0 0 16px rgba(0,255,249,.15); }
  .react-btn--dislike.active { color: var(--neon-pink); border-color: var(--neon-pink);   background: rgba(255,0,110,.08);  box-shadow: 0 0 16px rgba(255,0,110,.15); }
  .react-btn--superlike { border-color: rgba(255,230,0,.2); color: rgba(255,230,0,.5); }
  .react-btn--superlike:hover { border-color: rgba(255,230,0,.5); color: var(--neon-yellow); }
  .react-btn--superlike.active { color: var(--neon-yellow); border-color: var(--neon-yellow); background: rgba(255,230,0,.08); box-shadow: 0 0 20px rgba(255,230,0,.25); }

  /* Play button */
  .play-btn {
    display: inline-flex; align-items: center; gap: 12px; align-self: flex-start;
    font-family: 'Share Tech Mono', monospace;
    font-size: .72rem; letter-spacing: .2em; text-transform: uppercase;
    text-decoration: none;
    background: rgba(0,255,249,.08); border: 1px solid rgba(0,255,249,.4);
    color: var(--neon-cyan); text-shadow: 0 0 8px var(--neon-cyan);
    padding: 14px 32px;
    transition: all .25s;
    clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
    box-shadow: 0 0 24px rgba(0,255,249,.1);
  }
  .play-btn:hover {
    background: rgba(0,255,249,.15);
    box-shadow: 0 0 40px rgba(0,255,249,.25);
  }
  .play-icon { font-size: 1rem; }

  /* BODY */
  .body-section {
    max-width: 1200px; margin: 40px auto 0;
    padding: 0 60px;
    display: flex; flex-direction: column; gap: 20px;
  }
  .info-card {
    background: rgba(10,0,20,.6);
    border: 1px solid rgba(0,255,249,.08);
    padding: 28px 32px;
    display: flex; flex-direction: column; gap: 16px;
    backdrop-filter: blur(8px);
  }
  .card-eyebrow {
    font-family: 'Share Tech Mono', monospace;
    font-size: .58rem; letter-spacing: .28em; color: rgba(0,255,249,.4);
  }
  .description {
    font-family: 'Share Tech Mono', monospace;
    font-size: .72rem; letter-spacing: .05em; line-height: 1.9;
    color: rgba(224,224,255,.45); margin: 0;
  }
  .tag-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag {
    font-family: 'Share Tech Mono', monospace;
    font-size: .55rem; letter-spacing: .15em;
    color: rgba(191,0,255,.7); border: 1px solid rgba(191,0,255,.2);
    background: rgba(191,0,255,.04); padding: 5px 14px;
    clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%);
  }

  @media (max-width: 900px) {
    .hero { padding: 90px 24px 48px; }
    .hero-inner { grid-template-columns: 1fr; gap: 28px; }
    .body-section { padding: 0 24px; }
    .cover-wrap { max-width: 480px; }
  }
</style>