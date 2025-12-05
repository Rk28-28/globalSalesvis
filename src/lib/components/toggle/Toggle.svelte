<script lang="ts">
  import { onMount } from "svelte";

  let { checked = false, projectionType = $bindable('2d') } = $props();
  function handleChange(event: Event) {
    projectionType = projectionType == '2d' ? 'globe' : '2d';
    checked = projectionType == 'globe';
  }

  onMount(() => {
    checked = projectionType == 'globe';
  })
</script>

<label class="toggle">
  2d Map
  <input
    type="checkbox"
    bind:checked
    onchange={handleChange}
    class="toggle-input"
  />
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
  background: #ccc;
  border-radius: 20px;
  position: relative;
  transition: background 0.2s;
}
.toggle-slider::before {
  content: "";
  position: absolute;
  left: 2px;
  top: 2px;
  width: 16px;
  height: 16px;
  background: #a5a5a5;
  border: 2px solid white;
  border-radius: 50%;
  transition: transform 0.2s;
}
.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}
</style>