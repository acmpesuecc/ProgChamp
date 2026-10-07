<script lang="ts">
  import { goto } from '$app/navigation';

  import Navbar        from '$lib/components/Navbar.svelte';
  import HeroSection   from '$lib/components/HeroSection.svelte';
  import GameCard      from '$lib/components/GameCard.svelte';
  import CategoryItem  from '$lib/components/CategoryItem.svelte';
  import UploadCTA     from '$lib/components/UploadCTA.svelte';
  import LoginModal    from '$lib/components/LoginModal.svelte';
  import Footer        from '$lib/components/Footer.svelte';

  // ── Page data (from server load function) ──────────────────
  let { data } = $props();

  let isLoggedIn = $derived(data.session?.authenticated ?? false);
  let isAdmin    = $derived(data.session?.user?.userType === 'admin');
  let games       = $derived(data.games       ?? []);
  let categories  = $derived(data.categories  ?? []);

  // ── Login modal state ──────────────────────────────────────
  let showLogin = $state(false);

  // Navigate to a path; show the login modal first if not authenticated.
  function goTo(path: string, requiresAuth = false) {
    if (requiresAuth && !isLoggedIn) { showLogin = true; }
    else { goto(path); }
  }
</script>

<svelte:head>
  <title>PROGCHAMP // Game Vault</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Pixelify+Sans:wght@400;500;600;700&family=Caveat:wght@500;600;700&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<!-- ── Nav (also mounts the custom cursor + bg decorations) ── -->
<Navbar
  {isLoggedIn}
  {isAdmin}
  avatarUrl={data.session?.user?.avatarUrl}
  userName={data.session?.user?.name}
  onLoginClick={() => (showLogin = true)}
/>

<!-- ── Hero ───────────────────────────────────────────────── -->
<HeroSection
  onEnterVault={() => goTo('/all-games', true)}
  onViewLibrary={() => goTo('/my-games', true)}
/>


<!-- ── Trending games grid ────────────────────────────────── -->
<section>
  <div class="section-header">
    <h2 class="section-title trending-title">TRENDING</h2>
    <span class="section-tag">// UPDATED WEEKLY</span>
    <a
      href="/all-games"
      class="section-link"
      onclick={(e) => { e.preventDefault(); goTo('/all-games', true); }}
    >VIEW ALL →</a>
  </div>

  <div class="games-grid">
    {#each games as game, i}
      <GameCard
        {game}
        showCorner={i === 0 ? 'tl' : i === 2 ? 'br' : null}
      />
    {/each}
  </div>
</section>

<!-- ── Genre categories ───────────────────────────────────── -->
<section class="categories-section">
  <div class="section-header">
    <h2 class="section-title">EXPLORE BY <span>GENRE</span></h2>
    <span class="section-tag">// 48 CATEGORIES</span>
  </div>
  <div class="cat-grid">
    {#each categories as category}
      <CategoryItem {category} />
    {/each}
  </div>
</section>

<!-- ── Developer upload banner ────────────────────────────── -->
<UploadCTA onUploadClick={() => goTo('/upload', true)} />

<!-- ── Sign-up CTA ─────────────────────────────────────────── -->
<section class="cta-section">
  <div class="cta-eyebrow">// INITIALIZE YOUR SESSION</div>
  <h2 class="cta-title">READY TO<br/><span class="accent">LOGIN?</span></h2>
  <p class="cta-sub">
    Create your free account and get instant access to 100 games.
    No credit card required. No downloads. Just pure, uncut gameplay.
  </p>
  <button class="btn-primary" onclick={() => (showLogin = true)}>
    CREATE FREE ACCOUNT
  </button>
</section>

<!-- ── Footer ─────────────────────────────────────────────── -->
<Footer {isAdmin} />

<!-- ── Login modal ────────────────────────────────────────── -->
<LoginModal open={showLogin} onClose={() => (showLogin = false)} />

<style>
  /* ── Trending title glitch ───────────────────────────────── */
  .trending-title { color:var(--neon-cyan);  position:relative; cursor: var(--cursor-pointer); }
  .trending-title::before,
  .trending-title::after  { content:'TRENDING'; position:absolute; left:0; top:0; width:100%; height:100%; opacity:0; }
  .trending-title::before { color:var(--neon-pink);    }
  .trending-title::after  { color:var(--neon-yellow);   }
  .trending-title:hover               { animation:tGlitchMain .5s steps(1) infinite; }
  .trending-title:hover::before       { animation:tGlitch1    .5s steps(1) infinite; }
  .trending-title:hover::after        { animation:tGlitch2    .5s steps(1) infinite; }
  @keyframes tGlitchMain { 0%,100%{transform:none;clip-path:none} 20%{transform:translateX(2px);clip-path:polygon(0 30%,100% 30%,100% 55%,0 55%)} 40%{transform:translateX(-2px);clip-path:polygon(0 65%,100% 65%,100% 85%,0 85%)} 60%{transform:none;clip-path:none} }
  @keyframes tGlitch1    { 0%,100%{opacity:0;transform:none;clip-path:none} 20%,25%{opacity:1;transform:translateX(-4px);clip-path:polygon(0 10%,100% 10%,100% 40%,0 40%)} 50%,55%{opacity:1;transform:translateX(3px);clip-path:polygon(0 60%,100% 60%,100% 75%,0 75%)} 80%{opacity:0} }
  @keyframes tGlitch2    { 0%,100%{opacity:0;transform:none;clip-path:none} 30%,35%{opacity:1;transform:translateX(4px);clip-path:polygon(0 50%,100% 50%,100% 70%,0 70%)} 60%,65%{opacity:1;transform:translateX(-3px);clip-path:polygon(0 15%,100% 15%,100% 35%,0 35%)} 90%{opacity:0} }

  /* ── Games grid ──────────────────────────────────────────── */
  .games-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; background:rgba(232,93,130,0.2); border:1px solid rgba(232,93,130,0.25); }

  /* ── Categories ──────────────────────────────────────────── */
  .categories-section { background:rgba(30,14,30,.8); border-top:1px solid rgba(124,77,191,0.35); border-bottom:1px solid rgba(124,77,191,0.35); }
  .cat-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:16px; }

  /* ── Sign-up CTA section ─────────────────────────────────── */
  .cta-section  { text-align:center; padding:140px 60px; background:radial-gradient(ellipse at center,rgba(124,77,191,0.23) 0%,transparent 70%); border-top:1px solid rgba(124,77,191,0.25); }
  .cta-eyebrow  { font-family:'VT323',monospace; font-size:1.2rem; letter-spacing:.3em; text-transform:uppercase; color:var(--neon-purple);  margin-bottom:20px; }
  .cta-title    { font-family:'Press Start 2P',sans-serif; font-size:clamp(1.8rem,4.5vw,3.2rem); line-height:.95; letter-spacing:.02em; margin-bottom:30px; }
  .cta-title .accent { color:var(--neon-cyan);  }
  .cta-sub      { font-family:'VT323',monospace; font-size:1.3rem; color:rgba(245,205,210,0.65); margin-bottom:50px; letter-spacing:.1em; max-width:500px; margin-left:auto; margin-right:auto; line-height:1.8; }
</style>
