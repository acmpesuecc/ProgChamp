<script lang="ts">
  import { goto } from '$app/navigation';

  let { data } = $props();

  let requests = $derived(data.requests ?? []);
  let nextCursor = $derived(data.nextCursor ?? null);

  function timeAgo(date: string | null) {
    if (!date) return '—';
    const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  }
</script>

<svelte:head>
  <title>PROGCHAMP // Game Requests</title>
</svelte:head>

<div class="page-header">
  <div class="page-eyebrow">// PENDING REVIEW</div>
  <h1 class="page-title">GAME <span>REQUESTS</span></h1>
</div>

{#if requests.length === 0}
  <div class="empty-state">// NO PENDING REQUESTS — ALL CLEAR</div>
{:else}
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Game</th>
          <th>Submitted By</th>
          <th>URL</th>
          <th>Submitted</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each requests as req}
          <tr class="clickable-row" onclick={() => goto(`/admin/requests/${req.id}`)}>
            <td>
              <div class="game-cell">
                <div class="game-thumb">
                  {#if req.coverMedia?.r2Key}
                    <img src={req.coverMedia.r2Key} alt={req.title} />
                  {:else}
                    🎮
                  {/if}
                </div>
                <span class="game-title">{req.title}</span>
              </div>
            </td>
            <td>{req.submitter?.name ?? req.submitter?.email ?? '—'}</td>
            <td><span class="url-cell">{req.gameUrl}</span></td>
            <td>{timeAgo(req.createdAt)}</td>
            <td><span class="badge badge-pending">Pending</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if nextCursor}
    <div class="pagination">
      <a href={`/admin/requests?cursor=${nextCursor}`} class="btn-load-more">
        Load More →
      </a>
    </div>
  {/if}
{/if}

<style>
  .page-header { margin-bottom:40px; }
  .page-eyebrow { font-family:'Share Tech Mono',monospace; font-size:.62rem; letter-spacing:.3em; text-transform:uppercase; color:var(--neon-pink); text-shadow:0 0 8px var(--neon-pink); margin-bottom:10px; }
  .page-title { font-family:'Bebas Neue',sans-serif; font-size:4rem; letter-spacing:.05em; line-height:1; }
  .page-title span { color:var(--neon-cyan); text-shadow:0 0 20px var(--neon-cyan); }

  .empty-state { font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.15em; color:rgba(0,255,249,.3); text-align:center; padding:80px 0; }

  .table-wrap { border:1px solid rgba(0,255,249,.12); background:rgba(10,0,24,.6); }
  table { width:100%; border-collapse:collapse; }
  th { font-family:'Share Tech Mono',monospace; font-size:.57rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(224,224,255,.3); text-align:left; padding:14px 20px; border-bottom:1px solid rgba(255,255,255,.06); }
  td { font-family:'Share Tech Mono',monospace; font-size:.63rem; padding:14px 20px; border-bottom:1px solid rgba(255,255,255,.04); color:rgba(224,224,255,.7); letter-spacing:.04em; }
  .clickable-row { cursor:none; transition:background .15s; }
  .clickable-row:hover td { background:rgba(0,255,249,.04); }
  .clickable-row:last-child td { border-bottom:none; }

  .game-cell { display:flex; align-items:center; gap:12px; }
  .game-thumb { width:36px; height:36px; background:linear-gradient(135deg,#0a0020,#2a0060); display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0; border:1px solid rgba(191,0,255,.2); overflow:hidden; }
  .game-thumb img { width:100%; height:100%; object-fit:cover; }
  .game-title { font-family:'Bebas Neue',sans-serif; font-size:1rem; letter-spacing:.06em; color:rgba(224,224,255,.9); }

  .url-cell { color:rgba(0,255,249,.5); max-width:200px; display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

  .badge { display:inline-block; font-family:'Share Tech Mono',monospace; font-size:.52rem; letter-spacing:.12em; padding:3px 10px; text-transform:uppercase; }
  .badge-pending { background:rgba(255,230,0,.1); border:1px solid rgba(255,230,0,.3); color:var(--neon-yellow); }

  .pagination { display:flex; justify-content:center; margin-top:32px; }
  .btn-load-more { font-family:'Share Tech Mono',monospace; font-size:.62rem; letter-spacing:.15em; text-transform:uppercase; color:var(--neon-cyan); text-decoration:none; border:1px solid rgba(0,255,249,.3); padding:10px 28px; transition:all .2s; }
  .btn-load-more:hover { background:rgba(0,255,249,.06); }
</style>