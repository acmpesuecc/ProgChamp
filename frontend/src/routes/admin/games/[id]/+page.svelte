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

  async function deleteGame() {
    const reason = prompt(`Permanently delete "${game.title}"? This cannot be undone.\n\nReason for deletion:`);
    if (!reason) return;
  
    loading = 'delete';
    const res = await fetch(`${API_URL}/admin/game-requests/game/${game.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });
    loading = null;
  
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? 'Failed to delete game');
      return;
    }
    await goto('/admin/games');
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
          <button
            class="btn-action btn-delete"
            disabled={loading !== null}
            onclick={deleteGame}
          >
            {loading === 'delete' ? '...' : 'Delete Game'}
          </button>
        </div>
      </div>
    </div>
  </div>

</div>

<style>
  .back-link-row { margin-bottom:24px; }
  .back-link { font-family:'VT323',monospace; font-size:1.12rem; letter-spacing:.15em; text-transform:uppercase; color:rgba(245,205,210,0.65); text-decoration:none; transition:color .2s; }
  .back-link:hover { color:var(--neon-cyan); }

  .page-header { margin-bottom:40px; }
  .page-eyebrow { font-family:'VT323',monospace; font-size:1.12rem; letter-spacing:.3em; text-transform:uppercase; color:var(--gold);  margin-bottom:10px; }
  .page-title { font-family:'Press Start 2P',sans-serif; font-size: 2.4rem; letter-spacing:.05em; line-height:1; color:var(--text); }

  .detail-grid { display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start; }
  .main-col { display:flex; flex-direction:column; gap:24px; }
  .side-col { display:flex; flex-direction:column; gap:24px; }

  .panel { border:1px solid rgba(232,93,130,0.27); background:rgba(30,14,30,.6); }
  .panel-header { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; }
  .panel-title { font-family:'Press Start 2P',sans-serif; font-size:1.1rem; letter-spacing:.1em; color:rgba(245,205,210,0.8); }
  .panel-body { padding:20px 24px; }

  .field { margin-bottom:16px; }
  .field:last-child { margin-bottom:0; }
  .field-label { font-family:'VT323',monospace; font-size:1.05rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(245,205,210,0.55); margin-bottom:6px; }
  .field-value { font-family:'VT323',monospace; font-size:1.18rem; color:rgba(245,205,210,0.8); letter-spacing:.04em; }
  .field-desc { line-height:1.6; }
  .field-link { font-family:'VT323',monospace; font-size:1.18rem; color:var(--neon-cyan); letter-spacing:.04em; text-decoration:none; }
  .field-link:hover { opacity:.7; }
  .deactivation-reason { color:var(--neon-pink); }

  .tags-row { display:flex; flex-wrap:wrap; gap:8px; }
  .tag { font-family:'VT323',monospace; font-size:1.02rem; letter-spacing:.12em; padding:3px 10px; text-transform:uppercase; background:rgba(124,77,191,0.25); border:1px solid rgba(124,77,191,0.45); color:var(--neon-purple); }

  .media-item img { width:100%; aspect-ratio:16/9; object-fit:cover; border:1px solid rgba(232,93,130,0.25); }

  .user-cell { display:flex; align-items:center; gap:12px; }
  .user-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,var(--neon-purple),var(--neon-pink)); display:flex; align-items:center; justify-content:center; font-size:.8rem; font-family:'Press Start 2P',sans-serif; color:white; flex-shrink:0; }
  .user-avatar-img { width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid rgba(232,93,130,0.45); flex-shrink:0; }
  .user-name { font-family:'VT323',monospace; font-size:1.15rem; color:rgba(245,205,210,0.8); letter-spacing:.04em; }

  .action-buttons { display:flex; flex-direction:column; gap:10px; }
  .btn-action { font-family:'VT323',monospace; font-size:1.12rem; letter-spacing:.15em; text-transform:uppercase; padding:12px 20px; cursor: var(--cursor-pointer); border:none; transition:all .2s; width:100%; }
  .btn-action:disabled { opacity:.4; }
  .btn-approve { background:rgba(143,191,139,.1); color:#8FBF8B; border:1px solid rgba(143,191,139,.3); }
  .btn-approve:hover:not(:disabled) { background:rgba(143,191,139,.2); }
  .btn-reject { background:rgba(124,77,191,0.23); color:var(--neon-pink); border:1px solid rgba(124,77,191,0.4); }
  .btn-reject:hover:not(:disabled) { background:rgba(124,77,191,0.33); }
  .btn-delete { background:rgba(255,80,80,.1); color:rgba(255,100,100,.9); border:1px solid rgba(255,80,80,.35); }
  .btn-delete:hover:not(:disabled) { background:rgba(255,80,80,.2); }

  .badge { font-family:'VT323',monospace; font-size:1.02rem; letter-spacing:.12em; padding:3px 10px; text-transform:uppercase; display:inline-block; }
  .badge-active { background:rgba(143,191,139,.08); border:1px solid rgba(143,191,139,.25); color:#8FBF8B; }
  .badge-deactivated { background:rgba(124,77,191,0.23); border:1px solid rgba(124,77,191,0.4); color:var(--neon-pink); }
</style>