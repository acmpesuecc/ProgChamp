<script lang="ts">
  // ── Types ──────────────────────────────────────────────────────────────────
  type Game = {
    id: string;
    title: string;
    genre: string;
    description: string;
    url: string;
    thumbnail: string | null;
    rating: number;
    players: number;
    publishedAt: string;
  };

  type Developer = {
    username: string;
    displayName: string;
    bio: string;
    joinedAt: string;
    location?: string;
    website?: string;
  };

  // ── Props (swap mock data for real server load data once backend is wired) ─
  // Replace with: let { data } = $props(); and use data.dev / data.games
  let dev = $state<Developer>({
    username: 'voidcoder',
    displayName: 'VOID CODER',
    bio: 'Independent game developer pushing the limits of browser-based gameplay. Specialising in action RPGs and atmospheric horror experiences. Every project is an experiment in what the web can become.',
    joinedAt: '2024-01-15',
    location: 'Tokyo, JP',
    website: 'https://voidcoder.dev',
  });

  let games = $state<Game[]>([
    {
      id: '1',
      title: 'VOID SYNDICATE',
      genre: 'Action RPG',
      description: 'A relentless cyberpunk action RPG set in a collapsed megacity. Fight through procedurally generated districts and expose the corporate conspiracy.',
      url: 'https://games.example.com/void-syndicate',
      thumbnail: null,
      rating: 4.8,
      players: 12400,
      publishedAt: '2025-11-03',
    },
    {
      id: '2',
      title: 'DEPTH PROTOCOL',
      genre: 'Horror',
      description: 'Survive an abandoned deep-sea facility overrun by an unknown organism. Resource management meets psychological horror.',
      url: 'https://games.example.com/depth-protocol',
      thumbnail: null,
      rating: 4.5,
      players: 8900,
      publishedAt: '2025-08-17',
    },
    {
      id: '3',
      title: 'NEON DRIFT',
      genre: 'Racing',
      description: 'High-speed racing through neon-lit urban canyons. Draft, boost, and cut corners to dominate the leaderboard.',
      url: 'https://games.example.com/neon-drift',
      thumbnail: null,
      rating: 4.2,
      players: 5300,
      publishedAt: '2025-05-29',
    },
    {
      id: '4',
      title: 'FRACTAL SIEGE',
      genre: 'Strategy',
      description: 'Defend against infinite waves of self-replicating enemies in a mathematically generated battlefield.',
      url: 'https://games.example.com/fractal-siege',
      thumbnail: null,
      rating: 0,
      players: 0,
      publishedAt: '2026-01-10',
    },
  ]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  let totalPlayers = $derived(games.reduce((a, g) => a + g.players, 0));

  let avgRating = $derived(() => {
    const rated = games.filter(g => g.rating > 0);
    return rated.length
      ? (rated.reduce((a, g) => a + g.rating, 0) / rated.length).toFixed(1)
      : '—';
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function formatPlayers(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).toUpperCase();
  }

  function genreColor(genre: string): string {
    const map: Record<string, string> = {
      'Action RPG': 'var(--neon-purple)',
      'Horror':     'var(--neon-pink)',
      'Racing':     'var(--neon-cyan)',
      'Strategy':   'var(--neon-yellow)',
      'Shooter':    'var(--neon-pink)',
      'Arcade':     'var(--neon-cyan)',
      'Puzzle':     'var(--neon-purple)',
    };
    return map[genre] ?? 'var(--neon-purple)';
  }
</script>

<!-- ── PAGE HEADER ───────────────────────────────────────────────────────────── -->
<div class="page-header">
  <p class="page-eyebrow">// DEVELOPER PROFILE</p>
  <h1 class="page-title">{dev.displayName}</h1>
</div>

<!-- ── MAIN ──────────────────────────────────────────────────────────────────── -->
<main class="catalog-main">

  <!-- Profile panel -->
  <section class="profile-panel">

    <!-- Avatar -->
    <div class="avatar-wrap">
      <div class="avatar">
        <span class="avatar-initials">{dev.displayName.slice(0, 2)}</span>
      </div>
      <div class="avatar-ring"></div>
    </div>

    <!-- Info -->
    <div class="profile-info">
      <h2 class="profile-name">{dev.displayName}</h2>
      <p class="profile-handle">@{dev.username}</p>
      <p class="profile-bio">{dev.bio}</p>

      <div class="profile-meta">
        {#if dev.location}
          <span class="meta-chip">◎ {dev.location}</span>
        {/if}
        {#if dev.website}
          <a href={dev.website} class="meta-chip meta-chip--link" target="_blank" rel="noopener">
            ↗ {dev.website.replace('https://', '')}
          </a>
        {/if}
        <span class="meta-chip">⌚ JOINED {formatDate(dev.joinedAt)}</span>
      </div>
    </div>

    <!-- Stats -->
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

  <!-- Games section -->
  <div class="games-header">
    <span class="games-count">// {games.length} PUBLISHED GAMES</span>
    <div class="games-rule"></div>
  </div>

  <section class="games-grid">
    {#each games as game (game.id)}
      <article class="game-card">

        <!-- Thumbnail -->
        <div class="card-thumb">
          {#if game.thumbnail}
            <img src={game.thumbnail} alt={game.title} class="thumb-img" />
          {:else}
            <div class="thumb-placeholder" style="--ph-color: {genreColor(game.genre)}">
              <span class="ph-icon">◈</span>
            </div>
          {/if}
          <div class="thumb-overlay">
            <a href={game.url} target="_blank" rel="noopener" class="play-btn">PLAY NOW</a>
          </div>
          <span class="genre-label">{game.genre}</span>
        </div>

        <!-- Body -->
        <div class="card-body">
          <h3 class="card-title">{game.title}</h3>
          <p class="card-desc">{game.description}</p>
          <div class="card-foot">
            <div class="card-stats">
              {#if game.rating > 0}
                <span class="card-rating">★ {game.rating}</span>
              {/if}
              {#if game.players > 0}
                <span class="card-players">◉ {formatPlayers(game.players)}</span>
              {/if}
            </div>
            <span class="card-date">{formatDate(game.publishedAt)}</span>
          </div>
        </div>

      </article>
    {/each}
  </section>

</main>

<style>
  /* ── Page header ─────────────────────────────────────────────────────────── */
  .page-header {
    padding: 120px 24px 0;
    max-width: 1200px;
    margin: 0 auto;
  }
  .page-eyebrow {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.65rem;
    color: rgba(0, 255, 249, 0.5);
    margin-bottom: 8px;
  }
  .page-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(3.5rem, 7vw, 6rem);
    color: var(--text);
    line-height: 1;
    text-shadow: 0 0 40px rgba(0, 255, 249, 0.15);
  }

  /* ── Main wrapper ────────────────────────────────────────────────────────── */
  .catalog-main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 24px 80px;
  }

  /* ── Profile panel ───────────────────────────────────────────────────────── */
  .profile-panel {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 40px;
    align-items: start;
    padding: 40px;
    background: rgba(10, 0, 20, 0.6);
    border: 1px solid rgba(0, 255, 249, 0.15);
    clip-path: polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 24px 100%, 0 calc(100% - 24px));
    margin-bottom: 48px;
  }

  /* Avatar */
  .avatar-wrap {
    position: relative;
    width: 120px;
    height: 120px;
    flex-shrink: 0;
  }
  .avatar {
    width: 120px;
    height: 120px;
    background: linear-gradient(135deg, rgba(0,255,249,.15), rgba(191,0,255,.15));
    border: 2px solid var(--neon-cyan);
    clip-path: polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 8px var(--neon-cyan), 0 0 20px rgba(0,255,249,.35);
  }
  .avatar-initials {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 2.8rem;
    color: var(--neon-cyan);
    text-shadow: 0 0 10px var(--neon-cyan);
  }
  .avatar-ring {
    position: absolute;
    inset: -6px;
    border: 1px solid rgba(0, 255, 249, 0.25);
    clip-path: polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%);
    animation: ringPulse 3s ease-in-out infinite;
  }
  @keyframes ringPulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50%       { opacity: 0.9; transform: scale(1.04); }
  }

  /* Info */
  .profile-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(1.8rem, 3vw, 2.6rem);
    color: var(--text);
    line-height: 1;
    margin-bottom: 4px;
  }
  .profile-handle {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.72rem;
    color: var(--neon-cyan);
    margin-bottom: 16px;
  }
  .profile-bio {
    font-family: 'Oxanium', sans-serif;
    font-size: 0.88rem;
    color: rgba(224, 224, 255, 0.65);
    line-height: 1.7;
    max-width: 560px;
    margin-bottom: 20px;
  }
  .profile-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .meta-chip {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.6rem;
    color: rgba(224, 224, 255, 0.5);
    padding: 4px 10px;
    border: 1px solid rgba(0, 255, 249, 0.2);
    clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
    background: rgba(0, 255, 249, 0.04);
  }
  a.meta-chip--link {
    color: var(--neon-cyan);
    text-decoration: none;
  }
  a.meta-chip--link:hover {
    background: rgba(0, 255, 249, 0.1);
  }

  /* Stats */
  .profile-stats {
    display: flex;
    flex-direction: column;
    align-self: center;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(0, 255, 249, 0.12);
    clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
    padding: 24px 32px;
    min-width: 180px;
  }
  .stat-block {
    text-align: center;
    padding: 12px 0;
  }
  .stat-value {
    display: block;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 2.4rem;
    color: var(--neon-cyan);
    text-shadow: 0 0 8px var(--neon-cyan), 0 0 20px rgba(0,255,249,.35);
    line-height: 1;
  }
  .stat-label {
    display: block;
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.58rem;
    color: rgba(224, 224, 255, 0.4);
    margin-top: 4px;
  }
  .stat-divider {
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,255,249,.2), transparent);
  }

  /* ── Games header ────────────────────────────────────────────────────────── */
  .games-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
  }
  .games-count {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.65rem;
    color: rgba(0, 255, 249, 0.5);
    white-space: nowrap;
  }
  .games-rule {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(0,255,249,.2), transparent);
  }

  /* ── Games grid ──────────────────────────────────────────────────────────── */
  .games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 24px;
  }

  /* Card */
  .game-card {
    background: rgba(10, 0, 20, 0.8);
    border: 1px solid rgba(0, 255, 249, 0.08);
    clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    overflow: hidden;
  }
  .game-card:hover {
    transform: translateY(-4px);
    border-color: rgba(0, 255, 249, 0.3);
    box-shadow: 0 12px 40px rgba(0, 255, 249, 0.08);
  }
  .game-card:hover .thumb-img,
  .game-card:hover .thumb-placeholder { transform: scale(1.05); }
  .game-card:hover .thumb-overlay     { opacity: 1; }

  /* Thumbnail */
  .card-thumb {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
  }
  .thumb-img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  .thumb-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, var(--dark2), rgba(10,0,20,1));
    transition: transform 0.3s ease;
  }
  .ph-icon {
    font-size: 3rem;
    color: var(--ph-color, var(--neon-purple));
    text-shadow: 0 0 20px var(--ph-color, var(--neon-purple));
    opacity: 0.6;
  }
  .thumb-overlay {
    position: absolute; inset: 0;
    background: rgba(3, 0, 10, 0.7);
    display: flex; align-items: center; justify-content: center;
    opacity: 0;
    transition: opacity 0.25s ease;
  }
  .play-btn {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.72rem;
    color: var(--neon-cyan);
    text-decoration: none;
    padding: 8px 20px;
    border: 1px solid var(--neon-cyan);
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
    box-shadow: 0 0 8px var(--neon-cyan), 0 0 20px rgba(0,255,249,.3);
    transition: background 0.2s;
  }
  .play-btn:hover { background: rgba(0, 255, 249, 0.12); }

  /* Genre label */
  .genre-label {
    position: absolute;
    bottom: 10px; left: 10px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.58rem;
    color: var(--neon-purple);
    text-shadow: 0 0 8px var(--neon-purple);
    background: rgba(10, 0, 20, 0.85);
    padding: 3px 8px;
    border: 1px solid rgba(191, 0, 255, 0.4);
    clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* Card body */
  .card-body  { padding: 18px 18px 14px; }
  .card-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.6rem;
    color: var(--text);
    line-height: 1;
    margin-bottom: 10px;
  }
  .card-desc {
    font-family: 'Oxanium', sans-serif;
    font-size: 0.8rem;
    color: rgba(224, 224, 255, 0.55);
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 14px;
  }
  .card-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .card-stats  { display: flex; gap: 12px; }
  .card-rating {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.62rem;
    color: var(--neon-yellow);
    text-shadow: 0 0 8px rgba(255, 230, 0, 0.5);
  }
  .card-players {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.62rem;
    color: rgba(0, 255, 249, 0.6);
  }
  .card-date {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.58rem;
    color: rgba(224, 224, 255, 0.25);
  }

  /* ── Responsive ──────────────────────────────────────────────────────────── */
  @media (max-width: 900px) {
    .profile-panel  { grid-template-columns: auto 1fr; }
    .profile-stats  { grid-column: 1 / -1; flex-direction: row; padding: 16px 24px; }
    .stat-divider   { width: 1px; height: auto; background: linear-gradient(180deg, transparent, rgba(0,255,249,.2), transparent); }
  }
  @media (max-width: 600px) {
    .profile-panel  { grid-template-columns: 1fr; }
    .avatar-wrap    { margin: 0 auto; }
    .profile-info   { text-align: center; }
    .profile-meta   { justify-content: center; }
    .profile-stats  { flex-direction: column; }
    .stat-divider   { width: 100%; height: 1px; }
    .games-grid     { grid-template-columns: 1fr; }
  }
</style>