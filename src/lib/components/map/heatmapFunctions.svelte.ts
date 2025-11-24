import type { Order } from "@data-types/order";
import * as d3 from "d3";
import {
  orderData,
  geography,
  countriesLoading,
  g,
  selectedCountry,
  startDateRaw,
  endDateRaw,
  heatmapMetrics,
  heatmapMetric,
  legendData,
  showHeatmap,
} from "./mapStates.svelte";
import { getMostCommonCategory, normalizeCountryName } from "./utils";
import type { HeatmapMetric } from "@data-types/metrics";
import { showTooltip, hideTooltip } from "./tooltip.svelte";

let colorScale: d3.ScaleSequential<string> | null = null;

export function getHeatmapMetricData(
  orders: Order[],
  metric: string,
): Record<string, any> {
  const out: Record<string, any> = {};

  for (const order of orders) {
    const normalized = normalizeCountryName(order.country);

    if (!out[normalized]) {
      out[normalized] = {
        orders: 0,
        sales: [],
        profit: [],
        discount: [],
        quantity: 0,
        shipping: [],
        shippingMode: {
          "Standard Class": 0,
          "First Class": 0,
          "Second Class": 0,
          "Same Day": 0,
        },
        segment: { Consumer: 0, Corporate: 0, "Home Office": 0 },
        category: { Technology: 0, "Office Supplies": 0, Furniture: 0 },
        priority: { Medium: 0, High: 0, Low: 0, Critical: 0 },
      };
    }

    out[normalized].orders += 1;
    out[normalized].sales.push(order.sales);
    out[normalized].profit.push(order.profit);
    out[normalized].discount.push(order.discount);
    out[normalized].quantity += order.quantity;
    out[normalized].shipping.push(order.shippingCost);

    // Categorical data
    out[normalized].shippingMode[order.shipMode] =
      (out[normalized].shippingMode[order.shipMode] || 0) + 1;
    out[normalized].segment[order.segment] =
      (out[normalized].segment[order.segment] || 0) + 1;
    out[normalized].category[order.category] =
      (out[normalized].category[order.category] || 0) + 1;
    out[normalized].priority[order.orderPriority] =
      (out[normalized].priority[order.orderPriority] || 0) + 1;
  }

  return out;
}

let countrySelection: any | null = null;
let animationFrameId: number | null = null;

export function updateCountries(projection: d3.GeoProjection) {
  if (!countrySelection || countrySelection.empty()) {
    console.error("Country selection is not initialized");
    return;
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  animationFrameId = requestAnimationFrame(() => {
    const path = d3.geoPath().projection(projection);
    countrySelection.attr("d", (d: any) => path(d));
    animationFrameId = null;
  });
}

export function loadCountries(projection: d3.GeoProjection, loaders: boolean = false) {
  countriesLoading.state = loaders;

  if (!g.state) {
    console.error("g.state is not initialized");
    return;
  }

  if (!geography.state || !geography.state.features || geography.state.features.length === 0) {
    console.error("geography state is not empty");
    return;
  }

  const path = d3.geoPath().projection(projection);

  countrySelection = d3
    .select(g.state)
    .selectAll<SVGPathElement, any>("path")
    .data(geography.state.features);

  countrySelection
    .attr("d", (d: any) => path(d))
    .attr("fill", "#e0e0e0")
    .attr("stroke", "#999")
    .attr("stroke-width", 0.5)
    .attr(
      "data-country",
      (d: any, i: number) => geography.state.features[i].properties.name,
    );

  countrySelection = countrySelection
    .enter()
    .append("path")
    .attr("d", (d: any) => path(d))
    .attr("fill", "#e0e0e0")
    .attr("stroke", "#999")
    .attr("stroke-width", 0.5)
    .attr(
      "data-country",
      (d: any, i: number) => geography.state.features[i].properties.name,
    )
    .on("click", function (_, d) {
      const country = d.properties.name;
      selectedCountry.state = selectedCountry.state === country ? "" : country;
    });

  countriesLoading.state = false;
}

// Function to update country metric data based on date range
export function updateHeatmapMetricDataWithDateFilter() {
  if (!orderData.state) return;

  const startDate = startDateRaw.state ? new Date(startDateRaw.state) : null;
  const endDate = endDateRaw.state ? new Date(endDateRaw.state) : null;
  let filteredOrders = orderData.state;

  if (startDate || endDate) {
    filteredOrders = orderData.state.filter((order) => {
      const orderDate = new Date(order.orderDate);
      if (startDate && orderDate < startDate) return false;
      if (endDate && orderDate > endDate) return false;
      return true;
    });
  }

  // Update country metric data with filtered data
  heatmapMetrics.state = getHeatmapMetricData(filteredOrders, heatmapMetric.state);
}

export function updateHeatmap(
  targetG: SVGGElement | null,
  metricData: Record<string, any>,
  enabled: boolean,
  metric: HeatmapMetric,
) {
  if (!targetG) return;

  // Setup color scale based on metric - this will update legendData
  if (enabled && metricData && Object.keys(metricData).length > 0) {
    setupColorScale(metric, metricData);
  }

  // Update country colors
  d3.select(targetG)
    .selectAll("path")
    .each(function () {
      const path = d3.select(this);
      const countryName = path.attr("data-country");
      const countryData = metricData?.[countryName];

      if (enabled && countryData) {
        path
          .attr("fill", getColorForMetric(countryData, metric))
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5);
      } else {
        path.attr("fill", "#e0e0e0").attr("stroke", "#999").attr("stroke-width", 0.5);
      }
    });

          if (showHeatmap.state) {
        // Add hover interactions for heatmap
        d3.select(g.state)
          .selectAll("path")
          .each(function () {
            const path = d3.select(this);
            const countryName = path.attr("data-country");
            const countryData = heatmapMetrics.state[countryName];

            path
              .on("mouseover", function (event) {
                path.attr("opacity", 0.7);
                showTooltip(event, countryName, countryData, heatmapMetric.state);
              })
              .on("mouseout", function () {
                path.attr("opacity", 1);
                hideTooltip();
              })
              .on("mousemove", function (event) {
                showTooltip(event, countryName, countryData, heatmapMetric.state);
              });
          });
      } else {
        // Remove hover interactions
        d3.select(g.state)
          .selectAll("path")
          .on("mouseover", null)
          .on("mouseout", null)
          .on("mousemove", null)
          .attr("opacity", 1);
        hideTooltip();
      }
}

function setupColorScale(metric: HeatmapMetric, data: Record<string, any>) {
  const values = Object.values(data);

  switch (metric) {
    case "orders": {
      const counts = values.map((d: any) => d.orders);
      const maxCount = Math.max(...counts, 1);
      colorScale = d3
        .scaleSequential()
        .domain([0, maxCount])
        .interpolator(d3.interpolateBlues);
      legendData.state = {
        type: "gradient",
        gradient: { min: 0, max: maxCount },
      };
      break;
    }
    case "sales": {
      const totals = values.map((d: any) =>
        d.sales.reduce((a: number, b: number) => a + b, 0),
      );
      const maxSales = Math.max(...totals, 1);
      colorScale = d3
        .scaleSequential()
        .domain([0, maxSales])
        .interpolator(d3.interpolateBlues);
      legendData.state = {
        type: "gradient",
        gradient: {
          min: "$0",
          max: `$${Math.round(maxSales).toLocaleString()}`,
        },
      };
      break;
    }
    case "discounts": {
      const discounts = values.map(
        (d: any) =>
          d.discount.reduce((a: number, b: number) => a + b, 0) / d.discount.length,
      );
      const maxDiscount = Math.max(...discounts, 0.01);
      colorScale = d3
        .scaleSequential()
        .domain([0, maxDiscount])
        .interpolator(d3.interpolateBlues);
      legendData.state = {
        type: "gradient",
        gradient: { min: "0%", max: `${(maxDiscount * 100).toFixed(1)}%` },
      };
      break;
    }
    case "profit": {
      const totals = values.map((d: any) =>
        d.profit.reduce((a: number, b: number) => a + b, 0),
      );
      const maxProfit = Math.max(...totals, 1);
      const minProfit = Math.min(...totals, 0);
      colorScale = d3
        .scaleSequential()
        .domain([minProfit, maxProfit])
        .interpolator(d3.interpolateBlues);
      const minLabel =
        minProfit < 0
          ? `-$${Math.abs(Math.round(minProfit)).toLocaleString()}`
          : `$${Math.round(minProfit).toLocaleString()}`;
      legendData.state = {
        type: "gradient",
        gradient: {
          min: minLabel,
          max: `$${Math.round(maxProfit).toLocaleString()}`,
        },
      };
      break;
    }
    case "shipping_cost": {
      const avgs = values.map(
        (d: any) =>
          d.shipping.reduce((a: number, b: number) => a + b, 0) / d.shipping.length,
      );
      const maxShipping = Math.max(...avgs, 1);
      colorScale = d3
        .scaleSequential()
        .domain([0, maxShipping])
        .interpolator(d3.interpolateBlues);
      legendData.state = {
        type: "gradient",
        gradient: { min: "$0", max: `$${maxShipping.toFixed(2)}` },
      };
      break;
    }
    case "quantity": {
      const quantities = values.map((d: any) => d.quantity);
      const maxQty = Math.max(...quantities, 1);
      colorScale = d3
        .scaleSequential()
        .domain([0, maxQty])
        .interpolator(d3.interpolateBlues);
      legendData.state = { type: "gradient", gradient: { min: 0, max: maxQty } };
      break;
    }
    case "shipping_mode":
      legendData.state = {
        type: "categorical",
        items: [
          { color: "#3182bd", label: "Standard Class" },
          { color: "#e6550d", label: "First Class" },
          { color: "#31a354", label: "Second Class" },
          { color: "#756bb1", label: "Same Day" },
        ],
      };
      break;
    case "segment":
      legendData.state = {
        type: "categorical",
        items: [
          { color: "#3182bd", label: "Consumer" },
          { color: "#e6550d", label: "Corporate" },
          { color: "#31a354", label: "Home Office" },
        ],
      };
      break;
    case "category":
      legendData.state = {
        type: "categorical",
        items: [
          { color: "#3182bd", label: "Technology" },
          { color: "#e6550d", label: "Office Supplies" },
          { color: "#31a354", label: "Furniture" },
        ],
      };
      break;
    case "priority":
      legendData.state = {
        type: "categorical",
        items: [
          { color: "#3182bd", label: "Medium" },
          { color: "#e6550d", label: "High" },
          { color: "#31a354", label: "Low" },
          { color: "#756bb1", label: "Critical" },
        ],
      };
      break;
  }
}

function getColorForMetric(countryData: any, metric: HeatmapMetric): string {
  if (!countryData) return "#e0e0e0";

  const categoricalColors: Record<string, string> = {
    "Standard Class": "#3182bd",
    "First Class": "#e6550d",
    "Second Class": "#31a354",
    "Same Day": "#756bb1",
    Consumer: "#3182bd",
    Corporate: "#e6550d",
    "Home Office": "#31a354",
    Technology: "#3182bd",
    "Office Supplies": "#e6550d",
    Furniture: "#31a354",
    Medium: "#3182bd",
    High: "#e6550d",
    Low: "#31a354",
    Critical: "#756bb1",
  };

  switch (metric) {
    case "shipping_mode":
      const topShipMode = getMostCommonCategory(countryData.shippingMode);
      return categoricalColors[topShipMode] || "#e0e0e0";
    case "segment":
      const topSegment = getMostCommonCategory(countryData.segment);
      return categoricalColors[topSegment] || "#e0e0e0";
    case "category":
      const topCategory = getMostCommonCategory(countryData.category);
      return categoricalColors[topCategory] || "#e0e0e0";
    case "priority":
      const topPriority = getMostCommonCategory(countryData.priority);
      return categoricalColors[topPriority] || "#e0e0e0";
    case "orders":
      return colorScale ? colorScale(countryData.orders) : "#e0e0e0";
    case "sales": {
      const totalSales = countryData.sales.reduce((a: number, b: number) => a + b, 0);
      return colorScale ? colorScale(totalSales) : "#e0e0e0";
    }
    case "discounts": {
      const avgDiscount =
        countryData.discount.reduce((a: number, b: number) => a + b, 0) /
        countryData.discount.length;
      return colorScale ? colorScale(avgDiscount) : "#e0e0e0";
    }
    case "profit": {
      const totalProfit = countryData.profit.reduce((a: number, b: number) => a + b, 0);
      return colorScale ? colorScale(totalProfit) : "#e0e0e0";
    }
    case "shipping_cost": {
      const avgShipping =
        countryData.shipping.reduce((a: number, b: number) => a + b, 0) /
        countryData.shipping.length;
      return colorScale ? colorScale(avgShipping) : "#e0e0e0";
    }
    case "quantity":
      return colorScale ? colorScale(countryData.quantity) : "#e0e0e0";
    default:
      return "#e0e0e0";
  }
}
