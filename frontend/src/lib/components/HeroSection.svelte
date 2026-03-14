<script lang="ts">
    interface Props {
      onEnterVault?:   () => void;
      onViewLibrary?:  () => void;
    }
    let { onEnterVault = () => {}, onViewLibrary = () => {} }: Props = $props();
  </script>
  
  <section class="hero">
    <div class="hero-orb orb1"></div>
    <div class="hero-orb orb2"></div>
  
    <div class="hero-inner">
      <!-- left: headline and CTA buttons -->
      <div class="hero-left">
        <h1 class="hero-glitch-text">
          <span class="line1">BUILD IT.</span>
          <span class="line2">PLAY IT.</span>
          <span class="line3">WIN IT.</span>
        </h1>
  
        <p class="hero-sub">
          // UNAUTHORIZED ACCESS TO FUN DETECTED<br/>
          Stream, host, and dominate 10,000+ titles.<br/>
          No installs. No limits. Pure voltage.
        </p>
  
        <div class="hero-actions">
          <button class="btn-primary" onclick={onEnterVault}>ENTER THE VAULT</button>
          <button class="btn-secondary" onclick={onViewLibrary}>VIEW LIBRARY</button>
        </div>
      </div>
  
      <!-- right: space-invaders animation panel -->
      <div class="hero-anim" aria-hidden="true">
        <div class="ga-screen">
          <div class="ga-scanlines"></div>
          <div class="ga-star s1"></div>
          <div class="ga-star s2"></div>
          <div class="ga-star s3"></div>
          <div class="ga-star s4"></div>
          <div class="ga-star s5"></div>
          <div class="ga-star s6"></div>
          <div class="ga-invaders">
            <div class="ga-inv inv1">👾</div>
            <div class="ga-inv inv2">👾</div>
            <div class="ga-inv inv3">👾</div>
            <div class="ga-inv inv4">👾</div>
            <div class="ga-inv inv5">👾</div>
          </div>
          <div class="ga-ebullet eb1"></div>
          <div class="ga-ebullet eb2"></div>
          <div class="ga-ship">🚀</div>
          <div class="ga-laser"></div>
          <div class="ga-explosion">💥</div>
          <div class="ga-hud">
            <span class="ga-score">SCORE <span class="ga-score-num">08450</span></span>
            <span class="ga-lives">♥ ♥ ♥</span>
          </div>
          <div class="ga-ground"></div>
        </div>
      </div>
    </div>
  </section>
  
  <style>
    .hero { position:relative; z-index:10; min-height:100vh; display:flex; flex-direction:column; justify-content:center; padding:80px 60px; margin-top:-30px; overflow:hidden; }
  
    .hero-orb  { position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; }
    .orb1 { width:600px; height:600px; background:radial-gradient(circle,rgba(191,0,255,.15) 0%,transparent 70%); top:-200px; right:-100px; animation:orbFloat 10s ease-in-out infinite; }
    .orb2 { width:400px; height:400px; background:radial-gradient(circle,rgba(0,255,249,.1) 0%,transparent 70%);  bottom:-100px; left:300px; animation:orbFloat 14s ease-in-out infinite reverse; }
    @keyframes orbFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-40px) scale(1.05)} }
  
    .hero-inner { display:flex; align-items:center; gap:60px; width:100%; }
    .hero-left  { flex:1; min-width:0; }
  
    .hero-glitch-text { font-family:'Bebas Neue',sans-serif; font-size:clamp(3.5rem,8vw,7.5rem); line-height:.9; letter-spacing:.02em; display:inline-block; max-width:600px; animation:heroIn 1s ease both; }
    @keyframes heroIn { from{opacity:0;transform:translateY(40px) skewX(-5deg)} to{opacity:1;transform:none} }
    .line1 { display:block; color:transparent; -webkit-text-stroke:2px var(--neon-cyan); text-shadow:0 0 40px rgba(0,255,249,.3); }
    .line2 { display:block; color:var(--neon-pink); text-shadow:0 0 40px var(--neon-pink),0 0 80px rgba(255,0,110,.4); animation:glitch 4s infinite; }
    @keyframes glitch { 0%,90%,100%{transform:none;clip-path:none} 92%{transform:translateX(-3px);clip-path:polygon(0 20%,100% 20%,100% 40%,0 40%)} 94%{transform:translateX(3px);clip-path:polygon(0 60%,100% 60%,100% 80%,0 80%)} 96%{transform:none;clip-path:none} }
    .line3 { display:block; color:var(--neon-yellow); text-shadow:0 0 40px var(--neon-yellow),0 0 80px rgba(255,230,0,.3); }
  
    .hero-sub     { font-family:'Share Tech Mono',monospace; font-size:.85rem; color:rgba(224,224,255,.5); margin-top:40px; letter-spacing:.1em; max-width:500px; line-height:1.8; border-left:2px solid var(--neon-cyan); padding-left:20px; animation:heroIn 1s .3s ease both; }
    .hero-actions { display:flex; gap:20px; margin-top:50px; animation:heroIn 1s .5s ease both; align-items:center; }
  
    /* ── Space invaders panel ─────────────────────────────── */
    .hero-anim { flex:0 0 420px; display:flex; align-items:center; justify-content:center; animation:heroIn 1s .2s ease both; }
    .ga-screen { width:380px; height:420px; background:#000814; border:2px solid rgba(0,255,249,.3); box-shadow:0 0 40px rgba(0,255,249,.15),inset 0 0 40px rgba(0,0,0,.8); border-radius:8px; position:relative; overflow:hidden; font-family:monospace; }
    .ga-scanlines { position:absolute; inset:0; pointer-events:none; z-index:20; background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.18) 3px,rgba(0,0,0,.18) 4px); }
  
    .ga-star { position:absolute; border-radius:50%; background:#fff; animation:starTwinkle 2s ease-in-out infinite; }
    .s1{width:2px;height:2px;top:8%;left:12%;animation-delay:0s}  .s2{width:3px;height:3px;top:15%;left:70%;animation-delay:.4s}
    .s3{width:2px;height:2px;top:5%;left:45%;animation-delay:.8s} .s4{width:2px;height:2px;top:22%;left:85%;animation-delay:1.1s}
    .s5{width:3px;height:3px;top:10%;left:30%;animation-delay:1.6s}.s6{width:2px;height:2px;top:18%;left:58%;animation-delay:.3s}
    @keyframes starTwinkle { 0%,100%{opacity:.3} 50%{opacity:1} }
  
    .ga-invaders { position:absolute; top:60px; left:0; right:0; display:flex; justify-content:space-around; padding:0 20px; animation:invaderMarch 3s ease-in-out infinite alternate; }
    @keyframes invaderMarch { from{transform:translateX(-30px)} to{transform:translateX(30px)} }
    .ga-inv { font-size:1.5rem; animation:invBob .6s ease-in-out infinite alternate; }
    .inv1{animation-delay:0s} .inv2{animation-delay:.1s} .inv3{animation-delay:.2s} .inv4{animation-delay:.3s} .inv5{animation-delay:.4s}
    @keyframes invBob { from{transform:translateY(0)} to{transform:translateY(-6px)} }
  
    .ga-ebullet { position:absolute; width:3px; height:14px; background:var(--neon-pink); border-radius:2px; box-shadow:0 0 6px var(--neon-pink); animation:ebulletFall 2s linear infinite; }
    .eb1{left:22%;top:100px;animation-delay:.3s} .eb2{left:72%;top:100px;animation-delay:1.4s}
    @keyframes ebulletFall { 0%{transform:translateY(0);opacity:1} 80%{opacity:1} 100%{transform:translateY(300px);opacity:0} }
  
    .ga-ship { position:absolute; bottom:52px; left:50%; transform:translateX(-50%) rotate(-90deg); font-size:2rem; animation:shipMove 4s ease-in-out infinite alternate; filter:drop-shadow(0 0 8px var(--neon-cyan)); }
    @keyframes shipMove { from{left:25%} to{left:75%} }
  
    .ga-laser { position:absolute; bottom:90px; left:50%; width:3px; height:0; background:var(--neon-cyan); box-shadow:0 0 8px var(--neon-cyan); transform:translateX(-50%); animation:laserFire 2s ease-in-out infinite; transform-origin:bottom center; }
    @keyframes laserFire { 0%{height:0;opacity:0;bottom:90px} 10%{height:60px;opacity:1} 50%{height:260px;opacity:1;bottom:90px} 60%{height:0;opacity:0} 100%{height:0;opacity:0} }
  
    .ga-explosion { position:absolute; top:95px; left:45%; font-size:2rem; animation:explode 2s ease-in-out infinite; pointer-events:none; }
    @keyframes explode { 0%,49%{opacity:0;transform:scale(.4)} 50%{opacity:1;transform:scale(1.3)} 65%{opacity:1;transform:scale(1)} 80%,100%{opacity:0;transform:scale(.4)} }
  
    .ga-hud { position:absolute; top:10px; left:0; right:0; display:flex; justify-content:space-between; padding:0 14px; font-size:.6rem; letter-spacing:.12em; color:rgba(0,255,249,.7); font-family:'Share Tech Mono',monospace; }
    .ga-score-num { color:var(--neon-cyan); }
    .ga-lives     { color:var(--neon-pink); text-shadow:0 0 6px var(--neon-pink); }
    .ga-ground    { position:absolute; bottom:44px; left:0; right:0; height:1px; background:rgba(0,255,249,.25); box-shadow:0 0 4px rgba(0,255,249,.4); }
  </style>