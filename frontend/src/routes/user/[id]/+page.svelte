<script lang="ts">
  import { page } from '$app/state';
  import Navbar     from '$lib/components/Navbar.svelte';
  import Footer     from '$lib/components/Footer.svelte';
  import LoginModal from '$lib/components/LoginModal.svelte';

  let session    = $derived(page.data.session);
  let user       = $derived(session?.user);
  let isLoggedIn = $derived(session?.authenticated ?? false);
  let isAdmin    = $derived(user?.userType === 'admin');

  let { data } = $props();
  let profileUser = $state(data.profileUser);
  let games       = $state(data.games ?? []);

  let showLogin = $state(false);

  function initials(name: string | null): string {
    if (!name) return '?';
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function gameGenre(g: any) {
    return g.tags?.[0]?.tag?.category ?? g.tags?.[0]?.tag?.name ?? 'Game';
  }

  function formatScore(n: number) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  const iconColors = ['#bf00ff','#00ccff','#ff3300','#00cc44','#ffee00','#ff0066','#ff9900'];
  const icons      = ['⬡','◈','⟁','✦','◉','⟡','◆'];
</script>

<svelte:head>
  <title>{profileUser?.name ?? 'Developer'} // PROGCHAMP</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Oxanium:wght@300;400;600;800&display=swap" rel="stylesheet" />
</svelte:head>

<Navbar
  {isLoggedIn}
  {isAdmin}
  avatarUrl={user?.avatarUrl}
  userName={user?.name}
  onLoginClick={() => (showLogin = true)}
/>

<div class="profile-page">

  <!-- BANNER -->
  <div class="banner">
    <div class="banner-orb orb1"></div>
    <div class="banner-orb orb2"></div>
    <div class="banner-inner">
      <div class="banner-eyebrow">// DEVELOPER PROFILE</div>
      <div class="avatar-wrap">
        {#if profileUser?.avatarUrl}
          <img class="avatar-img" src={profileUser.avatarUrl} alt={profileUser.name ?? ''} referrerpolicy="no-referrer" />
        {:else}
          <div class="avatar-fallback">{initials(profileUser?.name ?? null)}</div>
        {/if}
        <div class="avatar-ring"></div>
      </div>
      <h1 class="banner-name">{profileUser?.name ?? '—'}</h1>
      <div class="banner-email">{profileUser?.email ?? ''}</div>
      <div class="banner-stats">
        <div class="stat-chip">
          <span class="stat-chip-val">{games.length}</span>
          <span class="stat-chip-label">GAMES</span>
        </div>
        <div class="stat-chip">
          <span class="stat-chip-val">{games.reduce((a: number, g: any) => a + (g.countLikes ?? 0), 0)}</span>
          <span class="stat-chip-label">TOTAL LIKES</span>
        </div>
        <div class="stat-chip">
          <span class="stat-chip-val">{games.reduce((a: number, g: any) => a + (g.viewCount ?? 0), 0)}</span>
          <span class="stat-chip-label">TOTAL PLAYS</span>
        </div>
      </div>
    </div>
  </div>

  <!-- GAMES -->
  <div class="games-section">
    <div class="section-eyebrow">// GAMES BY THIS DEVELOPER</div>

    {#if games.length === 0}
      <div class="empty-state">
        <div class="empty-icon">◌</div>
        <div class="empty-title">NO GAMES YET</div>
        <div class="empty-sub">This developer hasn't published any games.</div>
      </div>
    {:else}
      <div class="games-grid">
        {#each games as game, i}
          <a href="/game/{game.id}" class="game-card">
            <div class="game-thumb">
              {#if game.coverMedia?.r2Key}
                <img src="/media/{game.coverMedia.r2Key}" alt={game.title} class="thumb-img" />
              {:else}
                <div class="thumb-placeholder" style="background:radial-gradient(circle at 30% 30%,{iconColors[i % iconColors.length]}22,transparent 70%)">
                  <span class="thumb-icon" style="color:{iconColors[i % iconColors.length]}">{icons[i % icons.length]}</span>
                </div>
              {/if}
              <div class="game-overlay"></div>
              <div class="game-hover-btn">PLAY NOW</div>
            </div>
            <div class="game-info">
              <div class="game-genre">{gameGenre(game).toUpperCase()}</div>
              <div class="game-title">{game.title}</div>
              <div class="game-meta">
                {#if (game.score ?? 0) !== 0}
                  <span class="game-rating">★ {formatScore(game.score)}</span>
                {/if}
                {#if (game.viewCount ?? 0) > 0}
                  <span class="game-plays">{formatScore(game.viewCount)} PLAYS</span>
                {/if}
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>

</div>

<Footer {isAdmin} />
<LoginModal open={showLogin} onClose={() => (showLogin = false)} />

<style>
  .profile-page { position: relative; z-index: 10; min-height: 100vh; padding-bottom: 80px; }

  /* BANNER */
  .banner {
    position: relative; overflow: hidden;
    padding: 120px 60px 60px;
    border-bottom: 1px solid rgba(0,255,249,.08);
    text-align: center;
  }
  .banner-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
  .banner-orb.orb1 { width: 500px; height: 500px; background: rgba(0,255,249,.06); top: -150px; left: -100px; }
  .banner-orb.orb2 { width: 400px; height: 400px; background: rgba(191,0,255,.05); bottom: -100px; right: -80px; }
  .banner-inner { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 16px; }

  .banner-eyebrow {
    font-family: 'Share Tech Mono', monospace;
    font-size: .62rem; letter-spacing: .35em;
    color: var(--neon-cyan); text-shadow: 0 0 8px var(--neon-cyan);
  }

  .avatar-wrap { position: relative; width: 96px; height: 96px; margin: 8px 0; }
  .avatar-img {
    width: 100%; height: 100%; border-radius: 50%;
    object-fit: cover; border: 2px solid rgba(0,255,249,.3);
  }
  .avatar-fallback {
    width: 100%; height: 100%; border-radius: 50%;
    background: linear-gradient(135deg, var(--neon-purple), var(--neon-pink));
    display: flex; align-items: center; justify-content: center;
    font-family: 'Bebas Neue', sans-serif; font-size: 2.4rem; color: white;
    border: 2px solid rgba(0,255,249,.3);
  }
  .avatar-ring {
    position: absolute; inset: -4px; border-radius: 50%;
    border: 1px solid rgba(0,255,249,.25); pointer-events: none;
    animation: ringPulse 3s ease-in-out infinite;
  }
  @keyframes ringPulse {
    0%, 100% { box-shadow: 0 0 10px rgba(0,255,249,.15); }
    50%       { box-shadow: 0 0 24px rgba(0,255,249,.35); }
  }

  .banner-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(2.5rem, 5vw, 4rem); letter-spacing: .06em; line-height: 1; margin: 0;
  }
  .banner-email {
    font-family: 'Share Tech Mono', monospace;
    font-size: .68rem; letter-spacing: .1em; color: rgba(224,224,255,.3);
  }

  .banner-stats { display: flex; gap: 32px; margin-top: 8px; }
  .stat-chip { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .stat-chip-val {
    font-family: 'Bebas Neue', sans-serif; font-size: 2rem; line-height: 1;
    color: var(--neon-cyan); text-shadow: 0 0 16px var(--neon-cyan);
  }
  .stat-chip-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: .52rem; letter-spacing: .2em; color: rgba(224,224,255,.3);
  }

  /* GAMES SECTION */
  .games-section { max-width: 1200px; margin: 48px auto 0; padding: 0 60px; }
  .section-eyebrow {
    font-family: 'Share Tech Mono', monospace;
    font-size: .62rem; letter-spacing: .3em;
    color: rgba(0,255,249,.4); margin-bottom: 28px;
  }

  .games-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; }

  .game-card {
    display: flex; flex-direction: column;
    text-decoration: none; color: var(--text);
    background: rgba(10,0,20,.7);
    border: 1px solid rgba(0,255,249,.08);
    transition: border-color .3s, transform .3s, box-shadow .3s;
    cursor: none; overflow: hidden;
    clip-path: polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);
  }
  .game-card:hover {
    border-color: rgba(0,255,249,.3);
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0,255,249,.08);
  }
  .game-thumb { position: relative; aspect-ratio: 16/9; overflow: hidden; }
  .thumb-img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
  .game-card:hover .thumb-img { transform: scale(1.05); }
  .thumb-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
  .thumb-icon { font-size: 3rem; opacity: .6; }
  .game-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(3,0,10,.9) 0%, transparent 60%); }
  .game-hover-btn {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font-family: 'Share Tech Mono', monospace; font-size: .7rem; letter-spacing: .2em;
    color: var(--neon-cyan); text-shadow: 0 0 12px var(--neon-cyan);
    opacity: 0; transition: opacity .3s; background: rgba(3,0,10,.4);
  }
  .game-card:hover .game-hover-btn { opacity: 1; }

  .game-info { padding: 16px 18px 18px; }
  .game-genre {
    font-family: 'Share Tech Mono', monospace; font-size: .58rem; letter-spacing: .2em;
    color: var(--neon-purple); text-shadow: 0 0 6px var(--neon-purple); margin-bottom: 6px;
  }
  .game-title {
    font-family: 'Bebas Neue', sans-serif; font-size: 1.4rem;
    letter-spacing: .06em; line-height: 1; margin-bottom: 8px;
  }
  .game-meta { display: flex; align-items: center; gap: 12px; }
  .game-rating {
    font-family: 'Share Tech Mono', monospace; font-size: .65rem;
    color: var(--neon-yellow); text-shadow: 0 0 6px var(--neon-yellow);
  }
  .game-plays {
    font-family: 'Share Tech Mono', monospace; font-size: .58rem;
    letter-spacing: .12em; color: rgba(0,255,249,.4);
  }

  .empty-state { text-align: center; padding: 80px 20px; }
  .empty-icon { font-size: 3rem; color: rgba(0,255,249,.15); margin-bottom: 16px; }
  .empty-title {
    font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem;
    letter-spacing: .1em; color: rgba(224,224,255,.3); margin-bottom: 8px;
  }
  .empty-sub {
    font-family: 'Share Tech Mono', monospace; font-size: .65rem;
    letter-spacing: .1em; color: rgba(224,224,255,.2);
  }

  @media (max-width: 768px) {
    .banner { padding: 100px 24px 40px; }
    .games-section { padding: 0 24px; }
    .banner-stats { gap: 20px; }
  }
</style>