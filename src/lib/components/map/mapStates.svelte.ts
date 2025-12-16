// The purpose of this file is so that we can use these states across many .svelte and .svelte.ts files
// I know it looks stupid, but it's really good for code reusability
import type { Order } from "@data-types/order";
import type { CircleMetricData } from "@data-types/circleData";
import type { HeatmapMetric, CircleMetric } from "@data-types/metrics";
import type { ProjectionType } from "@data-types/mapState";
import { writable } from "svelte/store";

export type StateWrapper<T> = { state: T };
function makeStateWrapper<T>(p: T): StateWrapper<T> {
  return {
    state: p,
  };
}

type AnimationState = "playing" | "paused" | "stopped";

let orderData = $state<StateWrapper<Order[]>>(makeStateWrapper([]));
let circleGeoData = $state<any>(makeStateWrapper(null));
let geography = $state<any>(makeStateWrapper(null));
let countriesLoading = $state<StateWrapper<boolean>>(makeStateWrapper(true));
let selectedCountry = $state<StateWrapper<string>>(makeStateWrapper(""));
// const selectedCountry = writable<string>("");
let mapContainer = $state<StateWrapper<HTMLDivElement | null>>(makeStateWrapper(null));
let projection = $state<StateWrapper<d3.GeoProjection | null>>(makeStateWrapper(null));
let projectionType = $state<StateWrapper<ProjectionType>>(makeStateWrapper("2d"));
let countrySelection: d3.Selection<SVGPathElement, any, SVGGElement, unknown>;

// circle states
let circleMetrics = $state<
  StateWrapper<Record<string, Record<string, CircleMetricData>>>
>(makeStateWrapper({}));
let circleMetric = $state<StateWrapper<CircleMetric>>(makeStateWrapper("orders"));
let circlesRendered = $state<StateWrapper<boolean>>(makeStateWrapper(false));

// heatmap states
let heatmapMetric = $state<StateWrapper<HeatmapMetric>>(makeStateWrapper("orders"));
let heatmapMetrics = $state<StateWrapper<Record<string, any>>>(makeStateWrapper({}));
let showHeatmap = $state<StateWrapper<boolean>>(makeStateWrapper(false));
let legendData = $state<
  StateWrapper<{
    type: "gradient" | "categorical";
    items?: { color: string; label: string }[];
    gradient?: { min: number | string; max: number | string };
  } | null>
>(makeStateWrapper(null));

// these three will likely be used in the form, which we should break into a separate component
let showCircles = $state<StateWrapper<boolean>>(makeStateWrapper(false));
let startDateRaw = $state<StateWrapper<string>>(makeStateWrapper(""));
let endDateRaw = $state<StateWrapper<string>>(makeStateWrapper(""));

// singletons
let dataStartDate = $state<StateWrapper<Date>>(
  makeStateWrapper(
    new Date("Wed Jan 01 2014 00:00:00 GMT-0600 (Central Standard Time)"),
  ),
);
let dataEndDate = $state<StateWrapper<Date>>(
  makeStateWrapper(
    new Date("Sun Dec 31 2017 00:00:00 GMT-0600 (Central Standard Time)"),
  ),
);

// map elements
let svg = $state<StateWrapper<SVGSVGElement | null>>(makeStateWrapper(null));
let g = $state<StateWrapper<SVGGElement | null>>(makeStateWrapper(null));
let tooltip = $state<StateWrapper<HTMLDivElement | null>>(makeStateWrapper(null));
let radiusScale = $state<StateWrapper<d3.ScalePower<number, number, never> | null>>(
  makeStateWrapper(null),
);
let miniSvg = $state<StateWrapper<SVGSVGElement | null>>(makeStateWrapper(null));

//animation
let animationDate = $state<StateWrapper<Date>>(makeStateWrapper(new Date()));
let animationTimeframe = $state<StateWrapper<string>>(makeStateWrapper("week"));
let animationPlaying = $state<StateWrapper<AnimationState>>(
  makeStateWrapper("stopped"),
);
let animationDelay = $state<StateWrapper<number>>(makeStateWrapper(100));

// zoom
let zoomLevel = $state<StateWrapper<number>>(makeStateWrapper(1));

export {
  circlesRendered,
  orderData,
  circleGeoData,
  geography,
  selectedCountry,
  countriesLoading,
  showCircles,
  startDateRaw,
  endDateRaw,
  circleMetrics,
  circleMetric,
  showHeatmap,
  heatmapMetric,
  heatmapMetrics,
  legendData,
  g,
  svg,
  tooltip,
  radiusScale,
  animationDate,
  dataStartDate,
  dataEndDate,
  animationTimeframe,
  animationPlaying,
  animationDelay,
  mapContainer,
  projection,
  projectionType,
  zoomLevel,
  miniSvg,
};
