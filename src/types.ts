export interface StationData {
  county: string;
  sitename: string;
  status: string;
  aqi: number;
  pm25: number;
  pm10: number;
  temp: number;
  humidity: number;
  wind_speed?: number;
  publishtime: string;
}

export interface AQICategory {
  label: string;
  color: string; // Tailwind bg-xxx color
  textColor: string; // Tailwind text-xxx color
  accentColor: string; // Hex color indicator or secondary tailwind color
  shadowColor: string; // hex shadow or style
  bgGradient: string; // tailwind gradient background
  borderStroke: string; // tailwind border
  description: string;
  advice: string;
}

export interface HistoricRecord {
  time: string;
  aqi: number;
  pm25: number;
}
