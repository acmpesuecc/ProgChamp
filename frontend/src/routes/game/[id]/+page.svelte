<script>
    /** @type {{ game: any }} */
    export let data;
    const { game } = data;
    
</script>

<header>
    <h2> {game.title} </h2>
    <a href = "/">
        Back to Home!
    </a>
</header>

<main>
    <div class = "iframe-card">
        <iframe title = {game.title} src = {game.url}>

        </iframe>

    </div>
    <p> {game.description} </p>
</main>



<style>
    header{
        color: aliceblue;
        padding-bottom: 1rem;
    }
    h2, p{
        color: aliceblue;
    }

    iframe {
        width: 75%;
        aspect-ratio: 16/9;
        border-radius: 8px;
        border-color: rgb(179, 158, 255);
    }
    
</style>    