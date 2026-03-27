<script lang="ts">
  
  import { goto } from '$app/navigation';
  import { page } from '$app/state';

  import Navbar     from '$lib/components/Navbar.svelte';
  import Footer     from '$lib/components/Footer.svelte';
  import LoginModal from '$lib/components/LoginModal.svelte';

  // AUTH
  let session = $derived(page.data.session);
  let user    = $derived(session?.user);

  let isLoggedIn = $derived(session?.authenticated ?? false);
  let isAdmin    = $derived(user?.userType === 'admin');

  // LOGIN MODAL STATE
  let showLogin = $state(false);

  // GAME MEDIA
  let video        = $state<File | null>(null);
  let videoPreview = $state<string | null>(null);

  function goTo(path: string, requiresAuth = false) {
    if (requiresAuth && !isLoggedIn) showLogin = true;
    else goto(path);
  }

  // FORM STATE
  let title        = $state('');
  let description  = $state('');
  let url          = $state('');
  let genre        = $state('');
  let thumbnail    = $state<File | null>(null);
  let preview      = $state<string | null>(null);
  let isDragging   = $state(false);
  let isSubmitting = $state(false);
  let submitted    = $state(false);

  let dropzone = $state<HTMLElement | undefined>(undefined);

  const genres = ['Action RPG', 'Shooter', 'Racing', 'Strategy', 'Arcade', 'Space Sim', 'Survival', 'Horror', 'Fighting', 'Puzzle'];

  // FILE HANDLING
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

  // SUBMIT
  async function handleSubmit(e: Event) {
  e.preventDefault();
  if (!title || !description || !url) return;
  isSubmitting = true;

  try {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('gameUrl', url.startsWith('https://') ? url : `https://${url}`);
    if (thumbnail) formData.append('thumbnail', thumbnail);
    if (video) formData.append('video', video);

    const res = await fetch('/api/game-requests', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Submission failed:', err);
      isSubmitting = false;
      return;
    }

    isSubmitting = false;
    submitted = true;

    setTimeout(() => {
      submitted  = false;
      title      = description = url = genre = '';
      thumbnail  = preview = null;
      video      = videoPreview = null;
    }, 3000);

  } catch (err) {
    console.error('Submission error:', err);
    isSubmitting = false;
  }
  }

  function handleVideoChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !file.type.startsWith('video/')) return;
  video = file;
  videoPreview = file.name;
  }
</script>

<svelte:head>
  <title>UPLOAD // PROGCHAMP</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Oxanium:wght@300;400;600;800&display=swap" rel="stylesheet" />
</svelte:head>

<!-- NAV (replaces cursor divs + grid-bg + noise + raw <nav>) -->
<Navbar
  {isLoggedIn}
  {isAdmin}
  avatarUrl={user?.avatarUrl}
  userName={user?.name}
  onLoginClick={() => (showLogin = true)}
/>

<!-- PAGE HEADER -->
<header class="page-header">
  <div class="header-orb orb1"></div>
  <div class="header-orb orb2"></div>
  <div class="header-inner">
    <div class="header-eyebrow">// DEVELOPER TERMINAL</div>
    <h1 class="header-title">UPLOAD YOUR <span>GAME</span></h1>
    <p class="header-sub">Submit your build for review. Once approved, it goes live in the Vault.</p>
  </div>
</header>

<!-- UPLOAD FORM -->
<main class="upload-main">
  <div class="upload-grid">

    <!-- LEFT: FORM -->
    <div class="form-panel">
      <div class="panel-corner tl"></div>
      <div class="panel-corner br"></div>
      <div class="panel-eyebrow">// GAME DETAILS</div>

      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <form onsubmit={handleSubmit} class="upload-form">

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

        <div class="form-group">
          <label class="form-label" for="genre">GENRE</label>
          <select id="genre" class="form-input form-select" bind:value={genre}>
            <option value="" disabled selected>SELECT A GENRE...</option>
            {#each genres as g}
              <option value={g}>{g.toUpperCase()}</option>
            {/each}
          </select>
        </div>

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

        <button
          type="submit"
          class="btn-submit"
          disabled={isSubmitting || submitted || !title || !description || !url}
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
          <p class="submit-note">Your game has been queued for review.</p>
        {/if}

      </form>
    </div>

    <!-- RIGHT: THUMBNAIL -->
    <div class="thumb-panel">
      <div class="panel-corner tl"></div>
      <div class="panel-corner br"></div>
      <div class="panel-eyebrow">// THUMBNAIL</div>

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="dropzone"
        class:dragover={isDragging}
        class:has-preview={!!preview}
        bind:this={dropzone}
        ondrop={handleDrop}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
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
          onchange={handleInputChange}
        />
      </div>

      <div class="tips-block">
        <div class="tips-title">// SUBMISSION TIPS</div>
        <ul class="tips-list">
          <li>Thumbnail should be 16:9, at least 800×450px</li>
          <li>URL must point to a playable, public build</li>
          <li>Upload content must not contain sensitive or offensive information of any kind</li>
        </ul>
      </div>
      <div class="video-section">
      <div class="panel-eyebrow" style="margin-top: 28px;">// GAMEPLAY VIDEO</div>
      <div class="video-drop" class:has-video={!!video}>
        {#if video}
          <div class="video-name">
            <span class="video-icon">▶</span>
            <span>{videoPreview}</span>
          </div>
          <button class="video-clear" onclick={() => { video = null; videoPreview = null; }}>✕ REMOVE</button>
        {:else}
          <div class="dropzone-content">
            <div class="drop-icon">▶</div>
            <div class="drop-label">GAMEPLAY VIDEO</div>
            <div class="drop-sub">or click to browse</div>
            <div class="drop-hint">MP4, WEBM · Max 50MB</div>
          </div>
        {/if}
        <label for="video-input" class="dropzone-label" aria-label="Upload video"></label>
        <input
          id="video-input"
          type="file"
          accept="video/*"
          class="file-input-hidden"
          onchange={handleVideoChange}
        />
      </div>
    </div>
    </div>

  </div>
</main>

<!-- FOOTER (replaces raw <footer> block) -->
<Footer {isAdmin} />

<!-- LOGIN MODAL (replaces raw modal HTML) -->
<LoginModal open={showLogin} onClose={() => (showLogin = false)} />

<style>
  /* PAGE HEADER */
  .page-header {
    position: relative; z-index: 10;
    padding: 160px 60px 80px;
    border-bottom: 1px solid rgba(0,255,249,.08);
    background: radial-gradient(ellipse at 30% 50%, rgba(191,0,255,.07) 0%, transparent 60%);
    overflow: hidden;
  }
  .header-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
  .header-orb.orb1 { width: 400px; height: 400px; background: rgba(191,0,255,.12); top: -100px; left: -80px; }
  .header-orb.orb2 { width: 300px; height: 300px; background: rgba(0,255,249,.08); bottom: -50px; right: 10%; }
  .header-inner { position: relative; z-index: 2; max-width: 800px; margin: 0 auto; text-align: center; }
  .header-eyebrow {
    font-family: 'Share Tech Mono', monospace;
    font-size: .8rem; letter-spacing: .35em; text-transform: uppercase;
    color: var(--neon-yellow); text-shadow: 0 0 10px var(--neon-yellow);
    margin-bottom: 16px;
  }
  .header-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(3.5rem, 8vw, 9rem); letter-spacing: .04em; line-height: .95;
    margin-bottom: 20px;
  }
  .header-title span { color: var(--neon-yellow); text-shadow: 0 0 30px var(--neon-yellow); }
  .header-sub {
    font-family: 'Share Tech Mono', monospace;
    font-size: .78rem; color: rgba(224,224,255,.4);
    letter-spacing: .08em; line-height: 1.8; max-width: 500px;
    margin-left: auto; margin-right: auto;
  }

  /* MAIN LAYOUT */
  .upload-main { position: relative; z-index: 10; padding: 60px; min-height: 60vh; }
  .upload-grid {
    display: grid; grid-template-columns: 1fr 420px;
    gap: 40px; max-width: 1200px; margin: 0 auto;
  }

  /* PANELS */
  .form-panel, .thumb-panel {
    position: relative;
    background: rgba(10,0,20,.6);
    border: 1px solid rgba(0,255,249,.12);
    padding: 40px;
    backdrop-filter: blur(8px);
    clip-path: polygon(16px 0%, 100% 0%, calc(100% - 16px) 100%, 0% 100%);
  }
  .panel-corner { position: absolute; width: 20px; height: 20px; }
  .panel-corner.tl { top: 12px; left: 12px; border-top: 2px solid var(--neon-cyan); border-left: 2px solid var(--neon-cyan); }
  .panel-corner.br { bottom: 12px; right: 12px; border-bottom: 2px solid var(--neon-cyan); border-right: 2px solid var(--neon-cyan); }
  .panel-eyebrow {
    font-family: 'Share Tech Mono', monospace;
    font-size: .85rem; letter-spacing: .3em; text-transform: uppercase;
    color: var(--neon-cyan); text-shadow: 0 0 8px var(--neon-cyan);
    margin-bottom: 28px;
  }

  /* FORM */
  .upload-form { display: flex; flex-direction: column; gap: 24px; }
  .form-group  { display: flex; flex-direction: column; gap: 8px; }
  .form-label  {
    font-family: 'Share Tech Mono', monospace;
    font-size: .85rem; letter-spacing: .2em; text-transform: uppercase;
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
    background-repeat: no-repeat; background-position: right 16px center; cursor: none;
  }
  .form-select option { background: #0a0014; color: var(--text); }
  .form-textarea { resize: vertical; min-height: 120px; font-family: 'Share Tech Mono', monospace; line-height: 1.6; }
  .input-with-prefix { display: flex; align-items: stretch; }
  .input-prefix {
    font-family: 'Share Tech Mono', monospace; font-size: .9rem; letter-spacing: .05em;
    background: rgba(0,255,249,.06); border: 1px solid rgba(0,255,249,.15); border-right: none;
    color: rgba(0,255,249,.5); padding: 12px 14px; display: flex; align-items: center; flex-shrink: 0;
    clip-path: polygon(6px 0%, 100% 0%, 100% 100%, 0% 100%);
  }
  .input-prefixed { clip-path: polygon(0% 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%); border-left: none; }

  .btn-submit {
    font-family: 'Share Tech Mono', monospace;
    font-size: .8rem; letter-spacing: .2em; text-transform: uppercase;
    background: transparent; color: var(--neon-yellow); border: 1px solid var(--neon-yellow);
    padding: 18px 32px; cursor: none; transition: all .3s; margin-top: 8px;
    clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
    text-shadow: 0 0 10px var(--neon-yellow); box-shadow: 0 0 20px rgba(255,230,0,.15);
  }
  .btn-submit:hover:not(:disabled) { background: rgba(255,230,0,.08); box-shadow: 0 0 40px rgba(255,230,0,.4); transform: translateY(-2px); }
  .btn-submit:disabled { opacity: .4; cursor: not-allowed; }
  .success-text { color: var(--neon-cyan); text-shadow: 0 0 10px var(--neon-cyan); }
  .submit-note {
    font-family: 'Share Tech Mono', monospace; font-size: .8rem; letter-spacing: .1em;
    color: rgba(0,255,249,.5); text-align: center; line-height: 1.6;
  }

  /* DROPZONE */
  .dropzone {
    position: relative; border: 1px dashed rgba(0,255,249,.25);
    min-height: 240px; display: flex; align-items: center; justify-content: center;
    transition: border-color .3s, background .3s; cursor: none; overflow: hidden;
    clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
  }
  .dropzone.dragover { border-color: var(--neon-cyan); background: rgba(0,255,249,.05); box-shadow: 0 0 30px rgba(0,255,249,.1) inset; }
  .dropzone.has-preview { border-style: solid; border-color: rgba(0,255,249,.2); }
  .dropzone:hover { border-color: rgba(0,255,249,.5); }
  .dropzone-label { position: absolute; inset: 0; cursor: none; z-index: 1; }
  .file-input-hidden { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
  .dropzone-content { text-align: center; pointer-events: none; padding: 20px; }
  .drop-icon { font-size: 3.5rem; color: rgba(0,255,249,.25); margin-bottom: 12px; display: block; line-height: 1; transition: color .3s; }
  .dropzone:hover .drop-icon { color: rgba(0,255,249,.5); }
  .dragover .drop-icon { color: var(--neon-cyan); }
  .drop-label { font-family: 'Bebas Neue', sans-serif; font-size: 1.4rem; letter-spacing: .1em; color: rgba(224,224,255,.5); margin-bottom: 6px; }
  .drop-sub   { font-family: 'Share Tech Mono', monospace; font-size: .8rem; letter-spacing: .15em; color: rgba(224,224,255,.25); margin-bottom: 12px; }
  .drop-hint  { font-family: 'Share Tech Mono', monospace; font-size: .58rem; letter-spacing: .1em; color: rgba(0,255,249,.3); border: 1px solid rgba(0,255,249,.1); padding: 4px 12px; display: inline-block; }
  .thumb-preview { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
  .thumb-overlay { position: absolute; inset: 0; background: rgba(3,0,10,.7); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .3s; z-index: 2; }
  .dropzone.has-preview:hover .thumb-overlay { opacity: 1; }
  .thumb-change-btn {
    font-family: 'Share Tech Mono', monospace; font-size: .9rem; letter-spacing: .2em; text-transform: uppercase;
    color: var(--neon-cyan); border: 1px solid var(--neon-cyan); padding: 10px 24px; cursor: none;
    clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
    text-shadow: 0 0 8px var(--neon-cyan); background: rgba(0,255,249,.06);
  }

  /* TIPS */
  .tips-block { margin-top: 28px; border: 1px solid rgba(255,230,0,.1); padding: 20px 24px; background: rgba(255,230,0,.02); clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); }
  .tips-title { font-family: 'Share Tech Mono', monospace; font-size: .58rem; letter-spacing: .25em; text-transform: uppercase; color: var(--neon-yellow); text-shadow: 0 0 8px var(--neon-yellow); margin-bottom: 14px; }
  .tips-list  { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .tips-list li { font-family: 'Share Tech Mono', monospace; font-size: .8rem; letter-spacing: .05em; line-height: 1.5; color: rgba(224,224,255,.35); padding-left: 14px; position: relative; }
  .tips-list li::before { content: '›'; position: absolute; left: 0; color: var(--neon-yellow); font-size: .8rem; }

  /* LOADING DOTS */
  .loading-dots span              { animation: dotBlink 1.2s infinite; display: inline-block; }
  .loading-dots span:nth-child(2) { animation-delay: .2s; }
  .loading-dots span:nth-child(3) { animation-delay: .4s; }
  @keyframes dotBlink { 0%,80%,100% { opacity:0 } 40% { opacity:1 } }
  .video-drop{position:relative;border:1px dashed rgba(191,0,255,.25);min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;transition:border-color .3s,background .3s;cursor:none;overflow:hidden;clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);}
  .video-drop:hover{border-color:rgba(191,0,255,.5);}
  .video-drop.has-video{border-style:solid;border-color:rgba(191,0,255,.3);background:rgba(191,0,255,.03);}
  .video-name{display:flex;align-items:center;gap:10px;font-family:'Share Tech Mono',monospace;font-size:.75rem;letter-spacing:.08em;color:rgba(224,224,255,.6);padding:0 20px;text-align:center;}
  .video-icon{color:var(--neon-purple);text-shadow:0 0 8px var(--neon-purple);}
  .video-clear{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.15em;color:rgba(255,0,110,.6);border:1px solid rgba(255,0,110,.2);background:transparent;padding:6px 14px;cursor:none;transition:all .25s;clip-path:polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%);}
  .video-clear:hover{color:var(--neon-pink);border-color:var(--neon-pink);}
</style>