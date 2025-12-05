<script lang="ts">
  import * as d3 from "d3";
  import { onMount, onDestroy } from "svelte";
  import { loadCityLatLngData, loadData, loadGeographyData } from "@utils/loadData";
  import { Loader } from "@components/loader";
  import {
    orderData,
    circleGeoData,
    geography,
    showCircles,
    startDateRaw,
    selectedCountry as _selectedCountry,
    endDateRaw,
    g,
    svg,
    tooltip,
    countriesLoading,
    animationTimeframe,
    animationPlaying,
    animationDelay,
    circleMetric,
    showHeatmap,
    circleMetrics,
    heatmapMetric,
    heatmapMetrics,
    legendData,
    mapContainer,
    projection,
    projectionType,
    circlesRendered,
  } from "./mapStates.svelte";
  import {
    updateCircleMetrics,
    renderCircles,
    updateCircleSize,
    updateRadiusScale,
    updateCircleLocations,
  } from "./circleFunctions.svelte";
  import {
    startAnimation,
    pauseAnimation,
    stopAnimation,
    handleDelayChange,
  } from "./animation.svelte";
  import { loadStartEndDate } from "./utils";
  import {
    loadCountries,
    getHeatmapMetricData,
    updateHeatmap,
    updateHeatmapMetricDataWithDateFilter,
    updateCountryLocations,
  } from "./heatmapFunctions.svelte";
  import { circleMetricLabels, heatmapMetricLabels } from "@data-types/metrics";
  import "./mapStyles.css";
  import {
    destroyGlobeEventListeners,
    registerGlobeEventListeners,
  } from "./globeFunctions";
  import { Toggle } from "@components/toggle";
  import { logEffect } from "./logger";

  let statusMsg = $state('Loading data');
  let initialLoading = $state(true);
  // make the props as minimal as possible so that other people can easily hook into the map
  type Props = {
    width?: number;
    height?: number;
  };

  let {
    width = 960,
    height = 650,
  }: Props = $props();

  projection.state = d3.
    geoMercator()
    .scale(150)
    .translate([width / 2, height / 2]);

  // load geography data only once on component mount
  onMount(async () => {
    if (!projection.state) {
      projection.state = d3
      .geoOrthographic()
      .scale(250)
      .translate([width / 2, height / 2]);
    }
    countriesLoading.state = true;

    orderData.state = await loadData();
    statusMsg = "Loading country geography..."
    geography.state = await loadGeographyData();
    statusMsg = "Loading city geography..."
    const data = await loadCityLatLngData();
    circleGeoData.state = data;
    statusMsg = "Finalizing..."
    loadCountries(projection.state);
    // loadStartEndDate(); // this could be useful in a world where it's truly dynamic
    circleMetrics.state = updateCircleMetrics();
    renderCircles(projection.state, g.state, circleGeoData.state);
    registerGlobeEventListeners();
    countriesLoading.state = false;
    initialLoading = false;
  });

  onDestroy(() => {
    destroyGlobeEventListeners();
  });

  // Update country metric data when date range or metric changes
  $effect(() => {
    if (initialLoading) return;

    if (
      orderData.state &&
      (startDateRaw.state || endDateRaw.state || heatmapMetric.state)
    ) {
      updateHeatmapMetricDataWithDateFilter();
    } else if (orderData.state) {
      logEffect('Heatmap metrics')
      heatmapMetrics.state = getHeatmapMetricData(orderData.state, heatmapMetric.state);
    }
  });

  // updates when scale changes
  $effect(() => {
    if (initialLoading) return;

    logEffect('Radius scale');
    updateRadiusScale();
  });

  $effect(() => {
    if (initialLoading) return;

    logEffect('Circle metrics');
    circleMetrics.state = updateCircleMetrics();
  });

  // runs when projectionType changes
  $effect(() => {
    if (initialLoading) return;

    logEffect(`Projection change: ${projectionType.state}`)
    if (projectionType.state == '2d') {
      projection.state = d3.
        geoMercator()
        .scale(150)
        .translate([width / 2, height / 2]);
    } else {
      console.log('chaing projection to globe');
      projection.state = d3
        .geoOrthographic()
        .scale(250)
        .translate([width / 2, height / 2]);
    }
  });

  // runs whever projection changes & circle are shown
  $effect(() => {
    if (initialLoading) return;

    if (projection.state) {
      logEffect('Projection change: country locations');
      updateCountryLocations();
      
      if (showCircles.state) {
        requestAnimationFrame(() => {
          updateCircleSize();
          updateCircleLocations();
        });
      }
    }
  })

  // Handle heatmap toggle and metric changes
  $effect(() => {
    if (initialLoading) return;

    if (
      g.state &&
      heatmapMetrics.state &&
      Object.keys(heatmapMetrics.state).length > 0
    ) {
      logEffect('Update heatmap')
      updateHeatmap(
        g.state,
        heatmapMetrics.state,
        showHeatmap.state,
        heatmapMetric.state,
      );
    }
  });

  // toggle circle display
  $effect(() => {
    if (initialLoading) return;
    if (!svg.state) return;

    if (showCircles.state) {
      d3.select(svg.state).selectAll("circle").attr("display", "block");
    } else {
      d3.select(svg.state).selectAll("circle").attr("display", "none");
    }
  });

  $effect(() => {
    if (initialLoading) return;

    if (!_selectedCountry.state) {
      d3.select("#country-overlay").selectAll("path").remove();
    }
  });
</script>

<main class="map-component">
  <div class="tooltip" bind:this={tooltip.state}></div>

  <div class="controls-header">
    <div class="map-controls">
      <div class="control-item">
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={showCircles.state} />
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle
              cx="10"
              cy="10"
              r="7"
              stroke="currentColor"
              stroke-width="2"
              fill="none"
            />
            <circle cx="10" cy="10" r="3" fill="currentColor" />
          </svg>
          <span class="label-text">Circle Map</span>
        </label>

        <select 
          bind:value={circleMetric.state} 
          class="metric-select"
          disabled={!showCircles.state}
        >
          {#each Object.entries(circleMetricLabels) as [value, label]}
            <option {value}>{label}</option>
          {/each}
        </select>
        <span class="selected-metric">{circleMetricLabels[circleMetric.state]}</span>
      </div>

      <div class="control-item">
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={showHeatmap.state} />
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect
              x="2"
              y="2"
              width="16"
              height="16"
              rx="2"
              stroke="currentColor"
              stroke-width="2"
              fill="none"
            />
            <rect x="5" y="5" width="4" height="4" fill="currentColor" opacity="0.3" />
            <rect x="11" y="5" width="4" height="4" fill="currentColor" opacity="0.6" />
            <rect x="5" y="11" width="4" height="4" fill="currentColor" opacity="0.6" />
            <rect
              x="11"
              y="11"
              width="4"
              height="4"
              fill="currentColor"
              opacity="0.9"
            />
          </svg>
          <span class="label-text">Heatmap</span>
        </label>

        <select 
          bind:value={heatmapMetric.state} 
          class="metric-select"
          disabled={!showHeatmap.state}
        >
          {#each Object.entries(heatmapMetricLabels) as [value, label]}
            <option {value}>{label}</option>
          {/each}
        </select>
        <span class="selected-metric">{heatmapMetricLabels[heatmapMetric.state]}</span>
      </div>
    </div>

    {#if legendData.state}
      <div class="legend" class:hidden={!showHeatmap.state}>
        <span class="legend-label">{heatmapMetricLabels[heatmapMetric.state]}:</span>
        <div class="legend-content">
          {#if legendData.state.type === "gradient" && legendData.state.gradient}
            <div class="legend-gradient"></div>
            <div class="legend-labels">
              <span>{legendData.state.gradient.min}</span>
              <span>{legendData.state.gradient.max}</span>
            </div>
          {:else if legendData.state.type === "categorical" && legendData.state.items}
            <div class="legend-categorical">
              {#each legendData.state.items as item}
                <div class="legend-item">
                  <div
                    class="legend-color"
                    style="background-color: {item.color}"
                  ></div>
                  <span>{item.label}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
  <Toggle bind:projectionType={projectionType.state}/>
  <small>
    move this later ^
  </small>

  <div class="map-container" bind:this={mapContainer.state}>
    {#if countriesLoading.state}
    <div class="flex flex-col gap-2 items-center">
      <Loader />
      {statusMsg}
    </div>
    {/if}
    <svg
      {width}
      {height}
      bind:this={svg.state}
      style="display: {countriesLoading.state ? 'none' : 'block'}"
    >
      <g bind:this={g.state}></g>
    </svg>
  </div>

  <div class="date-controls">
    <div class="control-group">
      <label for="start-date">Start date</label>
      <input type="date" id="start-date" bind:value={startDateRaw.state} />
    </div>
    <div class="control-group">
      <label for="end-date">End date</label>
      <input
        type="date"
        id="end-date"
        bind:value={endDateRaw.state}
        min={startDateRaw.state || ""}
      />
    </div>
  </div>
  <br />
  <div class="date-controls">
    <div class="control-group">
      <label> Animation controls </label>
      <!-- SVGs generated with chat GPT -->
      {#if animationPlaying.state == "playing"}
        <button
          onclick={() => {
            pauseAnimation();
          }}
          aria-label="pause animation"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style="vertical-align: middle;"
          >
            <rect x="5" y="4" width="3" height="12" fill="currentColor" />
            <rect x="12" y="4" width="3" height="12" fill="currentColor" />
          </svg>
        </button>
        <button
          onclick={() => {
            stopAnimation();
          }}
          aria-label="stop animation"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style="vertical-align: middle;"
          >
            <rect x="5" y="5" width="10" height="10" fill="currentColor" />
          </svg>
        </button>
      {:else if animationPlaying.state == "paused"}
        <button
          onclick={() => {
            startAnimation();
          }}
          aria-label="start animation"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style="vertical-align: middle;"
          >
            <polygon points="5,4 15,10 5,16" fill="currentColor" />
          </svg>
        </button>
        <button
          onclick={() => {
            stopAnimation();
          }}
          aria-label="stop animation"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style="vertical-align: middle;"
          >
            <rect x="5" y="5" width="10" height="10" fill="currentColor" />
          </svg>
        </button>
      {:else}
        <button
          onclick={() => {
            startAnimation();
          }}
          aria-label="start animation"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style="vertical-align: middle;"
          >
            <polygon points="5,4 15,10 5,16" fill="currentColor" />
          </svg>
        </button>
      {/if}
    </div>
    <div class="control-group">
      <label for="timeframe-input"> Timeframe </label>
      <select
        name="timeframe"
        id="timeframe-input"
        bind:value={animationTimeframe.state}
      >
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
      </select>
    </div>
    <div class="control-group">
      <label for="timeframe-input"> Delay (ms) </label>
      <input
        type="number"
        min="50"
        bind:value={animationDelay.state}
        onchange={handleDelayChange}
      />
    </div>
  </div>
  {#if _selectedCountry.state}
    <div class="country-overlay">
      <button onclick={() => (_selectedCountry.state = "")}>&nbsp;[X]&nbsp;</button>
      <svg id="country-overlay" width="600" height="400"></svg>
    </div>
  {/if}
</main>