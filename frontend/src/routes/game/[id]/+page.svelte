<script>
    /** @type {{ game: any }} */
    export let data;
    const { game } = data;
    
    let isLoading = true;
    let hasError = false;
    let loadTimeout;
    let iframeEl;
    
    function handleLoad(){
        clearTimeout(loadTimeout);
        isLoading = false;
    }

    loadTimeout = setTimeout(() => {
        if(isLoading){
            hasError = true;
            isLoading = false;
        }
    }, 20000);

    function handleError(){
        hasError = true;
    }

    function goFullscreen(){
        if (iframeEl?.requestFullscreen){
            iframeEl.requestFullscreen();
        }
    }
</script>

<header>
    <h2> {game.title} </h2>
</header>

{#if isLoading}
    <div class = "overlay loading">
        <p>Loading . . .</p>
    </div>
{/if}

{#if hasError}
    <div class = "overlay error">
        <p>Error ! ! !</p>
    </div>
{/if}

<main>
    <div class = "iframe-card">
        
        <button class = "fullscreen-btn" on:click={goFullscreen()}>
          ⛶ Fullscreen!
        </button> 
        <br>

        <iframe 
            bind:this={iframeEl}
            title = {game.title} 
            src = {game.url}
            allowfullscreen 
            on:load={handleLoad}
            on:error={handleError}>
        </iframe>

        
    </div>
    <div class = "about">

        <h2> About {game.title} </h2>
        <p> {game.description} </p>

    </div>
</main>



<style>
    header{
        width: 75%;
        margin: 0 auto;
        color: aliceblue;
        padding-bottom: 1rem;
        border-radius: 8px;
        border: 1px solid ;
        border-color: rgb(194, 48, 121);
    }

    .about {
        color: cyan;
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
    }
    
</style>    