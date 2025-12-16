import * as d3 from "d3";
import type { CircleData } from "@data-types/circleData";
import {
  circleGeoData,
  startDateRaw,
  endDateRaw,
  svg,
  tooltip,
  orderData,
  animationDelay,
  selectedCountry,
  circleMetrics,
  circleMetric,
  circlesRendered,
  showCircles,
  projection,
  g,
  radiusScale,
  projectionType,
  zoomLevel,
} from "./mapStates.svelte";
import { getScaleRange, normalizeCountryName } from "./utils";
import type { CircleMetric } from "@data-types/metrics";
import type { CircleMetricData } from "@data-types/circleData";

let startDate = $derived<Date>(new Date(startDateRaw.state));
let endDate = $derived<Date>(new Date(endDateRaw.state));
let currentMetric = $state<CircleMetric>("orders"); // Track current metric
let lastMetric = "";
let allCities = new Set<string>();

// d3.selection
let circleGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;

// loops over city metrics and applies callback function with city and country
// use for loops instead of forEach beucase of the performance gains
function mapCircleMetrics(
  fn: (country: string, city: string, cm: CircleMetricData) => void,
) {
  const state = circleMetrics.state;
  const circleMetricEntries = Object.entries(circleMetrics.state);
  for (let i = 0; i < circleMetricEntries.length; i++) {
    let [country, cities] = circleMetricEntries[i];
    let cityKeys = Object.keys(cities || {});
    for (let j = 0; j < cityKeys.length; j++) {
      fn(country, cityKeys[j], state[country][cityKeys[j]]);
    }
  }
}

// update the scale. should be triggered on metric changes
export async function updateRadiusScale() {
  // don't update if metric has not changed
  if (lastMetric && lastMetric == circleMetric.state) {
    console.log("Metric didn't change, not updating radius scale");
    return;
  }
  lastMetric = circleMetric.state;
  circlesRendered.state = false;

  const allValues: number[] = [];
  mapCircleMetrics((country, city, data) => {
    allValues.push(data[circleMetric.state]);
  });

  const maxValue =
    circleMetric.state === "profit"
      ? Math.max(...allValues.map((v) => Math.abs(v)), 1)
      : Math.max(...allValues, 1);
  const scaleRange = getScaleRange();

  radiusScale.state = d3.scaleSqrt().domain([0, maxValue]).range(scaleRange);
}

// batch updates city buckets variable
// should realistically only need to happen once
export function updateCircleMetrics(): typeof circleMetrics.state {
  if (!orderData.state) return {};

  const out: any = {};
  const metricsOut: Record<string, Record<string, CircleMetricData>> = {};
  const start = startDate;
  const end = endDate;

  for (let i = 0; i < orderData.state.length; i++) {
    const order = orderData.state[i];
    const orderDate = new Date(order.orderDate);

    // Check if order is within date range
    if ((start && orderDate < start) || (end && orderDate > end)) continue;

    const country = order.country;
    const city = order.city;

    // Initialize if needed
    if (!out[country]) out[country] = {};
    if (!metricsOut[country]) metricsOut[country] = {};
    if (!metricsOut[country][city]) {
      metricsOut[country][city] = {
        orders: 0,
        sales: 0,
        profit: 0,
        quantity: 0,
        shipping: 0,
        discount: 0,
        maxDiscount: 0,
      };
    }

    // Store a reference to the nested object
    const cityMetrics = metricsOut[country][city];

    // Update counts
    out[country][city] = (out[country][city] || 0) + 1;

    // Update metric values using the local reference
    cityMetrics.orders += 1;
    cityMetrics.sales += order.sales || 0;
    cityMetrics.profit += order.profit || 0;
    cityMetrics.quantity += order.quantity || 0;
    cityMetrics.shipping += order.shippingCost || 0;
    cityMetrics.discount += order.discount || 0;
    cityMetrics.maxDiscount = Math.max(cityMetrics.maxDiscount, order.discount || 0);
  }

  return metricsOut;
}

// updates the size of circles on the map whenever cityFreqs updates
export function updateCircleSize() {
  if (radiusScale.state == null) {
    console.error(
      "Cannot update circle size: circles are not rendered or radius scale is null!",
    );
    return;
  }
  if (!circleGroup || circleGroup.empty()) {
    circleGroup = d3.select(g.state).append("g").attr("class", "cities");

    if (circleGroup.empty()) {
      console.error("Circle group is empty!");
      return;
    }
  }

  const metric = circleMetric.state;

  circleGroup.selectAll("circle").each(function (d: any) {
    const country = d.country;
    const city = d.city;
    const data = circleMetrics.state[country]?.[city];
    if (!data || !radiusScale.state) {
      d3.select(this).transition().duration(250).attr("r", 0);
      return;
    }

    const value = data[metric];
    const radius =
      metric === "profit"
        ? radiusScale.state(Math.abs(value))
        : radiusScale.state(value);

    d3.select(this)
      .transition()
      .duration(250)
      .attr("r", radius / zoomLevel.state)
      .attr("stroke-width", 0.8 / zoomLevel.state);
  });
}

// Format metric value for display in tooltip
function formatTooltip(city: string, country: string): string {
  if (!circleMetrics.state[country]?.[city]) return `<strong>${city}</strong>`;

  const data = circleMetrics.state[country][city];

  switch (circleMetric.state) {
    case "profit":
      const profit = data.profit;
      const profitStr =
        profit >= 0
          ? `$${profit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : `-$${Math.abs(profit).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      return `
                <strong>${city}</strong><br/>
                Net: ${profitStr}
            `;
    case "sales":
      return `
                <strong>${city}</strong><br/>
                Total Sales: $${data.sales.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            `;
    case "quantity":
      return `
                <strong>${city}</strong><br/>
                Quantity: ${data.quantity.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            `;
    case "shipping":
      return `
                <strong>${city}</strong><br/>
                Shipping Cost: $${data.shipping.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            `;
    case "discount":
      const avgDiscount = data.orders > 0 ? data.discount / data.orders : 0;
      return `
                <strong>${city}</strong><br/>
                Highest Discount: ${(data.maxDiscount * 100).toFixed(1)}%<br/>
                Average Discount: ${(avgDiscount * 100).toFixed(1)}%
            `;
    case "orders":
    default:
      return `
                <strong>${city}</strong><br/>
                Orders: ${data.orders.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            `;
  }
}

function isPointVisible(
  projection: d3.GeoProjection,
  lng: number,
  lat: number,
): boolean {
  const [centerLng, centerLat] = projection.rotate().map((d) => -d); // Reverse the rotation

  // Convert degrees to radians
  const toRadians = (deg: number) => (deg * Math.PI) / 180;

  const center = [
    Math.cos(toRadians(centerLat)) * Math.cos(toRadians(centerLng)),
    Math.cos(toRadians(centerLat)) * Math.sin(toRadians(centerLng)),
    Math.sin(toRadians(centerLat)),
  ];

  const target = [
    Math.cos(toRadians(lat)) * Math.cos(toRadians(lng)),
    Math.cos(toRadians(lat)) * Math.sin(toRadians(lng)),
    Math.sin(toRadians(lat)),
  ];

  // Dot product of the two vectors
  const dotProduct =
    center[0] * target[0] + center[1] * target[1] + center[2] * target[2];

  // If the dot product is positive, the point is on the visible side
  return dotProduct > 0;
}

export function updateCircleLocations() {
  if (!circleGroup || circleGroup.empty()) {
    circleGroup = d3.select(g.state).append("g").attr("class", "cities");

    if (circleGroup.empty()) {
      console.error("Circle group is empty!");
      return;
    }
  }

  const geoData = circleGeoData.state;
  circleGroup.selectAll("circle").each(function (d: any) {
    const city = d.city;
    const country = d.country;

    if (!geoData[country] || !geoData[country][city] || !projection.state) {
      return;
    }

    const [lng, lat] = [geoData[country][city].lng, geoData[country][city].lat];
    //@ts-ignore projection state was checked at the top of the function
    const [x, y] = projection.state([lng, lat]) || [null, null];

    if (x !== null && y !== null) {
      // Check if the circle is within the visible bounds
      if (
        projectionType.state == "globe" &&
        !isPointVisible(projection.state, lng, lat)
      ) {
        // Hide the circle if it's out of bounds
        d3.select(this).attr("display", "none");
      } else {
        // Show the circle and update its position
        d3.select(this)
          .attr("display", showCircles.state ? "block" : "none")
          .attr("cx", x)
          .attr("cy", y);
      }
    }
  });
}

// renders circles on the map. should only really be used once
export function renderCircles(
  projection: d3.GeoProjection,
  targetG: SVGGElement | null,
  geoData: any,
) {
  if (!orderData.state.length || !targetG || !geoData) {
    console.error("Params to renderCircles are not valid");
    return;
  }

  const metric = circleMetric.state;

  // If metric changed, force recreation of circles
  if (metric !== currentMetric && circleGroup) {
    console.log("Metric changed, removing old circles");
    circleGroup.remove();
    circlesRendered.state = false;
  } else if (circlesRendered.state) {
    console.log("Circles already rendered and metric has not changed");
    return;
  }

  // Ensure circleMetrics is populated
  if (Object.keys(circleMetrics).length === 0) {
    console.log("circleMetrics empty, skipping render");
    return;
  }

  currentMetric = metric; // Update current metric

  // const geoData = circleGeoData.state;
  circleGroup = d3.select(targetG).append("g").attr("class", "cities");
  if (selectedCountry.state === "USA") {
    selectedCountry.state = "United States";
  } // very hacky fix for the naming mismatch between country and selectedCountry.state

  const allValues: number[] = [];
  let circleData: (CircleData & { metricValue: number })[] = [];
  mapCircleMetrics((country, city, data) => {
    if (!geoData[country] || !geoData[country][city]) {
      return;
    }
    // if (country !== selectedCountry.state && "" !== selectedCountry.state) {
    //   return;
    // }
    allValues.push(data[circleMetric.state]);

    // initial rendering should be called with all data
    allCities.add(`${city}-${country}`);

    const normalizedCountry = normalizeCountryName(country);
    const [x, y] = projection([
      geoData[country][city].lng,
      geoData[country][city].lat,
    ])!;

    if (!x || !y) {
      return;
    }

    const metricValue = data[metric];

    circleData.push({
      city,
      country,
      normalizedCountry,
      x,
      y,
      metricValue,
    });
  });
  circleData = circleData.filter((d) => d !== null);
  const maxValue =
    circleMetric.state === "profit"
      ? Math.max(...allValues.map((v) => Math.abs(v)), 1)
      : Math.max(...allValues, 1);
  const scaleRange = getScaleRange();
  radiusScale.state = d3.scaleSqrt().domain([0, maxValue]).range(scaleRange);

  circleGroup
    .selectAll("circle")
    .data(circleData)
    .join("circle")
    .attr("id", (d) => `${d.city}-${d.country}`)
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d: any) => {
      if (!radiusScale.state) return 0;

      const absValue = metric === "profit" ? Math.abs(d.metricValue) : d.metricValue;
      return showCircles.state ? radiusScale.state(absValue) / zoomLevel.state : 0;
    })
    .attr("fill", (d) =>
      metric === "profit"
        ? d.metricValue < 0
          ? "rgba(255, 0, 0, 0.6)"
          : "rgba(0, 200, 0, 0.6)"
        : "rgba(255, 100, 0, 0.6)",
    )
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.8 / zoomLevel.state)
    .style("pointer-events", "all")
    .on("mouseover", function (event, d) {
      if (!radiusScale.state) return 0;

      const hoveredRadius = radiusScale.state(Math.abs(d.metricValue)) * 1.3;
      const hoverFill =
        metric === "profit"
          ? d.metricValue < 0
            ? "rgba(255, 50, 50, 0.9)"
            : "rgba(50, 200, 50, 0.9)"
          : "rgba(255, 150, 0, 0.9)";
      d3.select(this)
        .attr("fill", hoverFill)
        .attr("r", hoveredRadius / zoomLevel.state);

      const tt = tooltip.state;
      if (tt) {
        tt.style.display = "block";
        tt.style.left = `${event.pageX + 10}px`;
        tt.style.top = `${event.pageY + 10}px`;
        tt.innerHTML = formatTooltip(d.city, d.country);
      }
    })
    .on("mouseout", function (event, d) {
      const absValue = metric === "profit" ? Math.abs(d.metricValue) : d.metricValue;
      const normalFill =
        metric === "profit"
          ? d.metricValue < 0
            ? "rgba(255, 0, 0, 0.6)"
            : "rgba(0, 200, 0, 0.6)"
          : "rgba(255, 100, 0, 0.6)";
      d3.select(this)
        .attr("fill", normalFill)
        .attr(
          "r",
          radiusScale.state ? radiusScale.state(absValue) / zoomLevel.state : 0,
        );

      const tt = tooltip.state;
      if (tt) {
        tt.style.display = "none";
      }
    })
    .on("click", (event, d) => {
      selectedCountry.state =
        selectedCountry.state === d.normalizedCountry ? "" : d.normalizedCountry;
    });

  const circles = circleGroup.selectAll("circle");
  console.log("Number of circles rendered:", circles.size());

  // if (selectedCountry.state === "") {
  circlesRendered.state = true;
  // }
}
