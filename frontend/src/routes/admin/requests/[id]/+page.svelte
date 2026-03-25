<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';

  let { data } = $props();
  let request = $derived(data.request);
  let loading = $state<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

  async function reviewRequest(status: 'approve' | 'reject') {
    loading = status;
    await fetch(`${API_URL}/admin/game-requests/${request.id}/${status}`, {
      method: 'POST',
      credentials: 'include',
    });
    loading = null;
    goto('/admin/requests');
  }

  function formatDate(date: string | null) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
</script>

<svelte:head>
  <title>PROGCHAMP // Request — {request.title}</title>
</svelte:head>

<div class="back-link-row">
  <a href="/admin/requests" class="back-link">← Back to Requests</a>
</div>

<div class="page-header">
  <div class="page-eyebrow">// GAME REQUEST</div>
  <h1 class="page-title">{request.title}</h1>
</div>

<div class="detail-grid">

  <div class="main-col">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Game Details</div>
        <span class="badge badge-pending">Pending</span>
      </div>
      <div class="panel-body">
        <div class="field">
          <div class="field-label">Title</div>
          <div class="field-value">{request.title}</div>
        </div>
        <div class="field">
          <div class="field-label">Game URL</div>
          <a href={request.gameUrl} target="_blank" class="field-link">{request.gameUrl}</a>
        </div>
        {#if request.description}
          <div class="field">
            <div class="field-label">Description</div>
            <div class="field-value field-desc">{request.description}</div>
          </div>
        {/if}
        {#if request.tags?.length > 0}
          <div class="field">
            <div class="field-label">Tags</div>
            <div class="tags-row">
              {#each request.tags as t}
                <span class="tag">{t.tag.name}</span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>

    {#if request.media?.length > 0}
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Media</div>
        </div>
        <div class="panel-body">
          <div class="media-grid">
            {#each request.media as m}
              <div class="media-item">
                {#if m.mediaType === 'image'}
                  <img src={m.r2Key} alt="Game media" />
                {:else}
                  <video src={m.r2Key} controls></video>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="side-col">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Submitted By</div>
      </div>
      <div class="panel-body">
        <div class="user-cell">
          {#if request.submitter?.avatarUrl}
            <img class="user-avatar-img" src={request.submitter.avatarUrl} alt={request.submitter.name} referrerpolicy="no-referrer" />
          {:else}
            <div class="user-avatar">{(request.submitter?.name ?? '?')[0].toUpperCase()}</div>
          {/if}
          <div>
            <div class="user-name">{request.submitter?.name ?? '—'}</div>
            <div class="user-email">{request.submitter?.email ?? '—'}</div>
          </div>
        </div>
        <div class="field" style="margin-top:16px">
          <div class="field-label">Submitted</div>
          <div class="field-value">{formatDate(request.createdAt)}</div>
        </div>
      </div>
    </div>

    {#if request.status === 'pending'}
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Decision</div>
        </div>
        <div class="panel-body">
          <div class="action-buttons">
            <button
              class="btn-action btn-approve"
              disabled={loading !== null}
              onclick={() => reviewRequest('approve')}
            >
              {loading === 'approve' ? '...' : 'Approve Game'}
            </button>
            <button
              class="btn-action btn-reject"
              disabled={loading !== null}
              onclick={() => reviewRequest('reject')}
            >
              {loading === 'reject' ? '...' : 'Reject Game'}
            </button>
          </div>
        </div>
      </div>
    {:else}
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Decision</div>
        </div>
        <div class="panel-body">
          <div class="field">
            <div class="field-label">Status</div>
            <span class="badge {request.status === 'approved' ? 'badge-approved' : 'badge-rejected'}">
              {request.status}
            </span>
          </div>
          {#if request.reviewer}
            <div class="field" style="margin-top:12px">
              <div class="field-label">Reviewed By</div>
              <div class="field-value">{request.reviewer.name}</div>
            </div>
          {/if}
          {#if request.reviewedAt}
            <div class="field" style="margin-top:12px">
              <div class="field-label">Reviewed At</div>
              <div class="field-value">{formatDate(request.reviewedAt)}</div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
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

  .tags-row { display:flex; flex-wrap:wrap; gap:8px; }
  .tag { font-family:'Share Tech Mono',monospace; font-size:.52rem; letter-spacing:.12em; padding:3px 10px; text-transform:uppercase; background:rgba(191,0,255,.1); border:1px solid rgba(191,0,255,.3); color:var(--neon-purple); }

  .media-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; }
  .media-item img, .media-item video { width:100%; aspect-ratio:16/9; object-fit:cover; border:1px solid rgba(0,255,249,.1); }

  .user-cell { display:flex; align-items:center; gap:12px; }
  .user-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,var(--neon-purple),var(--neon-pink)); display:flex; align-items:center; justify-content:center; font-size:.8rem; font-family:'Bebas Neue',sans-serif; color:white; flex-shrink:0; }
  .user-avatar-img { width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid rgba(0,255,249,.3); flex-shrink:0; }
  .user-name { font-family:'Share Tech Mono',monospace; font-size:.65rem; color:rgba(224,224,255,.8); letter-spacing:.04em; }
  .user-email { font-family:'Share Tech Mono',monospace; font-size:.55rem; color:rgba(224,224,255,.3); letter-spacing:.04em; margin-top:2px; }

  .action-buttons { display:flex; flex-direction:column; gap:10px; }
  .btn-action { font-family:'Share Tech Mono',monospace; font-size:.62rem; letter-spacing:.15em; text-transform:uppercase; padding:12px 20px; cursor:none; border:none; transition:all .2s; width:100%; }
  .btn-action:disabled { opacity:.4; }
  .btn-approve { background:rgba(0,255,100,.1); color:#00ff64; border:1px solid rgba(0,255,100,.3); }
  .btn-approve:hover:not(:disabled) { background:rgba(0,255,100,.2); }
  .btn-reject { background:rgba(255,0,110,.08); color:var(--neon-pink); border:1px solid rgba(255,0,110,.25); }
  .btn-reject:hover:not(:disabled) { background:rgba(255,0,110,.18); }

  .badge { display:inline-block; font-family:'Share Tech Mono',monospace; font-size:.52rem; letter-spacing:.12em; padding:3px 10px; text-transform:uppercase; }
  .badge-pending  { background:rgba(255,230,0,.1);   border:1px solid rgba(255,230,0,.3);   color:var(--neon-yellow); }
  .badge-approved { background:rgba(0,255,100,.1);   border:1px solid rgba(0,255,100,.3);   color:#00ff64; }
  .badge-rejected { background:rgba(255,0,110,.1);   border:1px solid rgba(255,0,110,.3);   color:var(--neon-pink); }
</style>