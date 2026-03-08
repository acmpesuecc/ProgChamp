<script>
    import '../app.css'
    import Header from '$lib/components/layout/Header.svelte'
    import Footer from '$lib/components/layout/Footer.svelte'

</script>

<Header />

<main>
    <slot />
</main>

<Footer />

<style> 
    main {
        text-align: center;
        padding-top: 0.5rem;
    }
</style>
