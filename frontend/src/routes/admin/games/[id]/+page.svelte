<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';

  let { data } = $props();
  let game = $derived(data.game);
  let loading = $state<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

  async function deactivateGame() {
    const reason = prompt('Reason for deactivation:');
    if (!reason) return;

    loading = 'deactivate';
    await fetch(`${API_URL}/admin/game-requests/${game.id}/deactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });
    loading = null;
    await invalidateAll();
  }

  async function reactivateGame() {
    loading = 'reactivate';
    await fetch(`${API_URL}/admin/game-requests/${game.id}/reactivate`, {
      method: 'POST',
      credentials: 'include',
    });
    loading = null;
    await invalidateAll();
  }

  function formatDate(date: string | null) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
</script>

<svelte:head>
  <title>PROGCHAMP // {game.title}</title>
</svelte:head>

<div class="back-link-row">
  <a href="/admin/games" class="back-link">← Back to Games</a>
</div>

<div class="page-header">
  <div class="page-eyebrow">// GAME DETAIL</div>
  <h1 class="page-title">{game.title}</h1>
</div>

<div class="detail-grid">

  <div class="main-col">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Game Details</div>
        <span class="badge" class:badge-active={game.isActive} class:badge-deactivated={!game.isActive}>
          {game.isActive ? 'Active' : 'Deactivated'}
        </span>
      </div>
      <div class="panel-body">
        <div class="field">
          <div class="field-label">Title</div>
          <div class="field-value">{game.title}</div>
        </div>
        <div class="field">
          <div class="field-label">Game URL</div>
          <a href={game.gameUrl} target="_blank" class="field-link">{game.gameUrl}</a>
        </div>
        {#if game.description}
          <div class="field">
            <div class="field-label">Description</div>
            <div class="field-value field-desc">{game.description}</div>
          </div>
        {/if}
        {#if game.tags?.length > 0}
          <div class="field">
            <div class="field-label">Tags</div>
            <div class="tags-row">
              {#each game.tags as t}
                <span class="tag">{t.tag.name}</span>
              {/each}
            </div>
          </div>
        {/if}
        {#if !game.isActive && game.deactivationReason}
          <div class="field">
            <div class="field-label">Deactivation Reason</div>
            <div class="field-value field-desc deactivation-reason">{game.deactivationReason}</div>
          </div>
        {/if}
      </div>
    </div>

    {#if game.coverMedia}
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Cover Media</div>
        </div>
        <div class="panel-body">
          <div class="media-item">
            <img src={game.coverMedia.r2Key} alt={game.title} />
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="side-col">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Creator</div>
      </div>
      <div class="panel-body">
        <div class="user-cell">
          {#if game.creator?.avatarUrl}
            <img class="user-avatar-img" src={game.creator.avatarUrl} alt={game.creator.name} referrerpolicy="no-referrer" />
          {:else}
            <div class="user-avatar">{(game.creator?.name ?? '?')[0].toUpperCase()}</div>
          {/if}
          <div>
            <div class="user-name">{game.creator?.name ?? '—'}</div>
          </div>
        </div>
        <div class="field" style="margin-top:16px">
          <div class="field-label">Added</div>
          <div class="field-value">{formatDate(game.createdAt)}</div>
        </div>
        {#if !game.isActive && game.deactivatedAt}
          <div class="field" style="margin-top:12px">
            <div class="field-label">Deactivated At</div>
            <div class="field-value">{formatDate(game.deactivatedAt)}</div>
          </div>
        {/if}
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Actions</div>
      </div>
      <div class="panel-body">
        <div class="action-buttons">
          {#if game.isActive}
            <button
              class="btn-action btn-reject"
              disabled={loading !== null}
              onclick={deactivateGame}
            >
              {loading === 'deactivate' ? '...' : 'Deactivate Game'}
            </button>
          {:else}
            <button
              class="btn-action btn-approve"
              disabled={loading !== null}
              onclick={reactivateGame}
            >
              {loading === 'reactivate' ? '...' : 'Reactivate Game'}
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>

</div>

<style>
  .back-link-row { margin-bottom:24px; }
  .back-link { font-family:'Share Tech Mono',monospace; font-size:.62rem; letter-spacing:.15em; text-transform:uppercase; color:rgba(224,224,255,.4); text-decoration:none; transition:color .2s; }
  .back-link:hover { color:var(--neon-cyan); }

  .page-header { margin-bottom:40px; }
  .page-eyebrow { font-family:'Share Tech Mono',monospace; font-size:.62rem; letter-spacing:.3em; text-transform:uppercase; color:var(--neon-pink); text-shadow:0 0 8px var(--neon-pink); margin-bottom:10px; }
  .page-title { font-family:'Bebas Neue',sans-serif; font-size:3.5rem; letter-spacing:.05em; line-height:1; color:var(--text); }

  .detail-grid { display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start; }
  .main-col { display:flex; flex-direction:column; gap:24px; }
  .side-col { display:flex; flex-direction:column; gap:24px; }

  .panel { border:1px solid rgba(0,255,249,.12); background:rgba(10,0,24,.6); }
  .panel-header { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid rgba(0,255,249,.08); }
  .panel-title { font-family:'Bebas Neue',sans-serif; font-size:1.1rem; letter-spacing:.1em; color:rgba(224,224,255,.8); }
  .panel-body { padding:20px 24px; }

  .field { margin-bottom:16px; }
  .field:last-child { margin-bottom:0; }
  .field-label { font-family:'Share Tech Mono',monospace; font-size:.55rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(224,224,255,.3); margin-bottom:6px; }
  .field-value { font-family:'Share Tech Mono',monospace; font-size:.68rem; color:rgba(224,224,255,.8); letter-spacing:.04em; }
  .field-desc { line-height:1.6; }
  .field-link { font-family:'Share Tech Mono',monospace; font-size:.68rem; color:var(--neon-cyan); letter-spacing:.04em; text-decoration:none; }
  .field-link:hover { opacity:.7; }
  .deactivation-reason { color:var(--neon-pink); }

  .tags-row { display:flex; flex-wrap:wrap; gap:8px; }
  .tag { font-family:'Share Tech Mono',monospace; font-size:.52rem; letter-spacing:.12em; padding:3px 10px; text-transform:uppercase; background:rgba(191,0,255,.1); border:1px solid rgba(191,0,255,.3); color:var(--neon-purple); }

  .media-item img { width:100%; aspect-ratio:16/9; object-fit:cover; border:1px solid rgba(0,255,249,.1); }

  .user-cell { display:flex; align-items:center; gap:12px; }
  .user-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,var(--neon-purple),var(--neon-pink)); display:flex; align-items:center; justify-content:center; font-size:.8rem; font-family:'Bebas Neue',sans-serif; color:white; flex-shrink:0; }
  .user-avatar-img { width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid rgba(0,255,249,.3); flex-shrink:0; }
  .user-name { font-family:'Share Tech Mono',monospace; font-size:.65rem; color:rgba(224,224,255,.8); letter-spacing:.04em; }

  .action-buttons { display:flex; flex-direction:column; gap:10px; }
  .btn-action { font-family:'Share Tech Mono',monospace; font-size:.62rem; letter-spacing:.15em; text-transform:uppercase; padding:12px 20px; cursor:none; border:none; transition:all .2s; width:100%; }
  .btn-action:disabled { opacity:.4; }
  .btn-approve { background:rgba(0,255,100,.1); color:#00ff64; border:1px solid rgba(0,255,100,.3); }
  .btn-approve:hover:not(:disabled) { background:rgba(0,255,100,.2); }
  .btn-reject { background:rgba(255,0,110,.08); color:var(--neon-pink); border:1px solid rgba(255,0,110,.25); }
  .btn-reject:hover:not(:disabled) { background:rgba(255,0,110,.18); }

  .badge { font-family:'Share Tech Mono',monospace; font-size:.52rem; letter-spacing:.12em; padding:3px 10px; text-transform:uppercase; display:inline-block; }
  .badge-active { background:rgba(0,255,100,.08); border:1px solid rgba(0,255,100,.25); color:#00ff64; }
  .badge-deactivated { background:rgba(255,0,110,.08); border:1px solid rgba(255,0,110,.25); color:var(--neon-pink); }
</style>