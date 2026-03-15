<script lang="ts">
    import '$lib/styles/globals.css';
  
    let { children } = $props();
  </script>
  
  <svelte:head>
    <link
      href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&family=Oxanium:wght@300;400;600;800&display=swap"
      rel="stylesheet"
    />
  </svelte:head>
  
  <div style="padding-top: 72px;">
    {@render children()}
  </div>
