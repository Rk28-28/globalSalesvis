import { updateCircleLocations } from "./circleFunctions.svelte";
import { updateCountryLocations } from "./heatmapFunctions.svelte";
import {
  mapContainer,
  g,
  showCircles,
  projection,
  projectionType,
} from "./mapStates.svelte";

let [currentX, currentY]: number[] = [0, 0];
let mouseDown = false;
// any = timeout
let debounceTimeout: any | null = null;

let onMouseDown = () => (mouseDown = true);
let onMouseUp = () => {
  mouseDown = false;
  currentX = 0;
  currentY = 0;
};
let onMouseMove: (e: MouseEvent) => void | null;

function debouncedGlobeUpdate(e: MouseEvent, delay: number = 10) {
  if (debounceTimeout || !projection.state) {
    return;
  }

  const deltaX = e.x - currentX;
  const deltaY = e.y - currentY;

  if (currentX == 0 || currentY == 0) {
    currentX = e.x;
    currentY = e.y;
    return;
  }

  currentX = e.x;
  currentY = e.y;

  const rotate = projection.state.rotate();
  const newRotate = [rotate[0] + deltaX * 0.25, rotate[1] - deltaY * 0.25, rotate[2]];

  projection.state.rotate(newRotate);

  // debounceTimeout = setTimeout(() => {
  requestAnimationFrame(() => {
    updateCountryLocations();

    if (showCircles.state) {
      updateCircleLocations();
    }
    debounceTimeout = null;
  });
  // }, delay);
}

// registers event listeners for globe updating.
export function registerGlobeEventListeners() {
  onMouseMove = (e: MouseEvent) => {
    if (!mouseDown || projectionType.state == "2d") {
      return;
    }
    debouncedGlobeUpdate(e);
  };

  mapContainer.state?.addEventListener("mousedown", onMouseDown);
  mapContainer.state?.addEventListener("mouseup", onMouseUp);
  mapContainer.state?.addEventListener("mousemove", onMouseMove);
}

export function destroyGlobeEventListeners() {
  mapContainer.state?.removeEventListener("mousedown", onMouseDown);
  mapContainer.state?.removeEventListener("mouseup", onMouseUp);
  mapContainer.state?.removeEventListener("mousemove", onMouseMove);
}
