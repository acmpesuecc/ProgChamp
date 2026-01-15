<script>
    export let id;
    export let title;
    export let description;
</script>

<a href = {`/game/${id}`} class = "card-link">
    <div class = "card">
        <h3> {title} </h3>
        <p> {description} </p>
    </div>
</a>

<style>
    .card-link {
        color: inherit;
    }
    
    .card {
        padding: 1rem;  
        border-radius: 8px;
        background-color: #5b84c2;
        color: white;
        transition: transform 0.15s ease;
    }

    .card:hover {
        transform: translateY(-4px);
    }

</style>