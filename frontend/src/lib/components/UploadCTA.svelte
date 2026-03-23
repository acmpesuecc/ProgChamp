<script lang="ts">
    /**
     * UploadCTA
     * Developer upload call-to-action banner.
     * `onUploadClick` fires when the button is pressed — lets the parent
     * decide whether to navigate directly or show a login gate first.
     */
    interface Props {
      onUploadClick?: () => void;
    }
    let { onUploadClick = () => {} }: Props = $props();
  </script>
  
  <section class="upload-cta-section">
    <div class="upload-cta-inner">
      <div class="upload-text">
        <div class="upload-eyebrow">// FOR DEVELOPERS</div>
        <h2 class="upload-title">PUBLISH YOUR <span>GAME</span></h2>
        <p class="upload-sub">
          Got something worth playing? Upload your build, set your tags,
          and let the world plug in.
        </p>
      </div>
      <button class="btn-upload" onclick={onUploadClick}>UPLOAD A GAME ↗</button>
    </div>
  </section>
  
  <style>
    .upload-cta-section { position:relative; z-index:10; padding:0 60px 80px; }
    .upload-cta-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 40px;
      border: 1px solid rgba(255,230,0,.2);
      padding: 50px 60px;
      background: rgba(255,230,0,.02);
      position: relative;
      clip-path: polygon(16px 0%,100% 0%,calc(100% - 16px) 100%,0% 100%);
    }
    .upload-cta-inner::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(255,230,0,.04) 0%, transparent 60%);
      pointer-events: none;
    }
  
    .upload-eyebrow { font-family:'Share Tech Mono',monospace; font-size:.6rem; letter-spacing:.3em; text-transform:uppercase; color:var(--neon-yellow); text-shadow:0 0 8px var(--neon-yellow); margin-bottom:12px; }
    .upload-title   { font-family:'Bebas Neue',sans-serif; font-size:3rem; letter-spacing:.05em; line-height:1; margin-bottom:12px; }
    .upload-title span { color:var(--neon-yellow); text-shadow:0 0 20px var(--neon-yellow); }
    .upload-sub     { font-family:'Share Tech Mono',monospace; font-size:.72rem; color:rgba(224,224,255,.4); letter-spacing:.08em; line-height:1.7; max-width:420px; }
  
    .btn-upload {
      font-family: 'Share Tech Mono', monospace;
      font-size: .78rem;
      letter-spacing: .15em;
      text-transform: uppercase;
      background: transparent;
      color: var(--neon-yellow);
      border: 1px solid var(--neon-yellow);
      padding: 18px 44px;
      cursor: none;
      transition: all .3s;
      flex-shrink: 0;
      clip-path: polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%);
      text-shadow: 0 0 10px var(--neon-yellow);
      box-shadow: 0 0 20px rgba(255,230,0,.15);
    }
    .btn-upload:hover {
      background: rgba(255,230,0,.1);
      box-shadow: 0 0 40px rgba(255,230,0,.35);
      transform: translateY(-2px);
    }
  </style>