<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { submissions } from '../../lib/stores/submissions';

  
  // AUTH
  let isLoggedIn = $state(false);
  let isAdmin    = $state(false);
  let session    = $derived($page.data.session);

  // LOGIN MODAL STATE
  let showLogin     = $state(false);
  let loginEmail    = $state('');
  let loginPassword = $state('');
  let loginError    = $state('');
  let isLoggingIn   = $state(false);

  // FILTER / SEARCH STATE
  let searchQuery = $state('');
  let activeGenre = $state('All');
  let sortBy      = $state('newest');

  const genres = ['All', 'Action RPG', 'Shooter', 'Racing', 'Strategy', 'Arcade', 'Space Sim', 'Survival', 'Horror', 'Fighting', 'Puzzle'];

  // DUMMY PUBLISHED GAMES (replace with real API)
  const staticGames = [
    { id:'1', title:'VOID SYNDICATE',  genre:'Action RPG', dev:'darkforge',   rating:9.8, players:124000, thumbnail:null, url:'#', publishedAt: new Date('2026-01-10') },
    { id:'2', title:'ARCTIC BREACH',   genre:'Shooter',    dev:'coldlab',     rating:8.9, players:89000,  thumbnail:null, url:'#', publishedAt: new Date('2026-01-22') },
    { id:'3', title:'IRON REQUIEM',    genre:'Action RPG', dev:'steelworks',  rating:8.5, players:67000,  thumbnail:null, url:'#', publishedAt: new Date('2026-02-01') },
    { id:'4', title:'DEEP ROOT',       genre:'Horror',     dev:'mosspit',     rating:9.2, players:52000,  thumbnail:null, url:'#', publishedAt: new Date('2026-02-14') },
    { id:'5', title:'NEON DRIFT',      genre:'Racing',     dev:'turbostudio', rating:8.7, players:41000,  thumbnail:null, url:'#', publishedAt: new Date('2026-02-20') },
    { id:'6', title:'PULSE COMBAT',    genre:'Fighting',   dev:'arcadecore',  rating:9.4, players:98000,  thumbnail:null, url:'#', publishedAt: new Date('2026-02-28') },
    { id:'7', title:'STAR VAGRANT',    genre:'Space Sim',  dev:'voidship',    rating:8.1, players:23000,  thumbnail:null, url:'#', publishedAt: new Date('2026-01-05') },
    { id:'8', title:'GRID TACTICIAN',  genre:'Strategy',   dev:'hexmind',     rating:8.3, players:31000,  thumbnail:null, url:'#', publishedAt: new Date('2026-01-18') },
  ];

  // Merge in approved submissions from the store
  let storeGames = $derived(
    $submissions
      .filter((s: any) => s.status === 'approved')
      .map((s: any) => ({
        id: s.id, title: s.title, genre: s.genre ?? 'Uncategorised',
        dev: s.dev, rating: 0, players: 0,
        thumbnail: s.thumbnail ? URL.createObjectURL(s.thumbnail) : null,
        url: s.url, publishedAt: new Date(),
      }))
  );

  let allGames = $derived([...staticGames, ...storeGames]);

  let filteredGames = $derived(() => {
    let result = allGames;
    if (activeGenre !== 'All') result = result.filter((g: any) => g.genre === activeGenre);
    if (searchQuery.trim()) result = result.filter((g: any) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.dev.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (sortBy === 'newest') result = [...result].sort((a: any, b: any) => b.publishedAt - a.publishedAt);
    else if (sortBy === 'rating') result = [...result].sort((a: any, b: any) => b.rating - a.rating);
    else if (sortBy === 'players') result = [...result].sort((a: any, b: any) => b.players - a.players);
    return result;
  });

  // AUTH HELPERS
  function goTo(path: string, requiresAuth = false) {
    if (requiresAuth && !isLoggedIn) showLogin = true;
    else goto(path);
  }
  async function handleLogin(e: Event) {
    e.preventDefault();
    loginError = '';
    if (!loginEmail || !loginPassword) { loginError = 'ALL FIELDS REQUIRED'; return; }
    isLoggingIn = true;
    try {
      await new Promise(r => setTimeout(r, 1200));
      isLoggedIn = true; showLogin = false; loginEmail = loginPassword = '';
    } catch (err: any) {
      loginError = err.message || 'LOGIN FAILED';
    } finally { isLoggingIn = false; }
  }
  function logout() { isLoggedIn = false; isAdmin = false; }
  function closeOnBackdrop(e: MouseEvent) { if (e.target === e.currentTarget) showLogin = false; }

  // CURSOR
  let cursorEl = $state<HTMLElement | undefined>(undefined);
  let dotEl    = $state<HTMLElement | undefined>(undefined);

  onMount(() => {
    let mx = 0, my = 0, cx = 0, cy = 0;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (dotEl) { dotEl.style.left = mx+'px'; dotEl.style.top = my+'px'; }
    };
    document.addEventListener('mousemove', onMove);
    const raf = () => {
      cx += (mx-cx)*0.12; cy += (my-cy)*0.12;
      if (cursorEl) { cursorEl.style.left = cx+'px'; cursorEl.style.top = cy+'px'; }
      requestAnimationFrame(raf);
    };
    raf();
    const addHover = (el: Element) => {
      el.addEventListener('mouseenter', () => { if (cursorEl) { cursorEl.style.transform='translate(-50%,-50%) scale(2)'; cursorEl.style.borderColor='var(--neon-pink)'; } });
      el.addEventListener('mouseleave', () => { if (cursorEl) { cursorEl.style.transform='translate(-50%,-50%) scale(1)'; cursorEl.style.borderColor='var(--neon-cyan)'; } });
    };
    document.querySelectorAll('button, a, .game-card').forEach(addHover);
    return () => document.removeEventListener('mousemove', onMove);
  });

  function formatPlayers(n: number) {
    if (n >= 1000) return (n/1000).toFixed(0)+'K';
    return n.toString();
  }

  const iconColors = ['#bf00ff','#00ccff','#ff3300','#00cc44','#ffee00','#ff0066'];
  const icons      = ['⬡','◈','⟁','✦','◉','⟡'];
</script>

<svelte:head>
  <title>ALL GAMES // PROGCHAMP</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Oxanium:wght@300;400;600;800&display=swap" rel="stylesheet" />
</svelte:head>

<div class="cursor" bind:this={cursorEl}></div>
<div class="cursor-dot" bind:this={dotEl}></div>
<div class="grid-bg"></div>
<div class="noise"></div>

<!-- NAV -->
<nav>
  <a href="/" class="logo-wrap">
    <span class="logo">PROG<em>CHAMP</em></span>
    <span class="logo-sub">an @ACMpesuecc project</span>
  </a>
  <ul class="nav-links">
    <li><a href="/all-games" class="nav-link nav-link--active">ALL GAMES</a></li>
    <li><a href="/my-games" class="nav-link" onclick={(e)=>{e.preventDefault();goTo('/my-games',true);}}>MY GAMES</a></li>
    <li><a href="/upload"   class="nav-link" onclick={(e)=>{e.preventDefault();goTo('/upload',true);}}>UPLOAD</a></li>
    {#if isAdmin}<li><a href="/admin" class="nav-link nav-link--admin">ADMIN</a></li>{/if}
  </ul>
  {#if isLoggedIn}
    <button class="nav-cta nav-cta--out" onclick={logout}>LOG OUT</button>
  {:else}
    <button class="nav-cta" onclick={()=>showLogin=true}>LOGIN</button>
  {/if}
</nav>

<!-- HEADER -->
<header class="page-header">
  <div class="header-orb orb1"></div>
  <div class="header-orb orb2"></div>
  <div class="header-inner">
    <div class="header-eyebrow">// THE VAULT</div>
    <h1 class="header-title">ALL <span>GAMES</span></h1>
    <p class="header-sub">{allGames.length} titles available.</p>
  </div>
</header>

<!-- FILTERS -->
<div class="filters-bar">
  <div class="search-wrap">
    <span class="search-icon">⌕</span>
    <input class="search-input" type="text" placeholder="SEARCH GAMES OR DEVS..." bind:value={searchQuery} />
  </div>
  <select class="filter-select" bind:value={sortBy}>
    <option value="newest">NEWEST FIRST</option>
    <option value="rating">TOP RATED</option>
    <option value="players">MOST PLAYED</option>
  </select>
</div>
<div class="genre-bar">
  {#each genres as g}
    <button class="genre-pill" class:active={activeGenre===g} onclick={()=>activeGenre=g}>{g.toUpperCase()}</button>
  {/each}
</div>

<!-- GRID -->
<main class="games-main">
  {#if filteredGames().length === 0}
    <div class="empty-state">
      <div class="empty-icon">◌</div>
      <div class="empty-title">NO GAMES FOUND</div>
      <div class="empty-sub">Try a different search or genre filter.</div>
    </div>
  {:else}
    <div class="results-count">// {filteredGames().length} RESULT{filteredGames().length !== 1 ? 'S' : ''}</div>
    <div class="games-grid">
      {#each filteredGames() as game, i}
        <a href={game.url} class="game-card">
          <div class="game-thumb">
            {#if game.thumbnail}
              <img src={game.thumbnail} alt={game.title} class="thumb-img" />
            {:else}
              <div class="thumb-placeholder" style="background:radial-gradient(circle at 30% 30%,{iconColors[i%iconColors.length]}22,transparent 70%)">
                <span class="thumb-icon" style="color:{iconColors[i%iconColors.length]}">{icons[i%icons.length]}</span>
              </div>
            {/if}
            <div class="game-overlay"></div>
            <div class="game-hover-btn">PLAY NOW</div>
          </div>
          <div class="game-info">
            <div class="game-genre">{game.genre.toUpperCase()}</div>
            <div class="game-title">{game.title}</div>
            <div class="game-meta">
              <span class="game-dev">by {game.dev}</span>
              {#if game.rating > 0}<span class="game-rating">★ {game.rating}</span>{/if}
            </div>
            {#if game.players > 0}<div class="game-players">{formatPlayers(game.players)} PLAYING</div>{/if}
          </div>
        </a>
      {/each}
    </div>
  {/if}
</main>

<!-- FOOTER -->
<footer>
  <div class="footer-brand">
    <div class="footer-logo">PROG<span>CHAMP</span></div>
    <div class="footer-logo-sub">an @ACMpesuecc project</div>
    <p class="footer-desc">Upload, compete, ascend.</p>
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
      <li><a href="/my-games" onclick={(e)=>{e.preventDefault();goTo('/my-games',true);}}>My Games</a></li>
      <li><a href="/upload"   onclick={(e)=>{e.preventDefault();goTo('/upload',true);}}>Upload a Game</a></li>
      {#if isAdmin}<li><a href="/admin" class="admin-link">Admin Panel</a></li>{/if}
    </ul>
  </div>
  <div>
    <div class="footer-col-title">ProgChamp</div>
    <ul class="footer-links">
      <li><a href="/about">About ACMpesuecc</a></li>
    </ul>
  </div>
  <div class="footer-bottom">
    <div class="footer-copy">© 2026 PROGCHAMP — AN @ACMpesuecc PROJECT — ALL RIGHTS RESERVED</div>
    <div class="footer-status"><span class="status-dot"></span>ALL SYSTEMS OPERATIONAL</div>
  </div>
</footer>

<!-- ════ LOGIN MODAL ════ -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if showLogin}
  <div class="modal-backdrop" onclick={closeOnBackdrop}>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading">
      <div class="modal-corner tl"></div>
      <div class="modal-corner br"></div>
      <button class="modal-close" onclick={()=>showLogin=false} aria-label="Close">✕</button>
      <div class="modal-eyebrow">// ACCESS TERMINAL</div>
      <h2 class="modal-title" id="modal-heading">LOG<span>IN</span></h2>
      <p class="modal-sub">Enter your credentials to access the vault.</p>
      <form class="login-form" onsubmit={handleLogin}>
        <div class="form-group">
          <label class="form-label" for="login-email">EMAIL ADDRESS</label>
          <input id="login-email" type="email" class="form-input" placeholder="operator@progchamp.gg" bind:value={loginEmail} autocomplete="email" />
        </div>
        <div class="form-group">
          <label class="form-label" for="login-pass">PASSWORD</label>
          <input id="login-pass" type="password" class="form-input" placeholder="••••••••••••" bind:value={loginPassword} autocomplete="current-password" />
        </div>
        {#if loginError}<div class="login-error" role="alert">{loginError}</div>{/if}
        <button type="submit" class="btn-login" disabled={isLoggingIn}>
          {#if isLoggingIn}<span class="loading-dots">CONNECTING<span>.</span><span>.</span><span>.</span></span>{:else}INITIALIZE SESSION{/if}
        </button>
        <div class="login-divider"><span>OR</span></div>
        <a href="/register" class="btn-register">CREATE NEW ACCOUNT</a>
        <div class="login-footer-text"><a href="/forgot-password">FORGOT PASSWORD?</a></div>
      </form>
    </div>
  </div>
{/if}

<style>
  :global(:root){--neon-cyan:#00fff9;--neon-pink:#ff006e;--neon-yellow:#ffe600;--neon-purple:#bf00ff;--dark:#03000a;--dark2:#0a0014;--grid-color:rgba(0,255,249,0.06);--text:#e0e0ff;}
  :global(*,*::before,*::after){box-sizing:border-box;margin:0;padding:0;}
  :global(html){scroll-behavior:smooth;}
  :global(body){background:var(--dark);color:var(--text);font-family:'Oxanium',sans-serif;overflow-x:hidden;cursor:none;}
  :global(body::before){content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px);pointer-events:none;z-index:100;}

  .cursor{width:16px;height:16px;border:2px solid var(--neon-cyan);border-radius:50%;position:fixed;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:transform .12s ease,border-color .3s;mix-blend-mode:screen;}
  .cursor-dot{width:4px;height:4px;background:var(--neon-pink);border-radius:50%;position:fixed;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);}
  .grid-bg{position:fixed;inset:0;background-image:linear-gradient(var(--grid-color) 1px,transparent 1px),linear-gradient(90deg,var(--grid-color) 1px,transparent 1px);background-size:60px 60px;z-index:0;animation:gridPulse 8s ease-in-out infinite;}
  @keyframes gridPulse{0%,100%{opacity:.6}50%{opacity:1}}
  .noise{position:fixed;inset:0;opacity:.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:200px 200px;pointer-events:none;z-index:1;}

  nav{position:fixed;top:0;left:0;right:0;z-index:200;display:flex;align-items:center;gap:22px;padding:14px 48px;border-bottom:1px solid rgba(0,255,249,.15);background:rgba(3,0,10,.92);backdrop-filter:blur(14px);}
  .logo-wrap{display:flex;flex-direction:column;align-items:flex-start;text-decoration:none;flex-shrink:0;gap:2px;margin-right:auto;}
  .logo{font-family:'Bebas Neue',sans-serif;font-size:2.4rem;letter-spacing:.12em;line-height:1;font-style:normal;color:var(--neon-cyan);text-shadow:0 0 20px var(--neon-cyan),0 0 60px rgba(0,255,249,.3);}
  .logo em{font-style:normal;color:var(--neon-pink);text-shadow:0 0 20px var(--neon-pink);}
  .logo-sub{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.15em;color:rgba(0,255,249,.4);text-transform:uppercase;}
  .nav-links{list-style:none;display:flex;gap:6px;}
  .nav-link{font-family:'Share Tech Mono',monospace;font-size:.65rem;letter-spacing:.15em;text-transform:uppercase;color:rgba(224,224,255,.45);text-decoration:none;padding:8px 14px;border:1px solid transparent;transition:all .25s;cursor:none;}
  .nav-link:hover{color:var(--neon-cyan);border-color:rgba(0,255,249,.25);text-shadow:0 0 8px var(--neon-cyan);}
  .nav-link--active{color:var(--neon-cyan)!important;border-color:rgba(0,255,249,.3)!important;text-shadow:0 0 8px var(--neon-cyan)!important;}
  .nav-link--admin{color:rgba(255,0,110,.6)!important;}
  .nav-cta{font-family:'Share Tech Mono',monospace;font-size:.7rem;letter-spacing:.15em;text-transform:uppercase;background:transparent;color:var(--neon-cyan);border:1px solid var(--neon-cyan);padding:9px 22px;cursor:none;transition:all .3s;clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);text-shadow:0 0 8px var(--neon-cyan);box-shadow:0 0 15px rgba(0,255,249,.15);}
  .nav-cta:hover{background:rgba(0,255,249,.08);box-shadow:0 0 30px rgba(0,255,249,.3);}
  .nav-cta--out{color:rgba(224,224,255,.4);border-color:rgba(224,224,255,.2);text-shadow:none;box-shadow:none;}

  .page-header{position:relative;z-index:10;padding:140px 60px 60px;border-bottom:1px solid rgba(0,255,249,.08);overflow:hidden;}
  .header-orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}
  .header-orb.orb1{width:400px;height:400px;background:rgba(0,255,249,.07);top:-80px;right:5%;}
  .header-orb.orb2{width:300px;height:300px;background:rgba(191,0,255,.06);bottom:-60px;left:10%;}
  .header-inner{position:relative;z-index:2;max-width:800px;margin:0 auto;text-align:center;}
  .header-eyebrow{font-family:'Share Tech Mono',monospace;font-size:.65rem;letter-spacing:.35em;text-transform:uppercase;color:var(--neon-cyan);text-shadow:0 0 10px var(--neon-cyan);margin-bottom:16px;}
  .header-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(3.5rem,8vw,7rem);letter-spacing:.04em;line-height:.95;margin-bottom:20px;}
  .header-title span{color:var(--neon-cyan);text-shadow:0 0 30px var(--neon-cyan);}
  .header-sub{font-family:'Share Tech Mono',monospace;font-size:.78rem;color:rgba(224,224,255,.4);letter-spacing:.08em;line-height:1.8;}

  .filters-bar{position:relative;z-index:10;display:flex;align-items:center;gap:16px;padding:32px 60px 0;}
  .search-wrap{flex:1;position:relative;max-width:480px;}
  .search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(0,255,249,.4);font-size:1.1rem;pointer-events:none;}
  .search-input{width:100%;background:rgba(0,255,249,.03);border:1px solid rgba(0,255,249,.15);color:var(--text);font-family:'Share Tech Mono',monospace;font-size:.75rem;letter-spacing:.08em;padding:12px 16px 12px 40px;outline:none;transition:border-color .3s,box-shadow .3s;clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);cursor:none;}
  .search-input:focus{border-color:var(--neon-cyan);box-shadow:0 0 15px rgba(0,255,249,.1);}
  .search-input::placeholder{color:rgba(224,224,255,.2);}
  .filter-select{background:rgba(0,255,249,.03);border:1px solid rgba(0,255,249,.15);color:var(--text);font-family:'Share Tech Mono',monospace;font-size:.7rem;letter-spacing:.1em;padding:12px 36px 12px 16px;outline:none;cursor:none;transition:border-color .3s;clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2300fff9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;}
  .filter-select option{background:#0a0014;}

  .genre-bar{position:relative;z-index:10;display:flex;flex-wrap:wrap;gap:8px;padding:16px 60px 0;}
  .genre-pill{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.15em;text-transform:uppercase;background:transparent;color:rgba(224,224,255,.35);border:1px solid rgba(224,224,255,.1);padding:6px 14px;cursor:none;transition:all .25s;clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);}
  .genre-pill:hover{color:var(--neon-purple);border-color:rgba(191,0,255,.4);}
  .genre-pill.active{color:var(--neon-purple);border-color:var(--neon-purple);text-shadow:0 0 8px var(--neon-purple);box-shadow:0 0 16px rgba(191,0,255,.2);background:rgba(191,0,255,.06);}

  .games-main{position:relative;z-index:10;padding:32px 60px 80px;}
  .results-count{font-family:'Share Tech Mono',monospace;font-size:.62rem;letter-spacing:.2em;color:rgba(0,255,249,.4);margin-bottom:24px;}
  .games-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px;}

  .game-card{display:flex;flex-direction:column;text-decoration:none;color:var(--text);background:rgba(10,0,20,.7);border:1px solid rgba(0,255,249,.08);transition:border-color .3s,transform .3s,box-shadow .3s;cursor:none;overflow:hidden;clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);}
  .game-card:hover{border-color:rgba(0,255,249,.3);transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,255,249,.08);}
  .game-thumb{position:relative;aspect-ratio:16/9;overflow:hidden;}
  .thumb-img{width:100%;height:100%;object-fit:cover;transition:transform .4s;}
  .game-card:hover .thumb-img{transform:scale(1.05);}
  .thumb-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;}
  .thumb-icon{font-size:3rem;opacity:.6;}
  .game-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(3,0,10,.9) 0%,transparent 60%);}
  .game-hover-btn{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Share Tech Mono',monospace;font-size:.7rem;letter-spacing:.2em;color:var(--neon-cyan);text-shadow:0 0 12px var(--neon-cyan);opacity:0;transition:opacity .3s;background:rgba(3,0,10,.4);}
  .game-card:hover .game-hover-btn{opacity:1;}
  .game-info{padding:16px 18px 18px;}
  .game-genre{font-family:'Share Tech Mono',monospace;font-size:.58rem;letter-spacing:.2em;color:var(--neon-purple);text-shadow:0 0 6px var(--neon-purple);margin-bottom:6px;}
  .game-title{font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:.06em;line-height:1;margin-bottom:8px;}
  .game-meta{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
  .game-dev{font-family:'Share Tech Mono',monospace;font-size:.62rem;letter-spacing:.08em;color:rgba(224,224,255,.3);}
  .game-rating{font-family:'Share Tech Mono',monospace;font-size:.65rem;color:var(--neon-yellow);text-shadow:0 0 6px var(--neon-yellow);}
  .game-players{font-family:'Share Tech Mono',monospace;font-size:.58rem;letter-spacing:.12em;color:rgba(0,255,249,.4);}

  .empty-state{text-align:center;padding:100px 20px;}
  .empty-icon{font-size:4rem;color:rgba(0,255,249,.15);margin-bottom:20px;}
  .empty-title{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:.1em;color:rgba(224,224,255,.3);margin-bottom:10px;}
  .empty-sub{font-family:'Share Tech Mono',monospace;font-size:.7rem;letter-spacing:.1em;color:rgba(224,224,255,.2);}

  footer{position:relative;z-index:10;padding:60px;border-top:1px solid rgba(0,255,249,.1);display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:60px;background:rgba(3,0,10,.95);}
  .footer-logo{font-family:'Bebas Neue',sans-serif;font-size:3.2rem;color:var(--neon-cyan);text-shadow:0 0 20px var(--neon-cyan);margin-bottom:4px;}
  .footer-logo span{color:var(--neon-pink);text-shadow:0 0 20px var(--neon-pink);}
  .footer-logo-sub{font-family:'Share Tech Mono',monospace;font-size:.72rem;color:rgba(0,255,249,.4);letter-spacing:.12em;margin-bottom:14px;}
  .footer-desc{font-family:'Share Tech Mono',monospace;font-size:.7rem;line-height:1.8;color:rgba(224,224,255,.3);letter-spacing:.05em;}
  .footer-col-title{font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:.1em;color:rgba(224,224,255,.5);margin-bottom:20px;}
  .footer-links{list-style:none;display:flex;flex-direction:column;gap:12px;}
  .footer-links a{font-family:'Share Tech Mono',monospace;font-size:.65rem;letter-spacing:.1em;color:rgba(224,224,255,.3);text-decoration:none;text-transform:uppercase;transition:color .2s;cursor:none;}
  .footer-links a:hover{color:var(--neon-cyan);text-shadow:0 0 8px var(--neon-cyan);}
  .admin-link{color:rgba(255,0,110,.5)!important;}
  .admin-link:hover{color:var(--neon-pink)!important;text-shadow:0 0 8px var(--neon-pink)!important;}
  .footer-bottom{grid-column:1/-1;padding-top:30px;border-top:1px solid rgba(255,255,255,.05);display:flex;justify-content:space-between;align-items:center;}
  .footer-copy{font-family:'Share Tech Mono',monospace;font-size:.6rem;color:rgba(224,224,255,.2);letter-spacing:.12em;}
  .footer-status{display:flex;align-items:center;gap:8px;font-family:'Share Tech Mono',monospace;font-size:.6rem;color:rgba(0,255,249,.5);letter-spacing:.1em;}
  .status-dot{width:6px;height:6px;border-radius:50%;background:var(--neon-cyan);box-shadow:0 0 6px var(--neon-cyan);animation:pulse 2s infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

  .modal-backdrop{position:fixed;inset:0;z-index:1000;background:rgba(3,0,10,.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease;}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .modal{position:relative;width:460px;background:var(--dark2);border:1px solid rgba(0,255,249,.2);padding:50px 44px;box-shadow:0 0 60px rgba(0,255,249,.08),0 0 120px rgba(191,0,255,.06);animation:modalIn .3s ease;clip-path:polygon(16px 0%,100% 0%,calc(100% - 16px) 100%,0% 100%);}
  @keyframes modalIn{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:none}}
  .modal-corner{position:absolute;width:24px;height:24px;}
  .modal-corner.tl{top:10px;left:10px;border-top:2px solid var(--neon-cyan);border-left:2px solid var(--neon-cyan);}
  .modal-corner.br{bottom:10px;right:10px;border-bottom:2px solid var(--neon-cyan);border-right:2px solid var(--neon-cyan);}
  .modal-close{position:absolute;top:16px;right:20px;background:transparent;border:none;color:rgba(224,224,255,.3);font-size:1rem;cursor:none;transition:color .2s;font-family:'Share Tech Mono',monospace;}
  .modal-close:hover{color:var(--neon-pink);text-shadow:0 0 10px var(--neon-pink);}
  .modal-eyebrow{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.3em;text-transform:uppercase;color:var(--neon-cyan);text-shadow:0 0 8px var(--neon-cyan);margin-bottom:10px;}
  .modal-title{font-family:'Bebas Neue',sans-serif;font-size:4rem;line-height:1;letter-spacing:.05em;margin-bottom:10px;}
  .modal-title span{color:var(--neon-pink);text-shadow:0 0 20px var(--neon-pink);}
  .modal-sub{font-family:'Share Tech Mono',monospace;font-size:.7rem;color:rgba(224,224,255,.35);letter-spacing:.08em;margin-bottom:36px;line-height:1.6;}
  .login-form{display:flex;flex-direction:column;gap:20px;}
  .form-group{display:flex;flex-direction:column;gap:8px;}
  .form-label{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(0,255,249,.6);}
  .form-input{background:rgba(0,255,249,.03);border:1px solid rgba(0,255,249,.15);color:var(--text);font-family:'Share Tech Mono',monospace;font-size:.75rem;letter-spacing:.08em;padding:12px 16px;outline:none;transition:border-color .3s,box-shadow .3s;clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);width:100%;}
  .form-input:focus{border-color:var(--neon-cyan);box-shadow:0 0 15px rgba(0,255,249,.1);}
  .form-input::placeholder{color:rgba(224,224,255,.2);}
  .login-error{font-family:'Share Tech Mono',monospace;font-size:.65rem;letter-spacing:.15em;color:var(--neon-pink);text-shadow:0 0 8px var(--neon-pink);text-align:center;padding:8px;border:1px solid rgba(255,0,110,.3);background:rgba(255,0,110,.05);}
  .btn-login{font-family:'Share Tech Mono',monospace;font-size:.75rem;letter-spacing:.15em;text-transform:uppercase;background:var(--neon-cyan);color:var(--dark);border:none;padding:16px;cursor:none;font-weight:bold;transition:all .3s;clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);box-shadow:0 0 30px rgba(0,255,249,.4);}
  .btn-login:hover:not(:disabled){box-shadow:0 0 50px rgba(0,255,249,.7);transform:translateY(-1px);}
  .btn-login:disabled{opacity:.7;}
  .loading-dots span{animation:dotBlink 1.2s infinite;display:inline-block;}
  .loading-dots span:nth-child(2){animation-delay:.2s;}
  .loading-dots span:nth-child(3){animation-delay:.4s;}
  @keyframes dotBlink{0%,80%,100%{opacity:0}40%{opacity:1}}
  .login-divider{display:flex;align-items:center;gap:16px;font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.2em;color:rgba(224,224,255,.2);}
  .login-divider::before,.login-divider::after{content:'';flex:1;height:1px;background:rgba(224,224,255,.08);}
  .btn-register{font-family:'Share Tech Mono',monospace;font-size:.75rem;letter-spacing:.15em;text-transform:uppercase;background:transparent;color:var(--neon-purple);border:1px solid rgba(191,0,255,.4);padding:14px;cursor:none;transition:all .3s;text-decoration:none;text-align:center;display:block;clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);text-shadow:0 0 8px var(--neon-purple);}
  .btn-register:hover{background:rgba(191,0,255,.08);border-color:var(--neon-purple);box-shadow:0 0 20px rgba(191,0,255,.2);}
  .login-footer-text{text-align:center;}
  .login-footer-text a{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.15em;text-transform:uppercase;color:rgba(224,224,255,.25);text-decoration:none;transition:color .2s;}
  .login-footer-text a:hover{color:var(--neon-cyan);text-shadow:0 0 8px var(--neon-cyan);}
</style>