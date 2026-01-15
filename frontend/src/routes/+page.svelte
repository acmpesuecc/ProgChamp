<script>
    import GameCard from '$lib/components/GameCard.svelte';

    const games = [
        {
            id: 1,
            title: 'yes',
            description: 'welcome to game 1, this is temporary', //these are temporary T-T
            url: 'games/yes/index.html'
        },
        {
            id: 2, 
            title: 'no',
            description: 'this is game 2, temporary',
            url: 'games/no/index.html'
        }
    ];
</script>

<h1> Games! </h1>
<br> <p> Play games made by others :3 </p>
<div class = 'grid'>
    {#each games as game}
        <GameCard id = {game.id} title = {game.title} description = {game.description} />
    {/each}
</div>

<style>
    h1 {
        justify-content: center;
        text-align: center;
        color:aliceblue;
        margin-top: 0;
        padding: 0%;
    }

    p{
        text-align: center;
        color: aliceblue;
    }

    .grid{
        margin: 2rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;

    }
</style>
