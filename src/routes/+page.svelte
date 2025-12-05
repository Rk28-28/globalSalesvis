<script lang="ts">
  import { Map } from "@components/map";
  import { loadData } from "@utils/loadData";
  import { onMount } from "svelte";
  import type { Order } from "@data-types/order";
  import { asset } from "$app/paths";
</script>

<svelte:head>
  <title>Interactive Map Visualization</title>
  <link rel="icon" href={asset("/favicon.svg")} />
</svelte:head>
<main>
  <!-- would be nice if the selected country bind worked, maybe figure this out later -->
  <!-- not necessary though -->
  <Map />
</main>

<style>
  main {
    width: 100vw;
    height: 100vh;
    display: flex;
    padding-top: 2em;
    align-items: center;
    flex-direction: column;
  }
</style>
