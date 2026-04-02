<script lang="ts">
    import { onMount } from "svelte";

    let { children } = $props();

    let cursorEl = $state<HTMLDivElement | null>(null);
    let dotEl = $state<HTMLDivElement | null>(null);

    onMount(() => {
        let mx = 0,
            my = 0,
            cx = 0,
            cy = 0;
        const onMove = (e: MouseEvent) => {
            mx = e.clientX;
            my = e.clientY;
            if (dotEl) {
                dotEl.style.left = mx + "px";
                dotEl.style.top = my + "px";
            }
        };
        document.addEventListener("mousemove", onMove);
        const raf = () => {
            cx += (mx - cx) * 0.12;
            cy += (my - cy) * 0.12;
            if (cursorEl) {
                cursorEl.style.left = cx + "px";
                cursorEl.style.top = cy + "px";
            }
            requestAnimationFrame(raf);
        };
        raf();
        const addHover = (el: Element) => {
            el.addEventListener("mouseenter", () => {
                if (cursorEl) {
                    cursorEl.style.transform = "translate(-50%,-50%) scale(2)";
                    cursorEl.style.borderColor = "var(--neon-pink)";
                }
            });
            el.addEventListener("mouseleave", () => {
                if (cursorEl) {
                    cursorEl.style.transform = "translate(-50%,-50%) scale(1)";
                    cursorEl.style.borderColor = "var(--neon-cyan)";
                }
            });
        };
        document.querySelectorAll("button, a").forEach(addHover);
        return () => document.removeEventListener("mousemove", onMove);
    });
</script>

<div class="cursor" bind:this={cursorEl}></div>
<div class="cursor-dot" bind:this={dotEl}></div>
<div class="grid-bg"></div>
<div class="noise"></div>

{@render children()}

<style>
    :global(body) {
        cursor: none;
    }
</style>
