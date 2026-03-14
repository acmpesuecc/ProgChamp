<script lang="ts">
    /**
     * Footer
     * Pass `isAdmin` to show the Admin Panel link in the Your Space column.
     */
    interface Props {
      isAdmin?: boolean;
    }
    let { isAdmin = false }: Props = $props();
  </script>
  
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
        <li><a href="/my-games">My Games</a></li>
        <li><a href="/upload">Upload a Game</a></li>
        {#if isAdmin}
          <li><a href="/admin" class="admin-link">Admin Panel</a></li>
        {/if}
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
      <div class="footer-status">
        <span class="status-dot"></span>
        ALL SYSTEMS OPERATIONAL
      </div>
    </div>
  </footer>
  
  <style>
    footer {
      position: relative;
      z-index: 10;
      padding: 60px;
      border-top: 1px solid rgba(0,255,249,.1);
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 60px;
      background: rgba(3,0,10,.95);
    }
  
    .footer-logo     { font-family:'Bebas Neue',sans-serif; font-size:3.2rem; color:var(--neon-cyan); text-shadow:0 0 20px var(--neon-cyan); margin-bottom:4px; }
    .footer-logo span{ color:var(--neon-pink); text-shadow:0 0 20px var(--neon-pink); }
    .footer-logo-sub { font-family:'Share Tech Mono',monospace; font-size:.72rem; color:rgba(0,255,249,.4); letter-spacing:.12em; margin-bottom:14px; }
    .footer-desc     { font-family:'Share Tech Mono',monospace; font-size:.7rem; line-height:1.8; color:rgba(224,224,255,.3); letter-spacing:.05em; }
  
    .footer-col-title { font-family:'Bebas Neue',sans-serif; font-size:1.2rem; letter-spacing:.1em; color:rgba(224,224,255,.5); margin-bottom:20px; }
  
    .footer-links   { list-style:none; display:flex; flex-direction:column; gap:12px; }
    .footer-links a { font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.1em; color:rgba(224,224,255,.3); text-decoration:none; text-transform:uppercase; transition:color .2s; cursor:none; }
    .footer-links a:hover { color:var(--neon-cyan); text-shadow:0 0 8px var(--neon-cyan); }
  
    .admin-link       { color:rgba(255,0,110,.5) !important; }
    .admin-link:hover { color:var(--neon-pink) !important; text-shadow:0 0 8px var(--neon-pink) !important; }
  
    .footer-bottom {
      grid-column: 1 / -1;
      padding-top: 30px;
      border-top: 1px solid rgba(255,255,255,.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-copy   { font-family:'Share Tech Mono',monospace; font-size:.6rem; color:rgba(224,224,255,.2); letter-spacing:.12em; }
    .footer-status { display:flex; align-items:center; gap:8px; font-family:'Share Tech Mono',monospace; font-size:.6rem; color:rgba(0,255,249,.5); letter-spacing:.1em; }
  
    /* status-dot animation is defined in global.css but needs to be available here too */
    :global(.status-dot) {
      width:6px; height:6px; background:var(--neon-cyan); border-radius:50%;
      box-shadow:0 0 6px var(--neon-cyan); animation:blink 2s step-end infinite;
      display:inline-block; flex-shrink:0;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  </style>