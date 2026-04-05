<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { submissions } from '../../lib/stores/submissions';

  let isLoggedIn = $state(true);
  let isAdmin    = $state(false);
  let session    = $derived($page.data.session);
  let user       = $derived(session?.user);

  let showLogin     = $state(false);
  let loginEmail    = $state('');
  let loginPassword = $state('');
  let loginError    = $state('');
  let isLoggingIn   = $state(false);

  // MY GAMES
  let myGames   = $derived($submissions.filter((s: any) => s.dev === (user?.name ?? '')));
  let pending   = $derived(myGames.filter((s: any) => s.status === 'pending'));
  let approved  = $derived(myGames.filter((s: any) => s.status === 'approved'));
  let rejected  = $derived(myGames.filter((s: any) => s.status === 'rejected'));

  // AUTH HELPERS
  function goTo(path: string, requiresAuth = false) {
    if (requiresAuth && !isLoggedIn) showLogin = true;
    else goto(path);
  }
  async function handleLogin(e: Event) {
    e.preventDefault();
    loginError = '';
    if (!loginEmail || !loginPassword) { loginError = 'ALL FIELDS REQUIRED'; return; }
    isLoggingIn = true;
    try {
      await new Promise(r => setTimeout(r, 1200));
      isLoggedIn = true; showLogin = false; loginEmail = loginPassword = '';
    } catch (err: any) {
      loginError = err.message || 'LOGIN FAILED';
    } finally { isLoggingIn = false; }
  }
  function logout() { isLoggedIn = false; isAdmin = false; }
  function closeOnBackdrop(e: MouseEvent) { if (e.target === e.currentTarget) showLogin = false; }

  // CURSOR
  let cursorEl = $state<HTMLElement | undefined>(undefined);
  let dotEl    = $state<HTMLElement | undefined>(undefined);

  onMount(() => {
    // Redirect if not logged in
    if (!isLoggedIn) { showLogin = true; }

    let mx = 0, my = 0, cx = 0, cy = 0;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (dotEl) { dotEl.style.left = mx+'px'; dotEl.style.top = my+'px'; }
    };
    document.addEventListener('mousemove', onMove);
    const raf = () => {
      cx += (mx-cx)*0.12; cy += (my-cy)*0.12;
      if (cursorEl) { cursorEl.style.left = cx+'px'; cursorEl.style.top = cy+'px'; }
      requestAnimationFrame(raf);
    };
    raf();
    const addHover = (el: Element) => {
      el.addEventListener('mouseenter', () => { if (cursorEl) { cursorEl.style.transform='translate(-50%,-50%) scale(2)'; cursorEl.style.borderColor='var(--neon-pink)'; } });
      el.addEventListener('mouseleave', () => { if (cursorEl) { cursorEl.style.transform='translate(-50%,-50%) scale(1)'; cursorEl.style.borderColor='var(--neon-cyan)'; } });
    };
    document.querySelectorAll('button, a, .game-card').forEach(addHover);
    return () => document.removeEventListener('mousemove', onMove);
  });

  function thumbUrl(s: any) {
    return s.thumbnail ? URL.createObjectURL(s.thumbnail) : null;
  }

  const statusConfig: Record<string, { label: string; color: string; glow: string; icon: string; border: string; bg: string }> = {
    pending:  { label: 'AWAITING REVIEW', color: 'var(--neon-yellow)', glow: 'rgba(255,230,0,.3)',  icon: '◌', border: 'rgba(255,230,0,.25)',  bg: 'rgba(255,230,0,.04)' },
    approved: { label: 'LIVE',            color: 'var(--neon-cyan)',   glow: 'rgba(0,255,249,.3)',  icon: '◉', border: 'rgba(0,255,249,.25)',  bg: 'rgba(0,255,249,.04)' },
    rejected: { label: 'REJECTED',        color: 'var(--neon-pink)',   glow: 'rgba(255,0,110,.3)',  icon: '✕', border: 'rgba(255,0,110,.25)',  bg: 'rgba(255,0,110,.04)' },
  };
</script>

<svelte:head>
  <title>MY GAMES // PROGCHAMP</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Oxanium:wght@300;400;600;800&display=swap" rel="stylesheet" />
</svelte:head>

<div class="cursor" bind:this={cursorEl}></div>
<div class="cursor-dot" bind:this={dotEl}></div>
<div class="grid-bg"></div>
<div class="noise"></div>

<!-- NAV -->
<nav>
  <a href="/" class="logo-wrap">
    <span class="logo">PROG<em>CHAMP</em></span>
    <span class="logo-sub">an @ACMpesuecc project</span>
  </a>
  <ul class="nav-links">
    <li><a href="/all-games" class="nav-link">ALL GAMES</a></li>
    <li><a href="/my-games" class="nav-link nav-link--active">MY GAMES</a></li>
    <li><a href="/upload" class="nav-link" onclick={(e)=>{e.preventDefault();goTo('/upload',true);}}>UPLOAD</a></li>
    {#if isAdmin}<li><a href="/admin" class="nav-link nav-link--admin">ADMIN</a></li>{/if}
  </ul>
  {#if isLoggedIn}
    <button class="nav-cta nav-cta--out" onclick={logout}>LOG OUT</button>
  {:else}
    <button class="nav-cta" onclick={()=>showLogin=true}>LOGIN</button>
  {/if}
</nav>

<!-- HEADER -->
<header class="page-header">
  <div class="header-orb orb1"></div>
  <div class="header-orb orb2"></div>
  <div class="header-inner">
    <div class="header-eyebrow">// DEVELOPER DASHBOARD</div>
    <h1 class="header-title">MY <span>GAMES</span></h1>
    <p class="header-sub">
      {#if isLoggedIn}
        {myGames.length} submission{myGames.length !== 1 ? 's' : ''} · {approved.length} live · {pending.length} under review
      {:else}
        Log in to view your submitted games.
      {/if}
    </p>
  </div>
</header>

<!-- CONTENT -->
<main class="page-main">
  {#if !isLoggedIn}
    <!-- NOT LOGGED IN -->
    <div class="empty-state">
      <div class="empty-icon">⬡</div>
      <div class="empty-title">ACCESS DENIED</div>
      <div class="empty-sub">You need to be logged in to view your games.</div>
      <button class="btn-cta" onclick={()=>showLogin=true}>LOGIN TO CONTINUE</button>
    </div>

  {:else if myGames.length === 0}
    <!-- LOGGED IN BUT NOTHING SUBMITTED -->
    <div class="empty-state">
      <div class="empty-icon">◌</div>
      <div class="empty-title">NO SUBMISSIONS YET</div>
      <div class="empty-sub">You haven't uploaded any games. Ready to publish?</div>
      <a href="/upload" class="btn-cta">UPLOAD YOUR FIRST GAME ↗</a>
    </div>

  {:else}
    <!-- PENDING SECTION -->
    {#if pending.length > 0}
      <section class="game-section">
        <div class="section-header">
          <div class="section-eyebrow">// AWAITING ADMIN REVIEW</div>
          <h2 class="section-title">UNDER <span class="yellow">REVIEW</span></h2>
          <p class="section-sub">These games have been submitted and are waiting for approval. You'll be notified once reviewed.</p>
        </div>
        <div class="games-list">
          {#each pending as s}
            {@const cfg = statusConfig.pending}
            <div class="game-card" style="border-color:{cfg.border};background:{cfg.bg}">
              <div class="card-thumb">
                {#if thumbUrl(s)}
                  <img src={thumbUrl(s)} alt={s.title} class="thumb-img" />
                {:else}
                  <div class="thumb-placeholder"><span class="thumb-icon">◌</span></div>
                {/if}
                <div class="status-badge" style="color:{cfg.color};border-color:{cfg.border};box-shadow:0 0 12px {cfg.glow};background:{cfg.bg}">
                  <span class="status-icon">{cfg.icon}</span> {cfg.label}
                </div>
              </div>
              <div class="card-body">
                <div class="card-genre">{(s.genre ?? 'Uncategorised').toUpperCase()}</div>
                <div class="card-title">{s.title}</div>
                <div class="card-meta">
                  <span class="card-url">↗ {s.url}</span>
                </div>
                <p class="card-desc">{s.description}</p>
                <div class="card-notice" style="border-color:{cfg.border};color:{cfg.color}">
                  ◌ &nbsp;Submission is in queue.
                </div>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- APPROVED SECTION -->
    {#if approved.length > 0}
      <section class="game-section">
        <div class="section-header">
          <div class="section-eyebrow">// PUBLISHED</div>
          <h2 class="section-title">LIVE <span class="cyan">GAMES</span></h2>
          <p class="section-sub">These are live in the Vault and available to all players.</p>
        </div>
        <div class="games-list">
          {#each approved as s}
            {@const cfg = statusConfig.approved}
            <div class="game-card" style="border-color:{cfg.border};background:{cfg.bg}">
              <div class="card-thumb">
                {#if thumbUrl(s)}
                  <img src={thumbUrl(s)} alt={s.title} class="thumb-img" />
                {:else}
                  <div class="thumb-placeholder"><span class="thumb-icon" style="color:var(--neon-cyan)">◉</span></div>
                {/if}
                <div class="status-badge" style="color:{cfg.color};border-color:{cfg.border};box-shadow:0 0 12px {cfg.glow};background:{cfg.bg}">
                  <span class="status-icon">{cfg.icon}</span> {cfg.label}
                </div>
              </div>
              <div class="card-body">
                <div class="card-genre">{(s.genre ?? 'Uncategorised').toUpperCase()}</div>
                <div class="card-title">{s.title}</div>
                <div class="card-meta">
                  <a href={s.url} class="card-url card-url--link">↗ VIEW IN VAULT</a>
                </div>
                <p class="card-desc">{s.description}</p>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- ── REJECTED SECTION ── -->
    {#if rejected.length > 0}
      <section class="game-section">
        <div class="section-header">
          <div class="section-eyebrow">// NOT APPROVED</div>
          <h2 class="section-title">REJECTED <span class="pink">SUBMISSIONS</span></h2>
          <p class="section-sub">These submissions were not approved. Review the feedback below and resubmit if you've made changes.</p>
        </div>
        <div class="games-list">
          {#each rejected as s}
            {@const cfg = statusConfig.rejected}
            <div class="game-card" style="border-color:{cfg.border};background:{cfg.bg}">
              <div class="card-thumb">
                {#if thumbUrl(s)}
                  <img src={thumbUrl(s)} alt={s.title} class="thumb-img" />
                {:else}
                  <div class="thumb-placeholder"><span class="thumb-icon" style="color:var(--neon-pink)">✕</span></div>
                {/if}
                <div class="status-badge" style="color:{cfg.color};border-color:{cfg.border};box-shadow:0 0 12px {cfg.glow};background:{cfg.bg}">
                  <span class="status-icon">{cfg.icon}</span> {cfg.label}
                </div>
              </div>
              <div class="card-body">
                <div class="card-genre">{(s.genre ?? 'Uncategorised').toUpperCase()}</div>
                <div class="card-title">{s.title}</div>
                <p class="card-desc">{s.description}</p>
                <div class="card-notice" style="border-color:{cfg.border};color:{cfg.color}">
                  ✕ &nbsp;{s.rejectionReason ?? 'This submission did not meet our content guidelines.'}
                </div>
                <a href="/upload" class="btn-resubmit">RESUBMIT ↗</a>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- UPLOAD MORE CTA -->
    <div class="upload-cta">
      <div class="upload-cta-inner">
        <div>
          <div class="cta-eyebrow">// GOT MORE?</div>
          <div class="cta-title">PUBLISH ANOTHER <span>GAME</span></div>
        </div>
        <a href="/upload" class="btn-upload">UPLOAD ↗</a>
      </div>
    </div>
  {/if}
</main>

<!-- FOOTER -->
<footer>
  <div class="footer-brand">
    <div class="footer-logo">PROG<span>CHAMP</span></div>
    <div class="footer-logo-sub">an @ACMpesuecc project</div>
    <p class="footer-desc">Upload, compete, ascend.</p>
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
      <li><a href="/upload" onclick={(e)=>{e.preventDefault();goTo('/upload',true);}}>Upload a Game</a></li>
      {#if isAdmin}<li><a href="/admin" class="admin-link">Admin Panel</a></li>{/if}
    </ul>
  </div>
  <div>
    <div class="footer-col-title">ProgChamp</div>
    <ul class="footer-links">
      <li><a href="/about">About ACMpesuecc</a></li>
      <li><a href="/dev-portal">Dev Portal</a></li>
      <li><a href="/blog">Blog</a></li>
      <li><a href="/support">Support</a></li>
    </ul>
  </div>
  <div class="footer-bottom">
    <div class="footer-copy">© 2026 PROGCHAMP — AN @ACMpesuecc PROJECT — ALL RIGHTS RESERVED</div>
    <div class="footer-status"><span class="status-dot"></span>ALL SYSTEMS OPERATIONAL</div>
  </div>
</footer>

<!-- LOGIN MODAL -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if showLogin}
  <div class="modal-backdrop" onclick={closeOnBackdrop}>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading">
      <div class="modal-corner tl"></div>
      <div class="modal-corner br"></div>
      <button class="modal-close" onclick={()=>showLogin=false} aria-label="Close">✕</button>
      <div class="modal-eyebrow">// ACCESS TERMINAL</div>
      <h2 class="modal-title" id="modal-heading">LOG<span>IN</span></h2>
      <p class="modal-sub">Enter your credentials to access the vault.</p>
      <form class="login-form" onsubmit={handleLogin}>
        <div class="form-group">
          <label class="form-label" for="login-email">EMAIL ADDRESS</label>
          <input id="login-email" type="email" class="form-input" placeholder="operator@progchamp.gg" bind:value={loginEmail} autocomplete="email" />
        </div>
        <div class="form-group">
          <label class="form-label" for="login-pass">PASSWORD</label>
          <input id="login-pass" type="password" class="form-input" placeholder="••••••••••••" bind:value={loginPassword} autocomplete="current-password" />
        </div>
        {#if loginError}<div class="login-error" role="alert">{loginError}</div>{/if}
        <button type="submit" class="btn-login" disabled={isLoggingIn}>
          {#if isLoggingIn}<span class="loading-dots">CONNECTING<span>.</span><span>.</span><span>.</span></span>{:else}INITIALIZE SESSION{/if}
        </button>
        <div class="login-divider"><span>OR</span></div>
        <a href="/register" class="btn-register">CREATE NEW ACCOUNT</a>
        <div class="login-footer-text"><a href="/forgot-password">FORGOT PASSWORD?</a></div>
      </form>
    </div>
  </div>
{/if}

<style>
  :global(:root){--neon-cyan:#00fff9;--neon-pink:#ff006e;--neon-yellow:#ffe600;--neon-purple:#bf00ff;--dark:#03000a;--dark2:#0a0014;--grid-color:rgba(0,255,249,0.06);--text:#e0e0ff;}
  :global(*,*::before,*::after){box-sizing:border-box;margin:0;padding:0;}
  :global(html){scroll-behavior:smooth;}
  :global(body){background:var(--dark);color:var(--text);font-family:'Oxanium',sans-serif;overflow-x:hidden;cursor:none;}
  :global(body::before){content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px);pointer-events:none;z-index:100;}

  .cursor{width:16px;height:16px;border:2px solid var(--neon-cyan);border-radius:50%;position:fixed;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:transform .12s ease,border-color .3s;mix-blend-mode:screen;}
  .cursor-dot{width:4px;height:4px;background:var(--neon-pink);border-radius:50%;position:fixed;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);}
  .grid-bg{position:fixed;inset:0;background-image:linear-gradient(var(--grid-color) 1px,transparent 1px),linear-gradient(90deg,var(--grid-color) 1px,transparent 1px);background-size:60px 60px;z-index:0;animation:gridPulse 8s ease-in-out infinite;}
  @keyframes gridPulse{0%,100%{opacity:.6}50%{opacity:1}}
  .noise{position:fixed;inset:0;opacity:.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:200px 200px;pointer-events:none;z-index:1;}

  nav{position:fixed;top:0;left:0;right:0;z-index:200;display:flex;align-items:center;gap:22px;padding:14px 48px;border-bottom:1px solid rgba(0,255,249,.15);background:rgba(3,0,10,.92);backdrop-filter:blur(14px);}
  .logo-wrap{display:flex;flex-direction:column;align-items:flex-start;text-decoration:none;flex-shrink:0;gap:2px;margin-right:auto;}
  .logo{font-family:'Bebas Neue',sans-serif;font-size:2.4rem;letter-spacing:.12em;line-height:1;font-style:normal;color:var(--neon-cyan);text-shadow:0 0 20px var(--neon-cyan),0 0 60px rgba(0,255,249,.3);}
  .logo em{font-style:normal;color:var(--neon-pink);text-shadow:0 0 20px var(--neon-pink);}
  .logo-sub{font-family:'Share Tech Mono',monospace;font-size:.8rem;letter-spacing:.15em;color:rgba(0,255,249,.4);text-transform:uppercase;}
  .nav-links{list-style:none;display:flex;gap:6px;}
  .nav-link{font-family:'Share Tech Mono',monospace;font-size:.8rem;letter-spacing:.15em;text-transform:uppercase;color:rgba(224,224,255,.45);text-decoration:none;padding:8px 14px;border:1px solid transparent;transition:all .25s;cursor:none;}
  .nav-link:hover{color:var(--neon-cyan);border-color:rgba(0,255,249,.25);text-shadow:0 0 8px var(--neon-cyan);}
  .nav-link--active{color:var(--neon-pink)!important;border-color:rgba(255,0,110,.3)!important;text-shadow:0 0 8px var(--neon-pink)!important;}
  .nav-link--admin{color:rgba(255,0,110,.6)!important;}
  .nav-cta{font-family:'Share Tech Mono',monospace;font-size:.9rem;letter-spacing:.15em;text-transform:uppercase;background:transparent;color:var(--neon-cyan);border:1px solid var(--neon-cyan);padding:9px 22px;cursor:none;transition:all .3s;clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);text-shadow:0 0 8px var(--neon-cyan);box-shadow:0 0 15px rgba(0,255,249,.15);}
  .nav-cta:hover{background:rgba(0,255,249,.08);box-shadow:0 0 30px rgba(0,255,249,.3);}
  .nav-cta--out{color:rgba(224,224,255,.4);border-color:rgba(224,224,255,.2);text-shadow:none;box-shadow:none;}

  .page-header{position:relative;z-index:10;padding:140px 60px 60px;border-bottom:1px solid rgba(255,0,110,.08);overflow:hidden;}
  .header-orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}
  .header-orb.orb1{width:400px;height:400px;background:rgba(255,0,110,.06);top:-80px;right:5%;}
  .header-orb.orb2{width:300px;height:300px;background:rgba(191,0,255,.06);bottom:-60px;left:10%;}
  .header-inner{position:relative;z-index:2;max-width:800px;margin:0 auto;text-align:center;}
  .header-eyebrow{font-family:'Share Tech Mono',monospace;font-size:.8rem;letter-spacing:.35em;text-transform:uppercase;color:var(--neon-pink);text-shadow:0 0 10px var(--neon-pink);margin-bottom:16px;}
  .header-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(3.5rem,8vw,9rem);letter-spacing:.04em;line-height:.95;margin-bottom:20px;}
  .header-title span{color:var(--neon-pink);text-shadow:0 0 30px var(--neon-pink);}
  .header-sub{font-family:'Share Tech Mono',monospace;font-size:.78rem;color:rgba(224,224,255,.4);letter-spacing:.08em;line-height:1.8;margin:0 auto;max-width:500px;}

  /* ════ PAGE MAIN ════ */
  .page-main{position:relative;z-index:10;padding:60px;max-width:1100px;margin:0 auto;}

  /* ════ EMPTY STATE ════ */
  .empty-state{text-align:center;padding:100px 20px;display:flex;flex-direction:column;align-items:center;gap:16px;}
  .empty-icon{font-size:4rem;color:rgba(0,255,249,.15);}
  .empty-title{font-family:'Bebas Neue',sans-serif;font-size:2.5rem;letter-spacing:.1em;color:rgba(224,224,255,.3);}
  .empty-sub{font-family:'Share Tech Mono',monospace;font-size:.9rem;letter-spacing:.1em;color:rgba(224,224,255,.2);margin-bottom:8px;}
  .btn-cta{font-family:'Share Tech Mono',monospace;font-size:.9rem;letter-spacing:.2em;text-transform:uppercase;background:transparent;color:var(--neon-cyan);border:1px solid var(--neon-cyan);padding:14px 32px;cursor:none;transition:all .3s;text-decoration:none;display:inline-block;clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);text-shadow:0 0 8px var(--neon-cyan);box-shadow:0 0 20px rgba(0,255,249,.15);margin-top:8px;}
  .btn-cta:hover{background:rgba(0,255,249,.08);box-shadow:0 0 40px rgba(0,255,249,.35);}

  /* ════ SECTIONS ════ */
  .game-section{margin-bottom:60px;}
  .section-header{margin-bottom:28px;}
  .section-eyebrow{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.3em;text-transform:uppercase;color:rgba(224,224,255,.35);margin-bottom:8px;}
  .section-title{font-family:'Bebas Neue',sans-serif;font-size:2.4rem;letter-spacing:.05em;margin-bottom:8px;}
  .section-title .cyan{color:var(--neon-cyan);text-shadow:0 0 20px var(--neon-cyan);}
  .section-title .yellow{color:var(--neon-yellow);text-shadow:0 0 20px var(--neon-yellow);}
  .section-title .pink{color:var(--neon-pink);text-shadow:0 0 20px var(--neon-pink);}
  .section-sub{font-family:'Share Tech Mono',monospace;font-size:.68rem;letter-spacing:.06em;color:rgba(224,224,255,.3);line-height:1.7;max-width:600px;}

  /* ════ GAME CARDS (horizontal list layout) ════ */
  .games-list{display:flex;flex-direction:column;gap:16px;}

  .game-card{display:grid;grid-template-columns:220px 1fr;border:1px solid;overflow:hidden;clip-path:polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);transition:transform .3s,box-shadow .3s;}
  .game-card:hover{transform:translateY(-2px);box-shadow:0 8px 40px rgba(0,0,0,.4);}

  .card-thumb{position:relative;aspect-ratio:16/9;overflow:hidden;}
  .thumb-img{width:100%;height:100%;object-fit:cover;}
  .thumb-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(10,0,20,.8);}
  .thumb-icon{font-size:2.5rem;opacity:.5;}

  .status-badge{position:absolute;bottom:10px;left:10px;font-family:'Share Tech Mono',monospace;font-size:.55rem;letter-spacing:.15em;text-transform:uppercase;border:1px solid;padding:4px 10px;display:flex;align-items:center;gap:6px;backdrop-filter:blur(4px);clip-path:polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%);}
  .status-icon{font-size:.8rem;}

  .card-body{padding:20px 24px;display:flex;flex-direction:column;gap:8px;}
  .card-genre{font-family:'Share Tech Mono',monospace;font-size:.55rem;letter-spacing:.2em;color:var(--neon-purple);text-shadow:0 0 6px var(--neon-purple);}
  .card-title{font-family:'Bebas Neue',sans-serif;font-size:1.8rem;letter-spacing:.05em;line-height:1;}
  .card-meta{display:flex;align-items:center;gap:16px;}
  .card-url{font-family:'Share Tech Mono',monospace;font-size:.62rem;letter-spacing:.08em;color:rgba(224,224,255,.3);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:300px;}
  .card-url--link{color:var(--neon-cyan);transition:text-shadow .2s;}
  .card-url--link:hover{text-shadow:0 0 8px var(--neon-cyan);}
  .card-desc{font-family:'Share Tech Mono',monospace;font-size:.8rem;letter-spacing:.04em;color:rgba(224,224,255,.3);line-height:1.7;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;  line-clamp: 2;
; overflow:hidden;}

  .card-notice{font-family:'Share Tech Mono',monospace;font-size:.62rem;letter-spacing:.1em;line-height:1.6;border-left:2px solid;padding:8px 12px;margin-top:4px;background:rgba(0,0,0,.2);}

  .btn-resubmit{font-family:'Share Tech Mono',monospace;font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;background:transparent;color:var(--neon-pink);border:1px solid rgba(255,0,110,.4);padding:8px 20px;cursor:none;transition:all .3s;text-decoration:none;display:inline-block;clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);text-shadow:0 0 8px var(--neon-pink);margin-top:4px;align-self:flex-start;}
  .btn-resubmit:hover{background:rgba(255,0,110,.08);box-shadow:0 0 20px rgba(255,0,110,.2);}

  /* ════ UPLOAD MORE CTA ════ */
  .upload-cta{margin-top:40px;}
  .upload-cta-inner{display:flex;align-items:center;justify-content:space-between;gap:40px;border:1px solid rgba(255,230,0,.2);padding:40px 50px;background:rgba(255,230,0,.02);clip-path:polygon(16px 0%,100% 0%,calc(100% - 16px) 100%,0% 100%);}
  .cta-eyebrow{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.3em;text-transform:uppercase;color:var(--neon-yellow);text-shadow:0 0 8px var(--neon-yellow);margin-bottom:8px;}
  .cta-title{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:.05em;}
  .cta-title span{color:var(--neon-yellow);text-shadow:0 0 20px var(--neon-yellow);}
  .btn-upload{font-family:'Share Tech Mono',monospace;font-size:.9rem;letter-spacing:.15em;text-transform:uppercase;background:transparent;color:var(--neon-yellow);border:1px solid var(--neon-yellow);padding:16px 36px;cursor:none;transition:all .3s;flex-shrink:0;text-decoration:none;display:inline-block;clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);text-shadow:0 0 10px var(--neon-yellow);box-shadow:0 0 20px rgba(255,230,0,.15);}
  .btn-upload:hover{background:rgba(255,230,0,.08);box-shadow:0 0 40px rgba(255,230,0,.35);transform:translateY(-2px);}

  /* ════ FOOTER ════ */
  footer{position:relative;z-index:10;padding:60px;border-top:1px solid rgba(0,255,249,.1);display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:60px;background:rgba(3,0,10,.95);}
  .footer-logo{font-family:'Bebas Neue',sans-serif;font-size:3.2rem;color:var(--neon-cyan);text-shadow:0 0 20px var(--neon-cyan);margin-bottom:4px;}
  .footer-logo span{color:var(--neon-pink);text-shadow:0 0 20px var(--neon-pink);}
  .footer-logo-sub{font-family:'Share Tech Mono',monospace;font-size:.72rem;color:rgba(0,255,249,.4);letter-spacing:.12em;margin-bottom:14px;}
  .footer-desc{font-family:'Share Tech Mono',monospace;font-size:.9rem;line-height:1.8;color:rgba(224,224,255,.3);letter-spacing:.05em;}
  .footer-col-title{font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:.1em;color:rgba(224,224,255,.5);margin-bottom:20px;}
  .footer-links{list-style:none;display:flex;flex-direction:column;gap:12px;}
  .footer-links a{font-family:'Share Tech Mono',monospace;font-size:.8rem;letter-spacing:.1em;color:rgba(224,224,255,.3);text-decoration:none;text-transform:uppercase;transition:color .2s;cursor:none;}
  .footer-links a:hover{color:var(--neon-cyan);text-shadow:0 0 8px var(--neon-cyan);}
  .admin-link{color:rgba(255,0,110,.5)!important;}
  .admin-link:hover{color:var(--neon-pink)!important;text-shadow:0 0 8px var(--neon-pink)!important;}
  .footer-bottom{grid-column:1/-1;padding-top:30px;border-top:1px solid rgba(255,255,255,.05);display:flex;justify-content:space-between;align-items:center;}
  .footer-copy{font-family:'Share Tech Mono',monospace;font-size:.6rem;color:rgba(224,224,255,.2);letter-spacing:.12em;}
  .footer-status{display:flex;align-items:center;gap:8px;font-family:'Share Tech Mono',monospace;font-size:.6rem;color:rgba(0,255,249,.5);letter-spacing:.1em;}
  .status-dot{width:6px;height:6px;border-radius:50%;background:var(--neon-cyan);box-shadow:0 0 6px var(--neon-cyan);animation:pulse 2s infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

  /* ════ MODAL ════ */
  .modal-backdrop{position:fixed;inset:0;z-index:1000;background:rgba(3,0,10,.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease;}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .modal{position:relative;width:460px;background:var(--dark2);border:1px solid rgba(0,255,249,.2);padding:50px 44px;box-shadow:0 0 60px rgba(0,255,249,.08),0 0 120px rgba(191,0,255,.06);animation:modalIn .3s ease;clip-path:polygon(16px 0%,100% 0%,calc(100% - 16px) 100%,0% 100%);}
  @keyframes modalIn{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:none}}
  .modal-corner{position:absolute;width:24px;height:24px;}
  .modal-corner.tl{top:10px;left:10px;border-top:2px solid var(--neon-cyan);border-left:2px solid var(--neon-cyan);}
  .modal-corner.br{bottom:10px;right:10px;border-bottom:2px solid var(--neon-cyan);border-right:2px solid var(--neon-cyan);}
  .modal-close{position:absolute;top:16px;right:20px;background:transparent;border:none;color:rgba(224,224,255,.3);font-size:1rem;cursor:none;transition:color .2s;font-family:'Share Tech Mono',monospace;}
  .modal-close:hover{color:var(--neon-pink);text-shadow:0 0 10px var(--neon-pink);}
  .modal-eyebrow{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.3em;text-transform:uppercase;color:var(--neon-cyan);text-shadow:0 0 8px var(--neon-cyan);margin-bottom:10px;}
  .modal-title{font-family:'Bebas Neue',sans-serif;font-size:4rem;line-height:1;letter-spacing:.05em;margin-bottom:10px;}
  .modal-title span{color:var(--neon-pink);text-shadow:0 0 20px var(--neon-pink);}
  .modal-sub{font-family:'Share Tech Mono',monospace;font-size:.9rem;color:rgba(224,224,255,.35);letter-spacing:.08em;margin-bottom:36px;line-height:1.6;}
  .login-form{display:flex;flex-direction:column;gap:20px;}
  .form-group{display:flex;flex-direction:column;gap:8px;}
  .form-label{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(0,255,249,.6);}
  .form-input{background:rgba(0,255,249,.03);border:1px solid rgba(0,255,249,.15);color:var(--text);font-family:'Share Tech Mono',monospace;font-size:.9rem;letter-spacing:.08em;padding:12px 16px;outline:none;transition:border-color .3s,box-shadow .3s;clip-path:polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%);width:100%;}
  .form-input:focus{border-color:var(--neon-cyan);box-shadow:0 0 15px rgba(0,255,249,.1);}
  .form-input::placeholder{color:rgba(224,224,255,.2);}
  .login-error{font-family:'Share Tech Mono',monospace;font-size:.8rem;letter-spacing:.15em;color:var(--neon-pink);text-shadow:0 0 8px var(--neon-pink);text-align:center;padding:8px;border:1px solid rgba(255,0,110,.3);background:rgba(255,0,110,.05);}
  .btn-login{font-family:'Share Tech Mono',monospace;font-size:.9rem;letter-spacing:.15em;text-transform:uppercase;background:var(--neon-cyan);color:var(--dark);border:none;padding:16px;cursor:none;font-weight:bold;transition:all .3s;clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);box-shadow:0 0 30px rgba(0,255,249,.4);}
  .btn-login:hover:not(:disabled){box-shadow:0 0 50px rgba(0,255,249,.7);transform:translateY(-1px);}
  .btn-login:disabled{opacity:.7;}
  .loading-dots span{animation:dotBlink 1.2s infinite;display:inline-block;}
  .loading-dots span:nth-child(2){animation-delay:.2s;}
  .loading-dots span:nth-child(3){animation-delay:.4s;}
  @keyframes dotBlink{0%,80%,100%{opacity:0}40%{opacity:1}}
  .login-divider{display:flex;align-items:center;gap:16px;font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.2em;color:rgba(224,224,255,.2);}
  .login-divider::before,.login-divider::after{content:'';flex:1;height:1px;background:rgba(224,224,255,.08);}
  .btn-register{font-family:'Share Tech Mono',monospace;font-size:.9rem;letter-spacing:.15em;text-transform:uppercase;background:transparent;color:var(--neon-purple);border:1px solid rgba(191,0,255,.4);padding:14px;cursor:none;transition:all .3s;text-decoration:none;text-align:center;display:block;clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);text-shadow:0 0 8px var(--neon-purple);}
  .btn-register:hover{background:rgba(191,0,255,.08);border-color:var(--neon-purple);box-shadow:0 0 20px rgba(191,0,255,.2);}
  .login-footer-text{text-align:center;}
  .login-footer-text a{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.15em;text-transform:uppercase;color:rgba(224,224,255,.25);text-decoration:none;transition:color .2s;}
  .login-footer-text a:hover{color:var(--neon-cyan);text-shadow:0 0 8px var(--neon-cyan);}
</style>