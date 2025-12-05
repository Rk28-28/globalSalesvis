<script lang="ts">
  import { onMount } from "svelte";
  import type { Order } from "@data-types/order";
  import {
    calculateCountryStats,
    calculateGlobalStats,
    generateComparisonSummary,
    getUniqueCountries,
    type CountryStats,
  } from "./countryComparison.svelte";

  type Props = {
    orders: Order[];
    onClose: () => void;
  };

  let { orders, onClose }: Props = $props();
  let countries: string[] = $state([]);
  let selectedCountry1 = $state("");
  let selectedCountry2 = $state("");
  let stats1: CountryStats | null = $state(null);
  let stats2: CountryStats | null = $state(null);
  let globalStats: CountryStats | null = $state(null);
  let summary: string[] = $state([]);
  let comparisonReady = $state(false);

  onMount(() => {
    countries = getUniqueCountries(orders);
    globalStats = calculateGlobalStats(orders);
  });

  function handleCompare() {
    if (!selectedCountry1 || !selectedCountry2) return;

    stats1 = calculateCountryStats(orders, selectedCountry1);
    stats2 = calculateCountryStats(orders, selectedCountry2);

    if (stats1 && stats2 && globalStats) {
      summary = generateComparisonSummary(stats1, stats2, globalStats);
      comparisonReady = true;
    }
  }

  function formatCurrency(value: number): string {
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return value < 0 ? `-$${formatted}` : `$${formatted}`;
  }

  function formatPercent(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }

  function formatNumber(value: number): string {
    return Math.round(value).toLocaleString('en-US');
  }
</script>

<div class="modal-overlay" onclick={onClose}>
  <div class="modal-content" onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <h2>Compare Countries</h2>
      <button class="close-btn" onclick={onClose}>&times;</button>
    </div>

    <div class="country-selectors">
      <div class="selector-group">
        <label for="country1">Country 1:</label>
        <select id="country1" bind:value={selectedCountry1}>
          <option value="">Select a country</option>
          {#each countries as country}
            <option value={country}>{country}</option>
          {/each}
        </select>
      </div>

      <div class="vs-indicator">VS</div>

      <div class="selector-group">
        <label for="country2">Country 2:</label>
        <select id="country2" bind:value={selectedCountry2}>
          <option value="">Select a country</option>
          {#each countries as country}
            <option value={country}>{country}</option>
          {/each}
        </select>
      </div>

      <button
        class="compare-btn"
        onclick={handleCompare}
        disabled={!selectedCountry1 || !selectedCountry2}
      >
        Compare
      </button>
    </div>

    {#if comparisonReady && stats1 && stats2}
      <div class="comparison-results">
        <div class="summary-section">
          <h3>Summary</h3>
          <div class="summary-text">
            {#each summary as sentence}
              <p>{sentence}</p>
            {/each}
          </div>
        </div>

        <div class="stats-comparison">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>{stats1.country}</th>
                <th>{stats2.country}</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Orders</td>
                <td>{formatNumber(stats1.orders)}</td>
                <td>{formatNumber(stats2.orders)}</td>
                <td class={stats1.orders > stats2.orders ? "positive" : "negative"}>
                  {stats1.orders - stats2.orders > 0 ? "+" : ""}{formatNumber(stats1.orders - stats2.orders)}
                </td>
              </tr>
              <tr>
                <td>Total Sales</td>
                <td>{formatCurrency(stats1.totalSales)}</td>
                <td>{formatCurrency(stats2.totalSales)}</td>
                <td class={stats1.totalSales > stats2.totalSales ? "positive" : "negative"}>
                  {formatCurrency(stats1.totalSales - stats2.totalSales)}
                </td>
              </tr>
              <tr>
                <td>Avg Sales per Order</td>
                <td>{formatCurrency(stats1.avgSales)}</td>
                <td>{formatCurrency(stats2.avgSales)}</td>
                <td class={stats1.avgSales > stats2.avgSales ? "positive" : "negative"}>
                  {formatCurrency(stats1.avgSales - stats2.avgSales)}
                </td>
              </tr>
              <tr>
                <td>Total Profit</td>
                <td>{formatCurrency(stats1.totalProfit)}</td>
                <td>{formatCurrency(stats2.totalProfit)}</td>
                <td class={stats1.totalProfit > stats2.totalProfit ? "positive" : "negative"}>
                  {formatCurrency(stats1.totalProfit - stats2.totalProfit)}
                </td>
              </tr>
              <tr>
                <td>Avg Profit per Order</td>
                <td>{formatCurrency(stats1.avgProfit)}</td>
                <td>{formatCurrency(stats2.avgProfit)}</td>
                <td class={stats1.avgProfit > stats2.avgProfit ? "positive" : "negative"}>
                  {formatCurrency(stats1.avgProfit - stats2.avgProfit)}
                </td>
              </tr>
              <tr>
                <td>Avg Discount</td>
                <td>{formatPercent(stats1.avgDiscount)}</td>
                <td>{formatPercent(stats2.avgDiscount)}</td>
                <td class={stats1.avgDiscount < stats2.avgDiscount ? "positive" : "negative"}>
                  {formatPercent(stats1.avgDiscount - stats2.avgDiscount)}
                </td>
              </tr>
              <tr>
                <td>Avg Shipping Cost</td>
                <td>{formatCurrency(stats1.avgShippingCost)}</td>
                <td>{formatCurrency(stats2.avgShippingCost)}</td>
                <td class={stats1.avgShippingCost < stats2.avgShippingCost ? "positive" : "negative"}>
                  {formatCurrency(stats1.avgShippingCost - stats2.avgShippingCost)}
                </td>
              </tr>
              <tr>
                <td>Total Quantity</td>
                <td>{formatNumber(stats1.totalQuantity)}</td>
                <td>{formatNumber(stats2.totalQuantity)}</td>
                <td class={stats1.totalQuantity > stats2.totalQuantity ? "positive" : "negative"}>
                  {stats1.totalQuantity - stats2.totalQuantity > 0 ? "+" : ""}{formatNumber(stats1.totalQuantity - stats2.totalQuantity)}
                </td>
              </tr>
              <tr>
                <td>Top Category</td>
                <td>{stats1.topCategory}</td>
                <td>{stats2.topCategory}</td>
                <td>-</td>
              </tr>
              <tr>
                <td>Top Ship Mode</td>
                <td>{stats1.topShipMode}</td>
                <td>{stats2.topShipMode}</td>
                <td>-</td>
              </tr>
              <tr>
                <td>Top Segment</td>
                <td>{stats1.topSegment}</td>
                <td>{stats2.topSegment}</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 2rem;
    max-width: 1000px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    color: #ffffff;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    border-bottom: 1px solid #333;
    padding-bottom: 1rem;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #ffffff;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    color: #fff;
  }

  .country-selectors {
    display: flex;
    gap: 1rem;
    align-items: flex-end;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .selector-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 200px;
  }

  .selector-group label {
    font-weight: 600;
    color: #cccccc;
  }

  .selector-group select {
    padding: 0.75rem;
    border: 2px solid #333;
    border-radius: 6px;
    background: #0a0a0a;
    color: #ffffff;
    font-size: 1rem;
  }

  .selector-group select:focus {
    outline: none;
    border-color: #4a90e2;
  }

  .vs-indicator {
    font-size: 1.5rem;
    font-weight: bold;
    color: #4a90e2;
    padding: 0 1rem;
    margin-bottom: 0.5rem;
  }

  .compare-btn {
    padding: 0.75rem 2rem;
    background: #4a90e2;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .compare-btn:hover:not(:disabled) {
    background: #357abd;
  }

  .compare-btn:disabled {
    background: #333;
    cursor: not-allowed;
    opacity: 0.5;
  }

  .comparison-results {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .summary-section {
    background: #0a0a0a;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid #333;
  }

  .summary-section h3 {
    margin: 0 0 1rem 0;
    color: #4a90e2;
    font-size: 1.2rem;
  }

  .summary-text p {
    margin: 0.75rem 0;
    line-height: 1.6;
    color: #cccccc;
  }

  .stats-comparison {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: #0a0a0a;
    border-radius: 8px;
    overflow: hidden;
  }

  thead {
    background: #2a2a2a;
  }

  th {
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #ffffff;
    border-bottom: 2px solid #333;
  }

  td {
    padding: 0.875rem 1rem;
    border-bottom: 1px solid #222;
    color: #cccccc;
  }

  tbody tr:hover {
    background: #1a1a1a;
  }

  .positive {
    color: #4ade80;
    font-weight: 600;
  }

  .negative {
    color: #f87171;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    .modal-content {
      padding: 1rem;
      width: 95%;
    }

    .country-selectors {
      flex-direction: column;
    }

    .vs-indicator {
      margin: 0;
    }
  }
</style>