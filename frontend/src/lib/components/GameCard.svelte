<script lang="ts">
    /**
     * GameCard
     * Renders a single game tile. Pass the full game object via the `game` prop.
     * Optional `showCorner` controls which corner decoration to display.
     */
    interface Game {
      slug:      string;
      name:      string;
      genre:     string;
      rating:    string | number;
      icon:      string;
      iconColor: string;
      image_url?: string;
    }
  
    interface Props {
      game:        Game;
      showCorner?: 'tl' | 'br' | null;
    }
  
    let { game, showCorner = null }: Props = $props();
  </script>
  
  <a href="/games/{game.slug}" class="game-card">
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
    .game-name   { font-family:'Bebas Neue',sans-serif; font-size:1.8rem; letter-spacing:.05em; color:white; text-shadow:0 0 20px rgba(255,255,255,.3); margin-bottom:8px; }
    .game-meta   { display:flex; align-items:center; justify-content:space-between; }
    .game-rating { font-family:'Share Tech Mono',monospace; font-size:.65rem; color:var(--neon-yellow); text-shadow:0 0 8px var(--neon-yellow); }
  
    /* corner decorations — same classes as global.css but scoped here for card context */
    .corner-deco      { position:absolute; width:40px; height:40px; pointer-events:none; }
    .corner-deco.tl   { top:0;    left:0;   border-top:    2px solid var(--neon-cyan); border-left:   2px solid var(--neon-cyan); }
    .corner-deco.br   { bottom:0; right:0;  border-bottom: 2px solid var(--neon-cyan); border-right:  2px solid var(--neon-cyan); }
  </style>