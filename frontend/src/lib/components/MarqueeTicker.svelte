<script lang="ts">
    /**
     * MarqueeTicker
     * Pass an array of text strings via `items` prop.
     * Defaults to the original PROGCHAMP ticker items.
     */
    interface Props {
      items?: string[];
    }
  
    let {
      items = [
        'PROGCHAMP',
        'NEW DROP: CYBER EXODUS',
        'SEASON 7 LIVE',
        'TOURNAMENT — PRIZE POOL $50K',
        '@ACMpesuecc PROJECT',
      ],
    }: Props = $props();
  </script>
  
  <div class="marquee-section">
    <div class="marquee-track">
      <!-- duplicate for seamless loop -->
      {#each Array(2) as _}
        {#each items as item}
          <span class="marquee-item">{item} <span>★</span></span>
        {/each}
      {/each}
    </div>
  </div>
  
  <style>
    .marquee-section {
      border-top: 1px solid rgba(255,0,110,.2);
      border-bottom: 1px solid rgba(255,0,110,.2);
      padding: 16px 0;
      background: rgba(255,0,110,.03);
      overflow: hidden;
      position: relative;
      z-index: 10;
    }
  
    .marquee-track {
      display: flex;
      gap: 60px;
      animation: marquee 22s linear infinite;
      white-space: nowrap;
    }
    @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  
    .marquee-item {
      font-family: 'Share Tech Mono', monospace;
      font-size: .7rem;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: rgba(255,0,110,.5);
      flex-shrink: 0;
    }
    .marquee-item span {
      color: var(--neon-pink);
      text-shadow: 0 0 8px var(--neon-pink);
    }
  </style>