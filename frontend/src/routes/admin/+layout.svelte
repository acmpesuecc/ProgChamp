<script lang="ts">
  let { children } = $props();
</script>


<nav>
  <a href="/" class="logo-wrap">
    <span class="logo">PROG<em>CHAMP</em></span>
    <span class="logo-sub">an @ACMpesuecc project</span>
  </a>
  <a href="/" class="nav-back">← Back to Site</a>

    <div class="nav-links">
    <a href="/admin" class="nav-link">Dashboard</a>
    <a href="/admin/requests" class="nav-link">Game Requests</a>
    <a href="/admin/appeals" class="nav-link">Appeals</a>
    <a href="/admin/users" class="nav-link">Users</a>
    <a href="/admin/games" class="nav-link">Games</a>
    </div>

  <div class="nav-badge">⚙ ADMIN PANEL</div>
</nav>

<main>
  {@render children()}
</main>

<style>
  nav { position:fixed; top:0; left:0; right:0; z-index:200; display:flex; align-items:center; gap:22px; padding:14px 48px; background:rgba(36,19,44,.98); }
  .logo-wrap { display:flex; flex-direction:column; text-decoration:none; flex-shrink:0; gap:2px; }
  .logo { font-family:'Press Start 2P',sans-serif; font-size:2.4rem; letter-spacing:.12em; color:var(--neon-cyan);  }
  .logo em { color:var(--neon-pink); font-style:normal;  }
  .logo-sub { font-family:'Caveat',cursive; font-size:1rem; font-weight:600; letter-spacing:.02em; color:rgba(114,61,81,.85); }
  .nav-back { font-family:'VT323',monospace; font-size:1.45rem; letter-spacing:.1em; text-transform:uppercase; color:rgba(245,205,210,0.65); text-decoration:none; transition:color .2s; }
  .nav-back:hover { color:var(--neon-cyan); }
  .nav-badge { font-family:'VT323',monospace; font-size:1.35rem; letter-spacing:.15em; background:rgba(124,77,191,0.27); border:1px solid rgba(124,77,191,0.4); color:var(--neon-pink); padding:5px 14px; text-transform:uppercase; margin-left:auto; }
  main { position:relative; z-index:10; padding:100px 48px 60px; }
  .nav-links { display:flex; align-items:center; gap:24px; margin-left:24px; }
    .nav-link { font-family:'VT323',monospace; font-size:1.4rem; letter-spacing:.1em; text-transform:uppercase; color:rgba(245,205,210,0.65); text-decoration:none; transition:color .2s; padding-bottom:2px; border-bottom:1px solid transparent; }
    .nav-link:hover { color:var(--neon-cyan); border-bottom-color:var(--neon-cyan); }
</style>