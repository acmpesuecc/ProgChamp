<script lang="ts">
  import { goto } from '$app/navigation';

  let { data } = $props();

  let appeals = $derived(data.appeals ?? []);
  let nextCursor = $derived(data.nextCursor ?? null);

  function timeAgo(date: string | null) {
    if (!date) return '—';
    const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  }

  function appealTypeLabel(type: string) {
    if (type === 'user_unban_appeal') return 'Unban Appeal';
    if (type === 'game_report_appeal') return 'Game Report Appeal';
    return type;
  }
</script>

<svelte:head>
  <title>PROGCHAMP // Appeals</title>
</svelte:head>

<div class="page-header">
  <div class="page-eyebrow">// USER APPEALS</div>
  <h1 class="page-title">APPEALS <span>QUEUE</span></h1>
</div>

{#if appeals.length === 0}
  <div class="empty-state">// NO APPEALS — ALL CLEAR</div>
{:else}
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>Type</th>
          <th>Related Game</th>
          <th>Status</th>
          <th>Submitted</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each appeals as appeal}
          <tr class="clickable-row" onclick={() => goto(`/admin/appeals/${appeal.id}`)}>
            <td>
              <div class="user-cell">
                {#if appeal.submitter?.avatarUrl}
                  <img class="user-avatar-img" src={appeal.submitter.avatarUrl} alt={appeal.submitter.name} referrerpolicy="no-referrer" />
                {:else}
                  <div class="user-avatar">{(appeal.submitter?.name ?? '?')[0].toUpperCase()}</div>
                {/if}
                <span>{appeal.submitter?.name ?? appeal.submitter?.email ?? '—'}</span>
              </div>
            </td>
            <td><span class="type-label">{appealTypeLabel(appeal.requestType)}</span></td>
            <td>{appeal.relatedGame?.title ?? '—'}</td>
            <td>
              <span class="badge {appeal.status === 'pending' ? 'badge-pending' : appeal.status === 'approved' ? 'badge-approved' : 'badge-rejected'}">
                {appeal.status}
              </span>
            </td>
            <td>{timeAgo(appeal.createdAt)}</td>
            <td><span class="view-hint">View →</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if nextCursor}
    <div class="pagination">
      <a href={`/admin/appeals?cursor=${nextCursor}`} class="btn-load-more">
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

  .user-cell { display:flex; align-items:center; gap:10px; }
  .user-avatar { width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,var(--neon-purple),var(--neon-pink)); display:flex; align-items:center; justify-content:center; font-size:.7rem; font-family:'Bebas Neue',sans-serif; color:white; flex-shrink:0; }
  .user-avatar-img { width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid rgba(0,255,249,.3); flex-shrink:0; }

  .type-label { font-family:'Share Tech Mono',monospace; font-size:.55rem; letter-spacing:.1em; color:rgba(0,255,249,.6); }

  .badge { display:inline-block; font-family:'Share Tech Mono',monospace; font-size:.52rem; letter-spacing:.12em; padding:3px 10px; text-transform:uppercase; }
  .badge-pending  { background:rgba(255,230,0,.1);   border:1px solid rgba(255,230,0,.3);   color:var(--neon-yellow); }
  .badge-approved { background:rgba(0,255,100,.1);   border:1px solid rgba(0,255,100,.3);   color:#00ff64; }
  .badge-rejected { background:rgba(255,0,110,.1);   border:1px solid rgba(255,0,110,.3);   color:var(--neon-pink); }

  .view-hint { font-family:'Share Tech Mono',monospace; font-size:.55rem; color:rgba(0,255,249,.3); letter-spacing:.1em; }
  .clickable-row:hover .view-hint { color:var(--neon-cyan); }

  .pagination { display:flex; justify-content:center; margin-top:32px; }
  .btn-load-more { font-family:'Share Tech Mono',monospace; font-size:.62rem; letter-spacing:.15em; text-transform:uppercase; color:var(--neon-cyan); text-decoration:none; border:1px solid rgba(0,255,249,.3); padding:10px 28px; transition:all .2s; }
  .btn-load-more:hover { background:rgba(0,255,249,.06); }
</style>