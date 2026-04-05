<script lang="ts">
    export let game: {
        id: string;
        title: string;
        devName: string;
        description: string;
        thumbnail: string;
        url: string;
        ratings: string;
        views: string;
        superlikes: string;
        tags: string[];
    }
</script>

<a href = {`/game/${game.id}`} class = "card-link">
    <div class = "card">

        <div class = "thumbnail">
            <img src = {game.thumbnail} alt= {game.title}/>
        </div>

        <div class = "data">
            <h2> {game.title} </h2>
            <p> {game.devName} </p>
            <hr>
            ⭐ {game.ratings} 👥 {game.views} 🌟 {game.superlikes} <br>
            <div class = "tags">
                {#each game.tags as tag}
                    <span class = "tag">#{tag}</span>
                {/each}
            </div>
        </div>
    </div>
</a>

<style>
    .card-link {
        text-decoration: none;
        color: inherit;
        display: block;
    }
    
    .card {
        padding: 1rem;  
        border-radius: 8px;
        background-color: #40246e;
        color: white;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.25);
    }

    .thumbnail {
        width: 100%;
        aspect-ratio: 16/9;
        overflow: hidden;
    }

    .thumbnail img{
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .data {
        padding: 0.75rem 1rem;
    }

    .description {
        font-size: 0.9rem;
        opacity: 0.85;
        display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .tags{
        margin: 1rem auto;
    }

    .tag{
        padding: 4px;
        margin: 3px;
        border: 1px solid;
        border-color: lavender;
        border-radius: 8px;
    }
</style>