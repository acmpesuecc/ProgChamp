<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { submissions } from '../../lib/stores/submissions';

  // ─────────────────────────────────────────────
  // AUTH — swap with your real auth store
  // ─────────────────────────────────────────────
  let isLoggedIn = true;
  let isAdmin    = false;

  $: session = $page.data.session;
  $: user    = session?.user;

  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────
  let showLogin     = false;
  let loginEmail    = '';
  let loginPassword = '';
  let loginError    = '';
  let isLoggingIn   = false;

  let title       = '';
  let description = '';
  let url         = '';
  let genre       = '';
  let thumbnail: File | null = null;
  let preview: string | null = null;
  let isDragging  = false;
  let isSubmitting = false;
  let submitted   = false;

  let cursorEl: HTMLElement;
  let dotEl: HTMLElement;
  let dropzone: HTMLElement;

  const genres = ['Action RPG', 'Shooter', 'Racing', 'Strategy', 'Arcade', 'Space Sim', 'Survival', 'Horror', 'Fighting', 'Puzzle'];

  // ─────────────────────────────────────────────
  // FILE HANDLING
  // ─────────────────────────────────────────────
  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    thumbnail = file;
    preview   = URL.createObjectURL(file);
  }

  function handleInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) handleFile(input.files[0]);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: DragEvent) { e.preventDefault(); isDragging = true; }
  function handleDragLeave() { isDragging = false; }

  // ─────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────
  async function handleSubmit() {
    if (!title || !description || !url || !thumbnail) return;
    isSubmitting = true;

    await new Promise(r => setTimeout(r, 1400)); // simulate upload

    submissions.update(list => [
      ...list,
      {
        id:          crypto.randomUUID(),
        title,
        description,
        url,
        genre,
        thumbnail,
        status:      'pending',
        dev:         user?.name ?? 'Anonymous',
      }
    ]);

    isSubmitting = false;
    submitted    = true;

    // reset after 3s
    setTimeout(() => {
      submitted   = false;
      title       = description = url = genre = '';
      thumbnail   = preview = null;
    }, 3000);
  }

  // ─────────────────────────────────────────────
  // LOGIN (same as home page)
  // ─────────────────────────────────────────────
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
      isLoggedIn = true;
      showLogin  = false;
      loginEmail = loginPassword = '';
    } catch (err: any) {
      loginError = err.message || 'LOGIN FAILED';
    } finally {
      isLoggingIn = false;
    }
  }

  function logout() { isLoggedIn = isAdmin = false; }
  function closeOnBackdrop(e: MouseEvent) { if (e.target === e.currentTarget) showLogin = false; }

  // ─────────────────────────────────────────────
  // CURSOR (identical to home page)
  // ─────────────────────────────────────────────
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
      el.addEventListener('mouseenter', () => { if (cursorEl) { cursorEl.style.transform = 'translate(-50%,-50%) scale(2)'; cursorEl.style.borderColor = 'var(--neon-pink)'; } });
      el.addEventListener('mouseleave', () => { if (cursorEl) { cursorEl.style.transform = 'translate(-50%,-50%) scale(1)'; cursorEl.style.borderColor = 'var(--neon-cyan)'; } });
    };
    document.querySelectorAll('button, a, .form-input, .dropzone, select').forEach(addHover);

    return () => document.removeEventListener('mousemove', onMove);
  });
</script>

<svelte:head>
  <title>UPLOAD // PROGCHAMP</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Oxanium:wght@300;400;600;800&display=swap" rel="stylesheet" />
</svelte:head>

<!-- ── CURSOR ── -->
<div class="cursor"     bind:this={cursorEl}></div>
<div class="cursor-dot" bind:this={dotEl}></div>

<!-- ── BACKGROUND ── -->
<div class="grid-bg"></div>
<div class="noise"></div>

<!-- ════════════════════════════════════════
     NAV (identical to home page)
════════════════════════════════════════ -->
<nav>
  <a href="/" class="logo-wrap">
    <span class="logo">PROG<em>CHAMP</em></span>
    <span class="logo-sub">an @ACMpesuecc project</span>
  </a>

  <ul class="nav-links">
    <li><a href="/games" class="nav-link">ALL GAMES</a></li>
    <li><a href="/my-games" class="nav-link"
        on:click|preventDefault={() => goTo('/my-games', true)}>MY GAMES</a></li>
    <li><a href="/upload" class="nav-link nav-link--active">UPLOAD</a></li>
    {#if isAdmin}
      <li><a href="/admin" class="nav-link nav-link--admin">ADMIN</a></li>
    {/if}
  </ul>

  {#if isLoggedIn}
    <button class="nav-cta nav-cta--out" on:click={logout}>LOG OUT</button>
  {:else}
    <button class="nav-cta" on:click={() => showLogin = true}>LOGIN</button>
  {/if}
</nav>

<!-- ════════════════════════════════════════
     PAGE HEADER
════════════════════════════════════════ -->
<header class="page-header">
  <div class="header-orb orb1"></div>
  <div class="header-orb orb2"></div>
  <div class="header-inner">
    <div class="header-eyebrow">// DEVELOPER TERMINAL</div>
    <h1 class="header-title">UPLOAD YOUR <span>GAME</span></h1>
    <p class="header-sub">Submit your build for review. Once approved, it goes live in the Vault.</p>
  </div>
</header>

<!-- ════════════════════════════════════════
     UPLOAD FORM
════════════════════════════════════════ -->
<main class="upload-main">
  <div class="upload-grid">

    <!-- ── LEFT: FORM ── -->
    <div class="form-panel">
      <div class="panel-corner tl"></div>
      <div class="panel-corner br"></div>

      <div class="panel-eyebrow">// GAME DETAILS</div>

      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <form on:submit|preventDefault={handleSubmit} class="upload-form">

        <!-- TITLE -->
        <div class="form-group">
          <label class="form-label" for="title">GAME TITLE</label>
          <input
            id="title"
            class="form-input"
            placeholder="e.g. VOID SYNDICATE"
            bind:value={title}
            required
          />
        </div>

        <!-- GENRE -->
        <div class="form-group">
          <label class="form-label" for="genre">GENRE</label>
          <select id="genre" class="form-input form-select" bind:value={genre}>
            <option value="" disabled selected>SELECT A GENRE...</option>
            {#each genres as g}
              <option value={g}>{g.toUpperCase()}</option>
            {/each}
          </select>
        </div>

        <!-- DESCRIPTION -->
        <div class="form-group">
          <label class="form-label" for="description">DESCRIPTION</label>
          <textarea
            id="description"
            class="form-input form-textarea"
            placeholder="Describe your game — genre, mechanics, what makes it worth playing..."
            bind:value={description}
            rows="5"
            required
          ></textarea>
        </div>

        <!-- GAME URL -->
        <div class="form-group">
          <label class="form-label" for="url">GAME URL</label>
          <div class="input-with-prefix">
            <span class="input-prefix">https://</span>
            <input
              id="url"
              class="form-input input-prefixed"
              placeholder="yourgame.itch.io"
              bind:value={url}
              required
            />
          </div>
        </div>

        <!-- SUBMIT -->
        <button
          type="submit"
          class="btn-submit"
          disabled={isSubmitting || submitted || !title || !description || !url || !thumbnail}
        >
          {#if submitted}
            <span class="success-text">✓ SUBMITTED FOR REVIEW</span>
          {:else if isSubmitting}
            <span class="loading-dots">UPLOADING<span>.</span><span>.</span><span>.</span></span>
          {:else}
            SUBMIT GAME ↗
          {/if}
        </button>

        {#if submitted}
          <p class="submit-note">Your game has been queued for review. You'll hear back within 48 hours.</p>
        {/if}

      </form>
    </div>

    <!-- ── RIGHT: THUMBNAIL ── -->
    <div class="thumb-panel">
      <div class="panel-corner tl"></div>
      <div class="panel-corner br"></div>
      <div class="panel-eyebrow">// THUMBNAIL</div>

      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="dropzone"
        class:dragover={isDragging}
        class:has-preview={!!preview}
        bind:this={dropzone}
        on:drop={handleDrop}
        on:dragover={handleDragOver}
        on:dragleave={handleDragLeave}
      >
        {#if preview}
          <img src={preview} alt="Thumbnail preview" class="thumb-preview" />
          <div class="thumb-overlay">
            <label class="thumb-change-btn" for="file-input">CHANGE IMAGE</label>
          </div>
        {:else}
          <div class="dropzone-content">
            <div class="drop-icon">⊞</div>
            <div class="drop-label">DROP IMAGE HERE</div>
            <div class="drop-sub">or click to browse</div>
            <div class="drop-hint">PNG, JPG, WEBP · Max 5MB</div>
          </div>
        {/if}
        <label for="file-input" class="dropzone-label" aria-label="Upload thumbnail"></label>
        <input
          id="file-input"
          type="file"
          accept="image/*"
          class="file-input-hidden"
          on:change={handleInputChange}
        />
      </div>

      <!-- TIPS -->
      <div class="tips-block">
        <div class="tips-title">// SUBMISSION TIPS</div>
        <ul class="tips-list">
          <li>Thumbnail should be 16:9, at least 800×450px</li>
          <li>URL must point to a playable, public build</li>
          <li>All games are reviewed within 48 hours</li>
          <li>Adult content or hate speech = instant reject</li>
        </ul>
      </div>
    </div>

  </div>
</main>

<!-- ════════════════════════════════════════
     FOOTER (matching home page)
════════════════════════════════════════ -->
<footer>
  <div class="footer-brand">
    <div class="footer-logo">PROG<span>CHAMP</span></div>
    <div class="footer-logo-sub">an @ACMpesuecc project</div>
    <p class="footer-desc">The premier cyberpunk game hosting platform. We live in the grid so you can play without limits. Upload, compete, ascend.</p>
  </div>

  <div>
    <div class="footer-col-title">Vault</div>
    <ul class="footer-links">
      <li><a href="/games?sort=new">New Releases</a></li>
      <li><a href="/games?sort=top">Top Rated</a></li>
      <li><a href="/games?filter=free">Free to Play</a></li>
      <li><a href="/games?filter=upcoming">Coming Soon</a></li>
    </ul>
  </div>

  <div>
    <div class="footer-col-title">Your Space</div>
    <ul class="footer-links">
      <li><a href="/games">Browse All Games</a></li>
      <li><a href="/my-games" on:click|preventDefault={() => goTo('/my-games', true)}>My Games</a></li>
      <li><a href="/upload">Upload a Game</a></li>
      {#if isAdmin}
        <li><a href="/admin" class="admin-link">Admin Panel</a></li>
      {/if}
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

<!-- ════════════════════════════════════════
     LOGIN MODAL (identical to home page)
════════════════════════════════════════ -->
{#if showLogin}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-backdrop" on:click={closeOnBackdrop}>
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading">
      <div class="modal-corner tl"></div>
      <div class="modal-corner br"></div>

      <button class="modal-close" on:click={() => showLogin = false} aria-label="Close">✕</button>

      <div class="modal-eyebrow">// ACCESS TERMINAL</div>
      <h2 class="modal-title" id="modal-heading">LOG<span>IN</span></h2>
      <p class="modal-sub">Enter your credentials to access the vault.</p>

      <form class="login-form" on:submit={handleLogin}>
        <div class="form-group">
          <label class="form-label" for="login-email">EMAIL ADDRESS</label>
          <input id="login-email" type="email" class="form-input"
            placeholder="operator@progchamp.gg" bind:value={loginEmail} autocomplete="email" />
        </div>
        <div class="form-group">
          <label class="form-label" for="login-pass">PASSWORD</label>
          <input id="login-pass" type="password" class="form-input"
            placeholder="••••••••••••" bind:value={loginPassword} autocomplete="current-password" />
        </div>

        {#if loginError}
          <div class="login-error" role="alert">{loginError}</div>
        {/if}

        <button type="submit" class="btn-login" disabled={isLoggingIn}>
          {#if isLoggingIn}
            <span class="loading-dots">CONNECTING<span>.</span><span>.</span><span>.</span></span>
          {:else}
            INITIALIZE SESSION
          {/if}
        </button>

        <div class="login-divider"><span>OR</span></div>
        <a href="/register" class="btn-register">CREATE NEW ACCOUNT</a>
        <div class="login-footer-text">
          <a href="/forgot-password">FORGOT PASSWORD?</a>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  /* ── CSS VARIABLES ── */
  :global(:root) {
    --hot-orange:  #ff6600;
    --neon-lavender: #bf5fff;
    --neon-green: #00ff88;
    --electric-blue: #0088ff;
    --neon-cyan:   #00fff9;
    --neon-pink:   #ff006e;
    --neon-yellow: #ffe600;
    --neon-purple: #bf00ff;
    --dark:        #03000a;
    --dark2:       #0a0014;
    --grid-color:  rgba(0,255,249,0.06);
    --text:        #e0e0ff;
  }
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(html) { scroll-behavior: smooth; }
  :global(body) {
    background: var(--dark);
    color: var(--text);
    font-family: 'Oxanium', sans-serif;
    overflow-x: hidden;
    cursor: none;
  }
  :global(body::before) {
    content: '';
    position: fixed; inset: 0;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px
    );
    pointer-events: none;
    z-index: 100;
  }

  /* ── CURSOR ── */
  .cursor {
    width: 16px; height: 16px;
    border: 2px solid var(--neon-cyan); border-radius: 50%;
    position: fixed; pointer-events: none; z-index: 9999;
    transform: translate(-50%,-50%);
    transition: transform .12s ease, border-color .3s;
    mix-blend-mode: screen;
  }
  .cursor-dot {
    width: 4px; height: 4px; background: var(--neon-pink); border-radius: 50%;
    position: fixed; pointer-events: none; z-index: 9999;
    transform: translate(-50%,-50%);
  }

  /* ── BACKGROUND ── */
  .grid-bg {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(var(--grid-color) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
    background-size: 60px 60px;
    z-index: 0; animation: gridPulse 8s ease-in-out infinite;
  }
  @keyframes gridPulse { 0%,100% { opacity:.6 } 50% { opacity:1 } }
  .noise {
    position: fixed; inset: 0; opacity: .03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 200px 200px; pointer-events: none; z-index: 1;
  }

  /* ════════════ NAV ════════════ */
  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    display: flex; align-items: center; gap: 22px;
    padding: 14px 48px;
    border-bottom: 1px solid rgba(0,255,249,.15);
    background: rgba(3,0,10,.92);
    backdrop-filter: blur(14px);
  }
  .logo-wrap {
    display: flex; flex-direction: column; align-items: flex-start;
    text-decoration: none; flex-shrink: 0; gap: 2px; margin-right: auto;
  }
  .logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 2.4rem; letter-spacing: .12em; line-height: 1; font-style: normal;
    color: var(--neon-cyan);
    text-shadow: 0 0 20px var(--neon-cyan), 0 0 60px rgba(0,255,249,.3);
  }
  .logo em {
    font-style: normal;
    color: var(--neon-pink);
    text-shadow: 0 0 20px var(--neon-pink), 0 0 60px rgba(255,0,110,.3);
  }
  .logo-sub {
    font-family: 'Share Tech Mono', monospace;
    font-size: .8rem; letter-spacing: .15em; color: rgba(0,255,249,.4);
    text-transform: uppercase;
  }
  .nav-links { list-style: none; display: flex; gap: 6px; }
  .nav-link {
    font-family: 'Share Tech Mono', monospace;
    font-size: .65rem; letter-spacing: .15em; text-transform: uppercase;
    color: rgba(224,224,255,.45); text-decoration: none;
    padding: 8px 14px; border: 1px solid transparent;
    transition: all .25s; cursor: none;
  }
  .nav-link:hover { color: var(--neon-cyan); border-color: rgba(0,255,249,.25); text-shadow: 0 0 8px var(--neon-cyan); }
  .nav-link--active { color: var(--neon-lavender) !important; border-color: rgba(255,230,0,.3) !important; text-shadow: 0 0 8px var(--neon-lavender) !important; }
  .nav-link--admin { color: rgba(255,0,110,.6) !important; }
  .nav-cta {
    font-family: 'Share Tech Mono', monospace; font-size: .9rem; letter-spacing: .15em;
    text-transform: uppercase; background: transparent;
    color: var(--neon-cyan); border: 1px solid var(--neon-cyan);
    padding: 9px 22px; cursor: none; transition: all .3s;
    clip-path: polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);
    text-shadow: 0 0 8px var(--neon-cyan); box-shadow: 0 0 15px rgba(0,255,249,.15);
  }
  .nav-cta:hover { background: rgba(0,255,249,.08); box-shadow: 0 0 30px rgba(0,255,249,.3); }
  .nav-cta--out { color: rgba(224,224,255,.4); border-color: rgba(224,224,255,.2); text-shadow: none; box-shadow: none; }

  /* ════════════ PAGE HEADER ════════════ */
  .page-header {
    position: relative; z-index: 10;
    padding: 160px 60px 80px;
    border-bottom: 1px solid rgba(0,255,249,.08);
    background: radial-gradient(ellipse at 30% 50%, rgba(191,0,255,.07) 0%, transparent 60%);
    overflow: hidden;
  }
  .header-orb {
    position: absolute; border-radius: 50%;
    filter: blur(80px); pointer-events: none;
  }
  .header-orb.orb1 { width: 400px; height: 400px; background: rgba(191,0,255,.12); top: -100px; left: -80px; }
  .header-orb.orb2 { width: 300px; height: 300px; background: rgba(0,255,249,.08); bottom: -50px; right: 10%; }
  .header-inner { position: relative; z-index: 2; max-width: 800px; }
  .header-eyebrow {
    font-family: 'Share Tech Mono', monospace;
    font-size: .65rem; letter-spacing: .35em; text-transform: uppercase;
    color: var(--neon-lavender); text-shadow: 0 0 10px var(--neon-lavender);
    margin-bottom: 16px;
  }
  .header-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(3.5rem, 8vw, 9rem); letter-spacing: .04em; line-height: .95;
    margin-bottom: 20px;
  }
  .header-title span { color: var(--neon-lavender); text-shadow: 0 0 30px var(--neon-lavender); }
  .header-sub {
    font-family: 'Share Tech Mono', monospace;
    font-size: .78rem; color: rgba(224,224,255,.4);
    letter-spacing: .08em; line-height: 1.8; max-width: 500px;
  }

  /* ════════════ MAIN LAYOUT ════════════ */
  .upload-main {
    position: relative; z-index: 10;
    padding: 60px;
    min-height: 60vh;
  }
  .upload-grid {
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 40px;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* ════════════ PANELS ════════════ */
  .form-panel,
  .thumb-panel {
    position: relative;
    background: rgba(10,0,20,.6);
    border: 1px solid rgba(0,255,249,.12);
    padding: 40px;
    backdrop-filter: blur(8px);
    clip-path: polygon(16px 0%, 100% 0%, calc(100% - 16px) 100%, 0% 100%);
  }
  .panel-corner {
    position: absolute; width: 20px; height: 20px;
  }
  .panel-corner.tl { top: 12px; left: 12px; border-top: 2px solid var(--neon-cyan); border-left: 2px solid var(--neon-cyan); }
  .panel-corner.br { bottom: 12px; right: 12px; border-bottom: 2px solid var(--neon-cyan); border-right: 2px solid var(--neon-cyan); }
  .panel-eyebrow {
    font-family: 'Share Tech Mono', monospace;
    font-size: .8rem; letter-spacing: .3em; text-transform: uppercase;
    color: var(--neon-cyan); text-shadow: 0 0 8px var(--neon-cyan);
    margin-bottom: 28px;
  }

  /* ════════════ FORM ════════════ */
  .upload-form { display: flex; flex-direction: column; gap: 24px; }
  .form-group  { display: flex; flex-direction: column; gap: 8px; }
  .form-label  {
    font-family: 'Share Tech Mono', monospace;
    font-size: .8rem; letter-spacing: .2em; text-transform: uppercase;
    color: rgba(0,255,249,.6);
  }
  .form-input {
    background: rgba(0,255,249,.03); border: 1px solid rgba(0,255,249,.15);
    color: var(--text); font-family: 'Share Tech Mono', monospace;
    font-size: .8rem; letter-spacing: .06em;
    padding: 12px 16px; outline: none;
    transition: border-color .3s, box-shadow .3s;
    clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
    width: 100%;
  }
  .form-input:focus { border-color: var(--neon-cyan); box-shadow: 0 0 15px rgba(0,255,249,.1); }
  .form-input::placeholder { color: rgba(224,224,255,.2); }

  .form-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2300fff9'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    cursor: none;
  }
  .form-select option { background: #0a0014; color: var(--text); }

  .form-textarea { resize: vertical; min-height: 120px; font-family: 'Share Tech Mono', monospace; line-height: 1.6; }

  .input-with-prefix { display: flex; align-items: stretch; }
  .input-prefix {
    font-family: 'Share Tech Mono', monospace;
    font-size: .9rem; letter-spacing: .05em;
    background: rgba(0,255,249,.06);
    border: 1px solid rgba(0,255,249,.15); border-right: none;
    color: rgba(0,255,249,.5); padding: 12px 14px;
    display: flex; align-items: center; flex-shrink: 0;
    clip-path: polygon(6px 0%, 100% 0%, 100% 100%, 0% 100%);
  }
  .input-prefixed {
    clip-path: polygon(0% 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
    border-left: none;
  }

  .btn-submit {
    font-family: 'Share Tech Mono', monospace;
    font-size: .8rem; letter-spacing: .2em; text-transform: uppercase;
    background: transparent; color: var(--neon-lavender);
    border: 1px solid var(--neon-lavender);
    padding: 18px 32px; cursor: none;
    transition: all .3s; margin-top: 8px;
    clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
    text-shadow: 0 0 10px var(--neon-lavender);
    box-shadow: 0 0 20px rgba(255,230,0,.15);
  }
  .btn-submit:hover:not(:disabled) {
    background: rgba(255,230,0,.08);
    box-shadow: 0 0 40px rgba(255,230,0,.4);
    transform: translateY(-2px);
  }
  .btn-submit:disabled { opacity: .4; cursor: not-allowed; }
  .success-text { color: var(--neon-cyan); text-shadow: 0 0 10px var(--neon-cyan); }

  .submit-note {
    font-family: 'Share Tech Mono', monospace;
    font-size: .65rem; letter-spacing: .1em;
    color: rgba(0,255,249,.5); text-align: center; line-height: 1.6;
  }

  /* ════════════ DROPZONE ════════════ */
  .dropzone {
    position: relative;
    border: 1px dashed rgba(0,255,249,.25);
    min-height: 240px;
    display: flex; align-items: center; justify-content: center;
    transition: border-color .3s, background .3s;
    cursor: none; overflow: hidden;
    clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
  }
  .dropzone.dragover {
    border-color: var(--neon-cyan);
    background: rgba(0,255,249,.05);
    box-shadow: 0 0 30px rgba(0,255,249,.1) inset;
  }
  .dropzone.has-preview { border-style: solid; border-color: rgba(0,255,249,.2); }
  .dropzone:hover { border-color: rgba(0,255,249,.5); }

  .dropzone-label {
    position: absolute; inset: 0; cursor: none; z-index: 1;
  }
  .file-input-hidden {
    position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none;
  }

  .dropzone-content {
    text-align: center; pointer-events: none; padding: 20px;
  }
  .drop-icon {
    font-size: 3.5rem; color: rgba(0,255,249,.25);
    margin-bottom: 12px; display: block; line-height: 1;
    transition: color .3s;
  }
  .dropzone:hover .drop-icon { color: rgba(0,255,249,.5); }
  .dragover .drop-icon { color: var(--neon-cyan); }

  .drop-label {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.4rem; letter-spacing: .1em;
    color: rgba(224,224,255,.5); margin-bottom: 6px;
  }
  .drop-sub {
    font-family: 'Share Tech Mono', monospace;
    font-size: .65rem; letter-spacing: .15em;
    color: rgba(224,224,255,.25); margin-bottom: 12px;
  }
  .drop-hint {
    font-family: 'Share Tech Mono', monospace;
    font-size: .58rem; letter-spacing: .1em;
    color: rgba(0,255,249,.3);
    border: 1px solid rgba(0,255,249,.1);
    padding: 4px 12px; display: inline-block;
  }

  .thumb-preview {
    width: 100%; height: 100%;
    object-fit: cover;
    position: absolute; inset: 0;
  }
  .thumb-overlay {
    position: absolute; inset: 0;
    background: rgba(3,0,10,.7);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity .3s; z-index: 2;
  }
  .dropzone.has-preview:hover .thumb-overlay { opacity: 1; }
  .thumb-change-btn {
    font-family: 'Share Tech Mono', monospace;
    font-size: .9rem; letter-spacing: .2em; text-transform: uppercase;
    color: var(--neon-cyan); border: 1px solid var(--neon-cyan);
    padding: 10px 24px; cursor: none;
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
    text-shadow: 0 0 8px var(--neon-cyan);
    background: rgba(0,255,249,.06);
  }

  /* ════════════ TIPS ════════════ */
  .tips-block {
    margin-top: 28px;
    border: 1px solid rgba(255,230,0,.1);
    padding: 20px 24px;
    background: rgba(255,230,0,.02);
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  }
  .tips-title {
    font-family: 'Share Tech Mono', monospace;
    font-size: .58rem; letter-spacing: .25em; text-transform: uppercase;
    color: var(--neon-lavender); text-shadow: 0 0 8px var(--neon-lavender);
    margin-bottom: 14px;
  }
  .tips-list {
    list-style: none; display: flex; flex-direction: column; gap: 10px;
  }
  .tips-list li {
    font-family: 'Share Tech Mono', monospace;
    font-size: .65rem; letter-spacing: .05em; line-height: 1.5;
    color: rgba(224,224,255,.35);
    padding-left: 14px; position: relative;
  }
  .tips-list li::before {
    content: '›'; position: absolute; left: 0;
    color: var(--neon-lavender); font-size: .8rem;
  }

  /* ════════════ LOADING DOTS ════════════ */
  .loading-dots span              { animation: dotBlink 1.2s infinite; display: inline-block; }
  .loading-dots span:nth-child(2) { animation-delay: .2s; }
  .loading-dots span:nth-child(3) { animation-delay: .4s; }
  @keyframes dotBlink { 0%,80%,100% { opacity:0 } 40% { opacity:1 } }

  /* ════════════ FOOTER ════════════ */
  footer {
    position: relative; z-index: 10; padding: 60px;
    border-top: 1px solid rgba(0,255,249,.1);
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 60px;
    background: rgba(3,0,10,.95);
  }
  .footer-logo     { font-family: 'Bebas Neue', sans-serif; font-size: 3.2rem; color: var(--neon-cyan); text-shadow: 0 0 20px var(--neon-cyan); margin-bottom: 4px; }
  .footer-logo span { color: var(--neon-pink); text-shadow: 0 0 20px var(--neon-pink); }
  .footer-logo-sub { font-family: 'Share Tech Mono', monospace; font-size: .72rem; color: rgba(0,255,249,.4); letter-spacing: .12em; margin-bottom: 14px; }
  .footer-desc     { font-family: 'Share Tech Mono', monospace; font-size: .9rem; line-height: 1.8; color: rgba(224,224,255,.3); letter-spacing: .05em; }
  .footer-col-title { font-family: 'Bebas Neue', sans-serif; font-size: 1.2rem; letter-spacing: .1em; color: rgba(224,224,255,.5); margin-bottom: 20px; }
  .footer-links    { list-style: none; display: flex; flex-direction: column; gap: 12px; }
  .footer-links a  { font-family: 'Share Tech Mono', monospace; font-size: .65rem; letter-spacing: .1em; color: rgba(224,224,255,.3); text-decoration: none; text-transform: uppercase; transition: color .2s; cursor: none; }
  .footer-links a:hover { color: var(--neon-cyan); text-shadow: 0 0 8px var(--neon-cyan); }
  .admin-link      { color: rgba(255,0,110,.5) !important; }
  .admin-link:hover { color: var(--neon-pink) !important; text-shadow: 0 0 8px var(--neon-pink) !important; }
  .footer-bottom   { grid-column: 1 / -1; padding-top: 30px; border-top: 1px solid rgba(255,255,255,.05); display: flex; justify-content: space-between; align-items: center; }
  .footer-copy     { font-family: 'Share Tech Mono', monospace; font-size: .8rem; color: rgba(224,224,255,.2); letter-spacing: .12em; }
  .footer-status   { display: flex; align-items: center; gap: 8px; font-family: 'Share Tech Mono', monospace; font-size: .8rem; color: rgba(0,255,249,.5); letter-spacing: .1em; }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--neon-cyan); box-shadow: 0 0 6px var(--neon-cyan); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }

  /* ════════════ LOGIN MODAL ════════════ */
  .modal-backdrop {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(3,0,10,.85); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn .2s ease;
  }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  .modal {
    position: relative; width: 460px;
    background: var(--dark2); border: 1px solid rgba(0,255,249,.2);
    padding: 50px 44px;
    box-shadow: 0 0 60px rgba(0,255,249,.08), 0 0 120px rgba(191,0,255,.06);
    animation: modalIn .3s ease;
    clip-path: polygon(16px 0%, 100% 0%, calc(100% - 16px) 100%, 0% 100%);
  }
  @keyframes modalIn { from { opacity:0; transform:translateY(20px) scale(.97) } to { opacity:1; transform:none } }
  .modal-corner    { position: absolute; width: 24px; height: 24px; }
  .modal-corner.tl { top: 10px; left: 10px; border-top: 2px solid var(--neon-cyan); border-left: 2px solid var(--neon-cyan); }
  .modal-corner.br { bottom: 10px; right: 10px; border-bottom: 2px solid var(--neon-cyan); border-right: 2px solid var(--neon-cyan); }
  .modal-close { position: absolute; top: 16px; right: 20px; background: transparent; border: none; color: rgba(224,224,255,.3); font-size: 1rem; cursor: none; transition: color .2s; font-family: 'Share Tech Mono', monospace; }
  .modal-close:hover { color: var(--neon-pink); text-shadow: 0 0 10px var(--neon-pink); }
  .modal-eyebrow { font-family: 'Share Tech Mono', monospace; font-size: .8rem; letter-spacing: .3em; text-transform: uppercase; color: var(--neon-cyan); text-shadow: 0 0 8px var(--neon-cyan); margin-bottom: 10px; }
  .modal-title   { font-family: 'Bebas Neue', sans-serif; font-size: 4rem; line-height: 1; letter-spacing: .05em; margin-bottom: 10px; }
  .modal-title span { color: var(--neon-pink); text-shadow: 0 0 20px var(--neon-pink); }
  .modal-sub     { font-family: 'Share Tech Mono', monospace; font-size: .9rem; color: rgba(224,224,255,.35); letter-spacing: .08em; margin-bottom: 36px; line-height: 1.6; }
  .login-form    { display: flex; flex-direction: column; gap: 20px; }
  .login-error { font-family: 'Share Tech Mono', monospace; font-size: .65rem; letter-spacing: .15em; color: var(--neon-pink); text-shadow: 0 0 8px var(--neon-pink); text-align: center; padding: 8px; border: 1px solid rgba(255,0,110,.3); background: rgba(255,0,110,.05); }
  .btn-login {
    font-family: 'Share Tech Mono', monospace; font-size: .9rem; letter-spacing: .15em; text-transform: uppercase;
    background: var(--neon-cyan); color: var(--dark); border: none;
    padding: 16px; cursor: none; font-weight: bold; transition: all .3s;
    clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
    box-shadow: 0 0 30px rgba(0,255,249,.4);
  }
  .btn-login:hover:not(:disabled) { box-shadow: 0 0 50px rgba(0,255,249,.7); transform: translateY(-1px); }
  .btn-login:disabled { opacity: .7; }
  .login-divider { display: flex; align-items: center; gap: 16px; font-family: 'Share Tech Mono', monospace; font-size: .8rem; letter-spacing: .2em; color: rgba(224,224,255,.2); }
  .login-divider::before,.login-divider::after { content: ''; flex: 1; height: 1px; background: rgba(224,224,255,.08); }
  .btn-register {
    font-family: 'Share Tech Mono', monospace; font-size: .9rem; letter-spacing: .15em; text-transform: uppercase;
    background: transparent; color: var(--neon-purple); border: 1px solid rgba(191,0,255,.4);
    padding: 14px; cursor: none; transition: all .3s; text-decoration: none; text-align: center; display: block;
    clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
    text-shadow: 0 0 8px var(--neon-purple);
  }
  .btn-register:hover { background: rgba(191,0,255,.08); border-color: var(--neon-purple); box-shadow: 0 0 20px rgba(191,0,255,.2); }
  .login-footer-text { text-align: center; }
  .login-footer-text a { font-family: 'Share Tech Mono', monospace; font-size: .8rem; letter-spacing: .15em; text-transform: uppercase; color: rgba(224,224,255,.25); text-decoration: none; transition: color .2s; }
  .login-footer-text a:hover { color: var(--neon-cyan); text-shadow: 0 0 8px var(--neon-cyan); }
</style>