<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { onDestroy } from 'svelte';
  import { globalSearch } from '$lib/stores/search';
  import UploadCTA from '$lib/components/UploadCTA.svelte';
  import Navbar     from '$lib/components/Navbar.svelte';
  import Footer     from '$lib/components/Footer.svelte';
  import LoginModal from '$lib/components/LoginModal.svelte';

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

  // GAMES STATE
  let games      = $state(data.games ?? []);
  let nextCursor = $state(data.nextCursor ?? null);
  let loading    = $state(false);

  // map raw backend game to display shape
  function mapGame(g: any) {
    return {
      id:          g.id,
      title:       g.title,
      genre:       g.tags?.[0]?.tag?.category ?? g.tags?.[0]?.tag?.name ?? 'Uncategorised',
      dev:         g.creator?.name ?? 'unknown',
      rating:      g.score ?? 0,
      players:     g.viewCount ?? 0,
      thumbnail:   null,
      publishedAt: new Date(g.createdAt),
    };
  }

  let mappedGames = $derived(games.map(mapGame));

  async function loadMore() {
    if (!nextCursor || loading) return;
    loading = true;
    try {
      const res = await fetch(`/api/games?limit=20&cursor=${encodeURIComponent(nextCursor)}`);
      if (res.ok) {
        const d = await res.json();
        games = [...games, ...(d.games ?? [])];
        nextCursor = d.nextCursor ?? null;
      }
    } finally {
      loading = false;
    }
  }

  // FILTER / SEARCH STATE
    let searchQuery = $state(page.url.searchParams.get('q') ?? '');
    let activeGenre = $state('All');
    let sortBy      = $state('newest');
  
    function scrollToGames() {
      const el = document.querySelector('.filters-bar') as HTMLElement | null;
      if (!el) return;
      const navHeight = (document.querySelector('nav') as HTMLElement | null)?.offsetHeight ?? 80;
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  
    onMount(() => {
      // Sync store → page only after mount (client-only, avoids SSR 500)
      globalSearch.set(searchQuery);
  
      // If we arrived with a ?q= param (e.g. navigated from another page), scroll down
      if (searchQuery) {
        // Small tick to let the page render first
        setTimeout(scrollToGames, 50);
      }
  
      // Subscribe to navbar searches while on this page
      const unsubscribe = globalSearch.subscribe(val => {
        if (val !== searchQuery) {
          searchQuery = val;
          if (val) scrollToGames();
        }
      });
  
      return unsubscribe;
    });
  
    onDestroy(() => {
      globalSearch.set('');
    });

  const genres = ['All', 'Action RPG', 'Shooter', 'Racing', 'Strategy', 'Arcade', 'Space Sim', 'Survival', 'Horror', 'Fighting', 'Puzzle'];

  let filteredGames = $derived(() => {
    let result = mappedGames;
    if (activeGenre !== 'All') result = result.filter((g: any) => g.genre === activeGenre);
    if (searchQuery.trim()) result = result.filter((g: any) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.dev.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (sortBy === 'newest')       result = [...result].sort((a: any, b: any) => b.publishedAt - a.publishedAt);
    else if (sortBy === 'rating')  result = [...result].sort((a: any, b: any) => b.rating - a.rating);
    else if (sortBy === 'players') result = [...result].sort((a: any, b: any) => b.players - a.players);
    return result;
  });

  function formatPlayers(n: number) {
    if (n >= 1000) return (n/1000).toFixed(0)+'K';
    return n.toString();
  }

  const iconColors = ['#7C4DBF','#E85D82','#C97064','#8FBF8B','#F0899E','#A85F75'];
  const icons      = ['⬡','◈','⟁','✦','◉','⟡'];
  
  onDestroy(() => {
    globalSearch.set('');
  });
</script>

<svelte:head>
  <title>ALL GAMES // PROGCHAMP</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Pixelify+Sans:wght@400;500;600;700&family=Caveat:wght@500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<!-- NAV -->
<Navbar
  {isLoggedIn}
  {isAdmin}
  avatarUrl={user?.avatarUrl}
  userName={user?.name}
  onLoginClick={() => (showLogin = true)}
/>

<!-- HEADER -->
<header class="page-header">
  <div class="header-inner">
    <div class="header-eyebrow">// THE VAULT</div>
    <h1 class="header-title">ALL <span>GAMES</span></h1>
    <p class="header-sub">{mappedGames.length} titles available.</p>
  </div>
</header>

<!-- FILTERS -->
<div class="filters-bar">
  <div class="search-wrap">
    <span class="search-icon">⌕</span>
    <input 
      class="search-input" 
      type="text" 
      placeholder="SEARCH GAMES OR DEVS..." 
      value={searchQuery}
      oninput={(e) => {
        searchQuery = (e.target as HTMLInputElement).value;
        globalSearch.set(searchQuery);
      }}
    />
  </div>
  <select class="filter-select" bind:value={sortBy}>
    <option value="newest">NEWEST FIRST</option>
    <option value="rating">TOP RATED</option>
    <option value="players">MOST PLAYED</option>
  </select>
</div>
<div class="genre-bar">
  {#each genres as g}
    <button class="genre-pill" class:active={activeGenre===g} onclick={() => activeGenre = g}>{g.toUpperCase()}</button>
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
        <a href="/game/{game.id}" class="game-card">
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
    {#if nextCursor}
      <div class="load-more-wrap">
        <button class="load-more-btn" onclick={loadMore} disabled={loading}>
          {loading ? 'LOADING...' : 'LOAD MORE'}
        </button>
      </div>
    {/if}
  {/if}
</main>

<UploadCTA onUploadClick={() => goTo('/upload', true)} />

<!-- FOOTER -->
<Footer {isAdmin} />

<!-- LOGIN MODAL -->
<LoginModal open={showLogin} onClose={() => (showLogin = false)} />

<style>
  .page-header{position:relative;z-index:10;padding:140px 60px 60px;overflow:hidden;}
  .header-inner{position:relative;z-index:2;max-width:800px;margin:0 auto;text-align:center;}
  .header-eyebrow{font-family:'VT323',monospace;font-size:1.15rem;letter-spacing:.35em;text-transform:uppercase;color:var(--gold);margin-bottom:16px;}
  .header-title{font-family:'Press Start 2P',sans-serif;font-size:clamp(1.8rem,4.5vw,3.4rem);letter-spacing:.04em;line-height:.95;margin-bottom:20px;}
  .header-title span{color:var(--neon-cyan);}
  .header-sub{font-family:'VT323',monospace;font-size:1.28rem;color:rgba(245,205,210,0.65);letter-spacing:.08em;line-height:1.8;}

  .filters-bar{position:relative;z-index:10;display:flex;align-items:center;gap:16px;padding:32px 60px 0;}
  .search-wrap{flex:1;position:relative;max-width:480px;}
  .search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:rgba(232,93,130,0.4);font-size:1.1rem;pointer-events:none;}
  .search-input{width:100%;background:rgba(232,93,130,0.18);border:1px solid rgba(232,93,130,0.3);color:var(--text);font-family:'VT323',monospace;font-size:1.25rem;letter-spacing:.08em;padding:12px 16px 12px 40px;outline:none;transition:border-color .3s,box-shadow .3s;border-radius: 10px;cursor: var(--cursor-pointer);}
  .search-input:focus{border-color:var(--neon-cyan);}
  .search-input::placeholder{color:rgba(245,205,210,0.45);}
  .filter-select{background:rgba(232,93,130,0.18);border:1px solid rgba(232,93,130,0.3);color:var(--text);font-family:'VT323',monospace;font-size:1.2rem;letter-spacing:.1em;padding:12px 36px 12px 16px;outline:none;cursor: var(--cursor-pointer);transition:border-color .3s;border-radius: 10px;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2300fff9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;}
  .filter-select option{background:#1E0E1E;}

  .genre-bar{position:relative;z-index:10;display:flex;flex-wrap:wrap;gap:8px;padding:16px 60px 0;}
  .genre-pill{font-family:'VT323',monospace;font-size:1.1rem;letter-spacing:.15em;text-transform:uppercase;background:transparent;color:rgba(245,205,210,0.6);border:1px solid rgba(245,205,210,0.35);padding:6px 14px;cursor: var(--cursor-pointer);transition:all .25s;border-radius: 10px;}
  .genre-pill:hover{color:var(--neon-purple);border-color:rgba(124,77,191,0.4);}
  .genre-pill.active{color:var(--neon-purple);border-color:var(--neon-purple);background:rgba(124,77,191,0.21);}

  .games-main{position:relative;z-index:10;padding:32px 60px 80px;}
  .results-count{font-family:'VT323',monospace;font-size:1.12rem;letter-spacing:.2em;color:rgba(232,93,130,0.4);margin-bottom:24px;}
  .games-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px;}

  .game-card{display:flex;flex-direction:column;text-decoration:none;color:var(--text);background:rgba(30,14,30,.7);border:1px solid rgba(232,93,130,0.23);transition:border-color .3s,transform .3s,box-shadow .3s;cursor: var(--cursor-pointer);overflow:hidden;border-radius: 10px;}
  .game-card:hover{border-color:rgba(232,93,130,0.45);transform:translateY(-4px);box-shadow: 0 12px 40px rgba(232,93,130,0.23);}
  .game-thumb{position:relative;aspect-ratio:16/9;overflow:hidden;}
  .thumb-img{width:100%;height:100%;object-fit:cover;transition:transform .4s;}
  .game-card:hover .thumb-img{transform:scale(1.05);}
  .thumb-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;}
  .thumb-icon{font-size:3rem;opacity:.6;}
  .game-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(36,19,44,.9) 0%,transparent 60%);}
  .game-hover-btn{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'VT323',monospace;font-size:1.2rem;letter-spacing:.2em;color:var(--neon-cyan);opacity:0;transition:opacity .3s;background:rgba(36,19,44,.4);}
  .game-card:hover .game-hover-btn{opacity:1;}
  .game-info{padding:16px 18px 18px;}
  .game-genre{font-family:'VT323',monospace;font-size:1.08rem;letter-spacing:.2em;color:var(--neon-purple);margin-bottom:6px;}
  .game-title{font-family:'Press Start 2P',sans-serif;font-size:1.4rem;letter-spacing:.06em;line-height:1;margin-bottom:8px;}
  .game-meta{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
  .game-dev{font-family:'VT323',monospace;font-size:1.12rem;letter-spacing:.08em;color:rgba(245,205,210,0.55);}
  .game-rating{font-family:'VT323',monospace;font-size:1.15rem;color:var(--neon-yellow);}
  .game-players{font-family:'VT323',monospace;font-size:1.08rem;letter-spacing:.12em;color:rgba(232,93,130,0.4);}

  .empty-state{text-align:center;padding:100px 20px;}
  .empty-icon{font-size:4rem;color:rgba(232,93,130,0.3);margin-bottom:20px;}
  .empty-title{font-family:'Press Start 2P',sans-serif;font-size:2rem;letter-spacing:.1em;color:rgba(245,205,210,0.55);margin-bottom:10px;}
  .empty-sub{font-family:'VT323',monospace;font-size:1.2rem;letter-spacing:.1em;color:rgba(245,205,210,0.45);}
  .load-more-wrap{display:flex;justify-content:center;margin-top:48px;}
  .load-more-btn{font-family:'VT323',monospace;font-size:1.2rem;letter-spacing:.2em;color:var(--neon-cyan);border:1px solid rgba(232,93,130,0.45);background:rgba(232,93,130,0.18);padding:14px 40px;cursor: var(--cursor-pointer);transition:all .25s;border-radius: 10px;}
  .load-more-btn:hover:not(:disabled){border-color:var(--neon-cyan);}
  .load-more-btn:disabled{opacity:.4;}
</style>