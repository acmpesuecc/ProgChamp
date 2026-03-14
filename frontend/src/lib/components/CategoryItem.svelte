<script lang="ts">
    /**
     * CategoryItem
     * A single genre tile. Used inside a cat-grid wrapper in the parent.
     */
    interface Category {
      name: string;
      icon: string;
    }
  
    interface Props {
      category: Category;
    }
  
    let { category }: Props = $props();
  </script>
  
  <a href="/all-games?genre={encodeURIComponent(category.name)}" class="cat-item">
    <span class="cat-icon">{category.icon}</span>
    <div class="cat-name">{category.name}</div>
  </a>
  
  <style>
    .cat-item {
      border: 1px solid rgba(191,0,255,.2);
      padding: 24px 16px;
      text-align: center;
      cursor: none;
      transition: all .3s;
      position: relative;
      overflow: hidden;
      background: rgba(191,0,255,.03);
      text-decoration: none;
      display: block;
    }
    .cat-item::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent 50%, rgba(191,0,255,.1) 100%);
      opacity: 0;
      transition: opacity .3s;
    }
    .cat-item:hover              { border-color: var(--neon-purple); transform: translateY(-4px); }
    .cat-item:hover::before      { opacity: 1; }
    .cat-item:hover .cat-icon    { text-shadow: 0 0 20px var(--neon-purple); transform: scale(1.2); }
  
    .cat-icon { font-size: 2rem; margin-bottom: 10px; transition: all .3s; display: block; }
    .cat-name { font-family: 'Share Tech Mono', monospace; font-size: .65rem; letter-spacing: .15em; text-transform: uppercase; color: rgba(224,224,255,.5); }
  </style>