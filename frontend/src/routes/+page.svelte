<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  // page data from server — Svelte 5: $props() replaces export let
  let { data } = $props();

  // derived state — Svelte 5: $derived() replaces $: reactive declarations
  let session    = $derived(data.session);
  let isLoggedIn = $derived(data.session?.authenticated ?? false);
  let isAdmin    = $derived(data.user?.userType === 'admin');
  let games      = $derived(data.games ?? []);
  let categories = $derived(data.categories ?? []);

  // local state — Svelte 5: $state() replaces plain let for reactive vars
  let showLogin   = $state(false);
  let searchQuery = $state('');
  let cursorEl    = $state<HTMLDivElement | null>(null);
  let dotEl       = $state<HTMLDivElement | null>(null);

  // go to a page, show login first if the user isn't signed in
  function goTo(path: string, requiresAuth = false) {
    goto(path);
  }

  // run a search
  function handleSearch(e: SubmitEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) goto(`/games?q=${encodeURIComponent(q)}`);
  }

  // sign in with Google — redirects to Hono backend OAuth flow
  function handleGoogleSignIn() {
    window.location.href = 'http://localhost:9210/auth/google';
  }

  // sign out — calls Hono logout endpoint then returns to home
  async function handleSignOut() {
    await fetch('http://localhost:9210/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    window.location.href = '/';
  }

  // close the login modal when clicking the dark backdrop
  function closeOnBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) showLogin = false;
  }

  // custom cursor that smoothly follows the mouse
  onMount(() => {
    let mx = 0, my = 0, cx = 0, cy = 0;

    const onMove = (e: MouseEvent) => {
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

    const addHover = (el: Element) => {
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

<!-- cursor -->
<div class="cursor"     bind:this={cursorEl}></div>
<div class="cursor-dot" bind:this={dotEl}></div>

<!-- background grid and noise -->
<div class="grid-bg"></div>
<div class="noise"></div>

<!-- nav bar -->
<nav>
  <a href="/" class="logo-wrap">
    <span class="logo">PROG<em>CHAMP</em></span>
    <span class="logo-sub">an @ACMpesuecc project</span>
  </a>

  <form class="nav-search" onsubmit={handleSearch}>
    <input class="nav-search-input" type="text" placeholder="SEARCH GAMES..." bind:value={searchQuery} />
    <button type="submit" class="nav-search-btn" aria-label="Search">⌕</button>
  </form>

  <ul class="nav-links">
    <li><a href="/all-games"    class="nav-link" onclick={(e) => { e.preventDefault(); goTo('/all-games',    true); }}>ALL GAMES</a></li>
    <li><a href="/my-games" class="nav-link" onclick={(e) => { e.preventDefault(); goTo('/my-games', true); }}>MY GAMES</a></li>
    <li><a href="/upload"   class="nav-link" onclick={(e) => { e.preventDefault(); goTo('/upload',   true); }}>UPLOAD</a></li>
    <li><a href="/admin" class="nav-link nav-link--admin">ADMIN</a></li>
  </ul>

  {#if isLoggedIn}
    <div class="nav-user">
      {#if data.user?.avatarUrl}
        <img class="nav-avatar" src={data.user.avatarUrl} alt={data.user.name} referrerpolicy="no-referrer" />
      {/if}
      <button class="nav-cta nav-cta--out" onclick={handleSignOut}>LOG OUT</button>
    </div>
  {:else}
    <button class="nav-cta" onclick={() => showLogin = true}>LOGIN</button>
  {/if}
</nav>

<!-- hero section -->
<section class="hero">
  <div class="hero-orb orb1"></div>
  <div class="hero-orb orb2"></div>

  <div class="hero-inner">
    <!-- left: headline and buttons -->
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
        <button class="btn-primary" onclick={() => goTo('/all-games', true)}>ENTER THE VAULT</button>
        <a href="/all-games" class="btn-secondary" onclick={(e) => { e.preventDefault(); goTo('/all-games', true); }}>VIEW LIBRARY</a>
      </div>
    </div>

    <!-- right: space invaders animation -->
    <div class="hero-anim" aria-hidden="true">
      <div class="ga-screen">
        <div class="ga-scanlines"></div>
        <div class="ga-star s1"></div>
        <div class="ga-star s2"></div>
        <div class="ga-star s3"></div>
        <div class="ga-star s4"></div>
        <div class="ga-star s5"></div>
        <div class="ga-star s6"></div>
        <div class="ga-invaders">
          <div class="ga-inv inv1">👾</div>
          <div class="ga-inv inv2">👾</div>
          <div class="ga-inv inv3">👾</div>
          <div class="ga-inv inv4">👾</div>
          <div class="ga-inv inv5">👾</div>
        </div>
        <div class="ga-ebullet eb1"></div>
        <div class="ga-ebullet eb2"></div>
        <div class="ga-ship">🚀</div>
        <div class="ga-laser"></div>
        <div class="ga-explosion">💥</div>
        <div class="ga-hud">
          <span class="ga-score">SCORE <span class="ga-score-num">08450</span></span>
          <span class="ga-lives">♥ ♥ ♥</span>
        </div>
        <div class="ga-ground"></div>
      </div>
    </div>
  </div>
</section>

<!-- scrolling text ticker -->
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

<!-- trending games grid -->
<section>
  <div class="section-header">
    <h2 class="section-title trending-title">TRENDING</h2>
    <span class="section-tag">// UPDATED WEEKLY</span>
    <a href="/all-games" class="section-link" onclick={(e) => { e.preventDefault(); goTo('/all-games', true); }}>VIEW ALL →</a>
  </div>
  <div class="games-grid">
    {#each games as game, i}
      <a href="/all-games/{game.slug}" class="game-card">
        <div class="game-thumb">
          {#if game.image_url}
            <img class="game-thumb-img" src={game.image_url} alt={game.name} />
          {:else}
            <div class="game-thumb-fallback">
              <span style="color:{game.iconColor}">{game.icon}</span>
            </div>
          {/if}
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

<!-- genre categories -->
<section class="categories-section">
  <div class="section-header">
    <h2 class="section-title">EXPLORE BY <span>GENRE</span></h2>
    <span class="section-tag">// 48 CATEGORIES</span>
  </div>
  <div class="cat-grid">
    {#each categories as cat}
      <a href="/all-games?genre={encodeURIComponent(cat.name)}" class="cat-item">
        <span class="cat-icon">{cat.icon}</span>
        <div class="cat-name">{cat.name}</div>
      </a>
    {/each}
  </div>
</section>

<!-- upload banner for developers -->
<section class="upload-cta-section">
  <div class="upload-cta-inner">
    <div class="upload-text">
      <div class="upload-eyebrow">// FOR DEVELOPERS</div>
      <h2 class="upload-title">PUBLISH YOUR <span>GAME</span></h2>
      <p class="upload-sub">Got something worth playing? Upload your build, set your tags, and let the world plug in.</p>
    </div>
    <button class="btn-upload" onclick={() => goTo('/upload', true)}>UPLOAD A GAME ↗</button>
  </div>
</section>

<!-- sign up call to action -->
<section class="cta-section">
  <div class="cta-eyebrow">// INITIALIZE YOUR SESSION</div>
  <h2 class="cta-title">READY TO<br/><span class="accent">LOGIN?</span></h2>
  <p class="cta-sub">Create your free account and get instant access to 100 games. No credit card required. No downloads. Just pure, uncut gameplay.</p>
  <button class="btn-primary" onclick={() => showLogin = true}>CREATE FREE ACCOUNT</button>
</section>

<!-- footer -->
<footer>
  <div class="footer-brand">
    <div class="footer-logo">PROG<span>CHAMP</span></div>
    <div class="footer-logo-sub">an @ACMpesuecc project</div>
    
  </div>
  <div>
    <div class="footer-col-title">Vault</div>
    <ul class="footer-links">
      <li><a href="/all-games?sort=new">New Releases</a></li>
      <li><a href="/all-games?sort=top">Top Rated</a></li>
      <li><a href="/all-games?filter=free">Free to Play</a></li>
      <li><a href="/all-games?filter=upcoming">Coming Soon</a></li>
    </ul>
  </div>
  <div>
    <div class="footer-col-title">Your Space</div>
    <ul class="footer-links">
      <li><a href="/all-games">Browse All Games</a></li>
      <li><a href="/my-games" onclick={(e) => { e.preventDefault(); goTo('/my-games', true); }}>My Games</a></li>
      <li><a href="/upload"   onclick={(e) => { e.preventDefault(); goTo('/upload',   true); }}>Upload a Game</a></li>
        <li><a href="/admin" class="admin-link">Admin Panel</a></li>
    </ul>
  </div>
  <div>
    <div class="footer-col-title">ProgChamp</div>
    <ul class="footer-links">
      <li><a href="#">About ACMpesuecc</a></li>
     
    </ul>
  </div>
  <div class="footer-bottom">
    <div class="footer-copy">© 2026 PROGCHAMP — AN @ACMpesuecc PROJECT — ALL RIGHTS RESERVED</div>
    <div class="footer-status"><span class="status-dot"></span>ALL SYSTEMS OPERATIONAL</div>
  </div>
</footer>

<!-- login modal -->
{#if showLogin}
  <div class="modal-backdrop" onclick={closeOnBackdrop} role="presentation">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading">
      <div class="modal-corner tl"></div>
      <div class="modal-corner br"></div>
      <button class="modal-close" onclick={() => showLogin = false} aria-label="Close">✕</button>
      <div class="modal-eyebrow">// ACCESS TERMINAL</div>
      <h2 class="modal-title" id="modal-heading">LOG<span>IN</span></h2>
      <p class="modal-sub">Authenticate to access the vault. One click is all it takes.</p>
      <div class="modal-actions">
        <button class="btn-google" onclick={handleGoogleSignIn}>
          <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          CONTINUE WITH GOOGLE
        </button>
        <p class="modal-terms">By signing in you agree to the ProgChamp terms of use.</p>
      </div>
    </div>
  </div>
{/if}

<style>
  /* global colours and fonts */
  :global(:root) { --neon-cyan:#00fff9; --neon-pink:#ff006e; --neon-yellow:#ffe600; --neon-purple:#bf00ff; --dark:#03000a; --dark2:#0a0014; --grid-color:rgba(0,255,249,0.06); --text:#e0e0ff; }
  :global(*,*::before,*::after) { box-sizing:border-box; margin:0; padding:0; }
  :global(html) { scroll-behavior:smooth; }
  :global(body) { background:var(--dark); color:var(--text); font-family:'Oxanium',sans-serif; overflow-x:hidden; cursor:none; }
  :global(body::before) { content:''; position:fixed; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px); pointer-events:none; z-index:100; }

  /* cursor */
  .cursor { width:16px; height:16px; border:2px solid var(--neon-cyan); border-radius:50%; position:fixed; pointer-events:none; z-index:9999; transform:translate(-50%,-50%); transition:transform .12s ease,border-color .3s; mix-blend-mode:screen; }
  .cursor-dot { width:4px; height:4px; background:var(--neon-pink); border-radius:50%; position:fixed; pointer-events:none; z-index:9999; transform:translate(-50%,-50%); }

  /* background grid */
  .grid-bg { position:fixed; inset:0; background-image:linear-gradient(var(--grid-color) 1px,transparent 1px),linear-gradient(90deg,var(--grid-color) 1px,transparent 1px); background-size:60px 60px; z-index:0; animation:gridPulse 8s ease-in-out infinite; }
  @keyframes gridPulse { 0%,100%{opacity:.6} 50%{opacity:1} }
  .noise { position:fixed; inset:0; opacity:.03; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size:200px 200px; pointer-events:none; z-index:1; }

  /* nav bar */
  nav { position:fixed; top:0; left:0; right:0; z-index:200; display:flex; align-items:center; gap:22px; padding:14px 48px; border-bottom:1px solid rgba(0,255,249,.15); background:rgba(3,0,10,.92); backdrop-filter:blur(14px); }
  .logo-wrap { display:flex; flex-direction:column; align-items:flex-start; text-decoration:none; flex-shrink:0; gap:2px; }
  .logo { font-family:'Bebas Neue',sans-serif; font-size:2.4rem; letter-spacing:.12em; line-height:1; font-style:normal; color:var(--neon-cyan); text-shadow:0 0 20px var(--neon-cyan),0 0 60px rgba(0,255,249,.3); }
  .logo em { color:var(--neon-pink); font-style:normal; text-shadow:0 0 20px var(--neon-pink),0 0 60px rgba(255,0,110,.3); }
  .logo-sub { font-family:'Share Tech Mono',monospace; font-size:.72rem; letter-spacing:.14em; color:rgba(0,255,249,.4); text-transform:lowercase; white-space:nowrap; }
  .nav-search { display:flex; align-items:center; flex:1; max-width:400px; border:1px solid rgba(0,255,249,.2); background:rgba(0,255,249,.03); clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%); transition:border-color .3s,box-shadow .3s; }
  .nav-search:focus-within { border-color:var(--neon-cyan); box-shadow:0 0 20px rgba(0,255,249,.12); }
  .nav-search-input { flex:1; background:transparent; border:none; outline:none; font-family:'Share Tech Mono',monospace; font-size:.68rem; letter-spacing:.12em; color:var(--text); padding:10px 14px; text-transform:uppercase; }
  .nav-search-input::placeholder { color:rgba(224,224,255,.22); }
  .nav-search-btn { background:transparent; border:none; border-left:1px solid rgba(0,255,249,.15); color:var(--neon-cyan); font-size:1.1rem; padding:8px 13px; cursor:none; line-height:1; transition:background .2s,text-shadow .2s; }
  .nav-search-btn:hover { background:rgba(0,255,249,.08); text-shadow:0 0 12px var(--neon-cyan); }
  .nav-links { display:flex; gap:26px; list-style:none; }
  .nav-link { font-family:'Share Tech Mono',monospace; font-size:.67rem; letter-spacing:.18em; text-transform:uppercase; color:rgba(224,224,255,.5); text-decoration:none; position:relative; transition:color .2s; white-space:nowrap; }
  .nav-link::after { content:''; position:absolute; bottom:-4px; left:0; width:0; height:1px; background:var(--neon-cyan); box-shadow:0 0 8px var(--neon-cyan); transition:width .3s; }
  .nav-link:hover { color:var(--neon-cyan); }
  .nav-link:hover::after { width:100%; }
  .nav-link--admin { color:rgba(255,0,110,.7); }
  .nav-link--admin::after { background:var(--neon-pink); box-shadow:0 0 8px var(--neon-pink); }
  .nav-link--admin:hover { color:var(--neon-pink); }
  .nav-cta { font-family:'Share Tech Mono',monospace; font-size:.68rem; letter-spacing:.15em; text-transform:uppercase; background:transparent; border:1px solid var(--neon-pink); color:var(--neon-pink); padding:9px 22px; cursor:none; transition:all .3s; flex-shrink:0; text-shadow:0 0 10px var(--neon-pink); box-shadow:0 0 10px rgba(255,0,110,.2),inset 0 0 10px rgba(255,0,110,.05); clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); }
  .nav-cta:hover { background:var(--neon-pink); color:var(--dark); box-shadow:0 0 30px var(--neon-pink),0 0 60px rgba(255,0,110,.4); text-shadow:none; }
  .nav-cta--out { border-color:rgba(224,224,255,.2); color:rgba(224,224,255,.35); text-shadow:none; box-shadow:none; }
  .nav-cta--out:hover { background:rgba(224,224,255,.05); color:rgba(224,224,255,.6); box-shadow:none; }
  .nav-user { display:flex; align-items:center; gap:10px; flex-shrink:0; }
  .nav-avatar { width:28px; height:28px; border-radius:50%; border:1px solid rgba(0,255,249,.3); object-fit:cover; }

  /* hero section */
  .hero { position:relative; z-index:10; min-height:100vh; display:flex; flex-direction:column; justify-content:center; padding:80px 60px; margin-top:-30px; overflow:hidden; }
  .hero-orb { position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; }
  .orb1 { width:600px; height:600px; background:radial-gradient(circle,rgba(191,0,255,.15) 0%,transparent 70%); top:-200px; right:-100px; animation:orbFloat 10s ease-in-out infinite; }
  .orb2 { width:400px; height:400px; background:radial-gradient(circle,rgba(0,255,249,.1) 0%,transparent 70%); bottom:-100px; left:300px; animation:orbFloat 14s ease-in-out infinite reverse; }
  @keyframes orbFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-40px) scale(1.05)} }
  .hero-inner { display:flex; align-items:center; gap:60px; width:100%; }
  .hero-left { flex:1; min-width:0; }
  .hero-glitch-text { font-family:'Bebas Neue',sans-serif; font-size:clamp(3.5rem,8vw,7.5rem); line-height:.9; letter-spacing:.02em; display:inline-block; max-width:600px; animation:heroIn 1s ease both; }
  @keyframes heroIn { from{opacity:0;transform:translateY(40px) skewX(-5deg)} to{opacity:1;transform:none} }
  .line1 { display:block; color:transparent; -webkit-text-stroke:2px var(--neon-cyan); text-shadow:0 0 40px rgba(0,255,249,.3); }
  .line2 { display:block; color:var(--neon-pink); text-shadow:0 0 40px var(--neon-pink),0 0 80px rgba(255,0,110,.4); animation:glitch 4s infinite; }
  @keyframes glitch { 0%,90%,100%{transform:none;clip-path:none} 92%{transform:translateX(-3px);clip-path:polygon(0 20%,100% 20%,100% 40%,0 40%)} 94%{transform:translateX(3px);clip-path:polygon(0 60%,100% 60%,100% 80%,0 80%)} 96%{transform:none;clip-path:none} }
  .line3 { display:block; color:var(--neon-yellow); text-shadow:0 0 40px var(--neon-yellow),0 0 80px rgba(255,230,0,.3); }
  .hero-sub { font-family:'Share Tech Mono',monospace; font-size:.85rem; color:rgba(224,224,255,.5); margin-top:40px; letter-spacing:.1em; max-width:500px; line-height:1.8; border-left:2px solid var(--neon-cyan); padding-left:20px; animation:heroIn 1s .3s ease both; }
  .hero-actions { display:flex; gap:20px; margin-top:50px; animation:heroIn 1s .5s ease both; align-items:center; }

  /* space invaders animation panel */
  .hero-anim { flex:0 0 420px; display:flex; align-items:center; justify-content:center; animation:heroIn 1s .2s ease both; }
  .ga-screen { width:380px; height:420px; background:#000814; border:2px solid rgba(0,255,249,.3); box-shadow:0 0 40px rgba(0,255,249,.15),inset 0 0 40px rgba(0,0,0,.8); border-radius:8px; position:relative; overflow:hidden; font-family:monospace; }
  .ga-scanlines { position:absolute; inset:0; pointer-events:none; z-index:20; background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.18) 3px,rgba(0,0,0,.18) 4px); }
  .ga-star { position:absolute; border-radius:50%; background:#fff; animation:starTwinkle 2s ease-in-out infinite; }
  .s1{width:2px;height:2px;top:8%;left:12%;animation-delay:0s} .s2{width:3px;height:3px;top:15%;left:70%;animation-delay:.4s} .s3{width:2px;height:2px;top:5%;left:45%;animation-delay:.8s} .s4{width:2px;height:2px;top:22%;left:85%;animation-delay:1.1s} .s5{width:3px;height:3px;top:10%;left:30%;animation-delay:1.6s} .s6{width:2px;height:2px;top:18%;left:58%;animation-delay:.3s}
  @keyframes starTwinkle { 0%,100%{opacity:.3} 50%{opacity:1} }
  .ga-invaders { position:absolute; top:60px; left:0; right:0; display:flex; justify-content:space-around; padding:0 20px; animation:invaderMarch 3s ease-in-out infinite alternate; }
  @keyframes invaderMarch { from{transform:translateX(-30px)} to{transform:translateX(30px)} }
  .ga-inv { font-size:1.5rem; animation:invBob .6s ease-in-out infinite alternate; }
  .inv1{animation-delay:0s} .inv2{animation-delay:.1s} .inv3{animation-delay:.2s} .inv4{animation-delay:.3s} .inv5{animation-delay:.4s}
  @keyframes invBob { from{transform:translateY(0)} to{transform:translateY(-6px)} }
  .ga-ebullet { position:absolute; width:3px; height:14px; background:var(--neon-pink); border-radius:2px; box-shadow:0 0 6px var(--neon-pink); animation:ebulletFall 2s linear infinite; }
  .eb1{left:22%;top:100px;animation-delay:.3s} .eb2{left:72%;top:100px;animation-delay:1.4s}
  @keyframes ebulletFall { 0%{transform:translateY(0);opacity:1} 80%{opacity:1} 100%{transform:translateY(300px);opacity:0} }
  .ga-ship { position:absolute; bottom:52px; left:50%; transform:translateX(-50%) rotate(-90deg); font-size:2rem; animation:shipMove 4s ease-in-out infinite alternate; filter:drop-shadow(0 0 8px var(--neon-cyan)); }
  @keyframes shipMove { from{left:25%} to{left:75%} }
  .ga-laser { position:absolute; bottom:90px; left:50%; width:3px; height:0; background:var(--neon-cyan); box-shadow:0 0 8px var(--neon-cyan); transform:translateX(-50%); animation:laserFire 2s ease-in-out infinite; transform-origin:bottom center; }
  @keyframes laserFire { 0%{height:0;opacity:0;bottom:90px} 10%{height:60px;opacity:1} 50%{height:260px;opacity:1;bottom:90px} 60%{height:0;opacity:0} 100%{height:0;opacity:0} }
  .ga-explosion { position:absolute; top:95px; left:45%; font-size:2rem; animation:explode 2s ease-in-out infinite; pointer-events:none; }
  @keyframes explode { 0%,49%{opacity:0;transform:scale(.4)} 50%{opacity:1;transform:scale(1.3)} 65%{opacity:1;transform:scale(1)} 80%,100%{opacity:0;transform:scale(.4)} }
  .ga-hud { position:absolute; top:10px; left:0; right:0; display:flex; justify-content:space-between; padding:0 14px; font-size:.6rem; letter-spacing:.12em; color:rgba(0,255,249,.7); font-family:'Share Tech Mono',monospace; }
  .ga-score-num { color:var(--neon-cyan); }
  .ga-lives { color:var(--neon-pink); text-shadow:0 0 6px var(--neon-pink); }
  .ga-ground { position:absolute; bottom:44px; left:0; right:0; height:1px; background:rgba(0,255,249,.25); box-shadow:0 0 4px rgba(0,255,249,.4); }

  /* buttons */
  .btn-primary { font-family:'Share Tech Mono',monospace; font-size:.8rem; letter-spacing:.15em; text-transform:uppercase; background:var(--neon-cyan); color:var(--dark); border:none; padding:16px 40px; cursor:none; font-weight:bold; transition:all .3s; clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%); box-shadow:0 0 30px rgba(0,255,249,.5),0 0 60px rgba(0,255,249,.2); }
  .btn-primary:hover { box-shadow:0 0 50px rgba(0,255,249,.8),0 0 100px rgba(0,255,249,.4); transform:translateY(-2px); }
  .btn-secondary { font-family:'Share Tech Mono',monospace; font-size:.8rem; letter-spacing:.15em; text-transform:uppercase; background:transparent; color:var(--neon-yellow); border:1px solid var(--neon-yellow); padding:16px 40px; cursor:none; transition:all .3s; text-decoration:none; display:inline-block; clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%); box-shadow:0 0 15px rgba(255,230,0,.2); text-shadow:0 0 10px var(--neon-yellow); }
  .btn-secondary:hover { background:rgba(255,230,0,.1); box-shadow:0 0 30px rgba(255,230,0,.4); }

  /* scrolling ticker */
  .marquee-section { border-top:1px solid rgba(255,0,110,.2); border-bottom:1px solid rgba(255,0,110,.2); padding:16px 0; background:rgba(255,0,110,.03); overflow:hidden; position:relative; z-index:10; }
  .marquee-track { display:flex; gap:60px; animation:marquee 22s linear infinite; white-space:nowrap; }
  @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  .marquee-item { font-family:'Share Tech Mono',monospace; font-size:.7rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(255,0,110,.5); flex-shrink:0; }
  .marquee-item span { color:var(--neon-pink); text-shadow:0 0 8px var(--neon-pink); }

  /* section titles */
  section { position:relative; z-index:10; padding:100px 60px; }
  .section-header { display:flex; align-items:baseline; gap:20px; margin-bottom:60px; flex-wrap:wrap; }
  .section-title { font-family:'Bebas Neue',sans-serif; font-size:3.5rem; letter-spacing:.05em; color:var(--text); }
  .section-title span { color:var(--neon-pink); text-shadow:0 0 20px var(--neon-pink); }
  .section-tag { font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.2em; color:rgba(224,224,255,.3); text-transform:uppercase; }
  .section-link { margin-left:auto; font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.15em; text-transform:uppercase; color:var(--neon-cyan); text-decoration:none; text-shadow:0 0 8px var(--neon-cyan); transition:opacity .2s; }
  .section-link:hover { opacity:.7; }

  /* trending title glitch on hover */
  .trending-title { color:var(--neon-cyan); text-shadow:0 0 20px var(--neon-cyan),0 0 40px rgba(0,255,249,.3); position:relative; cursor:none; }
  .trending-title::before,.trending-title::after { content:'TRENDING'; position:absolute; left:0; top:0; width:100%; height:100%; opacity:0; }
  .trending-title::before { color:var(--neon-pink); text-shadow:0 0 20px var(--neon-pink); }
  .trending-title::after  { color:var(--neon-yellow); text-shadow:0 0 20px var(--neon-yellow); }
  .trending-title:hover { animation:tGlitchMain .5s steps(1) infinite; }
  .trending-title:hover::before { animation:tGlitch1 .5s steps(1) infinite; }
  .trending-title:hover::after  { animation:tGlitch2 .5s steps(1) infinite; }
  @keyframes tGlitchMain { 0%,100%{transform:none;clip-path:none} 20%{transform:translateX(2px);clip-path:polygon(0 30%,100% 30%,100% 55%,0 55%)} 40%{transform:translateX(-2px);clip-path:polygon(0 65%,100% 65%,100% 85%,0 85%)} 60%{transform:none;clip-path:none} }
  @keyframes tGlitch1 { 0%,100%{opacity:0;transform:none;clip-path:none} 20%,25%{opacity:1;transform:translateX(-4px);clip-path:polygon(0 10%,100% 10%,100% 40%,0 40%)} 50%,55%{opacity:1;transform:translateX(3px);clip-path:polygon(0 60%,100% 60%,100% 75%,0 75%)} 80%{opacity:0} }
  @keyframes tGlitch2 { 0%,100%{opacity:0;transform:none;clip-path:none} 30%,35%{opacity:1;transform:translateX(4px);clip-path:polygon(0 50%,100% 50%,100% 70%,0 70%)} 60%,65%{opacity:1;transform:translateX(-3px);clip-path:polygon(0 15%,100% 15%,100% 35%,0 35%)} 90%{opacity:0} }

  /* game cards */
  .games-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; background:rgba(0,255,249,.05); border:1px solid rgba(0,255,249,.1); }
  .game-card { background:var(--dark2); overflow:hidden; position:relative; cursor:none; transition:transform .3s; aspect-ratio:3/4; display:flex; flex-direction:column; justify-content:flex-end; text-decoration:none; }
  .game-card:hover { z-index:2; transform:scale(1.02); }
  .game-thumb { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .game-thumb-img { width:100%; height:100%; object-fit:cover; transition:transform .5s; display:block; }
  .game-card:hover .game-thumb-img { transform:scale(1.08); }
  .game-thumb-fallback { width:100%; height:100%; background:linear-gradient(135deg,#0a0020 0%,#1a0040 50%,#2a0060 100%); display:flex; align-items:center; justify-content:center; font-size:4rem; }
  .game-art-pattern { position:absolute; inset:0; opacity:.06; background-image:repeating-linear-gradient(45deg,#fff 0px,#fff 1px,transparent 1px,transparent 10px); pointer-events:none; }
  .game-icon { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:3.5rem; opacity:.15; pointer-events:none; transition:opacity .3s; }
  .game-card:hover .game-icon { opacity:.25; }
  .game-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(3,0,10,.95) 0%,rgba(3,0,10,.5) 40%,transparent 70%); }
  .game-hover-btn { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,255,249,.05); opacity:0; transition:opacity .3s; }
  .game-card:hover .game-hover-btn { opacity:1; }
  .play-btn { font-family:'Share Tech Mono',monospace; font-size:.7rem; letter-spacing:.2em; text-transform:uppercase; background:var(--neon-cyan); color:var(--dark); padding:12px 30px; font-weight:bold; clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); box-shadow:0 0 30px rgba(0,255,249,.6); }
  .game-info { position:relative; padding:24px; }
  .game-genre { font-family:'Share Tech Mono',monospace; font-size:.6rem; letter-spacing:.25em; text-transform:uppercase; color:var(--neon-pink); text-shadow:0 0 10px var(--neon-pink); margin-bottom:6px; }
  .game-name { font-family:'Bebas Neue',sans-serif; font-size:1.8rem; letter-spacing:.05em; color:white; text-shadow:0 0 20px rgba(255,255,255,.3); margin-bottom:8px; }
  .game-meta { display:flex; align-items:center; justify-content:space-between; }
  .game-rating { font-family:'Share Tech Mono',monospace; font-size:.65rem; color:var(--neon-yellow); text-shadow:0 0 8px var(--neon-yellow); }
  .corner-deco { position:absolute; width:40px; height:40px; pointer-events:none; }
  .corner-deco.tl { top:0; left:0; border-top:2px solid var(--neon-cyan); border-left:2px solid var(--neon-cyan); }
  .corner-deco.br { bottom:0; right:0; border-bottom:2px solid var(--neon-cyan); border-right:2px solid var(--neon-cyan); }

  /* genre categories */
  .categories-section { background:rgba(10,0,20,.8); border-top:1px solid rgba(191,0,255,.2); border-bottom:1px solid rgba(191,0,255,.2); }
  .cat-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:16px; }
  .cat-item { border:1px solid rgba(191,0,255,.2); padding:24px 16px; text-align:center; cursor:none; transition:all .3s; position:relative; overflow:hidden; background:rgba(191,0,255,.03); text-decoration:none; display:block; }
  .cat-item::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,transparent 50%,rgba(191,0,255,.1) 100%); opacity:0; transition:opacity .3s; }
  .cat-item:hover { border-color:var(--neon-purple); transform:translateY(-4px); }
  .cat-item:hover::before { opacity:1; }
  .cat-icon { font-size:2rem; margin-bottom:10px; transition:all .3s; display:block; }
  .cat-item:hover .cat-icon { text-shadow:0 0 20px var(--neon-purple); transform:scale(1.2); }
  .cat-name { font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.15em; text-transform:uppercase; color:rgba(224,224,255,.5); }

  /* upload banner */
  .upload-cta-section { position:relative; z-index:10; padding:0 60px 80px; }
  .upload-cta-inner { display:flex; align-items:center; justify-content:space-between; gap:40px; border:1px solid rgba(255,230,0,.2); padding:50px 60px; background:rgba(255,230,0,.02); position:relative; clip-path:polygon(16px 0%,100% 0%,calc(100% - 16px) 100%,0% 100%); }
  .upload-cta-inner::before { content:''; position:absolute; inset:0; background:linear-gradient(90deg,rgba(255,230,0,.04) 0%,transparent 60%); pointer-events:none; }
  .upload-eyebrow { font-family:'Share Tech Mono',monospace; font-size:.6rem; letter-spacing:.3em; text-transform:uppercase; color:var(--neon-yellow); text-shadow:0 0 8px var(--neon-yellow); margin-bottom:12px; }
  .upload-title { font-family:'Bebas Neue',sans-serif; font-size:3rem; letter-spacing:.05em; line-height:1; margin-bottom:12px; }
  .upload-title span { color:var(--neon-yellow); text-shadow:0 0 20px var(--neon-yellow); }
  .upload-sub { font-family:'Share Tech Mono',monospace; font-size:.72rem; color:rgba(224,224,255,.4); letter-spacing:.08em; line-height:1.7; max-width:420px; }
  .btn-upload { font-family:'Share Tech Mono',monospace; font-size:.78rem; letter-spacing:.15em; text-transform:uppercase; background:transparent; color:var(--neon-yellow); border:1px solid var(--neon-yellow); padding:18px 44px; cursor:none; transition:all .3s; flex-shrink:0; clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%); text-shadow:0 0 10px var(--neon-yellow); box-shadow:0 0 20px rgba(255,230,0,.15); }
  .btn-upload:hover { background:rgba(255,230,0,.1); box-shadow:0 0 40px rgba(255,230,0,.35); transform:translateY(-2px); }

  /* sign up section */
  .cta-section { text-align:center; padding:140px 60px; background:radial-gradient(ellipse at center,rgba(191,0,255,.08) 0%,transparent 70%); border-top:1px solid rgba(191,0,255,.1); }
  .cta-eyebrow { font-family:'Share Tech Mono',monospace; font-size:.7rem; letter-spacing:.3em; text-transform:uppercase; color:var(--neon-purple); text-shadow:0 0 10px var(--neon-purple); margin-bottom:20px; }
  .cta-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(3rem,8vw,7rem); line-height:.95; letter-spacing:.02em; margin-bottom:30px; }
  .cta-title .accent { color:var(--neon-cyan); text-shadow:0 0 30px var(--neon-cyan); }
  .cta-sub { font-family:'Share Tech Mono',monospace; font-size:.8rem; color:rgba(224,224,255,.4); margin-bottom:50px; letter-spacing:.1em; max-width:500px; margin-left:auto; margin-right:auto; line-height:1.8; }

  /* footer */
  footer { position:relative; z-index:10; padding:60px; border-top:1px solid rgba(0,255,249,.1); display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:60px; background:rgba(3,0,10,.95); }
  .footer-logo { font-family:'Bebas Neue',sans-serif; font-size:3.2rem; color:var(--neon-cyan); text-shadow:0 0 20px var(--neon-cyan); margin-bottom:4px; }
  .footer-logo span { color:var(--neon-pink); text-shadow:0 0 20px var(--neon-pink); }
  .footer-logo-sub { font-family:'Share Tech Mono',monospace; font-size:.72rem; color:rgba(0,255,249,.4); letter-spacing:.12em; margin-bottom:14px; }
  .footer-desc { font-family:'Share Tech Mono',monospace; font-size:.7rem; line-height:1.8; color:rgba(224,224,255,.3); letter-spacing:.05em; }
  .footer-col-title { font-family:'Bebas Neue',sans-serif; font-size:1.2rem; letter-spacing:.1em; color:rgba(224,224,255,.5); margin-bottom:20px; }
  .footer-links { list-style:none; display:flex; flex-direction:column; gap:12px; }
  .footer-links a { font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.1em; color:rgba(224,224,255,.3); text-decoration:none; text-transform:uppercase; transition:color .2s; cursor:none; }
  .footer-links a:hover { color:var(--neon-cyan); text-shadow:0 0 8px var(--neon-cyan); }
  .admin-link { color:rgba(255,0,110,.5) !important; }
  .admin-link:hover { color:var(--neon-pink) !important; text-shadow:0 0 8px var(--neon-pink) !important; }
  .footer-bottom { grid-column:1 / -1; padding-top:30px; border-top:1px solid rgba(255,255,255,.05); display:flex; justify-content:space-between; align-items:center; }
  .footer-copy { font-family:'Share Tech Mono',monospace; font-size:.6rem; color:rgba(224,224,255,.2); letter-spacing:.12em; }
  .footer-status { display:flex; align-items:center; gap:8px; font-family:'Share Tech Mono',monospace; font-size:.6rem; color:rgba(0,255,249,.5); letter-spacing:.1em; }
  .status-dot { width:6px; height:6px; background:var(--neon-cyan); border-radius:50%; box-shadow:0 0 6px var(--neon-cyan); animation:blink 2s step-end infinite; display:inline-block; flex-shrink:0; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* login modal */
  .modal-backdrop { position:fixed; inset:0; z-index:1000; background:rgba(3,0,10,.85); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; animation:fadeIn .2s ease; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal { position:relative; width:420px; background:var(--dark2); border:1px solid rgba(0,255,249,.2); padding:50px 44px; box-shadow:0 0 60px rgba(0,255,249,.08),0 0 120px rgba(191,0,255,.06); animation:modalIn .3s ease; clip-path:polygon(16px 0%,100% 0%,calc(100% - 16px) 100%,0% 100%); }
  @keyframes modalIn { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }
  .modal-corner { position:absolute; width:24px; height:24px; }
  .modal-corner.tl { top:10px; left:10px; border-top:2px solid var(--neon-cyan); border-left:2px solid var(--neon-cyan); }
  .modal-corner.br { bottom:10px; right:10px; border-bottom:2px solid var(--neon-cyan); border-right:2px solid var(--neon-cyan); }
  .modal-close { position:absolute; top:16px; right:20px; background:transparent; border:none; color:rgba(224,224,255,.3); font-size:1rem; cursor:none; transition:color .2s; font-family:'Share Tech Mono',monospace; }
  .modal-close:hover { color:var(--neon-pink); text-shadow:0 0 10px var(--neon-pink); }
  .modal-eyebrow { font-family:'Share Tech Mono',monospace; font-size:.6rem; letter-spacing:.3em; text-transform:uppercase; color:var(--neon-cyan); text-shadow:0 0 8px var(--neon-cyan); margin-bottom:10px; }
  .modal-title { font-family:'Bebas Neue',sans-serif; font-size:4rem; line-height:1; letter-spacing:.05em; margin-bottom:10px; }
  .modal-title span { color:var(--neon-pink); text-shadow:0 0 20px var(--neon-pink); }
  .modal-sub { font-family:'Share Tech Mono',monospace; font-size:.7rem; color:rgba(224,224,255,.35); letter-spacing:.08em; margin-bottom:36px; line-height:1.6; }
  .modal-actions { display:flex; flex-direction:column; gap:16px; }
  .btn-google { display:flex; align-items:center; justify-content:center; gap:14px; font-family:'Share Tech Mono',monospace; font-size:.75rem; letter-spacing:.15em; text-transform:uppercase; background:rgba(255,255,255,.04); color:var(--text); border:1px solid rgba(255,255,255,.15); padding:16px 24px; cursor:none; transition:all .3s; width:100%; clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%); }
  .btn-google:hover { background:rgba(255,255,255,.09); border-color:rgba(255,255,255,.35); box-shadow:0 0 20px rgba(255,255,255,.05); transform:translateY(-1px); }
  .google-icon { width:20px; height:20px; flex-shrink:0; }
  .modal-terms { font-family:'Share Tech Mono',monospace; font-size:.58rem; color:rgba(224,224,255,.2); letter-spacing:.08em; text-align:center; line-height:1.6; }
</style>
