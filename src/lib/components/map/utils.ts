import {
  dataEndDate,
  dataStartDate,
  orderData,
  circleMetrics,
  circleMetric,
} from "./mapStates.svelte";

export const normalizeCountryName = (name: string): string => {
  // dataset country name : geography country name
  const countryMap: Record<string, string> = {
    "Guinea-Bissau": "Guinea Bissau",
    Serbia: "Republic of Serbia",
    Tanzania: "United Republic of Tanzania",
    "United States": "USA",
    "United Kingdom": "England",
    "Myanmar (Burma)": "Myanmar",
  };
  return countryMap[name] || name;
};

export const getCircleSize = (v: number): number => {
  return Math.sqrt(v) * 1.5;
};

export const getHoveredCircleSize = (v: number): number => {
  return Math.sqrt(v) * 1.5;
};

export const loadStartEndDate = () => {
  console.log("loading start/end dates");
  const orders = orderData.state;
  let lowestDate = new Date();
  lowestDate.setFullYear(2500); // will break in like 500 years...

  let highestDate = new Date();
  highestDate.setFullYear(1900);

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    if (order.orderDate > highestDate) {
      highestDate = order.orderDate;
    } else if (order.orderDate < lowestDate) {
      lowestDate = order.orderDate;
    }
  }

  dataEndDate.state = highestDate;
  dataStartDate.state = lowestDate;
};

// ai generated, html input dates are annoying
export function toHTMLFormat(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMetricValue(country: string, city: string): number {
  if (!circleMetrics.state[country]?.[city]) return 0;

  const data = circleMetrics.state[country][city];

  switch (circleMetric.state) {
    case "orders":
      return data.orders;
    case "sales":
      return data.sales;
    case "profit":
      return data.profit;
    case "quantity":
      return data.quantity;
    case "shipping":
      return data.shipping;
    case "discount":
      // Return average discount
      return data.orders > 0 ? data.discount / data.orders : 0;
    default:
      return data.orders;
  }
}

export function getScaleRange(): [number, number] {
  switch (circleMetric.state) {
    case "sales":
      return [3, 30]; // Larger range for sales visibility
    case "shipping":
      return [3, 25];
    case "profit":
      return [3, 28]; // For profit use absolute values
    case "quantity":
      return [3, 30];
    case "discount":
      return [3, 22];
    case "orders":
    default:
      return [3, 35];
  }
}

export function getMostCommonCategory(obj: Record<string, number>): string {
  return Object.entries(obj).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
}
