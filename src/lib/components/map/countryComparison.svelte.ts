import type { Order } from "@data-types/order";

export interface CountryStats {
  country: string;
  orders: number;
  totalSales: number;
  avgSales: number;
  totalProfit: number;
  avgProfit: number;
  avgDiscount: number;
  totalQuantity: number;
  avgShippingCost: number;
  topShipMode: string;
  topSegment: string;
  topCategory: string;
  topPriority: string;
}
export interface ComparisonSummary {
  country1: string;
  country2: string;
  sentences: string[];
  stats1: CountryStats;
  stats2: CountryStats;
  globalAvg: CountryStats;
}

function formatCurrency(value: number): string {
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return value < 0 ? `-$${formatted}` : `$${formatted}`;
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

// Calculate statistics for a single country
export function calculateCountryStats(
  orders: Order[],
  countryName: string
): CountryStats | null {
  const countryOrders = orders.filter(
    (order) => normalizeCountryName(order.country) === countryName
  );

  if (countryOrders.length === 0) return null;

  const totalSales = countryOrders.reduce((sum, o) => sum + o.sales, 0);
  const totalProfit = countryOrders.reduce((sum, o) => sum + o.profit, 0);
  const totalDiscount = countryOrders.reduce((sum, o) => sum + o.discount, 0);
  const totalShipping = countryOrders.reduce((sum, o) => sum + o.shippingCost, 0);
  const totalQuantity = countryOrders.reduce((sum, o) => sum + o.quantity, 0);
  const shipModeCounts: Record<string, number> = {};
  const segmentCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const priorityCounts: Record<string, number> = {};

  countryOrders.forEach((order) => {
    shipModeCounts[order.shipMode] = (shipModeCounts[order.shipMode] || 0) + 1;
    segmentCounts[order.segment] = (segmentCounts[order.segment] || 0) + 1;
    categoryCounts[order.category] = (categoryCounts[order.category] || 0) + 1;
    priorityCounts[order.orderPriority] = (priorityCounts[order.orderPriority] || 0) + 1;
  });

  return {
    country: countryName,
    orders: countryOrders.length,
    totalSales,
    avgSales: totalSales / countryOrders.length,
    totalProfit,
    avgProfit: totalProfit / countryOrders.length,
    avgDiscount: totalDiscount / countryOrders.length,
    totalQuantity,
    avgShippingCost: totalShipping / countryOrders.length,
    topShipMode: getMostCommon(shipModeCounts),
    topSegment: getMostCommon(segmentCounts),
    topCategory: getMostCommon(categoryCounts),
    topPriority: getMostCommon(priorityCounts),
  };
}

// Calculate global averages across all countries
export function calculateGlobalStats(orders: Order[]): CountryStats {
  const totalSales = orders.reduce((sum, o) => sum + o.sales, 0);
  const totalProfit = orders.reduce((sum, o) => sum + o.profit, 0);
  const totalDiscount = orders.reduce((sum, o) => sum + o.discount, 0);
  const totalShipping = orders.reduce((sum, o) => sum + o.shippingCost, 0);
  const totalQuantity = orders.reduce((sum, o) => sum + o.quantity, 0);

  return {
    country: "Global Average",
    orders: orders.length,
    totalSales,
    avgSales: totalSales / orders.length,
    totalProfit,
    avgProfit: totalProfit / orders.length,
    avgDiscount: totalDiscount / orders.length,
    totalQuantity,
    avgShippingCost: totalShipping / orders.length,
    topShipMode: "",
    topSegment: "",
    topCategory: "",
    topPriority: "",
  };
}

// summary sentences
export function generateComparisonSummary(
  stats1: CountryStats,
  stats2: CountryStats,
  globalAvg: CountryStats
): string[] {
  const sentences: string[] = [];

  const orderDiff = ((stats1.orders - stats2.orders) / stats2.orders) * 100;
  if (Math.abs(orderDiff) > 10) {
    sentences.push(
      `${stats1.country} has ${Math.abs(orderDiff).toFixed(0)}% ${
        orderDiff > 0 ? "more" : "fewer"
      } orders than ${stats2.country} (${formatNumber(stats1.orders)} vs ${formatNumber(stats2.orders)}).`
    );
  }

  const salesDiff = ((stats1.avgSales - stats2.avgSales) / stats2.avgSales) * 100;
  if (Math.abs(salesDiff) > 15) {
    sentences.push(
      `${stats1.country}'s average order value is ${Math.abs(salesDiff).toFixed(0)}% ${
        salesDiff > 0 ? "higher" : "lower"
      } than ${stats2.country} (${formatCurrency(stats1.avgSales)} vs ${formatCurrency(stats2.avgSales)}).`
    );
  }


  const profitDiff = ((stats1.avgProfit - stats2.avgProfit) / stats2.avgProfit) * 100;
  if (Math.abs(profitDiff) > 20) {
    sentences.push(
      `${stats1.country} generates ${Math.abs(profitDiff).toFixed(0)}% ${
        profitDiff > 0 ? "more" : "less"
      } profit per order compared to ${stats2.country}.`
    );
  }

  const shippingDiff =
    ((stats1.avgShippingCost - stats2.avgShippingCost) / stats2.avgShippingCost) * 100;
  if (Math.abs(shippingDiff) > 10) {
    sentences.push(
      `Shipping costs in ${stats1.country} are ${Math.abs(shippingDiff).toFixed(0)}% ${
        shippingDiff > 0 ? "higher" : "lower"
      } than ${stats2.country} (${formatCurrency(stats1.avgShippingCost)} vs ${formatCurrency(stats2.avgShippingCost)}).`
    );
  }

  const discountDiff = (stats1.avgDiscount - stats2.avgDiscount) * 100;
  if (Math.abs(discountDiff) > 5) {
    sentences.push(
      `${stats1.country} offers ${Math.abs(discountDiff).toFixed(1)}% ${
        discountDiff > 0 ? "higher" : "lower"
      } average discounts than ${stats2.country}.`
    );
  }

  const salesVsGlobal = ((stats1.avgSales - globalAvg.avgSales) / globalAvg.avgSales) * 100;
  if (Math.abs(salesVsGlobal) > 20) {
    sentences.push(
      `Compared to the global average, ${stats1.country} has ${Math.abs(salesVsGlobal).toFixed(0)}% ${
        salesVsGlobal > 0 ? "higher" : "lower"
      } average sales per order.`
    );
  }

  if (stats1.topCategory !== stats2.topCategory) {
    sentences.push(
      `${stats1.country} primarily orders ${stats1.topCategory}, while ${stats2.country} prefers ${stats2.topCategory}.`
    );
  }

  if (stats1.topShipMode !== stats2.topShipMode) {
    sentences.push(
      `The most common shipping method in ${stats1.country} is ${stats1.topShipMode}, compared to ${stats2.topShipMode} in ${stats2.country}.`
    );
  }

  // fallback sentence
  if (sentences.length === 0) {
    sentences.push(
      `${stats1.country} and ${stats2.country} have relatively similar performance metrics across most categories.`
    );
  }

  return sentences;
}

function normalizeCountryName(country: string): string {
  const mapping: Record<string, string> = {
    "United States": "United States of America",
    "USA": "United States of America",
    "US": "United States of America",
    "United Kingdom": "United Kingdom",
    "UK": "United Kingdom",
  };
  return mapping[country] || country;
}

function getMostCommon(counts: Record<string, number>): string {
  let maxCount = 0;
  let mostCommon = "";
  for (const [key, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = key;
    }
  }
  return mostCommon;
}

export function getUniqueCountries(orders: Order[]): string[] {
  const countries = new Set(orders.map((o) => normalizeCountryName(o.country)));
  return Array.from(countries).sort();
}