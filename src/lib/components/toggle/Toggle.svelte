<script lang="ts">
  import { onMount } from "svelte";

  let { checked = false, projectionType = $bindable("2d") } = $props();
  function handleChange(event: Event) {
    projectionType = projectionType == "2d" ? "globe" : "2d";
    checked = projectionType == "globe";
  }

  onMount(() => {
    checked = projectionType == "globe";
  });
</script>

<label class="toggle">
  2d Map
  <input type="checkbox" bind:checked onchange={handleChange} class="toggle-input" />
  <span class="toggle-slider"></span>
  Globe View
</label>

<style>
  .toggle {
    display: flex;
    align-items: center;
    cursor: pointer;
    gap: 1em;
    user-select: none;

    padding: 0.75rem 1.5rem;
    border: 2px solid #333333;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.2s;
    background: var(--background-input);
    color: #ffffff;

    &:focus {
      outline: none;
      border-color: #4a90e2;
      background-color: var(--background-input-hover);
      box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.3);
    }

    &:hover {
      background-color: var(--background-input-hover);
    }
  }

  .toggle-input {
    width: 0;
    height: 0;
    opacity: 0;
    position: absolute;
  }

  .toggle-slider {
    width: 40px;
    height: 20px;
    background: transparent;
    border: 1px solid white;
    border-radius: 20px;
    position: relative;
    transition: background 0.2s;
  }
  .toggle-slider::before {
    content: "";
    position: absolute;
    left: 2px;
    top: 1px;
    width: 16px;
    height: 16px;
    background: #a5a5a5;
    border: 2px solid white;
    border-radius: 50%;
    transition: transform 0.2s;
  }
  .toggle-input:checked + .toggle-slider::before {
    transform: translateX(18px);
  }
</style>
