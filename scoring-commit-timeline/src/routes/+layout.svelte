<script lang="ts">
  import type { Snippet } from "svelte";
  let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
  <title>採点 × コミット タイムライン</title>
</svelte:head>

{@render children()}

<style>
  :global(:root) {
    color-scheme: light;
  }

  :global(body) {
    margin: 0;
    min-height: 100vh;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    background: #fff;
    color: #111;
    line-height: 1.5;
  }

  :global(a) {
    color: #111;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  :global(a:hover) {
    text-decoration-thickness: 2px;
  }
</style>
