<script lang="ts">
  import { onMount } from 'svelte';

  let { children } = $props();

  let cursorEl = $state<HTMLDivElement | null>(null);
  let dotEl    = $state<HTMLDivElement | null>(null);

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
      el.addEventListener('mouseenter', () => { if (cursorEl) { cursorEl.style.transform = 'translate(-50%,-50%) scale(2)'; cursorEl.style.borderColor = 'var(--neon-pink)'; }});
      el.addEventListener('mouseleave', () => { if (cursorEl) { cursorEl.style.transform = 'translate(-50%,-50%) scale(1)'; cursorEl.style.borderColor = 'var(--neon-cyan)'; }});
    };
    document.querySelectorAll('button, a').forEach(addHover);
    return () => document.removeEventListener('mousemove', onMove);
  });
</script>

<div class="cursor"     bind:this={cursorEl}></div>
<div class="cursor-dot" bind:this={dotEl}></div>
<div class="grid-bg"></div>
<div class="noise"></div>

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
  nav { position:fixed; top:0; left:0; right:0; z-index:200; display:flex; align-items:center; gap:22px; padding:14px 48px; border-bottom:1px solid rgba(0,255,249,.15); background:rgba(3,0,10,.92); backdrop-filter:blur(14px); }
  .logo-wrap { display:flex; flex-direction:column; text-decoration:none; flex-shrink:0; gap:2px; }
  .logo { font-family:'Bebas Neue',sans-serif; font-size:2.4rem; letter-spacing:.12em; color:var(--neon-cyan); text-shadow:0 0 20px var(--neon-cyan); }
  .logo em { color:var(--neon-pink); font-style:normal; text-shadow:0 0 20px var(--neon-pink); }
  .logo-sub { font-family:'Share Tech Mono',monospace; font-size:.7rem; letter-spacing:.14em; color:rgba(0,255,249,.4); }
  .nav-back { font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.15em; text-transform:uppercase; color:rgba(224,224,255,.4); text-decoration:none; transition:color .2s; }
  .nav-back:hover { color:var(--neon-cyan); }
  .nav-badge { font-family:'Share Tech Mono',monospace; font-size:.6rem; letter-spacing:.2em; background:rgba(255,0,110,.12); border:1px solid rgba(255,0,110,.4); color:var(--neon-pink); padding:5px 14px; text-transform:uppercase; margin-left:auto; }
  main { position:relative; z-index:10; padding:100px 48px 60px; }
  .nav-links { display:flex; align-items:center; gap:24px; margin-left:24px; }
    .nav-link { font-family:'Share Tech Mono',monospace; font-size:.62rem; letter-spacing:.15em; text-transform:uppercase; color:rgba(224,224,255,.4); text-decoration:none; transition:color .2s; padding-bottom:2px; border-bottom:1px solid transparent; }
    .nav-link:hover { color:var(--neon-cyan); border-bottom-color:var(--neon-cyan); }
</style>