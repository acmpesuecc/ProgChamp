<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto,invalidateAll } from '$app/navigation';
    import { globalSearch } from '$lib/stores/search';
  
    interface Props {
      isLoggedIn?: boolean;
      isAdmin?:    boolean;
      avatarUrl?:  string;
      userName?:   string;
      onLoginClick?: () => void;
    }
  
    let {
      isLoggedIn  = false,
      isAdmin     = false,
      avatarUrl   = '',
      userName    = '',
      onLoginClick = () => {},
    }: Props = $props();
  
    let searchQuery = $state('');
    let cursorEl    = $state<HTMLDivElement | null>(null);
    let dotEl       = $state<HTMLDivElement | null>(null);
  
    function handleSearch(e: SubmitEvent) {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
    
        if (page.url.pathname === '/all-games') {
          globalSearch.set(q);
          searchQuery = '';  // clears the navbar input after search
        } else {
          goto(`/all-games?q=${encodeURIComponent(q)}`);
        }
      }

    function handleNav(path: string, requiresAuth = false) {
      if (requiresAuth && !isLoggedIn) {
        onLoginClick(); // This opens your modal
      } else {
        goto(path);
      }
    }
    
    function handleInput(e: Event) {
        const q = (e.target as HTMLInputElement).value;
        searchQuery = q;
    
        if (page.url.pathname === '/all-games') {
          // Already on all-games — update store directly, no navigation
          globalSearch.set(q);
        }
      }
      

    function goToAllGames() {
      globalSearch.set('');
      goto('/all-games');
    }
  
    async function handleSignOut() {
  await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:9210'}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  await invalidateAll();
  window.location.href = '/';
}
  
    // Custom cursor — lives here so it's registered once per page.
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
        el.addEventListener('mouseenter', () => {
          if (cursorEl) { cursorEl.style.transform = 'translate(-50%,-50%) scale(2)'; cursorEl.style.borderColor = 'var(--neon-pink)'; }
        });
        el.addEventListener('mouseleave', () => {
          if (cursorEl) { cursorEl.style.transform = 'translate(-50%,-50%) scale(1)'; cursorEl.style.borderColor = 'var(--neon-cyan)'; }
        });
      };
      document.querySelectorAll('button, a, .game-card, .cat-item').forEach(addHover);
  
      return () => document.removeEventListener('mousemove', onMove);
    });
    
    function goHome() { goto('/'); }
    function goAllGames() { globalSearch.set(''); goto('/all-games'); }
    function goMyGames() { goto('/my-games'); }
    function goUpload() { goto('/upload'); }
    function goAdmin() { goto('/admin'); }
    function goProfile() { goto('/profile'); }

  </script>
  
  <!-- Custom cursor (rendered once, globally) -->
  <div class="cursor"     bind:this={cursorEl}></div>
  <div class="cursor-dot" bind:this={dotEl}></div>
  
  <!-- Page background decorations -->
  <div class="grid-bg"></div>
  <div class="noise"></div>
  
  <nav>
    <button class="logo-wrap" onclick={goHome}>
      <span class="logo">PROG<em>CHAMP</em></span>
      <span class="logo-sub">an @ACMpesuecc project</span>
    </button>
  
    <form class="nav-search" onsubmit={handleSearch}>
      <input
        class="nav-search-input"
        type="text"
        placeholder="SEARCH GAMES..."
        value={searchQuery}
        oninput={handleInput}
      />
      <button type="submit" class="nav-search-btn" aria-label="Search">⌕</button>
    </form>
  
    <ul class="nav-links">
        <li>
          <button class="nav-link" onclick={goAllGames}>ALL GAMES</button>
        </li>
      <li>
        <button class="nav-link" onclick={() => handleNav('/my-games', true)}>
          MY GAMES
        </button>
      </li>

      <li>
        <button class="nav-link" onclick={() => handleNav('/upload', true)}>
          UPLOAD
        </button>
      </li>
      {#if isAdmin}
          <li>
            <button class="nav-link nav-link--admin" onclick={goAdmin}>
              ADMIN
            </button>
          </li>
        {/if}
    </ul>

  
    {#if isLoggedIn}
      <div class="nav-user">
          {#if avatarUrl}
            <button class="nav-avatar-btn" onclick={goProfile}>
              <img class="nav-avatar" src={avatarUrl} alt={userName} referrerpolicy="no-referrer" />
            </button>
          {/if}
        <button class="nav-cta nav-cta--out" onclick={handleSignOut}>LOG OUT</button>
      </div>
    {:else}
      <button class="nav-cta" onclick={onLoginClick}>LOGIN</button>
    {/if}
  </nav>
  
  <style>
    nav {
      position: fixed; top: 0; left: 0; right: 0;
      z-index: 200;
      display: flex; align-items: center; gap: 22px;
      padding: 14px 48px;
      border-bottom: 1px solid rgba(0,255,249,.15);
      background: rgba(3,0,10,.92);
      backdrop-filter: blur(14px);
    }
  
    .logo-wrap { display:flex; flex-direction:column; align-items:flex-start; text-decoration:none; flex-shrink:0; gap:2px; }
    .logo      { font-family:'Bebas Neue',sans-serif; font-size:2.4rem; letter-spacing:.12em; line-height:1; font-style:normal; color:var(--neon-cyan); text-shadow:0 0 20px var(--neon-cyan),0 0 60px rgba(0,255,249,.3); }
    .logo em   { color:var(--neon-pink); font-style:normal; text-shadow:0 0 20px var(--neon-pink),0 0 60px rgba(255,0,110,.3); }
    .logo-sub  { font-family:'Share Tech Mono',monospace; font-size:.72rem; letter-spacing:.14em; color:rgba(0,255,249,.4); text-transform:lowercase; white-space:nowrap; }
  
    .nav-search         { display:flex; align-items:center; flex:1; max-width:400px; border:1px solid rgba(0,255,249,.2); background:rgba(0,255,249,.03); clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%); transition:border-color .3s,box-shadow .3s; }
    .nav-search:focus-within { border-color:var(--neon-cyan); box-shadow:0 0 20px rgba(0,255,249,.12); }
    .nav-search-input   { flex:1; background:transparent; border:none; outline:none; font-family:'Share Tech Mono',monospace; font-size:.68rem; letter-spacing:.12em; color:var(--text); padding:10px 14px; text-transform:uppercase; }
    .nav-search-input::placeholder { color:rgba(224,224,255,.22); }
    .nav-search-btn     { background:transparent; border:none; border-left:1px solid rgba(0,255,249,.15); color:var(--neon-cyan); font-size:1.1rem; padding:8px 13px; cursor:none; line-height:1; transition:background .2s,text-shadow .2s; }
    .nav-search-btn:hover { background:rgba(0,255,249,.08); text-shadow:0 0 12px var(--neon-cyan); }
  
    .nav-links { display:flex; gap:26px; list-style:none; }
    .nav-link  { font-family:'Share Tech Mono',monospace; font-size:.67rem; letter-spacing:.18em; text-transform:uppercase; color:rgba(224,224,255,.5); text-decoration:none; position:relative; transition:color .2s; white-space:nowrap; }
    .nav-link::after { content:''; position:absolute; bottom:-4px; left:0; width:0; height:1px; background:var(--neon-cyan); box-shadow:0 0 8px var(--neon-cyan); transition:width .3s; }
    .nav-link:hover  { color:var(--neon-cyan); }
    .nav-link:hover::after { width:100%; }
    .nav-link--admin { color:rgba(255,0,110,.7); }
    .nav-link--admin::after { background:var(--neon-pink); box-shadow:0 0 8px var(--neon-pink); }
    .nav-link--admin:hover  { color:var(--neon-pink); }
  
    .nav-cta       { font-family:'Share Tech Mono',monospace; font-size:.68rem; letter-spacing:.15em; text-transform:uppercase; background:transparent; border:1px solid var(--neon-pink); color:var(--neon-pink); padding:9px 22px; cursor:none; transition:all .3s; flex-shrink:0; text-shadow:0 0 10px var(--neon-pink); box-shadow:0 0 10px rgba(255,0,110,.2),inset 0 0 10px rgba(255,0,110,.05); clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); }
    .nav-cta:hover { background:var(--neon-pink); color:var(--dark); box-shadow:0 0 30px var(--neon-pink),0 0 60px rgba(255,0,110,.4); text-shadow:none; }
    .nav-cta--out       { border-color:rgba(224,224,255,.2); color:rgba(224,224,255,.35); text-shadow:none; box-shadow:none; }
    .nav-cta--out:hover { background:rgba(224,224,255,.05); color:rgba(224,224,255,.6); box-shadow:none; }
  
    .nav-user  { display:flex; align-items:center; gap:10px; flex-shrink:0; }
    .nav-avatar { width:28px; height:28px; border-radius:50%; border:1px solid rgba(0,255,249,.3); object-fit:cover; }
    .logo-wrap { background: none; border: none; padding: 0; cursor: none; }
    button.nav-link { background: none; border: none; padding: 0; cursor: none; }
    .nav-avatar-btn { background: none; border: none; padding: 0; cursor: none; display: flex; align-items: center; }
  </style>
