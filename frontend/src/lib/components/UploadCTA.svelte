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
      border: 1px solid rgba(240,137,158,0.35);
      padding: 50px 60px;
      background: rgba(240,137,158,0.17);
      position: relative;
      border-radius: 10px;
    }
    .upload-cta-inner::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(240,137,158,0.19) 0%, transparent 60%);
      pointer-events: none;
    }
  
    .upload-eyebrow { font-family:'VT323',monospace; font-size:1.1rem; letter-spacing:.3em; text-transform:uppercase; color:var(--neon-yellow);  margin-bottom:12px; }
    .upload-title   { font-family:'Press Start 2P',sans-serif; font-size: 2.2rem; letter-spacing:.05em; line-height:1; margin-bottom:12px; }
    .upload-title span { color:var(--neon-yellow);  }
    .upload-sub     { font-family:'VT323',monospace; font-size:1.22rem; color:rgba(245,205,210,0.65); letter-spacing:.08em; line-height:1.7; max-width:420px; }
  
    .btn-upload {
      font-family: 'VT323', monospace;
      font-size: 1.28rem;
      letter-spacing: .15em;
      text-transform: uppercase;
      background: transparent;
      color: var(--neon-yellow);
      border: 1px solid var(--neon-yellow);
      padding: 18px 44px;
      cursor: var(--cursor-pointer);
      transition: all .3s;
      flex-shrink: 0;
      border-radius: 10px;
      
      
    }
    .btn-upload:hover {
      background: rgba(240,137,158,0.25);
      transform: translateY(-2px);
    }
  </style>