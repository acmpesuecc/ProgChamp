<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  
  import Navbar     from '$lib/components/Navbar.svelte';
  import Footer     from '$lib/components/Footer.svelte';
  import LoginModal from '$lib/components/LoginModal.svelte';
  
  const API = 'http://localhost:3000';
  
  // AUTH
  let session    = $derived(page.data.session);
  let user       = $derived(session?.user);
  let isLoggedIn = $derived(session?.authenticated ?? false);
  let isAdmin    = $derived(user?.userType === 'admin');
  let { data } = $props();
  
  // LOGIN MODAL STATE
  let showLogin = $state(false);
  
  function goTo(path: string, requiresAuth = false) {
    if (requiresAuth && !isLoggedIn) showLogin = true;
    else goto(path);
  }
  
  // GAME STATE
  let game = $state<any>(null);
  let loading = $state(true);
  let loadError = $state('');
  
  // REACTION STATE
  let likes          = $state(0);
  let dislikes       = $state(0);
  let superlikes     = $state(0);
  let userReaction   = $state<'like' | 'dislike' | null>(null);
  let userSuperliked = $state(false);
  
  onMount(async () => {
    try {
      const res = await fetch(`${API}/games/${data.gameId}`);
      if (!res.ok) { loadError = 'Game not found'; loading = false; return; }
      const json = await res.json();
      game = json.game;
      likes      = game.countLikes      ?? 0;
      dislikes   = game.countDislikes   ?? 0;
      superlikes = game.countSuperlikes ?? 0;
    } catch (e) {
      loadError = 'Failed to load game';
    } finally {
      loading = false;
    }
  });
  
  async function react(type: 'like' | 'dislike') {
    if (!isLoggedIn) { showLogin = true; return; }
    const prevReaction = userReaction;
    if (userReaction === type) {
      if (type === 'like') likes--; else dislikes--;
      userReaction = null;
    } else {
      if (userReaction === 'like') likes--; else if (userReaction === 'dislike') dislikes--;
      if (type === 'like') likes++; else dislikes++;
      userReaction = type;
    }
    try {
      const res = await fetch(`/api/games/${game.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error();
    } catch {
      userReaction = prevReaction;
      likes    = game.countLikes    ?? 0;
      dislikes = game.countDislikes ?? 0;
    }
  }
  
  async function superlike() {
    if (!isLoggedIn) { showLogin = true; return; }
    const prevSuperliked = userSuperliked;
    if (userSuperliked) { superlikes--; userSuperliked = false; }
    else                { superlikes++; userSuperliked = true;  }
    try {
      const res = await fetch(`/api/games/${game.id}/superlike`, { method: 'POST' });
      if (!res.ok) throw new Error();
    } catch {
      userSuperliked = prevSuperliked;
      superlikes = game.countSuperlikes ?? 0;
    }
  }
  
  function formatCount(n: number) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }
  
  const sidebarGames = [
    { id:'2', title:'ARCTIC BREACH',   genre:'Shooter',   dev:'coldlab',     rating:8.9, players:89000  },
    { id:'3', title:'IRON REQUIEM',    genre:'Action RPG',dev:'steelworks',  rating:8.5, players:67000  },
    { id:'4', title:'DEEP ROOT',       genre:'Horror',    dev:'mosspit',     rating:9.2, players:52000  },
    { id:'5', title:'NEON DRIFT',      genre:'Racing',    dev:'turbostudio', rating:8.7, players:41000  },
    { id:'6', title:'PULSE COMBAT',    genre:'Fighting',  dev:'arcadecore',  rating:9.4, players:98000  },
    { id:'7', title:'STAR VAGRANT',    genre:'Space Sim', dev:'voidship',    rating:8.1, players:23000  },
    { id:'8', title:'GRID TACTICIAN',  genre:'Strategy',  dev:'hexmind',     rating:8.3, players:31000  },
  ];
  
  const iconColors = ['#bf00ff','#00ccff','#ff3300','#00cc44','#ffee00','#ff0066','#ff9900'];
  const icons      = ['⬡','◈','⟁','✦','◉','⟡','◆'];
  
  function formatPlayers(n: number) {
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n.toString();
  }
  </script>
  
  <svelte:head>
    <title>{game ? game.title + ' // PROGCHAMP' : 'LOADING...'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Oxanium:wght@300;400;600;800&display=swap" rel="stylesheet" />
  </svelte:head>
  
  <Navbar
    {isLoggedIn}
    {isAdmin}
    avatarUrl={user?.avatarUrl}
    userName={user?.name}
    onLoginClick={() => (showLogin = true)}
  />
  
  {#if loading}
    <div class="state-msg">// LOADING...</div>
  {:else if loadError || !game}
    <div class="state-msg">// {loadError || 'GAME NOT FOUND'}</div>
  {:else}
  
  <!-- PAGE BODY -->
  <div class="gameplay-page">
  
    <!-- ── LEFT: PLAYER + INFO ── -->
    <div class="player-col">
  
      <!-- GAME IFRAME -->
      <div class="player-wrap">
        <div class="player-corner tl"></div>
        <div class="player-corner br"></div>
        <iframe
          src={game.gameUrl}
          title={game.title}
          class="game-frame"
          allowfullscreen
        ></iframe>
        <div class="player-scanline"></div>
      </div>
  
      <!-- TITLE ROW -->
      <div class="info-block">
        <div class="info-top">
          <div class="info-left">
            <div class="game-genre-tag">{(game.tags[0]?.tag?.category ?? game.tags[0]?.tag?.name ?? 'GAME').toUpperCase()}</div>
            <h1 class="game-title">{game.title}</h1>
            <div class="game-meta-row">
              <span class="meta-dev">by <em>{game.creator?.name ?? 'unknown'}</em></span>
              <span class="meta-sep">·</span>
              <span class="meta-players">{formatPlayers(game.viewCount ?? 0)} PLAYING</span>
              <span class="meta-sep">·</span>
              <span class="meta-rating">★ {game.score ?? '—'}</span>
            </div>
          </div>
  
          <!-- REACTION BUTTONS -->
          <div class="reactions">
            <button
              class="react-btn react-btn--superlike"
              class:active={userSuperliked}
              onclick={() => superlike()}
              title="Superlike"
            >
              <span class="react-icon">⚡</span>
              <span class="react-label">SUPERLIKE</span>
              <span class="react-count">{formatCount(superlikes)}</span>
            </button>
  
            <div class="react-divider"></div>
  
            <button
              class="react-btn react-btn--like"
              class:active={userReaction === 'like'}
              onclick={() => react('like')}
              title="Like"
            >
              <span class="react-icon">▲</span>
              <span class="react-count">{formatCount(likes)}</span>
            </button>
  
            <button
              class="react-btn react-btn--dislike"
              class:active={userReaction === 'dislike'}
              onclick={() => react('dislike')}
              title="Dislike"
            >
              <span class="react-icon">▼</span>
              <span class="react-count">{formatCount(dislikes)}</span>
            </button>
          </div>
        </div>
  
        <!-- DIVIDER -->
        <div class="info-divider"></div>
  
        <!-- DESCRIPTION + TAGS -->
        <div class="info-bottom">
          <div class="dev-card">
            <div class="dev-avatar">
              <span>{(game.creator?.name?.[0] ?? '?').toUpperCase()}</span>
            </div>
            <div>
              <div class="dev-name">{(game.creator?.name ?? 'unknown').toUpperCase()}</div>
              <div class="dev-label">// DEVELOPER</div>
            </div>
          </div>
          <p class="game-desc">{game.description}</p>
          <div class="tag-row">
            {#each game.tags.map((t: any) => t.tag.name) as tag}
              <span class="tag">{tag.toUpperCase()}</span>
            {/each}
          </div>
        </div>
      </div>
    </div>
  
    <!-- ── RIGHT: SIDEBAR ── -->
    <aside class="sidebar">
      <div class="sidebar-eyebrow">// UP NEXT</div>
      <div class="sidebar-list">
        {#each sidebarGames as g, i}
          <a href="/game/{g.id}" class="sidebar-card">
            <div class="sidebar-thumb"
              style="background:radial-gradient(circle at 30% 40%,{iconColors[i % iconColors.length]}28,transparent 70%)">
              <span class="sidebar-icon" style="color:{iconColors[i % iconColors.length]}">{icons[i % icons.length]}</span>
            </div>
            <div class="sidebar-info">
              <div class="sidebar-genre">{g.genre.toUpperCase()}</div>
              <div class="sidebar-title">{g.title}</div>
              <div class="sidebar-meta">
                <span class="sidebar-dev">by {g.dev}</span>
                <span class="sidebar-rating">★ {g.rating}</span>
              </div>
              <div class="sidebar-players">{formatPlayers(g.players)} PLAYING</div>
            </div>
          </a>
        {/each}
      </div>
    </aside>
  
  </div>
  
  {/if}
  
  <Footer {isAdmin} />
  <LoginModal open={showLogin} onClose={() => (showLogin = false)} />
  
  <style>
    .state-msg {
      font-family: 'Share Tech Mono', monospace;
      font-size: 1rem; letter-spacing: .2em;
      color: rgba(0,255,249,.4);
      text-align: center;
      padding: 200px 20px;
    }
  
    /* ── PAGE LAYOUT ── */
    .gameplay-page {
      position: relative; z-index: 10;
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 28px;
      padding: 100px 48px 60px;
      max-width: 1400px;
      margin: 0 auto;
      align-items: start;
    }
  
    /* ── PLAYER ── */
    .player-col { display: flex; flex-direction: column; gap: 0; min-width: 0; }
  
    .player-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #000;
      border: 1px solid rgba(0,255,249,.2);
      overflow: hidden;
      clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
    }
    .player-corner {
      position: absolute; width: 24px; height: 24px; z-index: 4; pointer-events: none;
    }
    .player-corner.tl { top: 10px; left: 10px; border-top: 2px solid var(--neon-cyan); border-left: 2px solid var(--neon-cyan); }
    .player-corner.br { bottom: 10px; right: 10px; border-bottom: 2px solid var(--neon-cyan); border-right: 2px solid var(--neon-cyan); }
  
    .game-frame {
      width: 100%; height: 100%;
      border: none; display: block;
      position: relative; z-index: 2;
    }
    .player-scanline {
      position: absolute; inset: 0; z-index: 3; pointer-events: none;
      background: repeating-linear-gradient(
        0deg, transparent, transparent 2px,
        rgba(0,0,0,.08) 2px, rgba(0,0,0,.08) 4px
      );
    }
  
    /* ── INFO BLOCK ── */
    .info-block {
      background: rgba(10,0,20,.6);
      border: 1px solid rgba(0,255,249,.1);
      border-top: none;
      padding: 24px 28px 28px;
      clip-path: polygon(0% 0%, 100% 0%, calc(100% - 12px) 100%, 12px 100%);
      backdrop-filter: blur(8px);
    }
  
    .info-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
    }
    .info-left { flex: 1; min-width: 0; }
  
    .game-genre-tag {
      font-family: 'Share Tech Mono', monospace;
      font-size: .6rem; letter-spacing: .25em;
      color: var(--neon-purple); text-shadow: 0 0 8px var(--neon-purple);
      margin-bottom: 6px;
    }
    .game-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(2rem, 4vw, 3.2rem);
      letter-spacing: .06em; line-height: 1;
      margin-bottom: 10px;
    }
    .game-meta-row {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      font-family: 'Share Tech Mono', monospace;
      font-size: .65rem; letter-spacing: .1em;
      color: rgba(224,224,255,.35);
    }
    .meta-dev em { font-style: normal; color: rgba(0,255,249,.6); }
    .meta-sep { color: rgba(224,224,255,.15); }
    .meta-rating { color: var(--neon-yellow); text-shadow: 0 0 6px var(--neon-yellow); }
    .meta-players { color: rgba(0,255,249,.5); }
  
    /* ── REACTIONS ── */
    .reactions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .react-divider {
      width: 1px; height: 36px;
      background: rgba(0,255,249,.12);
      margin: 0 4px;
    }
  
    .react-btn {
      display: flex; align-items: center; gap: 7px;
      font-family: 'Share Tech Mono', monospace;
      font-size: .65rem; letter-spacing: .12em; text-transform: uppercase;
      background: rgba(0,255,249,.03);
      border: 1px solid rgba(0,255,249,.12);
      color: rgba(224,224,255,.4);
      padding: 8px 14px;
      cursor: none;
      transition: all .25s;
      clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);
    }
    .react-btn:hover { color: rgba(224,224,255,.8); border-color: rgba(0,255,249,.3); }
  
    .react-icon { font-size: .9rem; line-height: 1; }
    .react-count { font-size: .7rem; }
  
    .react-btn--like.active {
      color: var(--neon-cyan);
      border-color: var(--neon-cyan);
      background: rgba(0,255,249,.08);
      box-shadow: 0 0 16px rgba(0,255,249,.2);
      text-shadow: 0 0 8px var(--neon-cyan);
    }
    .react-btn--dislike.active {
      color: var(--neon-pink);
      border-color: var(--neon-pink);
      background: rgba(255,0,110,.08);
      box-shadow: 0 0 16px rgba(255,0,110,.2);
      text-shadow: 0 0 8px var(--neon-pink);
    }
    .react-btn--superlike {
      border-color: rgba(255,230,0,.2);
      color: rgba(255,230,0,.5);
    }
    .react-btn--superlike:hover {
      border-color: rgba(255,230,0,.5);
      color: var(--neon-yellow);
    }
    .react-btn--superlike.active {
      color: var(--neon-yellow);
      border-color: var(--neon-yellow);
      background: rgba(255,230,0,.08);
      box-shadow: 0 0 20px rgba(255,230,0,.3);
      text-shadow: 0 0 10px var(--neon-yellow);
    }
  
    .info-divider {
      height: 1px;
      background: rgba(0,255,249,.08);
      margin: 20px 0;
    }
  
    .info-bottom { display: flex; flex-direction: column; gap: 16px; }
  
    .dev-card { display: flex; align-items: center; gap: 14px; }
    .dev-avatar {
      width: 40px; height: 40px;
      border: 1px solid rgba(0,255,249,.2);
      background: rgba(0,255,249,.05);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1.3rem; color: var(--neon-cyan);
      clip-path: polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);
      flex-shrink: 0;
    }
    .dev-name {
      font-family: 'Share Tech Mono', monospace;
      font-size: .75rem; letter-spacing: .15em;
      color: rgba(224,224,255,.7);
    }
    .dev-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: .55rem; letter-spacing: .2em;
      color: rgba(0,255,249,.4);
      margin-top: 2px;
    }
  
    .game-desc {
      font-family: 'Share Tech Mono', monospace;
      font-size: .72rem; letter-spacing: .05em; line-height: 1.8;
      color: rgba(224,224,255,.35);
    }
  
    .tag-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag {
      font-family: 'Share Tech Mono', monospace;
      font-size: .55rem; letter-spacing: .15em;
      color: rgba(191,0,255,.7);
      border: 1px solid rgba(191,0,255,.2);
      background: rgba(191,0,255,.04);
      padding: 4px 12px;
      clip-path: polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%);
    }
  
    /* ── SIDEBAR ── */
    .sidebar {
      position: sticky;
      top: 88px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: calc(100vh - 108px);
      overflow-y: auto;
      scrollbar-width: none;
    }
    .sidebar::-webkit-scrollbar { display: none; }
  
    .sidebar-eyebrow {
      font-family: 'Share Tech Mono', monospace;
      font-size: .7rem; letter-spacing: .3em; text-transform: uppercase;
      color: var(--neon-cyan); text-shadow: 0 0 8px var(--neon-cyan);
    }
  
    .sidebar-list { display: flex; flex-direction: column; gap: 10px; }
  
    .sidebar-card {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 0;
      text-decoration: none; color: var(--text);
      background: rgba(10,0,20,.6);
      border: 1px solid rgba(0,255,249,.08);
      overflow: hidden;
      transition: border-color .25s, transform .25s, box-shadow .25s;
      clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
      cursor: none;
    }
    .sidebar-card:hover {
      border-color: rgba(0,255,249,.3);
      transform: translateX(4px);
      box-shadow: 0 4px 24px rgba(0,255,249,.06);
    }
  
    .sidebar-thumb {
      aspect-ratio: 16/9;
      display: flex; align-items: center; justify-content: center;
      background: rgba(10,0,20,.8);
      flex-shrink: 0;
    }
    .sidebar-icon { font-size: 1.8rem; opacity: .7; }
  
    .sidebar-info {
      padding: 10px 12px;
      display: flex; flex-direction: column; gap: 3px;
      min-width: 0;
    }
    .sidebar-genre {
      font-family: 'Share Tech Mono', monospace;
      font-size: .5rem; letter-spacing: .18em;
      color: var(--neon-purple); text-shadow: 0 0 6px var(--neon-purple);
    }
    .sidebar-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 1rem; letter-spacing: .06em; line-height: 1.1;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sidebar-meta {
      display: flex; align-items: center; justify-content: space-between;
    }
    .sidebar-dev {
      font-family: 'Share Tech Mono', monospace;
      font-size: .52rem; letter-spacing: .06em;
      color: rgba(224,224,255,.25);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sidebar-rating {
      font-family: 'Share Tech Mono', monospace;
      font-size: .55rem;
      color: var(--neon-yellow); text-shadow: 0 0 6px var(--neon-yellow);
      flex-shrink: 0;
    }
    .sidebar-players {
      font-family: 'Share Tech Mono', monospace;
      font-size: .5rem; letter-spacing: .1em;
      color: rgba(0,255,249,.35);
    }
  </style>
