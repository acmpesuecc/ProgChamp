<script lang="ts">
    import { ratings } from '$lib/stores/ratings';
    import { user } from '$lib/stores/user.js';

    /** @type {{ game: any }} */
    export let data;
    const { game } = data;

    let isLoading = true;
    let hasError = false;
    let loadTimeout;
    let iframeEl;

    function handleLoad() {
        clearTimeout(loadTimeout);
        isLoading = false;
    }

    loadTimeout = setTimeout(() => {
        if (isLoading) {
            hasError = true;
            isLoading = false;
        }
    }, 20000);

    function handleError() {
        hasError = true;
    }

    function goFullscreen() {
        if (iframeEl?.requestFullscreen) {
            iframeEl.requestFullscreen();
        }
    }

    const gameId = game.id;

    function rate(value: number) {
        ratings.update(r => {
            const current = r[gameId] ?? { totalRatings: 0, totalScore: 0, superlikes: 0 };

            return {
                ...r,
                [gameId]: {
                    ...current,
                    totalRatings: current.totalRatings + 1,
                    totalScore: current.totalScore + value
                }
            };
        });
    }

    function superlike() {
        if ($user.superlikesUsed >= $user.maxSuperlikes) return;

        ratings.update(r => {
            const current = r[gameId] ?? { totalRatings: 0, totalScore: 0, superlikes: 0 };

            return {
                ...r,
                [gameId]: {
                    ...current,
                    superlikes: current.superlikes + 1
                }
            };
        });

        user.update(u => ({
            ...u,
            superlikesUsed: u.superlikesUsed + 1
        }));
    }

    $: stats = $ratings[gameId] ?? { totalRatings: 0, totalScore: 0, superlikes: 0 };
    $: average = stats.totalRatings === 0 ? "0.0" : (stats.totalScore / stats.totalRatings).toFixed(1);
</script>

<header>
    <h2>{game.title}</h2>
</header>

{#if isLoading}
    <div class="overlay loading">
        <p>Loading . . .</p>
    </div>
{/if}

{#if hasError}
    <div class="overlay error">
        <p>Error ! ! !</p>
    </div>
{/if}

<main>
    <div class="iframe-card">
        <button class="fullscreen-btn" on:click={goFullscreen}>
            ⛶ Fullscreen!
        </button>
        <br>

        <iframe 
            bind:this={iframeEl}
            title={game.title}
            src={game.url}
            allowfullscreen
            on:load={handleLoad}
            on:error={handleError}
        ></iframe>
    </div>

    <div class="about">
        <h2>About {game.title}</h2>
        <p>{game.description}</p>
    </div>

    <div class="stats-container">
        <div class="ratings">
            <h2>Rate this game</h2>

            <div class="rating-buttons">
                {#each [1, 2, 3, 4, 5] as n}
                    <button on:click={() => rate(n)}>{n}</button>
                {/each}
            </div>

            <h2>Superlike</h2>

            <button on:click={superlike} disabled={$user.superlikesUsed >= $user.maxSuperlikes}>
                Superlike
            </button>

            <p>{$user.superlikesUsed}/{ $user.maxSuperlikes } superlikes used</p>
        </div>

        <div class="stats">
            <h2>Stats</h2>
            <p>Total ratings: {stats.totalRatings}</p>
            <p>Average score: {average}</p>
            <p>Superlikes: {stats.superlikes}</p>
        </div>
    </div>
</main>

<style>
    header {
        width: 75%;
        margin: 0 auto;
        color: aliceblue;
        padding-bottom: 1rem;
        border-radius: 8px;
        border: 1px solid;
        border-color: rgb(194, 48, 121);
    }

    .about {
        margin: 0 auto;
        width: 75%;
        color: cyan;
        border: 1px solid;
        border-radius: 8px;
        border-color: cyan;
        margin-bottom: 1rem;
    }

    .stats-container {
        display: flex;
        gap: 20px;
        margin: 0 auto;
        width: 75%;
        color: cyan;
    }

    .ratings {
        border: 1px solid;
        flex: 1;
        padding: 15px;
        border-radius: 8px;
        border-color: cyan;
    }

    .stats {
        border: 1px solid;
        flex: 1;
        padding: 15px;
        border-radius: 8px;
        border-color: cyan;
    }

    .rating-buttons {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
        margin-bottom: 1rem;
    }

    .rating-buttons button {
        padding: 0.4rem 0.7rem;
        background: #0a0a0f;
        color: cyan;
        border: 1px solid cyan;
        border-radius: 6px;
        cursor: pointer;
    }

    .rating-buttons button:hover {
        border-color: #ca1261;
        transform: scale(1.05);
        transition: all 150ms ease;
    }

    .overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: grid;
        place-items: center;
        font-size: 5rem;
        color: #b39eff;
        background: rgba(0, 0, 0, 0.85);
    }

    .error {
        background: rgba(120, 0, 0, 0.8);
    }

    .fullscreen-btn {
        justify-content: center;
        padding: 1rem;
        margin: 0.5em;
        width: 75%;
        background-color: #b39eff;
        border-radius: 10px;
        color: aliceblue;
        font-size: 1rem;
    }

    .fullscreen-btn:hover {
        background-color: rgb(28, 172, 172);
        transform: scale(1.025);
        transition: all 150ms ease;
    }

    iframe {
        justify-content: center;
        width: 75%;
        aspect-ratio: 16/9;
        border-radius: 8px;
        border-color: rgb(179, 158, 255);
        margin-bottom: 1rem;
    }
</style>
