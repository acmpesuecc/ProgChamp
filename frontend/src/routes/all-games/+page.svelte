<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { submissions } from '../../lib/stores/submissions';
  import UploadCTA from '$lib/components/UploadCTA.svelte';

  import Navbar     from '$lib/components/Navbar.svelte';
  import Footer     from '$lib/components/Footer.svelte';
  import LoginModal from '$lib/components/LoginModal.svelte';

  // AUTH
  let session    = $derived(page.data.session);
  let user       = $derived(session?.user);
  let isLoggedIn = $derived(session?.authenticated ?? false);
  let isAdmin    = $derived(user?.userType === 'admin');

  // LOGIN MODAL STATE
  let showLogin = $state(false);

  function goTo(path: string, requiresAuth = false) {
    if (requiresAuth && !isLoggedIn) showLogin = true;
    else goto(path);
  }

  // FILTER / SEARCH STATE
  let searchQuery = $state('');
  let activeGenre = $state('All');
  let sortBy      = $state('newest');

  const genres = ['All', 'Action RPG', 'Shooter', 'Racing', 'Strategy', 'Arcade', 'Space Sim', 'Survival', 'Horror', 'Fighting', 'Puzzle'];

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
    if (sortBy === 'newest')  result = [...result].sort((a: any, b: any) => b.publishedAt - a.publishedAt);
    else if (sortBy === 'rating')  result = [...result].sort((a: any, b: any) => b.rating - a.rating);
    else if (sortBy === 'players') result = [...result].sort((a: any, b: any) => b.players - a.players);
    return result;
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
  {/if}
</main>

<UploadCTA onUploadClick={() => goTo('/upload', true)} />

<!-- FOOTER -->
<Footer {isAdmin} />

<!-- LOGIN MODAL -->
<LoginModal open={showLogin} onClose={() => (showLogin = false)} />

<style>
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
</style>