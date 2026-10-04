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
        <li><a href="https://acmpesuecc.github.io/" target="_blank" rel="noopener noreferrer">About ACMpesuecc</a></li>
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
      border-top: 2px solid transparent;
      border-image: linear-gradient(90deg, var(--gold) 0%, var(--green) 12%, var(--neon-cyan) 12%, var(--neon-cyan) 100%) 1;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 60px;
      background: rgba(36,19,44,.95);
    }
  
    .footer-logo     { font-family:'Press Start 2P',sans-serif; font-size: 2.2rem; color:var(--neon-cyan);  margin-bottom:4px; }
    .footer-logo span{ color:var(--neon-pink);  }
    .footer-logo-sub { font-family:'VT323',monospace; font-size:1.22rem; color:rgba(232,93,130,0.4); letter-spacing:.12em; margin-bottom:14px; }
    .footer-desc     { font-family:'VT323',monospace; font-size:1.2rem; line-height:1.8; color:rgba(245,205,210,0.55); letter-spacing:.05em; }
  
    .footer-col-title { font-family:'Press Start 2P',sans-serif; font-size:1.2rem; letter-spacing:.1em; color:rgba(245,205,210,0.75); margin-bottom:20px; }
  
    .footer-links   { list-style:none; display:flex; flex-direction:column; gap:12px; }
    .footer-links a { font-family:'VT323',monospace; font-size:1.15rem; letter-spacing:.1em; color:rgba(245,205,210,0.55); text-decoration:none; text-transform:uppercase; transition:color .2s; cursor: var(--cursor-pointer); }
    .footer-links a:hover { color:var(--neon-cyan);  }
  
    .admin-link       { color:rgba(124,77,191,0.5) !important; }
    .admin-link:hover { color:var(--neon-pink) !important;  }
  
    .footer-bottom {
      grid-column: 1 / -1;
      padding-top: 30px;
      border-top: 1px solid rgba(255,255,255,.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-copy   { font-family:'VT323',monospace; font-size:1.1rem; color:rgba(245,205,210,0.45); letter-spacing:.12em; }
    .footer-status { display:flex; align-items:center; gap:8px; font-family:'VT323',monospace; font-size:1.1rem; color:rgba(232,93,130,0.5); letter-spacing:.1em; }
  
    /* status-dot animation is defined in global.css but needs to be available here too */
    :global(.status-dot) {
      width:6px; height:6px; background:var(--green); border-radius:50%;
       animation:blink 2s step-end infinite;
      display:inline-block; flex-shrink:0;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  </style>