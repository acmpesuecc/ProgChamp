<script lang="ts">
    import '$lib/styles/globals.css';
  
    let { children } = $props();
  </script>
  
  <svelte:head>
    <link
      href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Pixelify+Sans:wght@400;500;600;700&family=Caveat:wght@500;600;700&display=swap"
      rel="stylesheet"
    />
    <meta name="description" content="PROGCHAMP is a community game vault built by ACMpesuecc — stream and host student-built games, browse 10,000+ titles, and ship your own with no installs required." />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="PROGCHAMP" />
    <meta property="og:title" content="PROGCHAMP // Game Vault" />
    <meta property="og:description" content="Stream, host, and play student-built games. Built by ACMpesuecc." />
    <meta property="og:image" content="/favicon.svg" />
    <meta name="theme-color" content="#24132C" />
  </svelte:head>
  
  <div style="padding-top: 112px;">
    {@render children()}
  </div>
