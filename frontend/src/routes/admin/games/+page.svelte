<script lang="ts">
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();

  let games = $derived(data.games ?? []);
  let nextCursor = $derived(data.nextCursor ?? null);
  let loading = $state<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

  async function deactivateGame(gameId: string) {
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

  function formatDate(date: string | null) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
</script>

<svelte:head>
  <title>PROGCHAMP // Games</title>
</svelte:head>

<div class="page-header">
  <div class="page-eyebrow">// GAME VAULT</div>
  <h1 class="page-title">ALL <span>GAMES</span></h1>
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
          <th>Score</th>
          <th>Views</th>
          <th>Tags</th>
          <th>Added</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each games as game}
          <tr>
            <td>
              <div class="game-cell">
                <div class="game-thumb">🎮</div>
                <div>
                  <div class="game-title">{game.title}</div>
                  <a href={game.gameUrl} target="_blank" class="game-url">{game.gameUrl}</a>
                </div>
              </div>
            </td>
            <td>{game.creator?.name ?? '—'}</td>
            <td><span class="score">{game.score}</span></td>
            <td>{game.viewCount}</td>
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
            <td>{formatDate(game.createdAt)}</td>
            <td>
              <button
                class="btn-sm btn-reject"
                disabled={loading === game.id}
                onclick={() => deactivateGame(game.id)}
              >
                {loading === game.id ? '...' : 'Deactivate'}
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if nextCursor}
    <div class="pagination">
      <a href={`/admin/games?cursor=${nextCursor}`} class="btn-load-more">
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
  tr:last-child td { border-bottom:none; }
  tr:hover td { background:rgba(0,255,249,.02); }

  .game-cell { display:flex; align-items:center; gap:12px; }
  .game-thumb { width:36px; height:36px; background:linear-gradient(135deg,#0a0020,#2a0060); display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0; border:1px solid rgba(191,0,255,.2); }
  .game-title { font-family:'Bebas Neue',sans-serif; font-size:1rem; letter-spacing:.06em; color:rgba(224,224,255,.9); }
  .game-url { font-family:'Share Tech Mono',monospace; font-size:.52rem; color:rgba(0,255,249,.4); text-decoration:none; display:block; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .game-url:hover { color:var(--neon-cyan); }

  .score { color:var(--neon-cyan); font-family:'Bebas Neue',sans-serif; font-size:1rem; }

  .tags-row { display:flex; flex-wrap:wrap; gap:4px; }
  .tag { font-family:'Share Tech Mono',monospace; font-size:.48rem; letter-spacing:.1em; padding:2px 8px; text-transform:uppercase; background:rgba(191,0,255,.1); border:1px solid rgba(191,0,255,.3); color:var(--neon-purple); }
  .tag-more { font-family:'Share Tech Mono',monospace; font-size:.48rem; color:rgba(224,224,255,.3); padding:2px 4px; }

  .btn-sm { font-family:'Share Tech Mono',monospace; font-size:.55rem; letter-spacing:.12em; text-transform:uppercase; padding:5px 14px; cursor:none; border:none; transition:all .2s; }
  .btn-sm:disabled { opacity:.4; }
  .btn-reject { background:rgba(255,0,110,.08); color:var(--neon-pink); border:1px solid rgba(255,0,110,.25); }
  .btn-reject:hover:not(:disabled) { background:rgba(255,0,110,.18); }

  .pagination { display:flex; justify-content:center; margin-top:32px; }
  .btn-load-more { font-family:'Share Tech Mono',monospace; font-size:.62rem; letter-spacing:.15em; text-transform:uppercase; color:var(--neon-cyan); text-decoration:none; border:1px solid rgba(0,255,249,.3); padding:10px 28px; transition:all .2s; }
  .btn-load-more:hover { background:rgba(0,255,249,.06); }
</style>