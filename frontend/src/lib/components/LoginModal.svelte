<script lang="ts">
    /**
     * LoginModal
     * Pass `open` to control visibility.
     * `onClose` fires when the user dismisses the modal.
     */
    interface Props {
      open?:    boolean;
      onClose?: () => void;
    }
  
    let { open = false, onClose = () => {} }: Props = $props();
  
    function handleGoogleSignIn() {
      window.location.href = 'http://localhost:9210/auth/google';
    }
  
    function closeOnBackdrop(e: MouseEvent) {
      if (e.target === e.currentTarget) onClose();
    }
  </script>
  
  {#if open}
    <div class="modal-backdrop" onclick={closeOnBackdrop} role="presentation">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-heading">
        <div class="modal-corner tl"></div>
        <div class="modal-corner br"></div>
  
        <button class="modal-close" onclick={onClose} aria-label="Close">✕</button>
  
        <div class="modal-eyebrow">// ACCESS TERMINAL</div>
        <h2 class="modal-title" id="modal-heading">LOG<span>IN</span></h2>
        <p class="modal-sub">Authenticate to access the vault. One click is all it takes.</p>
  
        <div class="modal-actions">
          <button class="btn-google" onclick={handleGoogleSignIn}>
            <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            CONTINUE WITH GOOGLE
          </button>
          <p class="modal-terms">By signing in you agree to the ProgChamp terms of use.</p>
        </div>
      </div>
    </div>
  {/if}
  
  <style>
    .modal-backdrop {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(3,0,10,.85);
      backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn .2s ease;
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  
    .modal {
      position: relative;
      width: 420px;
      background: var(--dark2);
      border: 1px solid rgba(0,255,249,.2);
      padding: 50px 44px;
      box-shadow: 0 0 60px rgba(0,255,249,.08), 0 0 120px rgba(191,0,255,.06);
      animation: modalIn .3s ease;
      clip-path: polygon(16px 0%,100% 0%,calc(100% - 16px) 100%,0% 100%);
    }
    @keyframes modalIn { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }
  
    .modal-corner    { position:absolute; width:24px; height:24px; }
    .modal-corner.tl { top:10px;    left:10px;  border-top:    2px solid var(--neon-cyan); border-left:   2px solid var(--neon-cyan); }
    .modal-corner.br { bottom:10px; right:10px; border-bottom: 2px solid var(--neon-cyan); border-right:  2px solid var(--neon-cyan); }
  
    .modal-close       { position:absolute; top:16px; right:20px; background:transparent; border:none; color:rgba(224,224,255,.3); font-size:1rem; cursor:none; transition:color .2s; font-family:'Share Tech Mono',monospace; }
    .modal-close:hover { color:var(--neon-pink); text-shadow:0 0 10px var(--neon-pink); }
  
    .modal-eyebrow { font-family:'Share Tech Mono',monospace; font-size:.6rem; letter-spacing:.3em; text-transform:uppercase; color:var(--neon-cyan); text-shadow:0 0 8px var(--neon-cyan); margin-bottom:10px; }
    .modal-title   { font-family:'Bebas Neue',sans-serif; font-size:4rem; line-height:1; letter-spacing:.05em; margin-bottom:10px; }
    .modal-title span { color:var(--neon-pink); text-shadow:0 0 20px var(--neon-pink); }
    .modal-sub     { font-family:'Share Tech Mono',monospace; font-size:.7rem; color:rgba(224,224,255,.35); letter-spacing:.08em; margin-bottom:36px; line-height:1.6; }
  
    .modal-actions { display:flex; flex-direction:column; gap:16px; }
  
    .btn-google {
      display: flex; align-items: center; justify-content: center; gap: 14px;
      font-family: 'Share Tech Mono', monospace;
      font-size: .75rem; letter-spacing: .15em; text-transform: uppercase;
      background: rgba(255,255,255,.04); color: var(--text);
      border: 1px solid rgba(255,255,255,.15);
      padding: 16px 24px; cursor: none; transition: all .3s; width: 100%;
      clip-path: polygon(10px 0%,100% 0%,calc(100% - 10px) 100%,0% 100%);
    }
    .btn-google:hover { background:rgba(255,255,255,.09); border-color:rgba(255,255,255,.35); box-shadow:0 0 20px rgba(255,255,255,.05); transform:translateY(-1px); }
  
    .google-icon  { width:20px; height:20px; flex-shrink:0; }
    .modal-terms  { font-family:'Share Tech Mono',monospace; font-size:.58rem; color:rgba(224,224,255,.2); letter-spacing:.08em; text-align:center; line-height:1.6; }
  </style>