<script lang="ts">
  import { submissions } from '../../lib/stores/submissions.ts';

  let title = "";
  let description = "";
  let url = "";

  let thumbnail: File | null = null;
  let preview: string | null = null;

  function handleFile(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;

    thumbnail = input.files[0];
    preview = URL.createObjectURL(thumbnail);
  }

  function handleSubmit() {
    if (!title || !description || !url || !thumbnail) return;

    submissions.update(list => [
      ...list,
      {
        id: crypto.randomUUID(),
        title,
        description,
        url,
        thumbnail,
        status: "pending"
      }
    ]);

    alert("Submitted for review!");

    // cleanup
    title = "";
    description = "";
    url = "";
    thumbnail = null;
    preview = null;
  }
</script>

<h1>Upload Your Game</h1>

<form class="upload-form" on:submit|preventDefault={handleSubmit}>
  <label>
    Title
    <input bind:value={title} required />
  </label>

  <label>
    Description
    <textarea bind:value={description} required></textarea>
  </label>

  <label>
    Game URL
    <input bind:value={url} required />
  </label>

  <label>
    Thumbnail
    <input type="file" accept="image/*" on:change={handleFile} required />
  </label>

  {#if preview}
    <img src={preview} alt="Preview" class="preview" />
  {/if}

  <button type="submit">Submit</button>
</form>

<style>
  h1 {
    text-align: center;
    color: aliceblue;
  }

  .upload-form {
    max-width: 500px;
    margin: 2rem auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: #2c2c2c;
    padding: 1rem;
    border-radius: 8px;
  }

  label {
    color: aliceblue;
    display: flex;
    flex-direction: column;
  }

  input, textarea {
    padding: 0.5rem;
    border-radius: 4px;
    border: none;
  }

  button {
    padding: 0.7rem;
    background: #4CAF50;
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
  }

  .preview {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
    border-radius: 6px;
  }
</style>
