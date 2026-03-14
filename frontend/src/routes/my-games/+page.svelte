<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { submissions } from '../../lib/stores/submissions';

  import Navbar     from '$lib/components/Navbar.svelte';
  import Footer     from '$lib/components/Footer.svelte';
  import LoginModal from '$lib/components/LoginModal.svelte';

  // AUTH
  let session    = $derived(page.data.session);
  let user       = $derived(session?.user);
  let isLoggedIn = $derived(session?.authenticated ?? false);
  let isAdmin    = $derived(user?.userType === 'admin');

  // LOGIN MODAL STATE
  let showLogin = $state(false);

  function goTo(path: string, requiresAuth = false) {
    if (requiresAuth && !isLoggedIn) showLogin = true;
    else goto(path);
  }

  // MY GAMES
  let myGames  = $derived($submissions.filter((s: any) => s.dev === (user?.name ?? '')));
  let pending  = $derived(myGames.filter((s: any) => s.status === 'pending'));
  let approved = $derived(myGames.filter((s: any) => s.status === 'approved'));
  let rejected = $derived(myGames.filter((s: any) => s.status === 'rejected'));


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

<!-- NAV -->
<Navbar
  {isLoggedIn}
  {isAdmin}
  avatarUrl={user?.avatarUrl}
  userName={user?.name}
  onLoginClick={() => (showLogin = true)}
/>

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
    <div class="empty-state">
      <div class="empty-icon">⬡</div>
      <div class="empty-title">ACCESS DENIED</div>
      <div class="empty-sub">You need to be logged in to view your games.</div>
      <button class="btn-cta" onclick={() => showLogin = true}>LOGIN TO CONTINUE</button>
    </div>

  {:else if myGames.length === 0}
    <div class="empty-state">
      <div class="empty-icon">◌</div>
      <div class="empty-title">NO SUBMISSIONS YET</div>
      <div class="empty-sub">You haven't uploaded any games. Ready to publish?</div>
      <a href="/upload" class="btn-cta">UPLOAD YOUR FIRST GAME ↗</a>
    </div>

  {:else}
    {#if pending.length > 0}
      <section class="game-section">
        <div class="section-header">
          <div class="section-eyebrow">// AWAITING ADMIN REVIEW</div>
          <h2 class="section-title">UNDER <span class="yellow">REVIEW</span></h2>
          <p class="section-sub">These games have been submitted and are waiting for approval.</p>
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
                <div class="card-meta"><span class="card-url">↗ {s.url}</span></div>
                <p class="card-desc">{s.description}</p>
                <div class="card-notice" style="border-color:{cfg.border};color:{cfg.color}">◌ &nbsp;Submission is in queue.</div>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

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
<Footer {isAdmin} />

<!-- LOGIN MODAL -->
<LoginModal open={showLogin} onClose={() => (showLogin = false)} />

<style>
  .page-header{position:relative;z-index:10;padding:140px 60px 60px;border-bottom:1px solid rgba(255,0,110,.08);overflow:hidden;}
  .header-orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}
  .header-orb.orb1{width:400px;height:400px;background:rgba(255,0,110,.06);top:-80px;right:5%;}
  .header-orb.orb2{width:300px;height:300px;background:rgba(191,0,255,.06);bottom:-60px;left:10%;}
  .header-inner{position:relative;z-index:2;max-width:800px;margin:0 auto;text-align:center;}
  .header-eyebrow{font-family:'Share Tech Mono',monospace;font-size:.8rem;letter-spacing:.35em;text-transform:uppercase;color:var(--neon-pink);text-shadow:0 0 10px var(--neon-pink);margin-bottom:16px;}
  .header-title{font-family:'Bebas Neue',sans-serif;font-size:clamp(3.5rem,8vw,9rem);letter-spacing:.04em;line-height:.95;margin-bottom:20px;}
  .header-title span{color:var(--neon-pink);text-shadow:0 0 30px var(--neon-pink);}
  .header-sub{font-family:'Share Tech Mono',monospace;font-size:.78rem;color:rgba(224,224,255,.4);letter-spacing:.08em;line-height:1.8;margin:0 auto;max-width:500px;}

  .page-main{position:relative;z-index:10;padding:60px;max-width:1100px;margin:0 auto;}

  .empty-state{text-align:center;padding:100px 20px;display:flex;flex-direction:column;align-items:center;gap:16px;}
  .empty-icon{font-size:4rem;color:rgba(0,255,249,.15);}
  .empty-title{font-family:'Bebas Neue',sans-serif;font-size:2.5rem;letter-spacing:.1em;color:rgba(224,224,255,.3);}
  .empty-sub{font-family:'Share Tech Mono',monospace;font-size:.9rem;letter-spacing:.1em;color:rgba(224,224,255,.2);margin-bottom:8px;}
  .btn-cta{font-family:'Share Tech Mono',monospace;font-size:.9rem;letter-spacing:.2em;text-transform:uppercase;background:transparent;color:var(--neon-cyan);border:1px solid var(--neon-cyan);padding:14px 32px;cursor:none;transition:all .3s;text-decoration:none;display:inline-block;clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);text-shadow:0 0 8px var(--neon-cyan);box-shadow:0 0 20px rgba(0,255,249,.15);margin-top:8px;}
  .btn-cta:hover{background:rgba(0,255,249,.08);box-shadow:0 0 40px rgba(0,255,249,.35);}

  .game-section{margin-bottom:60px;}
  .section-header{margin-bottom:28px;}
  .section-eyebrow{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.3em;text-transform:uppercase;color:rgba(224,224,255,.35);margin-bottom:8px;}
  .section-title{font-family:'Bebas Neue',sans-serif;font-size:2.4rem;letter-spacing:.05em;margin-bottom:8px;}
  .section-title .cyan{color:var(--neon-cyan);text-shadow:0 0 20px var(--neon-cyan);}
  .section-title .yellow{color:var(--neon-yellow);text-shadow:0 0 20px var(--neon-yellow);}
  .section-title .pink{color:var(--neon-pink);text-shadow:0 0 20px var(--neon-pink);}
  .section-sub{font-family:'Share Tech Mono',monospace;font-size:.68rem;letter-spacing:.06em;color:rgba(224,224,255,.3);line-height:1.7;max-width:600px;}

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
  .card-desc{font-family:'Share Tech Mono',monospace;font-size:.8rem;letter-spacing:.04em;color:rgba(224,224,255,.3);line-height:1.7;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-clamp:2;overflow:hidden;}
  .card-notice{font-family:'Share Tech Mono',monospace;font-size:.62rem;letter-spacing:.1em;line-height:1.6;border-left:2px solid;padding:8px 12px;margin-top:4px;background:rgba(0,0,0,.2);}
  .btn-resubmit{font-family:'Share Tech Mono',monospace;font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;background:transparent;color:var(--neon-pink);border:1px solid rgba(255,0,110,.4);padding:8px 20px;cursor:none;transition:all .3s;text-decoration:none;display:inline-block;clip-path:polygon(8px 0%,100% 0%,calc(100% - 8px) 100%,0% 100%);text-shadow:0 0 8px var(--neon-pink);margin-top:4px;align-self:flex-start;}
  .btn-resubmit:hover{background:rgba(255,0,110,.08);box-shadow:0 0 20px rgba(255,0,110,.2);}

  .upload-cta{margin-top:40px;}
  .upload-cta-inner{display:flex;align-items:center;justify-content:space-between;gap:40px;border:1px solid rgba(255,230,0,.2);padding:40px 50px;background:rgba(255,230,0,.02);clip-path:polygon(16px 0%,100% 0%,calc(100% - 16px) 100%,0% 100%);}
  .cta-eyebrow{font-family:'Share Tech Mono',monospace;font-size:.6rem;letter-spacing:.3em;text-transform:uppercase;color:var(--neon-yellow);text-shadow:0 0 8px var(--neon-yellow);margin-bottom:8px;}
  .cta-title{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:.05em;}
  .cta-title span{color:var(--neon-yellow);text-shadow:0 0 20px var(--neon-yellow);}
  .btn-upload{font-family:'Share Tech Mono',monospace;font-size:.9rem;letter-spacing:.15em;text-transform:uppercase;background:transparent;color:var(--neon-yellow);border:1px solid var(--neon-yellow);padding:16px 36px;cursor:none;transition:all .3s;flex-shrink:0;text-decoration:none;display:inline-block;clip-path:polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);text-shadow:0 0 10px var(--neon-yellow);box-shadow:0 0 20px rgba(255,230,0,.15);}
  .btn-upload:hover{background:rgba(255,230,0,.08);box-shadow:0 0 40px rgba(255,230,0,.35);transform:translateY(-2px);}
</style>