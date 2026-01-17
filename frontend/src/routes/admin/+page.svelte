<script lang="ts">
  import { submissions } from '../../lib/stores/submissions.ts';

  function approve(id: string) {
    submissions.update(list =>
      list.filter(item => item.id !== id)
    );
  }

  function reject(id: string) {
    submissions.update(list =>
      list.filter(item => item.id !== id)
    );
  }
</script>

<h1>Admin Panel</h1>

{#if $submissions.length === 0}
  <p>No pending submissions... :D</p>
{:else}
  <div class="list">
    {#each $submissions as game}
      <div class="item">
        <div>
          <strong>{game.title}</strong>
          <p>{game.description}</p>
        </div>

        <div class="actions">
          <button on:click={() => approve(game.id)}>Approve</button>
          <button class="reject" on:click={() => reject(game.id)}>Reject</button>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  h1, p {
    color: aliceblue;
    text-align: center;
  }

  .list {
    max-width: 700px;
    margin: 2rem auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .item {
    background: #2c2c2c;
    padding: 1rem;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .actions button {
    margin-left: 0.5rem;
  }

  .reject {
    background: #c0392b;
    color: white;
  }
</style>
