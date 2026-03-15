<script lang="ts">
  /**
   * GameCard
   * Renders a single game tile. Pass the full game object via the `game` prop.
   * Optional `showCorner` controls which corner decoration to display.
   */
  interface Game {
    id:           string;
    genre:        string;
    rating:       string | number;
    // Support both the original properties and the new dev-catalog properties
    name?:        string; 
    title?:       string;
    image_url?:   string;
    thumbnail?:   string;
    icon?:        string;
    iconColor?:   string;
    // New properties
    developer?:   string;
    players?:     number;
    publishedAt?: string;
  }

  interface Props {
    game:         Game;
    showCorner?:  'tl' | 'br' | null;
  }

  let { game, showCorner = null }: Props = $props();

  // ── Normalizers ────────────────────────────────────────────────────────────
  // Automatically picks the right data regardless of which page calls the card
  let displayTitle = $derived(game.title || game.name || 'UNKNOWN');
  let displayImage = $derived(game.thumbnail || game.image_url);

  // Formats '2025-11-03' into 'NOV 2025'
  let formattedDate = $derived(
    game.publishedAt 
      ? new Date(game.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
      : null
  );
</script>

<a href="/game/{game.id}" class="game-card">
  <div class="game-thumb">
    {#if displayImage}
      <img class="game-thumb-img" src={displayImage} alt={displayTitle} />
    {:else}
      <div class="game-thumb-fallback">
        <span style="color:{game.iconColor || 'var(--neon-cyan)'}">{game.icon || '◈'}</span>
      </div>
    {/if}
    <div class="game-art-pattern"></div>
    <div class="game-icon" style="color:{game.iconColor || 'var(--neon-cyan)'}">{game.icon || ''}</div>
  </div>

  <div class="game-overlay"></div>
  <div class="game-hover-btn"><span class="play-btn">PLAY NOW</span></div>

  <div class="game-info">
    <div class="game-genre">{game.genre}</div>
    <div class="game-name">{displayTitle}</div>
    
    {#if game.developer || formattedDate}
      <div class="game-dev-row">
        {#if game.developer}<span class="dev-name">{game.developer}</span>{/if}
        {#if formattedDate}<span class="pub-date">// {formattedDate}</span>{/if}
      </div>
    {/if}

    <div class="game-meta">
      <span class="game-rating">★ {game.rating}</span>
      {#if game.players !== undefined}
        <span class="game-players">◉ {game.players >= 1000 ? (game.players/1000).toFixed(1) + 'K' : game.players}</span>
      {/if}
    </div>
  </div>

  {#if showCorner === 'tl'}<div class="corner-deco tl"></div>{/if}
  {#if showCorner === 'br'}<div class="corner-deco br"></div>{/if}
</a>

<style>
  .game-card { background:var(--dark2); overflow:hidden; position:relative; cursor:none; transition:transform .3s; aspect-ratio:3/4; display:flex; flex-direction:column; justify-content:flex-end; text-decoration:none; }
  .game-card:hover { z-index:2; transform:scale(1.02); }

  .game-thumb         { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .game-thumb-img     { width:100%; height:100%; object-fit:cover; transition:transform .5s; display:block; }
  .game-card:hover .game-thumb-img { transform:scale(1.08); }
  .game-thumb-fallback { width:100%; height:100%; background:linear-gradient(135deg,#0a0020 0%,#1a0040 50%,#2a0060 100%); display:flex; align-items:center; justify-content:center; font-size:4rem; }

  .game-art-pattern { position:absolute; inset:0; opacity:.06; background-image:repeating-linear-gradient(45deg,#fff 0px,#fff 1px,transparent 1px,transparent 10px); pointer-events:none; }
  .game-icon        { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:3.5rem; opacity:.15; pointer-events:none; transition:opacity .3s; }
  .game-card:hover .game-icon { opacity:.25; }

  .game-overlay   { position:absolute; inset:0; background:linear-gradient(to top,rgba(3,0,10,.95) 0%,rgba(3,0,10,.5) 40%,transparent 70%); }
  .game-hover-btn { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,255,249,.05); opacity:0; transition:opacity .3s; }
  .game-card:hover .game-hover-btn { opacity:1; }

  .play-btn  { font-family:'Share Tech Mono',monospace; font-size:.7rem; letter-spacing:.2em; text-transform:uppercase; background:var(--neon-cyan); color:var(--dark); padding:12px 30px; font-weight:bold; clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%); box-shadow:0 0 30px rgba(0,255,249,.6); }

  .game-info   { position:relative; padding:24px; }
  .game-genre  { font-family:'Share Tech Mono',monospace; font-size:.6rem; letter-spacing:.25em; text-transform:uppercase; color:var(--neon-pink); text-shadow:0 0 10px var(--neon-pink); margin-bottom:6px; }
  .game-name   { font-family:'Bebas Neue',sans-serif; font-size:1.8rem; letter-spacing:.05em; color:white; text-shadow:0 0 20px rgba(255,255,255,.3); margin-bottom:8px; line-height: 1; }
  
  /* ── NEW: Developer & Date row ── */
  .game-dev-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
  .dev-name     { font-family:'Share Tech Mono',monospace; font-size:.65rem; color:rgba(224,224,255,.6); text-transform: uppercase; }
  .pub-date     { font-family:'Share Tech Mono',monospace; font-size:.6rem; color:rgba(0,255,249,.4); }

  .game-meta    { display:flex; align-items:center; justify-content:space-between; }
  .game-rating  { font-family:'Share Tech Mono',monospace; font-size:.65rem; color:var(--neon-yellow); text-shadow:0 0 8px var(--neon-yellow); }
  
  /* ── NEW: Player count ── */
  .game-players { font-family:'Share Tech Mono',monospace; font-size:.65rem; color:var(--neon-cyan); opacity: 0.8;}

  .corner-deco      { position:absolute; width:40px; height:40px; pointer-events:none; }
  .corner-deco.tl   { top:0;    left:0;   border-top:    2px solid var(--neon-cyan); border-left:   2px solid var(--neon-cyan); }
  .corner-deco.br   { bottom:0; right:0;  border-bottom: 2px solid var(--neon-cyan); border-right:  2px solid var(--neon-cyan); }
</style>