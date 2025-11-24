import { updateCircleLocations } from "./circleFunctions.svelte";
import { updateCountries } from "./heatmapFunctions.svelte";
import { mapContainer, g } from "./mapStates.svelte";

let [currentX, currentY]: number[] = [0, 0];
let mouseDown = false;
// any = timeout
let debounceTimeout: any | null = null;

let onMouseDown = () => mouseDown = true;
let onMouseUp = () => {
    mouseDown = false;
    currentX = 0;
    currentY = 0;
};
let onMouseMove: (e: MouseEvent) => void | null;

function debouncedGlobeUpdate(e: MouseEvent, projection: d3.GeoProjection, delay: number = 50) {
    if (debounceTimeout) {
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

    const rotate = projection.rotate();
    const newRotate = [
        rotate[0] + deltaX * 0.25,
        rotate[1] - deltaY * 0.25,
        rotate[2],
    ];

    projection.rotate(newRotate);

    debounceTimeout = setTimeout(() => {
        updateCountries(projection);
        updateCircleLocations(projection);
        debounceTimeout = null;
    }, delay);
}

// registers event listeners for globe updating.
export function registerGlobeEventListeners(projection: d3.GeoProjection) {
    onMouseMove = (e: MouseEvent) => {
        if (!mouseDown) {
            return;
        }
        debouncedGlobeUpdate(e, projection);
    };

    mapContainer.state?.addEventListener('mousedown', onMouseDown);
    mapContainer.state?.addEventListener('mouseup', onMouseUp);
    mapContainer.state?.addEventListener('mousemove', onMouseMove);
}

export function destroyGlobeEventListeners() {
    mapContainer.state?.removeEventListener('mousedown', onMouseDown);
    mapContainer.state?.removeEventListener('mouseup', onMouseUp);
    mapContainer.state?.removeEventListener('mousemove', onMouseMove);
}