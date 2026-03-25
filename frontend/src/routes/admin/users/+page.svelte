<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';

  let { data } = $props();

  let users = $derived(data.users ?? []);
  let nextCursor = $derived(data.nextCursor ?? null);
  let isActive = $derived(data.isActive ?? 'true');
  let loading = $state<string | null>(null);
  let search = $state(data.search ?? '');

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

  async function toggleUser(userId: string, currentIsActive: boolean) {
    loading = userId;
    await fetch(`${API_URL}/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: !currentIsActive }),
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

  function initials(name: string | null) {
    if (!name) return '?';
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function applyFilter(newIsActive: string) {
    goto(`/admin/users?isActive=${newIsActive}`);
  }

  function applySearch() {
    goto(`/admin/users?isActive=${isActive}&search=${search}`);
  }
</script>

<svelte:head>
  <title>PROGCHAMP // Users</title>
</svelte:head>

<div class="page-header">
  <div class="page-eyebrow">// USER MANAGEMENT</div>
  <h1 class="page-title">ALL <span>USERS</span></h1>
</div>

<div class="controls-row">
  <div class="filter-group">
    <button
      class="filter-btn {isActive === 'true' ? 'active' : ''}"
      onclick={() => applyFilter('true')}
    >Active</button>
    <button
      class="filter-btn {isActive === 'false' ? 'active' : ''}"
      onclick={() => applyFilter('false')}
    >Banned</button>
    <button
      class="filter-btn {isActive === '' ? 'active' : ''}"
      onclick={() => applyFilter('')}
    >All</button>
  </div>

  <div class="search-group">
    <input
      class="search-input"
      type="text"
      placeholder="Search by name or email..."
      bind:value={search}
      onkeydown={(e) => e.key === 'Enter' && applySearch()}
    />
    <button class="search-btn" onclick={applySearch}>Search</button>
  </div>
</div>

{#if users.length === 0}
  <div class="empty-state">// NO USERS FOUND</div>
{:else}
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>Email</th>
          <th>Role</th>
          <th>Joined</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each users as user}
          <tr>
            <td>
              <div class="user-cell">
                {#if user.avatarUrl}
                  <img class="user-avatar-img" src={user.avatarUrl} alt={user.name ?? ''} referrerpolicy="no-referrer" />
                {:else}
                  <div class="user-avatar">{initials(user.name)}</div>
                {/if}
                <span>{user.name ?? '—'}</span>
              </div>
            </td>
            <td>{user.email}</td>
            <td>
              <span class="badge {user.userType === 'admin' ? 'badge-pink' : 'badge-gray'}">{user.userType}</span>
            </td>
            <td>{formatDate(user.createdAt)}</td>
            <td>
              <span class="badge {user.isActive ? 'badge-green' : 'badge-pink'}">
                {user.isActive ? 'Active' : 'Banned'}
              </span>
            </td>
            <td>
              <button
                class="btn-sm {user.isActive ? 'btn-reject' : 'btn-approve'}"
                disabled={loading === user.id}
                onclick={() => toggleUser(user.id, user.isActive)}
              >
                {loading === user.id ? '...' : user.isActive ? 'Ban' : 'Restore'}
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if nextCursor}
    <div class="pagination">
      <a href={`/admin/users?isActive=${isActive}&cursor=${nextCursor}`} class="btn-load-more">
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

  .controls-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; gap:16px; flex-wrap:wrap; }
  .filter-group { display:flex; gap:8px; }
  .filter-btn { font-family:'Share Tech Mono',monospace; font-size:.58rem; letter-spacing:.15em; text-transform:uppercase; padding:7px 18px; background:transparent; color:rgba(224,224,255,.4); border:1px solid rgba(255,255,255,.1); cursor:none; transition:all .2s; }
  .filter-btn.active { color:var(--neon-cyan); border-color:rgba(0,255,249,.4); background:rgba(0,255,249,.06); }
  .filter-btn:hover:not(.active) { color:rgba(224,224,255,.7); border-color:rgba(255,255,255,.2); }

  .search-group { display:flex; gap:8px; }
  .search-input { font-family:'Share Tech Mono',monospace; font-size:.62rem; letter-spacing:.08em; background:rgba(10,0,24,.8); border:1px solid rgba(0,255,249,.2); color:var(--text); padding:7px 16px; width:260px; outline:none; }
  .search-input::placeholder { color:rgba(224,224,255,.2); }
  .search-input:focus { border-color:rgba(0,255,249,.5); }
  .search-btn { font-family:'Share Tech Mono',monospace; font-size:.58rem; letter-spacing:.15em; text-transform:uppercase; padding:7px 18px; background:rgba(0,255,249,.08); color:var(--neon-cyan); border:1px solid rgba(0,255,249,.3); cursor:none; transition:all .2s; }
  .search-btn:hover { background:rgba(0,255,249,.15); }

  .empty-state { font-family:'Share Tech Mono',monospace; font-size:.65rem; letter-spacing:.15em; color:rgba(0,255,249,.3); text-align:center; padding:80px 0; }

  .table-wrap { border:1px solid rgba(0,255,249,.12); background:rgba(10,0,24,.6); }
  table { width:100%; border-collapse:collapse; }
  th { font-family:'Share Tech Mono',monospace; font-size:.57rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(224,224,255,.3); text-align:left; padding:14px 20px; border-bottom:1px solid rgba(255,255,255,.06); }
  td { font-family:'Share Tech Mono',monospace; font-size:.63rem; padding:14px 20px; border-bottom:1px solid rgba(255,255,255,.04); color:rgba(224,224,255,.7); letter-spacing:.04em; }
  tr:last-child td { border-bottom:none; }
  tr:hover td { background:rgba(0,255,249,.02); }

  .user-cell { display:flex; align-items:center; gap:10px; }
  .user-avatar { width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,var(--neon-purple),var(--neon-pink)); display:flex; align-items:center; justify-content:center; font-size:.7rem; font-family:'Bebas Neue',sans-serif; color:white; flex-shrink:0; }
  .user-avatar-img { width:28px; height:28px; border-radius:50%; object-fit:cover; border:1px solid rgba(0,255,249,.3); flex-shrink:0; }

  .badge { display:inline-block; font-family:'Share Tech Mono',monospace; font-size:.52rem; letter-spacing:.12em; padding:3px 10px; text-transform:uppercase; }
  .badge-green { background:rgba(0,255,100,.1); border:1px solid rgba(0,255,100,.3); color:#00ff64; }
  .badge-pink  { background:rgba(255,0,110,.1); border:1px solid rgba(255,0,110,.3); color:var(--neon-pink); }
  .badge-gray  { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); color:rgba(224,224,255,.4); }

  .btn-sm { font-family:'Share Tech Mono',monospace; font-size:.55rem; letter-spacing:.12em; text-transform:uppercase; padding:5px 14px; cursor:none; border:none; transition:all .2s; }
  .btn-sm:disabled { opacity:.4; }
  .btn-approve { background:rgba(0,255,100,.1); color:#00ff64; border:1px solid rgba(0,255,100,.3); }
  .btn-approve:hover:not(:disabled) { background:rgba(0,255,100,.2); }
  .btn-reject  { background:rgba(255,0,110,.08); color:var(--neon-pink); border:1px solid rgba(255,0,110,.25); }
  .btn-reject:hover:not(:disabled)  { background:rgba(255,0,110,.18); }

  .pagination { display:flex; justify-content:center; margin-top:32px; }
  .btn-load-more { font-family:'Share Tech Mono',monospace; font-size:.62rem; letter-spacing:.15em; text-transform:uppercase; color:var(--neon-cyan); text-decoration:none; border:1px solid rgba(0,255,249,.3); padding:10px 28px; transition:all .2s; }
  .btn-load-more:hover { background:rgba(0,255,249,.06); }
</style>