<script lang="ts">
  import { invalidateAll } from '$app/navigation';

  type Tag = { id: string; name: string; category: string | null };

  let { data } = $props();

  let tags: Tag[] = $derived(data.tags ?? []);
  let categories  = $derived([...new Set(tags.map((t) => t.category).filter(Boolean))] as string[]);

  let newName      = $state('');
  let newCategory  = $state('');
  let editingId    = $state<string | null>(null);
  let editName     = $state('');
  let editCategory = $state('');
  let busy         = $state<string | null>(null); // 'create' or a tag id
  let message      = $state<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9210';

  async function api(path: string, method: string, body?: unknown) {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return { ok: res.ok, json: await res.json().catch(() => ({})) as any };
  }

  function explain(json: any): string {
    if (json?.error === 'Tag already exists') return 'A tag with that name already exists.';
    if (json?.error === 'Tag is in use')
      return `Can't delete: still attached to ${json.games} game(s) and ${json.pendingRequests} pending request(s).`;
    if (json?.error === 'Validation failed') return 'Name and category are required (max 100 characters).';
    return json?.error ?? 'Something went wrong.';
  }

  async function createTag(e: SubmitEvent) {
    e.preventDefault();
    busy = 'create'; message = null;
    const { ok, json } = await api('/tags/new', 'POST', { name: newName, category: newCategory });
    busy = null;
    if (!ok) { message = explain(json); return; }
    newName = ''; // keep the category so you can add several tags to it quickly
    await invalidateAll();
  }

  function startEdit(tag: Tag) {
    editingId = tag.id; editName = tag.name; editCategory = tag.category ?? ''; message = null;
  }

  async function saveEdit(id: string) {
    busy = id; message = null;
    const { ok, json } = await api(`/tags/${id}`, 'PATCH', { name: editName, category: editCategory });
    busy = null;
    if (!ok) { message = explain(json); return; }
    editingId = null;
    await invalidateAll();
  }

  async function deleteTag(tag: Tag) {
    if (!confirm(`Delete tag "${tag.name}"?`)) return;
    busy = tag.id; message = null;
    const { ok, json } = await api(`/tags/${tag.id}`, 'DELETE');
    busy = null;
    if (!ok) { message = explain(json); return; }
    await invalidateAll();
  }
</script>

<svelte:head><title>PROGCHAMP // Tags</title></svelte:head>

<div class="page-header">
  <div class="page-eyebrow">// TAG MANAGER</div>
  <h1 class="page-title">ALL <span>TAGS</span></h1>
</div>

<form class="add-row" onsubmit={createTag}>
  <input class="field-input" placeholder="NAME e.g. SHOOTER" maxlength="100" bind:value={newName} />
  <input class="field-input" list="category-options" placeholder="CATEGORY e.g. GENRE" maxlength="100" bind:value={newCategory} />
  <datalist id="category-options">
    {#each categories as c}<option value={c}></option>{/each}
  </datalist>
  <button class="btn-sm btn-approve" type="submit"
    disabled={busy !== null || !newName.trim() || !newCategory.trim()}>
    {busy === 'create' ? '...' : 'Add Tag'}
  </button>
</form>

{#if message}<div class="error-note">{message}</div>{/if}

{#if tags.length === 0}
  <div class="empty-state">// NO TAGS YET</div>
{:else}
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Name</th><th>Category</th><th></th></tr>
      </thead>
      <tbody>
        {#each tags as tag (tag.id)}
          <tr>
            {#if editingId === tag.id}
              <td>
                <input class="field-input" bind:value={editName} maxlength="100"
                  onkeydown={(e) => { if (e.key === 'Enter') saveEdit(tag.id); if (e.key === 'Escape') editingId = null; }} />
              </td>
              <td>
                <input class="field-input" list="category-options" bind:value={editCategory} maxlength="100"
                  onkeydown={(e) => { if (e.key === 'Enter') saveEdit(tag.id); if (e.key === 'Escape') editingId = null; }} />
              </td>
              <td class="actions">
                <button class="btn-sm btn-approve" disabled={busy !== null} onclick={() => saveEdit(tag.id)}>
                  {busy === tag.id ? '...' : 'Save'}
                </button>
                <button class="btn-sm btn-ghost" onclick={() => (editingId = null)}>Cancel</button>
              </td>
            {:else}
              <td><span class="tag">{tag.name}</span></td>
              <td>{tag.category ?? '—'}</td>
              <td class="actions">
                <button class="btn-sm btn-ghost" disabled={busy !== null} onclick={() => startEdit(tag)}>Edit</button>
                <button class="btn-sm btn-reject" disabled={busy !== null} onclick={() => deleteTag(tag)}>
                  {busy === tag.id ? '...' : 'Delete'}
                </button>
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .page-header { margin-bottom:32px; }
  .page-eyebrow { font-family:'VT323',monospace; font-size:1.12rem; letter-spacing:.3em; text-transform:uppercase; color:var(--gold); margin-bottom:10px; }
  .page-title { font-family:'Press Start 2P',sans-serif; font-size:2.6rem; letter-spacing:.05em; line-height:1; }
  .page-title span { color:var(--neon-cyan); }

  .add-row { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
  .field-input { flex:1; min-width:180px; background:rgba(232,93,130,0.18); border:1px solid rgba(232,93,130,0.3); color:var(--text); font-family:'VT323',monospace; font-size:1.2rem; letter-spacing:.06em; padding:8px 14px; outline:none; }
  .field-input:focus { border-color:var(--neon-cyan); }

  .empty-state { font-family:'VT323',monospace; font-size:1.15rem; letter-spacing:.15em; color:rgba(232,93,130,0.45); text-align:center; padding:80px 0; }
  .error-note { font-family:'VT323',monospace; font-size:1.15rem; letter-spacing:.08em; color:rgba(255,80,80,.85); border:1px solid rgba(255,80,80,.2); background:rgba(255,0,0,.04); padding:8px 14px; margin-bottom:20px; }

  .table-wrap { border:1px solid rgba(232,93,130,0.27); background:rgba(30,14,30,.6); }
  table { width:100%; border-collapse:collapse; }
  th { font-family:'VT323',monospace; font-size:1.07rem; letter-spacing:.2em; text-transform:uppercase; color:rgba(245,205,210,0.55); text-align:left; padding:14px 20px; border-bottom:1px solid rgba(255,255,255,.06); }
  td { font-family:'VT323',monospace; font-size:1.13rem; padding:12px 20px; border-bottom:1px solid rgba(255,255,255,.04); color:rgba(245,205,210,0.8); letter-spacing:.04em; }
  tr:last-child td { border-bottom:none; }
  .actions { display:flex; gap:8px; justify-content:flex-end; }

  .tag { font-family:'VT323',monospace; font-size:1.02rem; letter-spacing:.12em; padding:3px 10px; text-transform:uppercase; background:rgba(124,77,191,0.25); border:1px solid rgba(124,77,191,0.45); color:var(--neon-purple); }

  .btn-sm { font-family:'VT323',monospace; font-size:1.05rem; letter-spacing:.12em; text-transform:uppercase; padding:5px 14px; cursor:var(--cursor-pointer); border:none; transition:all .2s; }
  .btn-sm:disabled { opacity:.4; cursor:not-allowed; }
  .btn-approve { background:rgba(143,191,139,.08); color:#8FBF8B; border:1px solid rgba(143,191,139,.25); }
  .btn-approve:hover:not(:disabled) { background:rgba(143,191,139,.18); }
  .btn-reject { background:rgba(124,77,191,0.23); color:var(--neon-pink); border:1px solid rgba(124,77,191,0.4); }
  .btn-reject:hover:not(:disabled) { background:rgba(124,77,191,0.33); }
  .btn-ghost { background:transparent; color:var(--neon-cyan); border:1px solid rgba(232,93,130,0.45); }
  .btn-ghost:hover:not(:disabled) { background:rgba(232,93,130,0.21); }
</style>