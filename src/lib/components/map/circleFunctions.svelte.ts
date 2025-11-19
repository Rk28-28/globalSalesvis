import * as d3 from "d3";
import type { CityData } from "@data-types/cityData";
import {
  cityGeoData,
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
} from "./mapStates.svelte";
import { getScaleRange, normalizeCountryName } from "./utils";
import type { CircleMetric } from "@data-types/metrics";
import type { CircleMetricData } from "@data-types/cityData";

let startDate = $derived<Date>(new Date(startDateRaw.state));
let endDate = $derived<Date>(new Date(endDateRaw.state));
let currentMetric = $state<CircleMetric>("orders"); // Track current metric
let lastMetric = "";
let radiusScale: any | null;
let allCities = new Set<string>();

export function updateRadiusScale() {
  // don't update if metric has not changed
  if (
    (lastMetric && lastMetric == circleMetric.state) ||
    JSON.stringify(circleMetrics.state) == "{}"
  ) {
    return;
  } else {
    lastMetric = circleMetric.state;
  }

  const allValues: number[] = [];
  mapCircleMetrics((country, city, data) => {
    allValues.push(data[circleMetric.state]);
  });

  const maxValue =
    circleMetric.state === "profit"
      ? Math.max(...allValues.map((v) => Math.abs(v)), 1)
      : Math.max(...allValues, 1);
  const scaleRange = getScaleRange();

  // flip this variable to signal that circles need to be re-rendered on scale change
  circlesRendered.state = false;

  radiusScale = d3.scaleSqrt().domain([0, maxValue]).range(scaleRange);
}

// loops over city buckets and applies callback function with city and country
// use for loops instead of forEach beucase of the performance gains
function mapCircleMetrics(
  fn: (country: string, city: string, cm: CircleMetricData) => void,
) {
  const state = circleMetrics.state;
  const circleMetricEntries = Object.entries(circleMetrics.state);
  for (let i = 0; i < circleMetricEntries.length; i++) {
    let [country, cities] = circleMetricEntries[i];
    cities = Object.keys(cities || {});
    for (let j = 0; j < cities.length; j++) {
      fn(country, cities[j], state[country][cities[j]]);
    }
  }
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
  if (!circlesRendered.state || radiusScale == null) {
    return;
  }

  const metric = circleMetric.state;

  let shownCities = new Set<string>();
  mapCircleMetrics((country, city, data) => {
    const q = `${city}-${country}`;
    const circle = svg.state?.getElementById(q);
    if (circle) {
      shownCities.add(`${city}-${country}`);
      const value = data[circleMetric.state];
      const radius =
        metric === "profit" ? radiusScale(Math.abs(value)) : radiusScale(value);

      // For profit, change color based on positive/negative
      const fill =
        metric === "profit" && value < 0
          ? "rgba(255, 0, 0, 0.6)" // Red for negative profit
          : "rgba(255, 100, 0, 0.6)"; // Orange for positive/other metrics

      d3.select(circle)
        .transition()
        .duration(animationDelay.state)
        .attr("r", radius)
        .attr("fill", fill);
    }
  });
  
  // keep track of all hidden cities not shown
  let hiddenCities = Array.from(allCities.difference(shownCities));
  for (let i = 0; i < hiddenCities.length; i++) {
    const circle = svg.state?.getElementById(hiddenCities[i]);
    if (circle) {
      d3.select(circle)
        .transition()
        .duration(animationDelay.state)
        .attr("r", 0);
    }
  }
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

// renders circles on the map. should only really be used once
export function renderCircles(projection: any, targetG: SVGGElement | null) {
  if (!orderData.state.length || !targetG || !cityGeoData.state || !radiusScale) {
    return;
  }

  const metric = circleMetric.state;

  // If metric changed, force recreation of circles
  if (
    circlesRendered.state &&
    selectedCountry.state === "" &&
    metric !== currentMetric
  ) {
    console.log("Metric changed, removing old circles");
    d3.select(targetG).selectAll(".cities").remove();
    circlesRendered.state = false;
  }

  if (circlesRendered.state && selectedCountry.state === "") {
    return;
  }

  // Ensure circleMetrics is populated
  if (Object.keys(circleMetrics).length === 0) {
    console.log("circleMetrics empty, skipping render");
    return;
  }

  currentMetric = metric; // Update current metric

  const geoData = cityGeoData.state;
  const cityGroup = d3.select(targetG).append("g").attr("class", "cities");
  if (selectedCountry.state === "USA") {
    selectedCountry.state = "United States";
  } // very hacky fix for the naming mismatch between country and selectedCountry.state

  let cityData: (CityData & { metricValue: number })[] = [];
  mapCircleMetrics((country, city, data) => {
    if (!geoData[country] || !geoData[country][city]) {
      return;
    }
    if (country !== selectedCountry.state && "" !== selectedCountry.state) {
      return;
    }

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

    cityData.push({
      city,
      country,
      normalizedCountry,
      x,
      y,
      metricValue,
    });
  });
  cityData = cityData.filter((d) => d !== null);

  cityGroup
    .selectAll("circle")
    .data(cityData)
    .join("circle")
    .attr("id", (d) => `${d.city}-${d.country}`)
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d: any) => {
      const absValue = metric === "profit" ? Math.abs(d.metricValue) : d.metricValue;
      return radiusScale(absValue);
    })
    .attr("fill", (d) =>
      metric === "profit" && d.metricValue < 0
        ? "rgba(255, 0, 0, 0.6)"
        : "rgba(255, 100, 0, 0.6)",
    )
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.8)
    .style("pointer-events", "all")
    .on("mouseover", function (event, d) {
      const absValue = metric === "profit" ? Math.abs(d.metricValue) : d.metricValue;

      const hoveredRadius = radiusScale(absValue) * 1.3;
      const hoverFill =
        metric === "profit" && d.metricValue < 0
          ? "rgba(255, 50, 50, 0.9)"
          : "rgba(255, 150, 0, 0.9)";
      d3.select(this).attr("fill", hoverFill).attr("r", hoveredRadius);

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
        metric === "profit" && d.metricValue < 0
          ? "rgba(255, 0, 0, 0.6)"
          : "rgba(255, 100, 0, 0.6)";
      d3.select(this)
        .attr("fill", normalFill)
        //@ts-ignore this will not be null
        .attr("r", radiusScale(absValue));

      const tt = tooltip.state;
      if (tt) {
        tt.style.display = "none";
      }
    })
    .on("click", (event, d) => {
      selectedCountry.state =
        selectedCountry.state === d.normalizedCountry ? "" : d.normalizedCountry;
    });
  if (selectedCountry.state === "") {
    circlesRendered.state = true;
  }
}
