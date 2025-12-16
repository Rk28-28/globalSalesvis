// chatGPT and other online resource were consulted pretty heavily in the making of this file

import * as d3 from "d3";
import * as THREE from "three";
import { hexbin as d3Hexbin } from "d3-hexbin";
import { scene } from "./threeSetup";
import { circleMetrics, circleGeoData, geography } from "./mapStates.svelte";
import type { CircleMetric } from "@data-types/metrics";
import type { CircleMetricData } from "@data-types/circleData";

interface Point {
  x: number;
  y: number;
  value: number;
}

const WIDTH = 600;
const HEIGHT = 400;

const HEX_RADIUS = 7;
const COUNTRY_BASE_HEIGHT = 4;
const MAX_HEX_HEIGHT = 80;

export function renderMiniHexmap3d(
  selectedCountryName: string,
  metric: CircleMetric
) {

  if (!geography.state?.features) return;
  clearScene(scene);

  const countryFeature = geography.state.features.find(
    (f: any) =>
      f.properties.name === selectedCountryName 
  );

    const countryKey =
    selectedCountryName === "USA"
      ? "United States"
      : selectedCountryName;

  if (!countryFeature) return;

  // ---- projection ----
  const projection = d3
    .geoMercator()
    .fitSize([WIDTH, HEIGHT], countryFeature);

  const centroid = projection(d3.geoCentroid(countryFeature));
  if (!centroid) return;
  
  const [cx, cy] = centroid;

  const polygons = extractAllPolygons(countryFeature.geometry);

  const countryGroup = new THREE.Group();
  scene.add(countryGroup);

  polygons.forEach(({ outer, holes }) => {
    const shape = new THREE.Shape();

    outer.forEach(([lon, lat], i) => {
      const projected = projection([lon, lat]);
      if (!projected) return;

      const [x, y] = projected;
      const px = x - cx;
      const py = y - cy;

      if (i === 0) shape.moveTo(px, -py);
      else shape.lineTo(px, -py);
    });

    holes.forEach(hole => {
      const holePath = new THREE.Path();
      hole.forEach(([lon, lat], i) => {
        const projected = projection([lon, lat]);
        if (!projected) return;

        const [x, y] = projected;
        const px = x - cx;
        const py = y - cy;

        if (i === 0) holePath.moveTo(px, -py);
        else holePath.lineTo(px, -py);
      });
      shape.holes.push(holePath);
    });

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: COUNTRY_BASE_HEIGHT,
      bevelEnabled: false,
    });

    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        roughness: 0.9,
        metalness: 0.0,
      })
    );

    countryGroup.add(mesh);
  });

  const cityPoints: Point[] = [];
  const countryData = circleMetrics.state[countryKey];

  

  if (countryData) {
    for (const [city, data] of Object.entries(countryData)) {
      const value = data[metric as keyof CircleMetricData];
      if (!value) continue;

      const coord = circleGeoData.state[countryKey]?.[city];
      if (!coord) continue;

      const projected = projection([coord.lng, coord.lat]);
      if (!projected) continue;

      const [x, y] = projected;
      cityPoints.push({
        x: x - cx,
        y: y - cy,
        value
      });
    }
  }

  if (!cityPoints.length) return;

  const hexbin = d3Hexbin<Point>()
    .x(d => d.x)
    .y(d => d.y)
    .radius(HEX_RADIUS);

  const bins = hexbin(cityPoints);

  const maxValue =
    d3.max(bins, b => d3.sum(b, p => p.value)) || 1;

  const heightScale = d3
    .scaleLinear()
    .domain([0, maxValue])
    .range([2, MAX_HEX_HEIGHT]);

  const colorScale = d3
    .scaleSequential(d3.interpolateReds)
    .domain([0, maxValue]);

  const hexGroup = new THREE.Group();
  countryGroup.add(hexGroup);

  for (const bin of bins) {
    const rawValue = d3.sum(bin, p => p.value);
    const height = heightScale(rawValue);

    const geom = makeHexPrism(HEX_RADIUS, height);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorScale(rawValue)),
      roughness: 0.2,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(bin.x, -bin.y, COUNTRY_BASE_HEIGHT);

    hexGroup.add(mesh);
  }
}

type Ring = [number, number][];

interface PolygonRings {
  outer: Ring;
  holes: Ring[];
}

function extractAllPolygons(
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: any;
  }
): PolygonRings[] {
  if (!geometry || !geometry.coordinates) {
    throw new Error("bad geometry");
  }

  if (geometry.type === "Polygon") {
    const [outer, ...holes] = geometry.coordinates;
    return [{ outer, holes }];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map((polygon: any) => {
      const [outer, ...holes] = polygon;
      return { outer, holes };
    });
  }

  throw new Error(`bad geometry type: ${geometry.type}`);
}

function makeHexPrism(radius: number, height: number) {
  const shape = new THREE.Shape();

  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 3 * i + Math.PI / 6;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }

  shape.closePath();

  return new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  });
}

export function clearScene(scene: THREE.Scene) {
  if (!scene) return;

  for (let i = scene.children.length - 1; i >= 0; i--) {
    const obj = scene.children[i];
    if (!(obj instanceof THREE.Light)) {
      scene.remove(obj);
      obj.geometry?.dispose?.();
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material?.dispose?.();
      }
    }
  }
}