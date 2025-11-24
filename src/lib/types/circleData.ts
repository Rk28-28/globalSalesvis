export type City = {
  city: string;
  country: string;
  count: number;
};

export type CircleData = {
  city: string;
  country: string;
  normalizedCountry: string;
  x: number;
  y: number;
};

export type CircleGeoData = {
  city: string;
  country: string;
  lat: number;
  lng: number;
};

export type CircleMetricData = {
  orders: number;
  sales: number;
  profit: number;
  quantity: number;
  shipping: number;
  discount: number;
  maxDiscount: number; // Track highest discount
};
