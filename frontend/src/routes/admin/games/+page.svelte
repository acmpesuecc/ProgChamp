<script lang="ts">
  import { invalidateAll, goto } from '$app/navigation';

  let { data } = $props();

  let games = $derived(data.games ?? []);
  let nextCursor = $derived(data.nextCursor ?? null);
  let currentStatus = $derived(data.status ?? '');
  let loading = $state<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

  async function deactivateGame(e: MouseEvent, gameId: string) {
    e.stopPropagation();
    const reason = prompt('Reason for deactivation:');
    if (!reason) return;

    loading = gameId;
    await fetch(`${API_URL}/admin/game-requests/${gameId}/deactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });
    loading = null;
    await invalidateAll();
  }

  async function reactivateGame(e: MouseEvent, gameId: string) {
    e.stopPropagation();
    loading = gameId;
    await fetch(`${API_URL}/admin/game-requests/${gameId}/reactivate`, {
      method: 'POST',
      credentials: 'include',
    });
    loading = null;
    await invalidateAll();
  }

  function applyFilter(status: string) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    goto(`/admin/games?${params.toString()}`);
  }

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
  <title>PROGCHAMP // Games</title>
</svelte:head>

<div class="page-header">
  <div class="page-eyebrow">// GAME VAULT</div>
  <h1 class="page-title">ALL <span>GAMES</span></h1>
</div>

<div class="filter-row">
  <button class="filter-btn" class:active={currentStatus === ''} onclick={() => applyFilter('')}>All</button>
  <button class="filter-btn" class:active={currentStatus === 'active'} onclick={() => applyFilter('active')}>Active</button>
  <button class="filter-btn" class:active={currentStatus === 'deactivated'} onclick={() => applyFilter('deactivated')}>Deactivated</button>
</div>

{#if games.length === 0}
  <div class="empty-state">// NO GAMES FOUND</div>
{:else}
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Game</th>
          <th>Creator</th>
          <th>Tags</th>
          <th>Status</th>
          <th>Added</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each games as game}
          <tr class="clickable-row" class:deactivated={!game.isActive} onclick={() => goto(`/admin/games/${game.id}`)}>
            <td>
              <div class="game-cell">
                <div class="game-thumb">
                  {#if game.coverMedia?.r2Key}
                    <img src={game.coverMedia.r2Key} alt={game.title} />
                  {:else}
                    🎮
                  {/if}
                </div>
                <div>
                  <div class="game-title">{game.title}</div>
                  <a href={game.gameUrl} target="_blank" class="game-url" onclick={(e) => e.stopPropagation()}>{game.gameUrl}</a>
                </div>
              </div>
            </td>
            <td>{game.creator?.name ?? '—'}</td>
            <td>
              <div class="tags-row">
                {#each (game.tags ?? []).slice(0, 3) as t}
                  <span class="tag">{t.tag.name}</span>
                {/each}
                {#if (game.tags ?? []).length > 3}
                  <span class="tag-more">+{game.tags.length - 3}</span>
                {/if}
              </div>
            </td>
            <td>
              <span class="badge" class:badge-active={game.isActive} class:badge-deactivated={!game.isActive}>
                {game.isActive ? 'Active' : 'Deactivated'}
              </span>
            </td>
            <td>{timeAgo(game.createdAt)}</td>
            <td>
              {#if game.isActive}
                <button
                  class="btn-sm btn-reject"
                  disabled={loading === game.id}
                  onclick={(e) => deactivateGame(e, game.id)}
                >
                  {loading === game.id ? '...' : 'Deactivate'}
                </button>
              {:else}
                <button
                  class="btn-sm btn-approve"
                  disabled={loading === game.id}
                  onclick={(e) => reactivateGame(e, game.id)}
                >
                  {loading === game.id ? '...' : 'Reactivate'}
                </button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if nextCursor}
    <div class="pagination">
      <a href={`/admin/games?cursor=${nextCursor}&status=${currentStatus}`} class="btn-load-more">
        Load More →
      </a>
    </div>
  {/if}
{/if}

<style>
  .page-header { margin-bottom:32px; }
  .page-eyebrow { font-family:'Share Tech Mono',monospace; font-size:.62rem; letter-spacing:.3em; text-transform:uppercase; color:var(--neon-pink); text-shadow:0 0 8px var(--neon-pink); margin-bottom:10px; }
  .page-title { font-family:'Bebas Neue',sans-serif; font-size:4rem; letter-spacing:.05em; line-height:1; }
  .page-title span { color:var(--neon-cyan); text-shadow:0 0 20px var(--neon-cyan); }

  .filter-row { display:flex; gap:8px; margin-bottom:24px; }
  .filter-btn { font-family:'Share Tech Mono',monospace; font-size:.58rem; letter-spacing:.15em; text-transform:uppercase; padding:6px 18px; background:transparent; border:1px solid rgba(224,224,255,.1); color:rgba(224,224,255,.35); cursor:none; transition:all .2s; }
  .filter-btn.active { color:var(--neon-cyan); border-color:var(--neon-cyan); background:rgba(0,255,249,.06); }
  .filter-btn:hover:not(.active) { color:rgba(224,224,255,.6); border-color:rgba(224,224,255,.2); }

  .empty-state { font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.15em; color:rgba(0,255,249,.3); text-align:center; padding:80px 0; }

  .table-wrap { border:1px solid rgba(0,255,249,.12); background:rgba(10,0,24,.6); }
  table { width:100%; border-collapse:collapse; }
  th { font-family:'Share Tech Mono',monospace; font-size:.57rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(224,224,255,.3); text-align:left; padding:14px 20px; border-bottom:1px solid rgba(255,255,255,.06); }
  td { font-family:'Share Tech Mono',monospace; font-size:.63rem; padding:14px 20px; border-bottom:1px solid rgba(255,255,255,.04); color:rgba(224,224,255,.7); letter-spacing:.04em; }
  .clickable-row { cursor:none; transition:background .15s; }
  .clickable-row:hover td { background:rgba(0,255,249,.04); }
  .clickable-row:last-child td { border-bottom:none; }
  .clickable-row.deactivated td { opacity:.45; }

  .game-cell { display:flex; align-items:center; gap:12px; }
  .game-thumb { width:36px; height:36px; background:linear-gradient(135deg,#0a0020,#2a0060); display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0; border:1px solid rgba(191,0,255,.2); overflow:hidden; }
  .game-thumb img { width:100%; height:100%; object-fit:cover; }
  .game-title { font-family:'Bebas Neue',sans-serif; font-size:1rem; letter-spacing:.06em; color:rgba(224,224,255,.9); }
  .game-url { font-family:'Share Tech Mono',monospace; font-size:.52rem; color:rgba(0,255,249,.4); text-decoration:none; display:block; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .game-url:hover { color:var(--neon-cyan); }

  .tags-row { display:flex; flex-wrap:wrap; gap:4px; }
  .tag { font-family:'Share Tech Mono',monospace; font-size:.48rem; letter-spacing:.1em; padding:2px 8px; text-transform:uppercase; background:rgba(191,0,255,.1); border:1px solid rgba(191,0,255,.3); color:var(--neon-purple); }
  .tag-more { font-family:'Share Tech Mono',monospace; font-size:.48rem; color:rgba(224,224,255,.3); padding:2px 4px; }

  .badge { font-family:'Share Tech Mono',monospace; font-size:.52rem; letter-spacing:.12em; padding:3px 10px; text-transform:uppercase; display:inline-block; }
  .badge-active { background:rgba(0,255,100,.08); border:1px solid rgba(0,255,100,.25); color:#00ff64; }
  .badge-deactivated { background:rgba(255,0,110,.08); border:1px solid rgba(255,0,110,.25); color:var(--neon-pink); }

  .btn-sm { font-family:'Share Tech Mono',monospace; font-size:.55rem; letter-spacing:.12em; text-transform:uppercase; padding:5px 14px; cursor:none; border:none; transition:all .2s; }
  .btn-sm:disabled { opacity:.4; }
  .btn-reject { background:rgba(255,0,110,.08); color:var(--neon-pink); border:1px solid rgba(255,0,110,.25); }
  .btn-reject:hover:not(:disabled) { background:rgba(255,0,110,.18); }
  .btn-approve { background:rgba(0,255,100,.08); color:#00ff64; border:1px solid rgba(0,255,100,.25); }
  .btn-approve:hover:not(:disabled) { background:rgba(0,255,100,.18); }

  .pagination { display:flex; justify-content:center; margin-top:32px; }
  .btn-load-more { font-family:'Share Tech Mono',monospace; font-size:.62rem; letter-spacing:.15em; text-transform:uppercase; color:var(--neon-cyan); text-decoration:none; border:1px solid rgba(0,255,249,.3); padding:10px 28px; transition:all .2s; }
  .btn-load-more:hover { background:rgba(0,255,249,.06); }
</style>