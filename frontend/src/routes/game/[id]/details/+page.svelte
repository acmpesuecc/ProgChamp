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
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Pixelify+Sans:wght@400;500;600;700&family=Caveat:wght@500;600;700&display=swap" rel="stylesheet" />
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
  }

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
    border: 1px solid rgba(232,93,130,0.35);
    overflow: hidden;
    border-radius: 10px;
  }
  .cover-img { width: 100%; height: 100%; object-fit: cover; }
  .cover-placeholder {
    width: 100%; height: 100%;
    background: radial-gradient(circle at 40% 40%, rgba(232,93,130,0.23), transparent 70%);
    display: flex; align-items: center; justify-content: center;
  }
  .cover-icon { font-size: 4rem; color: rgba(232,93,130,0.35); }
  .cover-glow {
    position: absolute; inset: 0; pointer-events: none;
    
  }

  /* Hero text */
  .hero-text { display: flex; flex-direction: column; gap: 20px; }

  .hero-eyebrow {
    font-family: 'VT323', monospace;
    font-size: 1.12rem; letter-spacing: .3em;
    color:var(--gold); 
  }
  .hero-title {
    font-family: 'Press Start 2P', sans-serif;
    font-size: clamp(3rem, 6vw, 5.5rem);
    letter-spacing: .05em; line-height: .95; margin: 0;
  }

  .creator-link {
    display: flex; align-items: center; gap: 14px;
    text-decoration: none; color: inherit;
    padding: 12px 16px;
    border: 1px solid rgba(232,93,130,0.21);
    background: rgba(232,93,130,0.17);
    transition: border-color .25s, background .25s;
    border-radius: 10px;
    align-self: flex-start;
  }
  .creator-link:hover { border-color: rgba(232,93,130,0.35); background: rgba(232,93,130,0.2); }
  .creator-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    border: 1px solid rgba(232,93,130,0.35);
    background: rgba(232,93,130,0.2);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Press Start 2P', sans-serif; font-size: 1.2rem;
    color: var(--neon-cyan); flex-shrink: 0; overflow: hidden;
  }
  .creator-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .creator-name {
    font-family: 'VT323', monospace;
    font-size: 1.22rem; letter-spacing: .15em; color: rgba(245,205,210,0.8);
  }
  .creator-label {
    font-family: 'VT323', monospace;
    font-size: 1.02rem; letter-spacing: .18em; color: rgba(232,93,130,0.4); margin-top: 2px;
  }

  /* Stats */
  .stats-row { display: flex; align-items: center; gap: 24px; }
  .stat-item { display: flex; flex-direction: column; gap: 2px; }
  .stat-val {
    font-family: 'Press Start 2P', sans-serif; font-size: 1.8rem; line-height: 1;
    color: var(--neon-cyan); 
  }
  .stat-key {
    font-family: 'VT323', monospace;
    font-size: 1.02rem; letter-spacing: .2em; color: rgba(245,205,210,0.55);
  }
  .stat-divider { width: 1px; height: 36px; background: rgba(232,93,130,0.25); }

  /* Reactions */
  .reactions { display: flex; gap: 8px; flex-wrap: wrap; }
  .react-btn {
    display: flex; align-items: center; gap: 8px;
    font-family: 'VT323', monospace;
    font-size: 1.12rem; letter-spacing: .12em;
    background: rgba(232,93,130,0.18); border: 1px solid rgba(232,93,130,0.27);
    color: rgba(245,205,210,0.65); padding: 10px 18px;
    cursor: var(--cursor-pointer); transition: all .25s;
    border-radius: 10px;
  }
  .react-btn:hover { color: rgba(245,205,210,0.8); border-color: rgba(232,93,130,0.45); }
  .react-count { font-size: 1.2rem; opacity: .7; }
  .react-btn--like.active  { color: var(--neon-cyan);   border-color: var(--neon-cyan);   background: rgba(232,93,130,0.23);   }
  .react-btn--dislike.active { color: var(--neon-pink); border-color: var(--neon-pink);   background: rgba(124,77,191,0.23);   }
  .react-btn--superlike { border-color: rgba(240,137,158,0.35); color: rgba(240,137,158,0.5); }
  .react-btn--superlike:hover { border-color: rgba(240,137,158,0.5); color: var(--neon-yellow); }
  .react-btn--superlike.active { color: var(--neon-yellow); border-color: var(--neon-yellow); background: rgba(240,137,158,0.23);  }

  /* Play button */
  .play-btn {
    display: inline-flex; align-items: center; gap: 12px; align-self: flex-start;
    font-family: 'VT323', monospace;
    font-size: 1.22rem; letter-spacing: .2em; text-transform: uppercase;
    text-decoration: none;
    background: rgba(232,93,130,0.23); border: 1px solid rgba(232,93,130,0.4);
    color: var(--neon-cyan); 
    padding: 14px 32px;
    transition: all .25s;
    border-radius: 10px;
    
  }
  .play-btn:hover {
    background: rgba(232,93,130,0.3);
    
  }
  .play-icon { font-size: 1rem; }

  /* BODY */
  .body-section {
    max-width: 1200px; margin: 40px auto 0;
    padding: 0 60px;
    display: flex; flex-direction: column; gap: 20px;
  }
  .info-card {
    background: rgba(30,14,30,.6);
    border: 1px solid rgba(232,93,130,0.23);
    padding: 28px 32px;
    display: flex; flex-direction: column; gap: 16px;
    backdrop-filter: blur(8px);
  }
  .card-eyebrow {
    font-family: 'VT323', monospace;
    font-size: 1.08rem; letter-spacing: .28em; color:rgba(232,93,130,0.4);
  }
  .description {
    font-family: 'VT323', monospace;
    font-size: 1.22rem; letter-spacing: .05em; line-height: 1.9;
    color: rgba(245,205,210,0.7); margin: 0;
  }
  .tag-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag {
    font-family: 'VT323', monospace;
    font-size: 1.05rem; letter-spacing: .15em;
    color: rgba(124,77,191,0.7); border: 1px solid rgba(124,77,191,0.35);
    background: rgba(124,77,191,0.19); padding: 5px 14px;
    border-radius: 10px;
  }

  @media (max-width: 900px) {
    .hero { padding: 90px 24px 48px; }
    .hero-inner { grid-template-columns: 1fr; gap: 28px; }
    .body-section { padding: 0 24px; }
    .cover-wrap { max-width: 480px; }
  }
</style>