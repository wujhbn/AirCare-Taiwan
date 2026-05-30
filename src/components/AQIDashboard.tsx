import React from "react";
import { StationData } from "../types";
import { getAQICategory, getAQIProgress } from "../utils/aqiHelpers";
import { 
  Wind, 
  Thermometer, 
  Droplets, 
  TrendingUp, 
  Flame, 
  HeartHandshake, 
  AlertCircle, 
  Check, 
  Leaf 
} from "lucide-react";

interface AQIDashboardProps {
  station: StationData | null;
  onRefresh: () => void;
  refreshing: boolean;
  lastUpdated: string;
  isUsingGps?: boolean;
  gpsCoords?: { lat: number; lon: number } | null;
}

export default function AQIDashboard({
  station,
  onRefresh,
  refreshing,
  lastUpdated,
  isUsingGps,
  gpsCoords
}: AQIDashboardProps) {
  if (!station) {
    // Elegant Skeleton Loading state
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-8 w-1/3 bg-slate-900 rounded-lg mx-auto"></div>
        <div className="flex justify-center my-6">
          <div className="w-48 h-48 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-slate-950"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-slate-900 rounded-3xl"></div>
          <div className="h-24 bg-slate-900 rounded-3xl"></div>
          <div className="h-24 bg-slate-900 rounded-3xl"></div>
          <div className="h-24 bg-slate-900 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  const category = getAQICategory(station.aqi);
  const progressPercent = getAQIProgress(station.aqi);
  const circumference = 2 * Math.PI * 75; // r = 75, circ ~ 471.2
  const strokeOffset = circumference - (circumference * progressPercent) / 100;

  // Render a friendly advice icon
  const getAdviceIcon = (aqi: number) => {
    if (aqi <= 50) return <Leaf className="w-6 h-6 text-emerald-400" />;
    if (aqi <= 100) return <Leaf className="w-6 h-6 text-amber-400" />;
    return <AlertCircle className="w-6 h-6 text-orange-400" />;
  };

  const pm25Percent = Math.min((station.pm25 / 50) * 100, 100);
  const pm10Percent = Math.min((station.pm10 / 120) * 100, 100);

  return (
    <div className="space-y-5 px-1 text-white" id="aqi-dashboard">
      
      {/* Top Station Info Header */}
      {isUsingGps && gpsCoords && (
        <div className="flex items-center justify-start pb-2">
          <p className="text-xs text-white/90 font-semibold tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-emerald-300 font-bold">📍 經緯定位：({gpsCoords.lat.toFixed(2)}°, {gpsCoords.lon.toFixed(2)}°) 附近</span>
          </p>
        </div>
      )}

      {/* Large AQI Dial Widget */}
      <div className="flex flex-col items-center justify-center p-8 rounded-[2.5rem] glass-panel-premium relative overflow-hidden shadow-2xl border border-white/20">
        {/* Accent dynamic glow spot background */}
        <div className={`absolute -right-20 -bottom-20 w-48 h-48 rounded-full blur-[90px] opacity-50 pointer-events-none transition-all ${
          station.aqi <= 50 ? "bg-emerald-500" :
          station.aqi <= 100 ? "bg-amber-500" :
          station.aqi <= 150 ? "bg-orange-500" : "bg-red-500"
        }`}></div>

        <div className="absolute top-4 left-4">
          <span className={`px-4 py-1.5 text-xs font-black rounded-full uppercase tracking-widest ${category.color} ${category.textColor} border border-white/20 shadow-sm`}>
            {category.label}
          </span>
        </div>

        <div className="relative w-48 h-48 flex items-center justify-center my-2 select-none">
          {/* Background track under the dial */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="75"
              className="stroke-white/10"
              strokeWidth="9"
              fill="transparent"
            />
            {/* Animated colored progress circle */}
            <circle
              cx="96"
              cy="96"
              r="75"
              className={`transition-all duration-1000 ease-out stroke-white`}
              strokeWidth="11"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Dial metrics overlay */}
          <div className="absolute text-center flex flex-col justify-center items-center">
            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">AQI 指數</span>
            <span className="text-[7.5rem] font-black text-white font-sans mt-1 leading-none tracking-tighter drop-shadow-2xl">
              {station.aqi}
            </span>
          </div>
        </div>

        <div className="w-full text-center mt-3 relative z-10 px-3 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
          <p className="text-sm text-white/90 leading-relaxed font-medium">
            {category.description}
          </p>
        </div>
      </div>

      {/* Health Advise Card */}
      <div className="p-4 rounded-3xl glass-panel border border-white/20 flex items-start gap-3.5 relative overflow-hidden shadow-xl">
        <div className="p-2.5 rounded-2xl bg-white/10 border border-white/10 shadow-inner shrink-0 text-white">
          {getAdviceIcon(station.aqi)}
        </div>
        <div className="space-y-1">
          <span className="font-extrabold text-white text-sm flex items-center gap-1.5">
            <HeartHandshake className="w-5 h-5 text-emerald-300" />
            <span>貼心健康防護建議</span>
          </span>
          <p className="text-sm text-white/80 leading-relaxed font-medium">
            {category.advice}
          </p>
        </div>
      </div>

      {/* Metrics Matrix Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        
        {/* PM2.5 with a gorgeous High Density progress bar */}
        <div className="p-5 rounded-3xl glass-panel relative overflow-hidden shadow-xl flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-white/70 text-xs font-bold tracking-wider">
            <span>PM2.5 細微粒</span>
            <span className="font-semibold text-xs">μg/m³</span>
          </div>
          <div>
            <div className="text-4xl font-black font-sans text-white mt-1.5 flex items-baseline gap-1">
              <span>{station.pm25}</span>
              <span className="text-sm font-normal text-white/60">μg</span>
            </div>
            {/* High Density progress indicator */}
            <div className="w-full h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${pm25Percent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* PM10 with a gorgeous High Density progress bar */}
        <div className="p-5 rounded-3xl glass-panel relative overflow-hidden shadow-xl flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-white/70 text-xs font-bold tracking-wider">
            <span>PM10 懸浮微粒</span>
            <span className="font-semibold text-xs">μg/m³</span>
          </div>
          <div>
            <div className="text-4xl font-black font-sans text-white mt-1.5 flex items-baseline gap-1">
              <span>{station.pm10}</span>
              <span className="text-sm font-normal text-white/60">μg</span>
            </div>
            {/* High Density progress indicator */}
            <div className="w-full h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-emerald-300 rounded-full transition-all duration-700" 
                style={{ width: `${pm10Percent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Temperature */}
        <div className="p-5 rounded-3xl glass-panel relative overflow-hidden shadow-xl flex flex-col justify-between h-36">
          <div className="flex items-center gap-1.5 text-white/70 text-xs font-bold tracking-wider">
            <Thermometer className="w-5 h-5 text-orange-400" />
            <span>目前溫度</span>
          </div>
          <div>
            <div className="text-4xl font-black font-sans text-white flex items-baseline">
              <span>{station.temp}</span>
              <span className="text-lg font-normal text-white/60 ml-0.5">°C</span>
            </div>
            <p className="text-xs text-white/60 font-semibold mt-1">體感約 {Math.max(Number(station.temp) - 2, 0)}°C</p>
          </div>
        </div>
        
        {/* Humidity */}
        <div className="p-5 rounded-3xl glass-panel relative overflow-hidden shadow-xl flex flex-col justify-between h-36">
          <div className="flex items-center gap-1.5 text-white/70 text-xs font-bold tracking-wider">
            <Droplets className="w-5 h-5 text-sky-400" />
            <span>目前濕度</span>
          </div>
          <div>
            <div className="text-4xl font-black font-sans text-white flex items-baseline">
              <span>{station.humidity}</span>
              <span className="text-lg font-normal text-white/60 ml-0.5">%</span>
            </div>
            <p className="text-xs text-white/60 font-semibold mt-1">大氣含水量適中</p>
          </div>
        </div>

      </div>

      {/* Sync Details Footer */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-white/60 pt-2 pb-2 font-semibold">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>5 分鐘自動刷新。最後更新：{lastUpdated}</span>
      </div>

    </div>
  );
}
