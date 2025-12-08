import * as d3 from "d3";
import { hexbin as d3Hexbin } from "d3-hexbin";
import { circleMetrics, circleGeoData, geography } from "./mapStates.svelte";
import { geoPath } from "d3-geo";
import type { CircleMetric } from "@data-types/metrics";
import type { CircleMetricData } from "@data-types/circleData";

interface Point {
  x: number;
  y: number;
  value: number;
}
const baseHexRadius = 17;
let scale = 1;

export function renderMiniHexmap(selectedCountryName: string, metric: CircleMetric, miniSvg: SVGSVGElement) {
  if (!geography.state?.features) return;
  scale = 1

  const svg = d3.select(miniSvg);
  svg.selectAll("*").remove();

  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const countryFeature = geography.state.features.find(
    (f: any) => f.properties.name === selectedCountryName
  );

  if (!countryFeature) return;

  if (countryFeature.properties.name === 'USA'){
    countryFeature.properties.name = 'United States'
  }

  svg.select("g.zoom-container")?.remove();
  const container = svg.append("g").attr("class", "zoom-container");

  const projection = d3.geoMercator().fitSize([width - 10, height - 10], countryFeature);
  const path = geoPath(projection);

  const cityPoints: Point[] = [];
  const countryData = circleMetrics.state[selectedCountryName];
  if (countryData) {
    Object.entries(countryData).forEach(([city, data]) => {
      const value = data[metric as keyof CircleMetricData];
      if (!value) return;

      const coord = circleGeoData.state[selectedCountryName]?.[city];
      if (!coord) return;

      const [x, y] = projection([coord.lng, coord.lat])!;
      cityPoints.push({ x, y, value });
    });
  }

  const hex = d3Hexbin<Point>()
    .x(d => d.x)
    .y(d => d.y)
    .radius(baseHexRadius/scale);

  const bins = hex(cityPoints);

  const maxValue = d3.max(bins, b => d3.sum(b, p => p.value)) || 1;
  const color = d3.scaleSequential(d3.interpolateReds).domain([0, maxValue]);

  container.append("clipPath")
    .attr("id", "country-clip")
    .append("path")
    .datum(countryFeature)
    .attr("d", path as any);

  container.append("g")
    .attr("class", "hex-layer")
    .attr("clip-path", "url(#country-clip)")
    .selectAll("path")
    .data(bins)
    .join("path")
    .attr("d", hex.hexagon())
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .attr("fill", d => color(d3.sum(d, p => p.value)))
    .attr("stroke", "#ccc")
    .attr("stroke-width", 0.5);

  container.append("path")
    .datum(countryFeature)
    .attr("d", path as any)
    .attr("fill", "none")
    .attr("stroke", "#999")
    .attr("stroke-width", 1);

    const legend = svg.append("g").attr("class", "legend");
    updateLegend(maxValue, legend, svg, height, color)

    const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 10]) // min/max zoom
      .on("zoom", (event) => {
    // live panning/zooming without recomputing expensive hexbin
    scale = event.transform.k;
    container.attr("transform", event.transform);
    })
    .on("end", (event) => {
        // user has stopped zooming → now recompute hexes
        scale = event.transform.k;
        rebuildHexes(container, cityPoints, legend, svg, height);
    });


  svg.call(zoom);
}

function rebuildHexes(container, cityPoints, legend, svg, height) {
  const hex = d3Hexbin<Point>()
    .x(d => d.x)
    .y(d => d.y)
    .radius(baseHexRadius / scale);

  const bins = hex(cityPoints);

  const maxValue = d3.max(bins, b => d3.sum(b, p => p.value)) || 1;
  const color = d3.scaleSequential(d3.interpolateReds).domain([0, maxValue]);
  updateLegend(maxValue, legend, svg, height, color)

  container.selectAll("g.hex-layer").remove();

  container.append("g")
    .attr("class", "hex-layer")
    .attr("clip-path", "url(#country-clip)")
    .selectAll("path")
    .data(bins)
    .join("path")
    .attr("d", hex.hexagon())
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .attr("fill", d => color(d3.sum(d, p => p.value)))
    .attr("stroke", "#ccc")
    .attr("stroke-width", 0.5);
}

function updateLegend(maxValue: number, legend, svg, height, color) {
  legend.selectAll("*").remove();

  const legendWidth = 120;
  const legendHeight = 10;

  const defs = svg.select("defs").empty()
    ? svg.append("defs")
    : svg.select("defs");

  const gradientId = "hexmap-gradient";

  const gradient = defs
    .selectAll("linearGradient")
    .data([null])
    .join("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0%")
    .attr("x2", "100%");

  const colors = d3.range(0, 1.01, 0.1);
  gradient
    .selectAll("stop")
    .data(colors)
    .join("stop")
    .attr("offset", (d) => `${d * 100}%`)
    .attr("stop-color", (d) => color(d * maxValue));

  legend
    .append("rect")
    .attr("x", 10)
    .attr("y", height - 30)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("fill", `url(#${gradientId})`);

  legend
    .append("text")
    .attr("x", 10)
    .attr("y", height - 35)
    .attr("font-size", "12px")
    .attr("fill", "white")
    .text("0");

  legend
    .append("text")
    .attr("x", 10 + legendWidth)
    .attr("y", height - 35)
    .attr("font-size", "12px")
    .attr("text-anchor", "end")
    .attr("fill", "white")
    .text(maxValue.toFixed(0));
}
