<script>
    export let id;
    export let title;
    export let description;
    export let url;
</script>

<a href = {`/game/${id}`} class = "card-link">
    <div class = "card">
        <h2> {title} </h2>
        <p> {description} </p>
    
        <div class = "iframe-wrapper">
            <iframe
                src={url}
                title={title}
                loading = "lazy"
                sandbox = "allow-scripts allow-same-origin"
            />
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
        background-color: #5b84c2;
        color: white;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 20px rgba(0,0,0,0.25);
    }

    .iframe-wrapper{
        margin-top: 1rem;
        width: 100%;
        aspect-ratio: 16/9;
        border-radius: 8px;
        overflow: hidden;
        pointer-events: none;
    }

    iframe{
        width: 100%;
        height: 100%;
        border: none;
    }

</style>