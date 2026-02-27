<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  // ─────────────────────────────────────────────
  // AUTH — swap this block for your real auth store
  // e.g. export let data; then: $: user = data.user;
  // ─────────────────────────────────────────────
  let isLoggedIn = false;
  let isAdmin    = false;   // set true when user has admin role

  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────
  let showLogin    = false;
  let searchQuery  = '';
  let loginEmail   = '';
  let loginPassword = '';
  let loginError   = '';
  let isLoggingIn  = false;
  let cursorEl;
  let dotEl;

  // ─────────────────────────────────────────────
  // DATA
  // ─────────────────────────────────────────────
  const games = [
    { art: 'game-art-1', icon: '⬡', iconColor: '#bf00ff', genre: 'RPG • OPEN WORLD',    name: 'VOID SYNDICATE', slug: 'void-syndicate', rating: '★★★★★ 9.8', players: '124K PLAYING' },
    { art: 'game-art-2', icon: '◈', iconColor: '#00ccff', genre: 'SHOOTER • TACTICAL',   name: 'ARCTIC BREACH',  slug: 'arctic-breach',  rating: '★★★★☆ 8.9', players: '89K PLAYING'  },
    { art: 'game-art-3', icon: '⟁', iconColor: '#ff3300', genre: 'ACTION • BRUTAL',      name: 'IRON REQUIEM',   slug: 'iron-requiem',   rating: '★★★★☆ 8.5', players: '67K PLAYING'  },
    { art: 'game-art-4', icon: '✦', iconColor: '#00cc44', genre: 'SURVIVAL • HORROR',    name: 'DEEP ROOT',      slug: 'deep-root',      rating: '★★★★★ 9.2', players: '52K PLAYING'  },
    { art: 'game-art-5', icon: '◉', iconColor: '#ffee00', genre: 'RACING • EXTREME',     name: 'NEON DRIFT',     slug: 'neon-drift',     rating: '★★★★☆ 8.7', players: '41K PLAYING'  },
    { art: 'game-art-6', icon: '⟡', iconColor: '#ff0066', genre: 'FIGHTING • ARENA',     name: 'PULSE COMBAT',   slug: 'pulse-combat',   rating: '★★★★★ 9.4', players: '98K PLAYING'  },
  ];

  const categories = [
    { icon: '⚔️', name: 'Action RPG',  count: '1,240' },
    { icon: '🎯', name: 'Shooter',     count: '890'   },
    { icon: '🏎️', name: 'Racing',      count: '430'   },
    { icon: '🧠', name: 'Strategy',    count: '760'   },
    { icon: '👾', name: 'Arcade',      count: '2,100' },
    { icon: '🌌', name: 'Space Sim',   count: '320'   },
  ];

  // ─────────────────────────────────────────────
  // NAVIGATION HELPERS
  // Public routes: /games
  // Auth-gated:    /my-games, /upload
  // Admin-only:    /admin
  // ─────────────────────────────────────────────
  function goTo(path, requiresAuth = false) {
    if (requiresAuth && !isLoggedIn) {
      showLogin = true;
    } else {
      goto(path);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) goto(`/games?q=${encodeURIComponent(q)}`);
  }

  // ─────────────────────────────────────────────
  // LOGIN (replace body with your real API call)
  // ─────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    loginError = '';
    if (!loginEmail || !loginPassword) { loginError = 'ALL FIELDS REQUIRED'; return; }
    isLoggingIn = true;
    try {
      // TODO: replace with your real auth endpoint
      // const res = await fetch('/api/login', { method:'POST', body: JSON.stringify({email: loginEmail, password: loginPassword}), headers:{'Content-Type':'application/json'} });
      // const data = await res.json();
      // if (!res.ok) throw new Error(data.message);
      // isAdmin = data.user.role === 'admin';
      await new Promise(r => setTimeout(r, 1200)); // ← remove this placeholder
      isLoggedIn = true;
      showLogin  = false;
      loginEmail = loginPassword = '';
    } catch (err) {
      loginError = err.message || 'LOGIN FAILED';
    } finally {
      isLoggingIn = false;
    }
  }

  function logout() {
    isLoggedIn = isAdmin = false;
    // TODO: call your real logout endpoint / clear session
  }

  function closeOnBackdrop(e) {
    if (e.target === e.currentTarget) showLogin = false;
  }

  // ─────────────────────────────────────────────
  // CURSOR
  // ─────────────────────────────────────────────
  onMount(() => {
    let mx = 0, my = 0, cx = 0, cy = 0;

    const onMove = (e) => {
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

    const addHover = (el) => {
      el.addEventListener('mouseenter', () => { if (cursorEl) { cursorEl.style.transform = 'translate(-50%,-50%) scale(2)'; cursorEl.style.borderColor = 'var(--neon-pink)'; } });
      el.addEventListener('mouseleave', () => { if (cursorEl) { cursorEl.style.transform = 'translate(-50%,-50%) scale(1)'; cursorEl.style.borderColor = 'var(--neon-cyan)'; } });
    };
    document.querySelectorAll('button, a, .game-card, .cat-item').forEach(addHover);

    return () => document.removeEventListener('mousemove', onMove);
  });
</script>

<svelte:head>
  <title>PROGCHAMP // Game Vault</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Oxanium:wght@300;400;600;800&display=swap" rel="stylesheet" />
</svelte:head>

<!-- ── CURSOR ── -->
<div class="cursor"     bind:this={cursorEl}></div>
<div class="cursor-dot" bind:this={dotEl}></div>

<!-- ── BACKGROUND LAYERS ── -->
<div class="grid-bg"></div>
<div class="noise"></div>

<!-- ════════════════════════════════════════
     NAV
════════════════════════════════════════ -->
<nav>
  <!-- LOGO -->
  <a href="/" class="logo-wrap">
    <span class="logo">PROG<em>CHAMP</em></span>
    <span class="logo-sub">an @ACMpesuecc project</span>
  </a>

  <!-- SEARCH -->
  <form class="nav-search" on:submit={handleSearch}>
    <input
      class="nav-search-input"
      type="text"
      placeholder="SEARCH GAMES..."
      bind:value={searchQuery}
    />
    <button type="submit" class="nav-search-btn" aria-label="Search">⌕</button>
  </form>

  <!-- PAGE LINKS -->
  <ul class="nav-links">
    <!-- Public -->
    <li><a href="/games"    class="nav-link">ALL GAMES</a></li>
    <!-- Auth-gated: opens login modal if not logged in -->
    <li><a href="/my-games" class="nav-link"
        on:click|preventDefault={() => goTo('/my-games', true)}>MY GAMES</a></li>
    <li><a href="/upload"   class="nav-link"
        on:click|preventDefault={() => goTo('/upload', true)}>UPLOAD</a></li>
    <!-- Admin-only: only rendered when isAdmin === true -->
    {#if isAdmin}
      <li><a href="/admin" class="nav-link nav-link--admin">ADMIN</a></li>
    {/if}
  </ul>

  <!-- AUTH BUTTON -->
  {#if isLoggedIn}
    <button class="nav-cta nav-cta--out" on:click={logout}>LOG OUT</button>
  {:else}
    <button class="nav-cta" on:click={() => showLogin = true}>LOGIN</button>
  {/if}
</nav>

<!-- ════════════════════════════════════════
     HERO
════════════════════════════════════════ -->
<section class="hero">
  <div class="hero-orb orb1"></div>
  <div class="hero-orb orb2"></div>

  <div class="hero-inner">
    <!-- LEFT: text -->
    <div class="hero-left">
      <h1 class="hero-glitch-text">
        <span class="line1">BUILD IT.</span>
        <span class="line2">PLAY IT.</span>
        <span class="line3">WIN IT.</span>
      </h1>

      <p class="hero-sub">
        // UNAUTHORIZED ACCESS TO FUN DETECTED<br/>
        Stream, host, and dominate 10,000+ titles.<br/>
        No installs. No limits. Pure voltage.
      </p>

      <div class="hero-actions">
        <button class="btn-primary" on:click={() => goto('/games')}>ENTER THE VAULT</button>
        <a href="/games" class="btn-secondary">VIEW LIBRARY</a>
      </div>
    </div>

    <!-- RIGHT: gaming animation -->
    <div class="hero-anim" aria-hidden="true">
      <!-- Pixel / retro game scene -->
      <div class="ga-screen">
        <!-- scanline overlay -->
        <div class="ga-scanlines"></div>

        <!-- stars -->
        <div class="ga-star s1"></div>
        <div class="ga-star s2"></div>
        <div class="ga-star s3"></div>
        <div class="ga-star s4"></div>
        <div class="ga-star s5"></div>
        <div class="ga-star s6"></div>

        <!-- enemy invaders row -->
        <div class="ga-invaders">
          <div class="ga-inv inv1">👾</div>
          <div class="ga-inv inv2">👾</div>
          <div class="ga-inv inv3">👾</div>
          <div class="ga-inv inv4">👾</div>
          <div class="ga-inv inv5">👾</div>
        </div>

        <!-- enemy bullets -->
        <div class="ga-ebullet eb1"></div>
        <div class="ga-ebullet eb2"></div>

        <!-- player ship -->
        <div class="ga-ship">🚀</div>

        <!-- player laser -->
        <div class="ga-laser"></div>

        <!-- explosion -->
        <div class="ga-explosion">💥</div>

        <!-- score HUD -->
        <div class="ga-hud">
          <span class="ga-score">SCORE <span class="ga-score-num">08450</span></span>
          <span class="ga-lives">♥ ♥ ♥</span>
        </div>

        <!-- bottom ground line -->
        <div class="ga-ground"></div>
      </div>
    </div>
  </div>
</section>

<!-- ════════════════════════════════════════
     STATS BAR
════════════════════════════════════════ -->
<div class="stats-bar">
  <div class="stat-item"><div class="stat-num">10K+</div><div class="stat-label">Games Hosted</div></div>
  <div class="stat-item"><div class="stat-num">4.2M</div><div class="stat-label">Active Players</div></div>
  <div class="stat-item"><div class="stat-num">99.9%</div><div class="stat-label">Uptime</div></div>
  <div class="stat-item"><div class="stat-num">0ms</div><div class="stat-label">Install Time</div></div>
</div>

<!-- ════════════════════════════════════════
     MARQUEE TICKER
════════════════════════════════════════ -->
<div class="marquee-section">
  <div class="marquee-track">
    {#each Array(2) as _}
      <span class="marquee-item">PROGCHAMP <span>★</span></span>
      <span class="marquee-item">NEW DROP: CYBER EXODUS <span>★</span></span>
      <span class="marquee-item">SEASON 7 LIVE <span>★</span></span>
      <span class="marquee-item">TOURNAMENT — PRIZE POOL $50K <span>★</span></span>
      <span class="marquee-item">@ACMpesuecc PROJECT <span>★</span></span>
    {/each}
  </div>
</div>

<!-- ════════════════════════════════════════
     FEATURED GAMES  →  /games
════════════════════════════════════════ -->
<section>
  <div class="section-header">
    <h2 class="section-title">HOT <span>DROPS</span></h2>
    <span class="section-tag">// UPDATED WEEKLY</span>
    <a href="/games" class="section-link">VIEW ALL →</a>
  </div>
  <div class="games-grid">
    {#each games as game, i}
      <a href="/games/{game.slug}" class="game-card">
        <div class="game-thumb">
          <div class="game-thumb-bg {game.art}"></div>
          <div class="game-art-pattern"></div>
          <div class="game-icon" style="color:{game.iconColor}">{game.icon}</div>
        </div>
        <div class="game-overlay"></div>
        <div class="game-hover-btn"><span class="play-btn">PLAY NOW</span></div>
        <div class="game-info">
          <div class="game-genre">{game.genre}</div>
          <div class="game-name">{game.name}</div>
          <div class="game-meta">
            <span class="game-rating">{game.rating}</span>
          </div>
        </div>
        {#if i === 0}<div class="corner-deco tl"></div>{/if}
        {#if i === 2}<div class="corner-deco br"></div>{/if}
      </a>
    {/each}
  </div>
</section>

<!-- ════════════════════════════════════════
     CATEGORIES  →  /games?genre=...
════════════════════════════════════════ -->
<section class="categories-section">
  <div class="section-header">
    <h2 class="section-title">EXPLORE BY <span>GENRE</span></h2>
    <span class="section-tag">// 48 CATEGORIES</span>
  </div>
  <div class="cat-grid">
    {#each categories as cat}
      <a href="/games?genre={encodeURIComponent(cat.name)}" class="cat-item">
        <span class="cat-icon">{cat.icon}</span>
        <div class="cat-name">{cat.name}</div>
        <span class="cat-count">{cat.count}</span>
      </a>
    {/each}
  </div>
</section>

<!-- ════════════════════════════════════════
     UPLOAD BANNER  →  /upload  (auth-gated)
════════════════════════════════════════ -->
<section class="upload-cta-section">
  <div class="upload-cta-inner">
    <div class="upload-text">
      <div class="upload-eyebrow">// FOR DEVELOPERS</div>
      <h2 class="upload-title">PUBLISH YOUR <span>GAME</span></h2>
      <p class="upload-sub">Got something worth playing? Upload your build, set your tags, and let the world plug in.</p>
    </div>
    <button class="btn-upload" on:click={() => goTo('/upload', true)}>UPLOAD A GAME ↗</button>
  </div>
</section>

<!-- ════════════════════════════════════════
     MAIN CTA
════════════════════════════════════════ -->
<section class="cta-section">
  <div class="cta-eyebrow">// INITIALIZE YOUR SESSION</div>
  <h2 class="cta-title">READY TO<br/><span class="accent">LOGIN?</span></h2>
  <p class="cta-sub">Create your free account and get instant access to 100 games. No credit card required. No downloads. Just pure, uncut gameplay.</p>
  <button class="btn-primary" on:click={() => showLogin = true}>CREATE FREE ACCOUNT</button>
</section>

<!-- ════════════════════════════════════════
     FOOTER
════════════════════════════════════════ -->
<footer>
  <div class="footer-brand">
    <div class="footer-logo">PROG<span>CHAMP</span></div>
    <div class="footer-logo-sub">an @ACMpesuecc project</div>
    <p class="footer-desc">The premier cyberpunk game hosting platform. We live in the grid so you can play without limits. Upload, compete, ascend.</p>
  </div>

  <div>
    <div class="footer-col-title">Vault</div>
    <ul class="footer-links">
      <li><a href="/games?sort=new">New Releases</a></li>
      <li><a href="/games?sort=top">Top Rated</a></li>
      <li><a href="/games?filter=free">Free to Play</a></li>
      <li><a href="/games?filter=upcoming">Coming Soon</a></li>
    </ul>
  </div>

  <div>
    <div class="footer-col-title">Your Space</div>
    <ul class="footer-links">
      <li><a href="/games">Browse All Games</a></li>
      <li><a href="/my-games" on:click|preventDefault={() => goTo('/my-games', true)}>My Games</a></li>
      <li><a href="/upload"   on:click|preventDefault={() => goTo('/upload',   true)}>Upload a Game</a></li>
      {#if isAdmin}
        <li><a href="/admin" class="admin-link">Admin Panel</a></li>
      {/if}
    </ul>
  </div>

  <div>
    <div class="footer-col-title">ProgChamp</div>
    <ul class="footer-links">
      <li><a href="#">About ACMpesuecc</a></li>
      <li><a href="#">Dev Portal</a></li>
      <li><a href="#">Blog</a></li>
      <li><a href="#">Support</a></li>
    </ul>
  </div>

  <div class="footer-bottom">
    <div class="footer-copy">© 2026 PROGCHAMP — AN @ACMpesuecc PROJECT — ALL RIGHTS RESERVED</div>
    <div class="footer-status"><span class="status-dot"></span>ALL SYSTEMS OPERATIONAL</div>
  </div>
</footer>

<!-- ════════════════════════════════════════
     LOGIN MODAL
════════════════════════════════════════ -->
{#if showLogin}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-backdrop" on:click={closeOnBackdrop}>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading">
      <div class="modal-corner tl"></div>
      <div class="modal-corner br"></div>

      <button class="modal-close" on:click={() => showLogin = false} aria-label="Close">✕</button>

      <div class="modal-eyebrow">// ACCESS TERMINAL</div>
      <h2 class="modal-title" id="modal-heading">LOG<span>IN</span></h2>
      <p class="modal-sub">Enter your credentials to access the vault.</p>

      <form class="login-form" on:submit={handleLogin}>
        <div class="form-group">
          <label class="form-label" for="login-email">EMAIL ADDRESS</label>
          <input id="login-email" type="email" class="form-input"
            placeholder="operator@progchamp.gg" bind:value={loginEmail} autocomplete="email" />
        </div>
        <div class="form-group">
          <label class="form-label" for="login-pass">PASSWORD</label>
          <input id="login-pass" type="password" class="form-input"
            placeholder="••••••••••••" bind:value={loginPassword} autocomplete="current-password" />
        </div>

        {#if loginError}
          <div class="login-error" role="alert">{loginError}</div>
        {/if}

        <button type="submit" class="btn-login" disabled={isLoggingIn}>
          {#if isLoggingIn}
            <span class="loading-dots">CONNECTING<span>.</span><span>.</span><span>.</span></span>
          {:else}
            INITIALIZE SESSION
          {/if}
        </button>

        <div class="login-divider"><span>OR</span></div>

        <a href="/register" class="btn-register">CREATE NEW ACCOUNT</a>

        <div class="login-footer-text">
          <a href="/forgot-password">FORGOT PASSWORD?</a>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  /* ── CSS VARIABLES ── */
  :global(:root) {
    --neon-cyan:   #00fff9;
    --neon-pink:   #ff006e;
    --neon-yellow: #ffe600;
    --neon-purple: #bf00ff;
    --dark:        #03000a;
    --dark2:       #0a0014;
    --grid-color:  rgba(0,255,249,0.06);
    --text:        #e0e0ff;
  }
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(html) { scroll-behavior: smooth; }
  :global(body) {
    background: var(--dark);
    color: var(--text);
    font-family: 'Oxanium', sans-serif;
    overflow-x: hidden;
    cursor: none;
  }
  :global(body::before) {
    content: '';
    position: fixed; inset: 0;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px
    );
    pointer-events: none;
    z-index: 100;
  }

  /* ── CURSOR ── */
  .cursor {
    width: 16px; height: 16px;
    border: 2px solid var(--neon-cyan); border-radius: 50%;
    position: fixed; pointer-events: none; z-index: 9999;
    transform: translate(-50%,-50%);
    transition: transform .12s ease, border-color .3s;
    mix-blend-mode: screen;
  }
  .cursor-dot {
    width: 4px; height: 4px; background: var(--neon-pink); border-radius: 50%;
    position: fixed; pointer-events: none; z-index: 9999;
    transform: translate(-50%,-50%);
  }

  /* ── BACKGROUND ── */
  .grid-bg {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(var(--grid-color) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
    background-size: 60px 60px;
    z-index: 0; animation: gridPulse 8s ease-in-out infinite;
  }
  @keyframes gridPulse { 0%,100% { opacity:.6 } 50% { opacity:1 } }

  .noise {
    position: fixed; inset: 0; opacity: .03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 200px 200px; pointer-events: none; z-index: 1;
  }

  /* ════════════ NAV ════════════ */
  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    display: flex; align-items: center; gap: 22px;
    padding: 14px 48px;
    border-bottom: 1px solid rgba(0,255,249,.15);
    background: rgba(3,0,10,.92);
    backdrop-filter: blur(14px);
  }

  /* LOGO  ← bigger than before */
  .logo-wrap {
    display: flex; flex-direction: column; align-items: flex-start;
    text-decoration: none; flex-shrink: 0; gap: 2px;
  }
  .logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 2.4rem;                   /* ← original size */
    letter-spacing: .12em; line-height: 1; font-style: normal;
    color: var(--neon-cyan);
    text-shadow: 0 0 20px var(--neon-cyan), 0 0 60px rgba(0,255,249,.3);
  }
  .logo em {
    color: var(--neon-pink); font-style: normal;
    text-shadow: 0 0 20px var(--neon-pink), 0 0 60px rgba(255,0,110,.3);
  }
  .logo-sub {
    font-family: 'Share Tech Mono', monospace;
    font-size: .72rem; letter-spacing: .14em;
    color: rgba(0,255,249,.4); text-transform: lowercase; white-space: nowrap;
  }

  /* SEARCH */
  .nav-search {
    display: flex; align-items: center;
    flex: 1; max-width: 400px;
    border: 1px solid rgba(0,255,249,.2);
    background: rgba(0,255,249,.03);
    clip-path: polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);
    transition: border-color .3s, box-shadow .3s;
  }
  .nav-search:focus-within {
    border-color: var(--neon-cyan);
    box-shadow: 0 0 20px rgba(0,255,249,.12);
  }
  .nav-search-input {
    flex: 1; background: transparent; border: none; outline: none;
    font-family: 'Share Tech Mono', monospace; font-size: .68rem;
    letter-spacing: .12em; color: var(--text);
    padding: 10px 14px; text-transform: uppercase;
  }
  .nav-search-input::placeholder { color: rgba(224,224,255,.22); }
  .nav-search-btn {
    background: transparent; border: none;
    border-left: 1px solid rgba(0,255,249,.15);
    color: var(--neon-cyan); font-size: 1.1rem;
    padding: 8px 13px; cursor: none; line-height: 1;
    transition: background .2s, text-shadow .2s;
  }
  .nav-search-btn:hover { background: rgba(0,255,249,.08); text-shadow: 0 0 12px var(--neon-cyan); }

  /* NAV LINKS */
  .nav-links { display: flex; gap: 26px; list-style: none; }
  .nav-link {
    font-family: 'Share Tech Mono', monospace;
    font-size: .67rem; letter-spacing: .18em; text-transform: uppercase;
    color: rgba(224,224,255,.5); text-decoration: none;
    position: relative; transition: color .2s; white-space: nowrap;
  }
  .nav-link::after {
    content: ''; position: absolute; bottom: -4px; left: 0;
    width: 0; height: 1px;
    background: var(--neon-cyan); box-shadow: 0 0 8px var(--neon-cyan);
    transition: width .3s;
  }
  .nav-link:hover               { color: var(--neon-cyan); }
  .nav-link:hover::after        { width: 100%; }
  .nav-link--admin              { color: rgba(255,0,110,.7); }
  .nav-link--admin::after       { background: var(--neon-pink); box-shadow: 0 0 8px var(--neon-pink); }
  .nav-link--admin:hover        { color: var(--neon-pink); }

  /* AUTH BUTTON */
  .nav-cta {
    font-family: 'Share Tech Mono', monospace; font-size: .68rem;
    letter-spacing: .15em; text-transform: uppercase;
    background: transparent; border: 1px solid var(--neon-pink);
    color: var(--neon-pink); padding: 9px 22px; cursor: none;
    transition: all .3s; flex-shrink: 0;
    text-shadow: 0 0 10px var(--neon-pink);
    box-shadow: 0 0 10px rgba(255,0,110,.2), inset 0 0 10px rgba(255,0,110,.05);
    clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
  }
  .nav-cta:hover {
    background: var(--neon-pink); color: var(--dark);
    box-shadow: 0 0 30px var(--neon-pink), 0 0 60px rgba(255,0,110,.4);
    text-shadow: none;
  }
  .nav-cta--out {
    border-color: rgba(224,224,255,.2); color: rgba(224,224,255,.35);
    text-shadow: none; box-shadow: none;
  }
  .nav-cta--out:hover {
    background: rgba(224,224,255,.05); color: rgba(224,224,255,.6);
    box-shadow: none;
  }

  /* ════════════ HERO ════════════ */
  .hero {
    position: relative; z-index: 10; min-height: 100vh;
    display: flex; flex-direction: column; justify-content: center;
    padding: 80px 60px 80px;
    margin-top: -30px;
    overflow: hidden;
  }
  .hero-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
  .orb1 { width:600px; height:600px; background: radial-gradient(circle, rgba(191,0,255,.15) 0%, transparent 70%); top:-200px; right:-100px; animation: orbFloat 10s ease-in-out infinite; }
  .orb2 { width:400px; height:400px; background: radial-gradient(circle, rgba(0,255,249,.1)   0%, transparent 70%); bottom:-100px; left:300px; animation: orbFloat 14s ease-in-out infinite reverse; }
  @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-40px) scale(1.05) } }

  /* two-column layout */
  .hero-inner {
    display: flex; align-items: center; gap: 60px; width: 100%;
  }
  .hero-left { flex: 1; min-width: 0; }

  .status-dot {
    width:6px; height:6px; background: var(--neon-cyan); border-radius:50%;
    box-shadow: 0 0 6px var(--neon-cyan);
    animation: blink 2s step-end infinite; display:inline-block; flex-shrink:0;
  }
  @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }

  .hero-glitch-text {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(3.5rem, 8vw, 7.5rem); line-height:.9; letter-spacing:.02em;
    display: inline-block; max-width: 600px;
    animation: heroIn 1s ease both;
  }
  @keyframes heroIn { from { opacity:0; transform:translateY(40px) skewX(-5deg) } to { opacity:1; transform:none } }

  .line1 { display:block; color:transparent; -webkit-text-stroke:2px var(--neon-cyan); text-shadow:0 0 40px rgba(0,255,249,.3); }
  .line2 { display:block; color:var(--neon-pink); text-shadow:0 0 40px var(--neon-pink),0 0 80px rgba(255,0,110,.4); animation:glitch 4s infinite; }
  @keyframes glitch {
    0%,90%,100% { transform:none; clip-path:none }
    92% { transform:translateX(-3px); clip-path:polygon(0 20%,100% 20%,100% 40%,0 40%) }
    94% { transform:translateX(3px);  clip-path:polygon(0 60%,100% 60%,100% 80%,0 80%) }
    96% { transform:none; clip-path:none }
  }
  .line3 { display:block; color:var(--neon-yellow); text-shadow:0 0 40px var(--neon-yellow), 0 0 80px rgba(255,230,0,.3); }

  .hero-sub {
    font-family: 'Share Tech Mono', monospace; font-size:.85rem;
    color: rgba(224,224,255,.5); margin-top:40px; letter-spacing:.1em;
    max-width:500px; line-height:1.8;
    border-left:2px solid var(--neon-cyan); padding-left:20px;
    animation: heroIn 1s .3s ease both;
  }
  .hero-actions { display:flex; gap:20px; margin-top:50px; animation:heroIn 1s .5s ease both; align-items:center; }

  /* ── GAMING ANIMATION PANEL ── */
  .hero-anim {
    flex: 0 0 420px; display: flex; align-items: center; justify-content: center;
    animation: heroIn 1s .2s ease both;
  }
  .ga-screen {
    width: 380px; height: 420px;
    background: #000814;
    border: 2px solid rgba(0,255,249,.3);
    box-shadow: 0 0 40px rgba(0,255,249,.15), inset 0 0 40px rgba(0,0,0,.8);
    border-radius: 8px;
    position: relative; overflow: hidden;
    font-family: monospace;
  }
  /* CRT scanlines */
  .ga-scanlines {
    position: absolute; inset: 0; pointer-events: none; z-index: 20;
    background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,.18) 3px, rgba(0,0,0,.18) 4px);
  }
  /* Stars */
  .ga-star {
    position: absolute; border-radius: 50%; background: #fff;
    animation: starTwinkle 2s ease-in-out infinite;
  }
  .s1 { width:2px; height:2px; top:8%;  left:12%; animation-delay:0s; }
  .s2 { width:3px; height:3px; top:15%; left:70%; animation-delay:.4s; }
  .s3 { width:2px; height:2px; top:5%;  left:45%; animation-delay:.8s; }
  .s4 { width:2px; height:2px; top:22%; left:85%; animation-delay:1.1s; }
  .s5 { width:3px; height:3px; top:10%; left:30%; animation-delay:1.6s; }
  .s6 { width:2px; height:2px; top:18%; left:58%; animation-delay:.3s; }
  @keyframes starTwinkle { 0%,100%{opacity:.3} 50%{opacity:1} }

  /* Invader row — marches side to side */
  .ga-invaders {
    position: absolute; top: 60px; left: 0; right: 0;
    display: flex; justify-content: space-around; padding: 0 20px;
    animation: invaderMarch 3s ease-in-out infinite alternate;
  }
  @keyframes invaderMarch { from { transform: translateX(-30px) } to { transform: translateX(30px) } }
  .ga-inv { font-size: 1.5rem; animation: invBob 0.6s ease-in-out infinite alternate; }
  .inv1 { animation-delay: 0s;   }
  .inv2 { animation-delay: .1s;  }
  .inv3 { animation-delay: .2s;  }
  .inv4 { animation-delay: .3s;  }
  .inv5 { animation-delay: .4s;  }
  @keyframes invBob { from { transform: translateY(0) } to { transform: translateY(-6px) } }

  /* Enemy bullets */
  .ga-ebullet {
    position: absolute; width: 3px; height: 14px;
    background: var(--neon-pink); border-radius: 2px;
    box-shadow: 0 0 6px var(--neon-pink);
    animation: ebulletFall 2s linear infinite;
  }
  .eb1 { left: 22%; top: 100px; animation-delay: 0.3s; }
  .eb2 { left: 72%; top: 100px; animation-delay: 1.4s; }
  @keyframes ebulletFall { 0%{transform:translateY(0);opacity:1} 80%{opacity:1} 100%{transform:translateY(300px);opacity:0} }

  /* Player ship */
  .ga-ship {
    position: absolute; bottom: 52px; left: 50%;
    transform: translateX(-50%) rotate(-90deg);
    font-size: 2rem;
    animation: shipMove 4s ease-in-out infinite alternate;
    filter: drop-shadow(0 0 8px var(--neon-cyan));
  }
  @keyframes shipMove { from { left: 25% } to { left: 75% } }

  /* Player laser */
  .ga-laser {
    position: absolute; bottom: 90px; left: 50%;
    width: 3px; height: 0;
    background: var(--neon-cyan);
    box-shadow: 0 0 8px var(--neon-cyan);
    transform: translateX(-50%);
    animation: laserFire 2s ease-in-out infinite;
    transform-origin: bottom center;
  }
  @keyframes laserFire {
    0%   { height: 0;    opacity: 0; bottom: 90px; }
    10%  { height: 60px; opacity: 1; }
    50%  { height: 260px; opacity: 1; bottom: 90px; }
    60%  { height: 0;    opacity: 0; }
    100% { height: 0;    opacity: 0; }
  }

  /* Explosion — appears briefly */
  .ga-explosion {
    position: absolute; top: 95px; left: 45%;
    font-size: 2rem;
    animation: explode 2s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes explode {
    0%,49%  { opacity: 0; transform: scale(.4); }
    50%     { opacity: 1; transform: scale(1.3); }
    65%     { opacity: 1; transform: scale(1); }
    80%,100%{ opacity: 0; transform: scale(.4); }
  }

  /* HUD */
  .ga-hud {
    position: absolute; top: 10px; left: 0; right: 0;
    display: flex; justify-content: space-between; padding: 0 14px;
    font-size: .6rem; letter-spacing: .12em; color: rgba(0,255,249,.7);
    font-family: 'Share Tech Mono', monospace;
  }
  .ga-score-num { color: var(--neon-cyan); }
  .ga-lives { color: var(--neon-pink); text-shadow: 0 0 6px var(--neon-pink); }

  /* Ground line */
  .ga-ground {
    position: absolute; bottom: 44px; left: 0; right: 0;
    height: 1px; background: rgba(0,255,249,.25);
    box-shadow: 0 0 4px rgba(0,255,249,.4);
  }

  .btn-primary {
    font-family:'Share Tech Mono',monospace; font-size:.8rem; letter-spacing:.15em; text-transform:uppercase;
    background:var(--neon-cyan); color:var(--dark); border:none;
    padding:16px 40px; cursor:none; font-weight:bold; transition:all .3s;
    clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);
    box-shadow:0 0 30px rgba(0,255,249,.5),0 0 60px rgba(0,255,249,.2);
  }
  .btn-primary:hover { box-shadow:0 0 50px rgba(0,255,249,.8),0 0 100px rgba(0,255,249,.4); transform:translateY(-2px); }

  .btn-secondary {
    font-family:'Share Tech Mono',monospace; font-size:.8rem; letter-spacing:.15em; text-transform:uppercase;
    background:transparent; color:var(--neon-yellow); border:1px solid var(--neon-yellow);
    padding:16px 40px; cursor:none; transition:all .3s;
    text-decoration:none; display:inline-block;
    clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);
    box-shadow:0 0 15px rgba(255,230,0,.2); text-shadow:0 0 10px var(--neon-yellow);
  }
  .btn-secondary:hover { background:rgba(255,230,0,.1); box-shadow:0 0 30px rgba(255,230,0,.4); }

  /* ════════════ STATS ════════════ */
  .stats-bar {
    position:relative; z-index:10; display:flex;
    border-top:1px solid rgba(0,255,249,.2); border-bottom:1px solid rgba(0,255,249,.2);
    background:rgba(0,255,249,.03);
  }
  .stat-item { flex:1; padding:30px 40px; border-right:1px solid rgba(0,255,249,.1); text-align:center; }
  .stat-item:last-child { border-right:none; }
  .stat-num   { font-family:'Bebas Neue',sans-serif; font-size:3rem; color:var(--neon-cyan); text-shadow:0 0 20px var(--neon-cyan); line-height:1; }
  .stat-label { font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(224,224,255,.4); margin-top:6px; }

  /* ════════════ MARQUEE ════════════ */
  .marquee-section {
    border-top:1px solid rgba(255,0,110,.2); border-bottom:1px solid rgba(255,0,110,.2);
    padding:16px 0; background:rgba(255,0,110,.03); overflow:hidden;
    position:relative; z-index:10;
  }
  .marquee-track { display:flex; gap:60px; animation:marquee 22s linear infinite; white-space:nowrap; }
  @keyframes marquee { from { transform:translateX(0) } to { transform:translateX(-50%) } }
  .marquee-item { font-family:'Share Tech Mono',monospace; font-size:.7rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(255,0,110,.5); flex-shrink:0; }
  .marquee-item span { color:var(--neon-pink); text-shadow:0 0 8px var(--neon-pink); }

  /* ════════════ SECTIONS ════════════ */
  section { position:relative; z-index:10; padding:100px 60px; }
  .section-header { display:flex; align-items:baseline; gap:20px; margin-bottom:60px; flex-wrap:wrap; }
  .section-title  { font-family:'Bebas Neue',sans-serif; font-size:3.5rem; letter-spacing:.05em; color:var(--text); }
  .section-title span { color:var(--neon-pink); text-shadow:0 0 20px var(--neon-pink); }
  .section-tag    { font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.2em; color:rgba(224,224,255,.3); text-transform:uppercase; }
  .section-link   { margin-left:auto; font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.15em; text-transform:uppercase; color:var(--neon-cyan); text-decoration:none; text-shadow:0 0 8px var(--neon-cyan); transition:opacity .2s; }
  .section-link:hover { opacity:.7; }

  /* ════════════ GAMES GRID ════════════ */
  .games-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; background:rgba(0,255,249,.05); border:1px solid rgba(0,255,249,.1); }
  .game-card  { background:var(--dark2); overflow:hidden; position:relative; cursor:none; transition:transform .3s; aspect-ratio:3/4; display:flex; flex-direction:column; justify-content:flex-end; text-decoration:none; }
  .game-card:hover { z-index:2; transform:scale(1.02); }

  .game-thumb     { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .game-thumb-bg  { width:100%; height:100%; transition:transform .5s; }
  .game-card:hover .game-thumb-bg { transform:scale(1.08); }

  .game-art-1 { background:linear-gradient(135deg,#0d0030 0%,#1a0050 30%,#3d0080 60%,#7700cc 100%); }
  .game-art-2 { background:linear-gradient(135deg,#001a2e 0%,#003d6b 40%,#0080cc 70%,#00ccff 100%); }
  .game-art-3 { background:linear-gradient(135deg,#1a0000 0%,#4d0000 40%,#990000 70%,#ff3300 100%); }
  .game-art-4 { background:linear-gradient(135deg,#001a00 0%,#003300 40%,#006600 70%,#00cc44 100%); }
  .game-art-5 { background:linear-gradient(135deg,#1a1a00 0%,#4d4d00 40%,#999900 70%,#ffee00 100%); }
  .game-art-6 { background:linear-gradient(135deg,#1a000a 0%,#4d0021 40%,#990040 70%,#ff0066 100%); }

  .game-art-pattern { position:absolute; inset:0; opacity:.3; background-image:radial-gradient(circle at 30% 40%,rgba(255,255,255,.2) 0%,transparent 40%),radial-gradient(circle at 70% 80%,rgba(255,255,255,.1) 0%,transparent 30%); }
  .game-icon { position:absolute; top:50%; left:50%; transform:translate(-50%,-60%); font-size:5rem; opacity:.5; filter:drop-shadow(0 0 20px currentColor); transition:opacity .3s,transform .3s; }
  .game-card:hover .game-icon { opacity:.8; transform:translate(-50%,-65%) scale(1.1); }
  .game-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(3,0,10,.95) 0%,rgba(3,0,10,.5) 40%,transparent 70%); }

  .game-info    { position:relative; padding:24px; }
  .game-genre   { font-family:'Share Tech Mono',monospace; font-size:.6rem; letter-spacing:.25em; text-transform:uppercase; color:var(--neon-pink); text-shadow:0 0 10px var(--neon-pink); margin-bottom:6px; }
  .game-name    { font-family:'Bebas Neue',sans-serif; font-size:1.8rem; letter-spacing:.05em; color:white; text-shadow:0 0 20px rgba(255,255,255,.3); margin-bottom:8px; }
  .game-meta    { display:flex; align-items:center; justify-content:space-between; }
  .game-rating  { font-family:'Share Tech Mono',monospace; font-size:.65rem; color:var(--neon-yellow); text-shadow:0 0 8px var(--neon-yellow); }
  .game-players { font-family:'Share Tech Mono',monospace; font-size:.6rem; color:rgba(224,224,255,.4); letter-spacing:.1em; }

  .game-hover-btn { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,255,249,.05); opacity:0; transition:opacity .3s; }
  .game-card:hover .game-hover-btn { opacity:1; }
  .play-btn { font-family:'Share Tech Mono',monospace; font-size:.7rem; letter-spacing:.2em; text-transform:uppercase; background:var(--neon-cyan); color:var(--dark); padding:12px 30px; font-weight:bold; clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); box-shadow:0 0 30px rgba(0,255,249,.6); transform:translateY(10px); transition:transform .3s; display:inline-block; }
  .game-card:hover .play-btn { transform:translateY(0); }

  .corner-deco    { position:absolute; width:40px; height:40px; pointer-events:none; }
  .corner-deco.tl { top:0; left:0; border-top:2px solid var(--neon-cyan); border-left:2px solid var(--neon-cyan); }
  .corner-deco.br { bottom:0; right:0; border-bottom:2px solid var(--neon-cyan); border-right:2px solid var(--neon-cyan); }

  /* ════════════ CATEGORIES ════════════ */
  .categories-section { background:rgba(10,0,20,.8); border-top:1px solid rgba(191,0,255,.2); border-bottom:1px solid rgba(191,0,255,.2); }
  .cat-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:16px; }
  .cat-item {
    border:1px solid rgba(191,0,255,.2); padding:24px 16px; text-align:center; cursor:none;
    transition:all .3s; position:relative; overflow:hidden;
    background:rgba(191,0,255,.03); text-decoration:none; display:block;
  }
  .cat-item::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,transparent 50%,rgba(191,0,255,.1) 100%); opacity:0; transition:opacity .3s; }
  .cat-item:hover { border-color:var(--neon-purple); transform:translateY(-4px); }
  .cat-item:hover::before { opacity:1; }
  .cat-icon { font-size:2rem; margin-bottom:10px; transition:all .3s; display:block; }
  .cat-item:hover .cat-icon { text-shadow:0 0 20px var(--neon-purple); transform:scale(1.2); }
  .cat-name  { font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.15em; text-transform:uppercase; color:rgba(224,224,255,.5); }
  .cat-count { font-family:'Bebas Neue',sans-serif; font-size:1.4rem; color:var(--neon-purple); text-shadow:0 0 10px var(--neon-purple); display:block; margin-top:4px; }

  /* ════════════ UPLOAD BANNER ════════════ */
  .upload-cta-section { position:relative; z-index:10; padding:0 60px 80px; }
  .upload-cta-inner {
    display:flex; align-items:center; justify-content:space-between; gap:40px;
    border:1px solid rgba(255,230,0,.2); padding:50px 60px;
    background:rgba(255,230,0,.02); position:relative;
    clip-path:polygon(16px 0%,100% 0%,calc(100% - 16px) 100%,0% 100%);
  }
  .upload-cta-inner::before { content:''; position:absolute; inset:0; background:linear-gradient(90deg,rgba(255,230,0,.04) 0%,transparent 60%); pointer-events:none; }
  .upload-eyebrow { font-family:'Share Tech Mono',monospace; font-size:.6rem; letter-spacing:.3em; text-transform:uppercase; color:var(--neon-yellow); text-shadow:0 0 8px var(--neon-yellow); margin-bottom:12px; }
  .upload-title   { font-family:'Bebas Neue',sans-serif; font-size:3rem; letter-spacing:.05em; line-height:1; margin-bottom:12px; }
  .upload-title span { color:var(--neon-yellow); text-shadow:0 0 20px var(--neon-yellow); }
  .upload-sub     { font-family:'Share Tech Mono',monospace; font-size:.72rem; color:rgba(224,224,255,.4); letter-spacing:.08em; line-height:1.7; max-width:420px; }
  .btn-upload {
    font-family:'Share Tech Mono',monospace; font-size:.78rem; letter-spacing:.15em; text-transform:uppercase;
    background:transparent; color:var(--neon-yellow); border:1px solid var(--neon-yellow);
    padding:18px 44px; cursor:none; transition:all .3s; flex-shrink:0;
    clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);
    text-shadow:0 0 10px var(--neon-yellow); box-shadow:0 0 20px rgba(255,230,0,.15);
  }
  .btn-upload:hover { background:rgba(255,230,0,.1); box-shadow:0 0 40px rgba(255,230,0,.35); transform:translateY(-2px); }

  /* ════════════ MAIN CTA ════════════ */
  .cta-section { text-align:center; padding:140px 60px; background:radial-gradient(ellipse at center,rgba(191,0,255,.08) 0%,transparent 70%); border-top:1px solid rgba(191,0,255,.1); }
  .cta-eyebrow { font-family:'Share Tech Mono',monospace; font-size:.7rem; letter-spacing:.3em; text-transform:uppercase; color:var(--neon-purple); text-shadow:0 0 10px var(--neon-purple); margin-bottom:20px; }
  .cta-title   { font-family:'Bebas Neue',sans-serif; font-size:clamp(3rem,8vw,7rem); line-height:.95; letter-spacing:.02em; margin-bottom:30px; }
  .cta-title .accent { color:var(--neon-cyan); text-shadow:0 0 30px var(--neon-cyan); }
  .cta-sub     { font-family:'Share Tech Mono',monospace; font-size:.8rem; color:rgba(224,224,255,.4); margin-bottom:50px; letter-spacing:.1em; max-width:500px; margin-left:auto; margin-right:auto; line-height:1.8; }

  /* ════════════ FOOTER ════════════ */
  footer {
    position:relative; z-index:10; padding:60px;
    border-top:1px solid rgba(0,255,249,.1);
    display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:60px;
    background:rgba(3,0,10,.95);
  }
  .footer-logo     { font-family:'Bebas Neue',sans-serif; font-size:3.2rem; color:var(--neon-cyan); text-shadow:0 0 20px var(--neon-cyan); margin-bottom:4px; }
  .footer-logo span { color:var(--neon-pink); text-shadow:0 0 20px var(--neon-pink); }
  .footer-logo-sub { font-family:'Share Tech Mono',monospace; font-size:.72rem; color:rgba(0,255,249,.4); letter-spacing:.12em; margin-bottom:14px; }
  .footer-desc     { font-family:'Share Tech Mono',monospace; font-size:.7rem; line-height:1.8; color:rgba(224,224,255,.3); letter-spacing:.05em; }
  .footer-col-title { font-family:'Bebas Neue',sans-serif; font-size:1.2rem; letter-spacing:.1em; color:rgba(224,224,255,.5); margin-bottom:20px; }
  .footer-links    { list-style:none; display:flex; flex-direction:column; gap:12px; }
  .footer-links a  { font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.1em; color:rgba(224,224,255,.3); text-decoration:none; text-transform:uppercase; transition:color .2s; cursor:none; }
  .footer-links a:hover { color:var(--neon-cyan); text-shadow:0 0 8px var(--neon-cyan); }
  .admin-link      { color:rgba(255,0,110,.5) !important; }
  .admin-link:hover { color:var(--neon-pink) !important; text-shadow:0 0 8px var(--neon-pink) !important; }
  .footer-bottom   { grid-column:1 / -1; padding-top:30px; border-top:1px solid rgba(255,255,255,.05); display:flex; justify-content:space-between; align-items:center; }
  .footer-copy     { font-family:'Share Tech Mono',monospace; font-size:.6rem; color:rgba(224,224,255,.2); letter-spacing:.12em; }
  .footer-status   { display:flex; align-items:center; gap:8px; font-family:'Share Tech Mono',monospace; font-size:.6rem; color:rgba(0,255,249,.5); letter-spacing:.1em; }

  /* ════════════ LOGIN MODAL ════════════ */
  .modal-backdrop {
    position:fixed; inset:0; z-index:1000;
    background:rgba(3,0,10,.85); backdrop-filter:blur(8px);
    display:flex; align-items:center; justify-content:center;
    animation:fadeIn .2s ease;
  }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

  .modal {
    position:relative; width:460px;
    background:var(--dark2); border:1px solid rgba(0,255,249,.2);
    padding:50px 44px;
    box-shadow:0 0 60px rgba(0,255,249,.08),0 0 120px rgba(191,0,255,.06);
    animation:modalIn .3s ease;
    clip-path:polygon(16px 0%,100% 0%,calc(100% - 16px) 100%,0% 100%);
  }
  @keyframes modalIn { from { opacity:0; transform:translateY(20px) scale(.97) } to { opacity:1; transform:none } }

  .modal-corner    { position:absolute; width:24px; height:24px; }
  .modal-corner.tl { top:10px; left:10px; border-top:2px solid var(--neon-cyan); border-left:2px solid var(--neon-cyan); }
  .modal-corner.br { bottom:10px; right:10px; border-bottom:2px solid var(--neon-cyan); border-right:2px solid var(--neon-cyan); }

  .modal-close { position:absolute; top:16px; right:20px; background:transparent; border:none; color:rgba(224,224,255,.3); font-size:1rem; cursor:none; transition:color .2s; font-family:'Share Tech Mono',monospace; }
  .modal-close:hover { color:var(--neon-pink); text-shadow:0 0 10px var(--neon-pink); }

  .modal-eyebrow { font-family:'Share Tech Mono',monospace; font-size:.6rem; letter-spacing:.3em; text-transform:uppercase; color:var(--neon-cyan); text-shadow:0 0 8px var(--neon-cyan); margin-bottom:10px; }
  .modal-title   { font-family:'Bebas Neue',sans-serif; font-size:4rem; line-height:1; letter-spacing:.05em; margin-bottom:10px; }
  .modal-title span { color:var(--neon-pink); text-shadow:0 0 20px var(--neon-pink); }
  .modal-sub     { font-family:'Share Tech Mono',monospace; font-size:.7rem; color:rgba(224,224,255,.35); letter-spacing:.08em; margin-bottom:36px; line-height:1.6; }

  .login-form  { display:flex; flex-direction:column; gap:20px; }
  .form-group  { display:flex; flex-direction:column; gap:8px; }
  .form-label  { font-family:'Share Tech Mono',monospace; font-size:.6rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(0,255,249,.6); }
  .form-input  {
    background:rgba(0,255,249,.03); border:1px solid rgba(0,255,249,.15);
    color:var(--text); font-family:'Share Tech Mono',monospace; font-size:.75rem;
    letter-spacing:.08em; padding:12px 16px; outline:none;
    transition:border-color .3s,box-shadow .3s;
    clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);
  }
  .form-input:focus { border-color:var(--neon-cyan); box-shadow:0 0 15px rgba(0,255,249,.1); }
  .form-input::placeholder { color:rgba(224,224,255,.2); }

  .login-error { font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.15em; color:var(--neon-pink); text-shadow:0 0 8px var(--neon-pink); text-align:center; padding:8px; border:1px solid rgba(255,0,110,.3); background:rgba(255,0,110,.05); }

  .btn-login {
    font-family:'Share Tech Mono',monospace; font-size:.75rem; letter-spacing:.15em; text-transform:uppercase;
    background:var(--neon-cyan); color:var(--dark); border:none;
    padding:16px; cursor:none; font-weight:bold; transition:all .3s;
    clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);
    box-shadow:0 0 30px rgba(0,255,249,.4);
  }
  .btn-login:hover:not(:disabled) { box-shadow:0 0 50px rgba(0,255,249,.7); transform:translateY(-1px); }
  .btn-login:disabled { opacity:.7; }

  .loading-dots span              { animation:dotBlink 1.2s infinite; display:inline-block; }
  .loading-dots span:nth-child(2) { animation-delay:.2s; }
  .loading-dots span:nth-child(3) { animation-delay:.4s; }
  @keyframes dotBlink { 0%,80%,100% { opacity:0 } 40% { opacity:1 } }

  .login-divider { display:flex; align-items:center; gap:16px; font-family:'Share Tech Mono',monospace; font-size:.6rem; letter-spacing:.2em; color:rgba(224,224,255,.2); }
  .login-divider::before,.login-divider::after { content:''; flex:1; height:1px; background:rgba(224,224,255,.08); }

  .btn-register {
    font-family:'Share Tech Mono',monospace; font-size:.75rem; letter-spacing:.15em; text-transform:uppercase;
    background:transparent; color:var(--neon-purple); border:1px solid rgba(191,0,255,.4);
    padding:14px; cursor:none; transition:all .3s; text-decoration:none; text-align:center; display:block;
    clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);
    text-shadow:0 0 8px var(--neon-purple);
  }
  .btn-register:hover { background:rgba(191,0,255,.08); border-color:var(--neon-purple); box-shadow:0 0 20px rgba(191,0,255,.2); }

  .login-footer-text { text-align:center; }
  .login-footer-text a { font-family:'Share Tech Mono',monospace; font-size:.6rem; letter-spacing:.15em; text-transform:uppercase; color:rgba(224,224,255,.25); text-decoration:none; transition:color .2s; }
  .login-footer-text a:hover { color:var(--neon-cyan); text-shadow:0 0 8px var(--neon-cyan); }
</style>
