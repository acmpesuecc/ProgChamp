<script lang="ts">
  import { enhance } from '$app/forms';
  import { onMount } from 'svelte';

  let { data, form } = $props();

  const DICEBEAR_BASE = 'https://api.dicebear.com/7.x/bottts/svg?seed=';

  // ── State ────────────────────────────────────────────────
  let name          = $state('');
  let avatarUrl     = $state('');
  let customUrl     = $state('');
  let submitting    = $state(false);
  let step          = $state<1 | 2>(1);

  const AVATARS = [
    { seed: 'cyber',  label: 'Cyber',  emoji: '🤖' },
    { seed: 'ghost',  label: 'Ghost',  emoji: '👾' },
    { seed: 'flame',  label: 'Flame',  emoji: '🔥' },
    { seed: 'void',   label: 'Void',   emoji: '💀' },
    { seed: 'nova',   label: 'Nova',   emoji: '⚡' },
    { seed: 'neon',   label: 'Neon',   emoji: '🎮' },
  ];

  let selectedSeed = $state<string | null>(null);

  // Pre-fill name from Google account
  onMount(() => {
    if (data?.user?.name) name = data.user.name;
    // Default to first avatar
    selectAvatar(AVATARS[0].seed);
  });

  function selectAvatar(seed: string) {
    selectedSeed = seed;
    customUrl    = '';
    avatarUrl    = `${DICEBEAR_BASE}${seed}`;
  }

  function onCustomUrlInput() {
    if (customUrl.trim()) {
      selectedSeed = null;
      avatarUrl    = customUrl.trim();
    } else {
      // Fall back to first avatar if custom cleared
      selectAvatar(AVATARS[0].seed);
    }
  }

  function goStep2() {
    if (!name.trim()) return;
    // Ensure avatarUrl is always set
    if (!avatarUrl) selectAvatar(AVATARS[0].seed);
    step = 2;
  }

  const avatarPreviewUrl = $derived(
    customUrl.trim() ? customUrl.trim() : avatarUrl
  );
</script>

<svelte:head>
  <title>PROGCHAMP // Profile Setup</title>
</svelte:head>

<div class="page-wrap">

  <!-- Left panel -->
  <aside class="side-panel">
    <div class="side-inner">
      <a href="/" class="logo-wrap">
        <span class="logo">PROG<em>CHAMP</em></span>
        <span class="logo-sub">an @ACMpesuecc project</span>
      </a>

      <div class="side-copy">
        <div class="eyebrow">// IDENTITY INIT</div>
        <h2 class="side-title">BUILD YOUR<br /><span>PROFILE</span></h2>
        <p class="side-desc">
          Choose a name, pick a face for the arena, and step into the
          ProgChamp community.
        </p>
      </div>

      <div class="side-stats">
        <div class="stat-note-top">// every member starts as</div>
        <div class="stat-tags">
          <span class="stat-tag cyan">🎮 Player</span>
          <span class="stat-tag pink">⚙ Developer</span>
        </div>
        <div class="stat-note">// you can play and build. always both.</div>
      </div>

      <div class="steps-track">
        <div class="step-dot {step >= 1 ? 'active' : ''}">
          <span>01</span>
          <span class="step-label">Identity</span>
        </div>
        <div class="step-line {step >= 2 ? 'active' : ''}"></div>
        <div class="step-dot {step >= 2 ? 'active' : ''}">
          <span>02</span>
          <span class="step-label">Avatar</span>
        </div>
      </div>
    </div>
  </aside>

  <!-- Right panel -->
  <main class="form-panel">
    <div class="form-inner">

      {#if form?.error}
        <div class="error-banner">
          <span class="error-icon">!</span>
          <span>{form.error}</span>
        </div>
      {/if}

      <form
        method="POST"
        action="?/setup"
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            await update();
            submitting = false;
          };
        }}
      >
        <!-- Always submitted hidden fields -->
        <input type="hidden" name="name"      bind:value={name} />
        <input type="hidden" name="avatarUrl" bind:value={avatarUrl} />

        <!-- ── STEP 1: Name ───────────────────────────────── -->
        {#if step === 1}
          <div class="step-content">
            <div class="form-header">
              <div class="form-eyebrow">// STEP 01 OF 02</div>
              <h1 class="form-title">WHO ARE<br /><span>YOU?</span></h1>
            </div>

            <div class="field-group">
              <label for="name-input" class="field-label">
                Display Name
                <span class="field-hint">// shown publicly · can be anything</span>
              </label>
              <div class="input-wrap">
                <input
                  id="name-input"
                  type="text"
                  class="field-input"
                  placeholder="Your Name"
                  bind:value={name}
                  maxlength="100"
                  autocomplete="off"
                />
              </div>
            </div>

            <button
              type="button"
              class="btn-primary"
              onclick={goStep2}
              disabled={!name.trim()}
            >
              <span>Continue</span>
              <span class="btn-arrow">→</span>
            </button>
          </div>

        <!-- ── STEP 2: Avatar ─────────────────────────────── -->
        {:else}
          <div class="step-content">
            <div class="form-header">
              <div class="form-eyebrow">// STEP 02 OF 02</div>
              <h1 class="form-title">PICK YOUR<br /><span>FACE</span></h1>
            </div>

            <!-- Preview card -->
            <div class="avatar-preview-row">
              <div class="avatar-preview">
                <img src={avatarPreviewUrl} alt="avatar preview" referrerpolicy="no-referrer" />
                <div class="avatar-ring"></div>
              </div>
              <div class="avatar-meta">
                <div class="avatar-name">{name || 'Your Name'}</div>
                <div class="avatar-roles">
                  <span class="role-tag cyan">Player</span>
                  <span class="role-tag pink">Developer</span>
                </div>
              </div>
            </div>

            <!-- Default avatar grid -->
            <div class="field-group">
              <div class="field-label">
                Choose a default
                <span class="field-hint">// or paste your own URL below</span>
              </div>
              <div class="avatar-grid">
                {#each AVATARS as av}
                  <button
                    type="button"
                    class="avatar-option {selectedSeed === av.seed ? 'selected' : ''}"
                    onclick={() => selectAvatar(av.seed)}
                    title={av.label}
                  >
                    <img
                      src="{DICEBEAR_BASE}{av.seed}"
                      alt={av.label}
                      class="av-img"
                    />
                    <span class="av-label">{av.label}</span>
                  </button>
                {/each}
              </div>
            </div>

            <!-- Custom URL -->
            <div class="field-group">
              <label for="avatar-url-input" class="field-label">
                Custom image URL
                <span class="field-hint">// optional</span>
              </label>
              <div class="input-wrap">
                <input
                  id="avatar-url-input"
                  type="url"
                  class="field-input"
                  placeholder="https://..."
                  bind:value={customUrl}
                  oninput={onCustomUrlInput}
                />
              </div>
            </div>

            <div class="btn-row">
              <button type="button" class="btn-secondary" onclick={() => (step = 1)}>
                ← Back
              </button>
              <button type="submit" class="btn-primary" disabled={submitting}>
                {#if submitting}
                  <span class="spin">◌</span> Saving…
                {:else}
                  <span>Enter the Arena</span>
                  <span class="btn-arrow">⚡</span>
                {/if}
              </button>
            </div>
          </div>
        {/if}
      </form>
    </div>
  </main>
</div>

<style>
  /* ── Layout ──────────────────────────────────────────── */
  .page-wrap {
    display: grid;
    grid-template-columns: 420px 1fr;
    min-height: 100vh;
    position: relative;
    z-index: 10;
  }

  /* ── Side panel ─────────────────────────────────────── */
  .side-panel {
    background: rgba(3, 0, 10, 0.85);
    border-right: 1px solid rgba(0, 255, 249, 0.1);
    position: relative;
    overflow: hidden;
  }
  .side-panel::before {
    content: '';
    position: absolute;
    top: -120px; left: -120px;
    width: 360px; height: 360px;
    background: radial-gradient(circle, rgba(0,255,249,.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .side-panel::after {
    content: '';
    position: absolute;
    bottom: -80px; right: -80px;
    width: 260px; height: 260px;
    background: radial-gradient(circle, rgba(255,0,110,.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .side-inner {
    display: flex;
    flex-direction: column;
    gap: 40px;
    padding: 48px 44px;
    height: 100%;
    position: relative;
    z-index: 1;
  }

  .logo-wrap { display: flex; flex-direction: column; text-decoration: none; gap: 4px; }
  .logo { font-family: 'Bebas Neue', sans-serif; font-size: 2.4rem; letter-spacing: .12em; color: var(--neon-cyan); text-shadow: 0 0 20px var(--neon-cyan); }
  .logo em { color: var(--neon-pink); font-style: normal; text-shadow: 0 0 20px var(--neon-pink); }
  .logo-sub { font-family: 'Share Tech Mono', monospace; font-size: .68rem; letter-spacing: .14em; color: rgba(0,255,249,.4); }

  .side-copy { display: flex; flex-direction: column; gap: 14px; }
  .eyebrow {
    font-family: 'Share Tech Mono', monospace;
    font-size: .6rem; letter-spacing: .3em; text-transform: uppercase;
    color: var(--neon-pink); text-shadow: 0 0 8px var(--neon-pink);
  }
  .side-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 3.4rem; letter-spacing: .06em; line-height: 1; margin: 0;
  }
  .side-title span { color: var(--neon-cyan); text-shadow: 0 0 20px var(--neon-cyan); }
  .side-desc {
    font-family: 'Share Tech Mono', monospace;
    font-size: .68rem; letter-spacing: .04em;
    color: rgba(224,224,255,.45); line-height: 1.7; margin: 0;
  }

  /* Info tags */
  .side-stats { display: flex; flex-direction: column; gap: 10px; }
  .stat-note-top {
    font-family: 'Share Tech Mono', monospace;
    font-size: .57rem; letter-spacing: .12em; color: rgba(224,224,255,.3);
  }
  .stat-tags { display: flex; gap: 10px; flex-wrap: wrap; }
  .stat-tag {
    font-family: 'Share Tech Mono', monospace;
    font-size: .62rem; letter-spacing: .12em; text-transform: uppercase;
    padding: 6px 14px; pointer-events: none; user-select: none;
  }
  .stat-tag.cyan { background: rgba(0,255,249,.06); border: 1px solid rgba(0,255,249,.2); color: var(--neon-cyan); }
  .stat-tag.pink { background: rgba(255,0,110,.06); border: 1px solid rgba(255,0,110,.2); color: var(--neon-pink); }
  .stat-note {
    font-family: 'Share Tech Mono', monospace;
    font-size: .55rem; letter-spacing: .1em; color: rgba(224,224,255,.22);
  }

  /* Step tracker */
  .steps-track { display: flex; align-items: center; gap: 12px; margin-top: auto; }
  .step-dot {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem;
    color: rgba(224,224,255,.2); letter-spacing: .1em; transition: color .3s;
  }
  .step-dot.active { color: var(--neon-cyan); text-shadow: 0 0 10px var(--neon-cyan); }
  .step-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: .55rem; letter-spacing: .15em; text-transform: uppercase; color: inherit;
  }
  .step-line {
    flex: 1; height: 1px; background: rgba(224,224,255,.1);
    transition: background .3s; margin-bottom: 20px;
  }
  .step-line.active { background: var(--neon-cyan); box-shadow: 0 0 6px var(--neon-cyan); }

  /* ── Form panel ─────────────────────────────────────── */
  .form-panel {
    display: flex; align-items: center; justify-content: center;
    padding: 60px 48px; background: rgba(6,0,18,.6);
  }
  .form-inner { width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 32px; }

  .error-banner {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 18px; background: rgba(255,0,110,.08);
    border: 1px solid rgba(255,0,110,.3);
    font-family: 'Share Tech Mono', monospace;
    font-size: .65rem; letter-spacing: .08em; color: var(--neon-pink);
  }
  .error-icon {
    width: 20px; height: 20px; border: 1px solid var(--neon-pink);
    display: flex; align-items: center; justify-content: center;
    font-size: .7rem; flex-shrink: 0;
  }

  .form-header { display: flex; flex-direction: column; gap: 10px; }
  .form-eyebrow {
    font-family: 'Share Tech Mono', monospace;
    font-size: .6rem; letter-spacing: .3em; text-transform: uppercase; color: var(--neon-cyan);
  }
  .form-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 3.8rem; letter-spacing: .05em; line-height: 1; margin: 0;
  }
  .form-title span { color: var(--neon-cyan); text-shadow: 0 0 20px var(--neon-cyan); }

  .step-content { display: flex; flex-direction: column; gap: 28px; }

  /* Fields */
  .field-group { display: flex; flex-direction: column; gap: 8px; }
  .field-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: .62rem; letter-spacing: .18em; text-transform: uppercase;
    color: rgba(224,224,255,.55); display: flex; align-items: baseline; gap: 10px;
  }
  .field-hint { font-size: .55rem; letter-spacing: .1em; color: rgba(224,224,255,.25); }
  .input-wrap {
    display: flex; align-items: center;
    border: 1px solid rgba(0,255,249,.18); background: rgba(0,255,249,.03);
    transition: border-color .2s, box-shadow .2s;
  }
  .input-wrap:focus-within {
    border-color: rgba(0,255,249,.5);
    box-shadow: 0 0 12px rgba(0,255,249,.08);
  }
  .field-input {
    flex: 1; background: transparent; border: none; outline: none;
    color: rgba(224,224,255,.9); font-family: 'Share Tech Mono', monospace;
    font-size: .82rem; letter-spacing: .06em; padding: 14px 16px;
  }
  .field-input::placeholder { color: rgba(224,224,255,.2); }

  /* Avatar preview */
  .avatar-preview-row {
    display: flex; align-items: center; gap: 24px;
    padding: 20px 24px; border: 1px solid rgba(0,255,249,.1);
    background: rgba(0,255,249,.02);
  }
  .avatar-preview { position: relative; width: 72px; height: 72px; flex-shrink: 0; }
  .avatar-preview img {
    width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
    background: rgba(0,255,249,.05);
  }
  .avatar-ring {
    position: absolute; inset: -3px; border-radius: 50%;
    border: 1px solid rgba(0,255,249,.3); pointer-events: none;
  }
  .avatar-meta { display: flex; flex-direction: column; gap: 6px; }
  .avatar-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.4rem; letter-spacing: .08em; color: rgba(224,224,255,.9);
  }
  .avatar-roles { display: flex; gap: 8px; }
  .role-tag {
    font-family: 'Share Tech Mono', monospace;
    font-size: .52rem; letter-spacing: .12em; text-transform: uppercase;
    padding: 3px 10px; pointer-events: none;
  }
  .role-tag.cyan { background: rgba(0,255,249,.08); border: 1px solid rgba(0,255,249,.25); color: var(--neon-cyan); }
  .role-tag.pink { background: rgba(255,0,110,.08); border: 1px solid rgba(255,0,110,.25); color: var(--neon-pink); }

  /* Avatar grid */
  .avatar-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
  .avatar-option {
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    padding: 8px 4px; background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.08); cursor: pointer; transition: all .2s;
    color: rgba(224,224,255,.6);
  }
  .avatar-option:hover { border-color: rgba(0,255,249,.3); background: rgba(0,255,249,.05); }
  .avatar-option.selected {
    border-color: var(--neon-cyan); background: rgba(0,255,249,.08);
    box-shadow: 0 0 10px rgba(0,255,249,.15);
  }
  .av-img { width: 36px; height: 36px; border-radius: 50%; }
  .av-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: .48rem; letter-spacing: .12em; text-transform: uppercase;
  }

  /* Buttons */
  .btn-primary {
    display: flex; align-items: center; justify-content: center; gap: 12px;
    width: 100%; padding: 16px 28px;
    background: rgba(0,255,249,.08); border: 1px solid rgba(0,255,249,.4);
    color: var(--neon-cyan); font-family: 'Bebas Neue', sans-serif;
    font-size: 1.2rem; letter-spacing: .2em; text-transform: uppercase;
    cursor: pointer; transition: all .2s;
  }
  .btn-primary:hover:not(:disabled) {
    background: rgba(0,255,249,.14); box-shadow: 0 0 20px rgba(0,255,249,.15);
  }
  .btn-primary:disabled { opacity: .35; cursor: not-allowed; }
  .btn-arrow { font-size: 1rem; }

  .btn-row { display: flex; gap: 12px; }
  .btn-secondary {
    padding: 16px 20px; background: transparent;
    border: 1px solid rgba(255,255,255,.1); color: rgba(224,224,255,.4);
    font-family: 'Share Tech Mono', monospace; font-size: .65rem;
    letter-spacing: .15em; text-transform: uppercase; cursor: pointer; transition: all .2s;
    flex-shrink: 0;
  }
  .btn-secondary:hover { border-color: rgba(255,255,255,.25); color: rgba(224,224,255,.7); }
  .btn-row .btn-primary { flex: 1; }

  .spin { display: inline-block; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 860px) {
    .page-wrap { grid-template-columns: 1fr; }
    .side-panel { display: none; }
    .form-panel { padding: 40px 24px; }
  }
</style>