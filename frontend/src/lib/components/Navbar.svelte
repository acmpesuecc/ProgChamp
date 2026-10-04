<script lang="ts">
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
  
    function goHome() { goto('/'); }
    function goAllGames() { globalSearch.set(''); goto('/all-games'); }
    function goMyGames() { goto('/my-games'); }
    function goUpload() { goto('/upload'); }
    function goAdmin() { goto('/admin'); }
    function goProfile() { goto('/profile'); }

  </script>
  
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
      padding: 20px 48px;
      background: rgba(36,19,44,.98);
    }
  
    .logo-wrap { display:flex; flex-direction:column; align-items:flex-start; text-decoration:none; flex-shrink:0; gap:2px; margin-top:10px; }
    .logo      { font-family:'Press Start 2P',sans-serif; font-size:2.9rem; letter-spacing:.12em; line-height:1; font-style:normal; color:var(--neon-cyan); }
    .logo em   { color:var(--neon-pink); font-style:normal; }
    .logo-sub  { font-family:'Caveat',cursive; font-size:1.3rem; font-weight:600; letter-spacing:.02em; color:rgba(114,61,81,.85); text-transform:none; white-space:nowrap; }
  
    .nav-search         { display:flex; align-items:center; flex:1; max-width:400px; border:1px solid rgba(232,93,130,0.5); background:rgba(232,93,130,0.2); border-radius: 10px; transition:border-color .3s,box-shadow .3s; }
    .nav-search:focus-within { border-color:var(--neon-cyan);  }
    .nav-search-input   { flex:1; background:transparent; border:none; outline:none; font-family:'VT323',monospace; font-size:1.2rem; letter-spacing:.08em; color:var(--text); padding:10px 14px; text-transform:uppercase; }
    .nav-search-input::placeholder { color:rgba(245,205,210,0.65); }
    .nav-search-btn     { background:transparent; border:none; color:var(--neon-cyan); font-size:1.6rem; padding:8px 13px; cursor: var(--cursor-pointer); line-height:1; transition:background .2s,text-shadow .2s; }
    .nav-search-btn:hover { background:rgba(232,93,130,0.23);  }
  
    .nav-links { display:flex; gap:26px; list-style:none; }
    .nav-link  { font-family:'VT323',monospace; font-size:1.25rem; letter-spacing:.12em; text-transform:uppercase; color:rgba(245,205,210,0.75); text-decoration:none; position:relative; transition:color .2s; white-space:nowrap; }
    .nav-link::after { content:''; position:absolute; bottom:-4px; left:0; width:0; height:1px; background:var(--neon-cyan);  transition:width .3s; }
    .nav-link:hover  { color:var(--neon-cyan); }
    .nav-link:hover::after { width:100%; }
    .nav-link--admin { color:rgba(124,77,191,0.85); }
    .nav-link--admin::after { background:var(--neon-pink);  }
    .nav-link--admin:hover  { color:var(--neon-pink); }
  
    .nav-cta       { font-family:'VT323',monospace; font-size:1.15rem; letter-spacing:.1em; text-transform:uppercase; background:transparent; border:1px solid var(--neon-pink); color:var(--neon-pink); padding:9px 22px; cursor: var(--cursor-pointer); transition:all .3s; flex-shrink:0;   border-radius: 10px; }
    .nav-cta:hover { background:var(--neon-pink); color:var(--dark);  text-shadow: none; }
    .nav-cta--out       { border-color:rgba(245,205,210,0.6); color:rgba(245,205,210,0.65); text-shadow: none; box-shadow: none; }
    .nav-cta--out:hover { background:rgba(245,205,210,0.33); color:rgba(245,205,210,0.8); box-shadow: none; }
  
    .nav-user  { display:flex; align-items:center; gap:10px; flex-shrink:0; }
    .nav-avatar { width:28px; height:28px; border-radius:50%; border:1px solid rgba(232,93,130,0.45); object-fit:cover; }
    .logo-wrap { background: none; border: none; padding: 0; cursor: var(--cursor-pointer); }
    button.nav-link { background: none; border: none; padding: 0; cursor: var(--cursor-pointer); }
    .nav-avatar-btn { background: none; border: none; padding: 0; cursor: var(--cursor-pointer); display: flex; align-items: center; }
  </style>
