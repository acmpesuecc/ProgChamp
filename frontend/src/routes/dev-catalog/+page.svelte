''
<script lang="ts">
  import { goto } from '$app/navigation';

  import Navbar        from '$lib/components/Navbar.svelte';
  import MarqueeTicker from '$lib/components/MarqueeTicker.svelte';
  import GameCard      from '$lib/components/GameCard.svelte';
  import CategoryItem  from '$lib/components/CategoryItem.svelte';
  import UploadCTA     from '$lib/components/UploadCTA.svelte';
  import LoginModal    from '$lib/components/LoginModal.svelte';
  import Footer        from '$lib/components/Footer.svelte';

  let showLogin  = $state(false);
  let isLoggedIn = $state(false); 
  let isAdmin    = $state(false);

  function goTo(path: string, requiresAuth = false) {
    if (requiresAuth && !isLoggedIn) { showLogin = true; }
    else { goto(path); }
  }

  // ── Developer Profile Data ─────────────────────────────────────────────────
  let dev = $state({
    username: 'Ieatfingies',
    displayName: 'IEATFINGIES',
    bio: 'Building the next generation of web-based retro games. Focus on Action RPGs and Space Sims. Pushing hardware limits to bring high-performance engines to the browser.',
    joinedAt: '2026',
    location: 'Bangalore, IN',
    email: 'dev@ieatfingies.com',
    github: 'https://github.com/Ieatfingies',
    website: 'https://github.com/Ieatfingies'
  });

  // ── Added publishedAt to all games ────────────────────────────────────────
  let games = $state([
    { id: '1', title: 'VOID SYNDICATE', developer: 'IEATFINGIES', genre: 'Action RPG', rating: 4.8, players: 12400, publishedAt: '2025-11-03', thumbnail: 'https://via.placeholder.com/640x360' },
    { id: '2', title: 'DEPTH PROTOCOL', developer: 'IEATFINGIES', genre: 'Horror', rating: 4.5, players: 8900, publishedAt: '2025-08-17', thumbnail: 'https://via.placeholder.com/640x360' },
    { id: '3', title: 'NEON DRIFT', developer: 'IEATFINGIES', genre: 'Racing', rating: 4.2, players: 5300, publishedAt: '2025-05-29', thumbnail: 'https://via.placeholder.com/640x360' }
  ]);

  let categories = $state(['Action RPG', 'Shooter', 'Racing', 'Strategy', 'Arcade', 'Horror']);

  let totalPlayers = $derived(games.reduce((a, g) => a + g.players, 0));
  let avgRating = $derived(() => {
    const rated = games.filter(g => g.rating > 0);
    return rated.length ? (rated.reduce((a, g) => a + g.rating, 0) / rated.length).toFixed(1) : '—';
  });

  function formatPlayers(n: number): string {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();
  }
</script>

<svelte:head>
  <title>PROGCHAMP // {dev.displayName}</title>
</svelte:head>

<div class="grid-bg"></div>

<Navbar {isLoggedIn} {isAdmin} avatarUrl={null} userName="IEATFINGIES" onLoginClick={() => (showLogin = true)} />

<main class="catalog-main">
  <div class="page-eyebrow">// DEVELOPER PROFILE</div>
  
  <section class="profile-panel">
    <div class="avatar-wrap">
      <div class="avatar">
        <span class="avatar-initials">{dev.displayName.slice(0, 2)}</span>
      </div>
      <div class="avatar-ring"></div>
    </div>

    <div class="profile-info">
      <h1 class="profile-name">{dev.displayName}</h1>
      <p class="profile-handle">@{dev.username}</p>
      <p class="profile-bio">{dev.bio}</p>
      
      <div class="profile-actions">
        {#if dev.github}
          <a href={dev.github} target="_blank" class="interact-btn github-btn">⎇ GITHUB</a>
        {/if}
        {#if dev.email}
          <a href="mailto:{dev.email}" class="interact-btn email-btn">✉ EMAIL</a>
        {/if}
        {#if dev.website}
          <a href={dev.website} target="_blank" class="interact-btn web-btn">↗ PORTFOLIO</a>
        {/if}
        <span class="meta-chip location-chip">◎ {dev.location}</span>
      </div>
    </div>

    <div class="profile-stats">
      <div class="stat-block">
        <span class="stat-value">{games.length}</span>
        <span class="stat-label">GAMES</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-block">
        <span class="stat-value">{formatPlayers(totalPlayers)}</span>
        <span class="stat-label">TOTAL PLAYERS</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-block">
        <span class="stat-value">{avgRating()}</span>
        <span class="stat-label">AVG RATING</span>
      </div>
    </div>
  </section>

  <div class="games-header">
    <span class="games-count">// {games.length} PUBLISHED GAMES</span>
    <div class="games-rule"></div>
  </div>

  <section class="games-grid">
    {#each games as game}
      <GameCard {game} />
    {/each}
  </section>
</main>

<MarqueeTicker />

<section class="explore-section">
  <div class="section-header">
    <h2 class="section-title">EXPLORE THE <span class="accent-pink">VAULT</span></h2>
  </div>
  <div class="cat-grid">
    {#each categories as category}
      <CategoryItem {category} />
    {/each}
  </div>
</section>

<UploadCTA onUploadClick={() => goTo('/upload', true)} />
<Footer {isAdmin} />
<LoginModal open={showLogin} onClose={() => (showLogin = false)} />

<style>
  /* ── Layout & Spacing ── */
  .catalog-main { max-width: 1200px; margin: 120px auto 80px; padding: 0 24px; }
  .explore-section { max-width: 1200px; margin: 80px auto; padding: 0 24px; }
  .page-eyebrow { font-family: 'Share Tech Mono', monospace; font-size: 0.8rem; color: var(--neon-cyan); margin-bottom: 16px; letter-spacing: 0.2em; }

  /* ── Profile Panel ── */
  .profile-panel { display: grid; grid-template-columns: auto 1fr auto; gap: 40px; align-items: center; padding: 40px; background: rgba(10, 0, 20, 0.8); border: 1px solid rgba(0, 255, 249, 0.2); clip-path: polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px)); margin-bottom: 60px; box-shadow: 0 0 30px rgba(0, 255, 249, 0.05); }

  /* ── Avatar ── */
  .avatar-wrap { position: relative; width: 140px; height: 140px; }
  .avatar { width: 100%; height: 100%; background: linear-gradient(135deg, rgba(0,255,249,0.1), rgba(191,0,255,0.2)); border: 2px solid var(--neon-cyan); clip-path: polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%); display: flex; align-items: center; justify-content: center; }
  .avatar-initials { font-family: 'Bebas Neue', sans-serif; font-size: 3.5rem; color: var(--neon-cyan); text-shadow: 0 0 15px var(--neon-cyan); }
  .avatar-ring { position: absolute; inset: -8px; border: 1px solid rgba(0, 255, 249, 0.3); clip-path: polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%); animation: ringPulse 3s infinite ease-in-out; }
  @keyframes ringPulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }

  /* ── Info block ── */
  .profile-name { font-family: 'Bebas Neue', sans-serif; font-size: 4rem; color: var(--text); line-height: 1; margin-bottom: 4px; text-shadow: 0 0 20px rgba(224, 224, 255, 0.2); }
  .profile-handle { font-family: 'Share Tech Mono', monospace; font-size: 0.9rem; color: var(--neon-pink); margin-bottom: 16px; }
  .profile-bio { font-family: 'Oxanium', sans-serif; font-size: 0.95rem; color: rgba(224, 224, 255, 0.7); line-height: 1.6; max-width: 600px; margin-bottom: 24px; }

  /* ── New Interactive Buttons ── */
  .profile-actions { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
  .interact-btn { font-family: 'Share Tech Mono', monospace; font-size: 0.75rem; color: var(--text); text-decoration: none; padding: 8px 16px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.2); clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px); transition: all 0.2s ease; cursor: pointer; }
  
  .github-btn:hover { background: rgba(0, 255, 249, 0.1); border-color: var(--neon-cyan); color: var(--neon-cyan); box-shadow: 0 0 15px rgba(0, 255, 249, 0.3); transform: translateY(-2px); }
  .email-btn:hover { background: rgba(255, 0, 110, 0.1); border-color: var(--neon-pink); color: var(--neon-pink); box-shadow: 0 0 15px rgba(255, 0, 110, 0.3); transform: translateY(-2px); }
  .web-btn:hover { background: rgba(255, 230, 0, 0.1); border-color: var(--neon-yellow); color: var(--neon-yellow); box-shadow: 0 0 15px rgba(255, 230, 0, 0.3); transform: translateY(-2px); }
  
  .meta-chip { font-family: 'Share Tech Mono', monospace; font-size: 0.7rem; color: rgba(0, 255, 249, 0.6); padding: 8px 12px; border: 1px dotted rgba(0, 255, 249, 0.3); background: transparent; }

  /* ── Stats block ── */
  .profile-stats { display: flex; flex-direction: column; background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(0, 255, 249, 0.15); padding: 24px; clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px)); }
  .stat-block { text-align: center; padding: 12px 0; }
  .stat-value { display: block; font-family: 'Bebas Neue', sans-serif; font-size: 2.5rem; color: var(--neon-cyan); line-height: 1; }
  .stat-label { font-family: 'Share Tech Mono', monospace; font-size: 0.65rem; color: rgba(224, 224, 255, 0.5); }
  .stat-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(0,255,249,0.3), transparent); }

  /* ── Games Header & Grid ── */
  .games-header { display: flex; align-items: center; gap: 16px; margin-bottom: 30px; }
  .games-count { font-family: 'Share Tech Mono', monospace; color: var(--neon-yellow); font-size: 0.8rem; }
  .games-rule { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(255,230,0,0.3), transparent); }
  .games-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }

  /* ── Explore Section ── */
  .section-header { border-bottom: 1px solid rgba(191, 0, 255, 0.3); padding-bottom: 12px; margin-bottom: 30px; }
  .section-title { font-family: 'Bebas Neue', sans-serif; font-size: 3rem; }
  .accent-pink { color: var(--neon-pink); text-shadow: 0 0 20px var(--neon-pink); }
  .cat-grid { display: flex; flex-wrap: wrap; gap: 16px; }
</style>