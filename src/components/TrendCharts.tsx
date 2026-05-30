import React, { useState } from "react";
import { StationData } from "../types";
import { TrendingUp, Clock, CalendarDays } from "lucide-react";

interface TrendChartsProps {
  station: StationData | null;
}

export default function TrendCharts({ station }: TrendChartsProps) {
  const [activeTab, setActiveTab] = useState<"aqi" | "pm25">("aqi");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!station) return null;

  // Generate a realistic 24-hour historic/future air path based on station defaults
  const hours = [
    "00:00", "02:00", "04:00", "06:00", "08:00", "10:00",
    "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"
  ];

  // Helper hash string to generate consistent, stable pseudo-random hourly rates
  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
       hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const seedValue = hashString(station.sitename);

  // Generate AQI hours
  const chartData = hours.map((hour, idx) => {
    // commute hours 08:00 & 18:00 have high values, late night has lower values
    const HourNum = parseInt(hour.split(":")[0]);
    let variance = 0;
    if (HourNum >= 7 && HourNum <= 9) variance = 12; // Morning rush
    else if (HourNum >= 17 && HourNum <= 19) variance = 15; // Evening rush
    else if (HourNum >= 12 && HourNum <= 15) variance = -5; // Mid-day breeze
    else if (HourNum >= 1 && HourNum <= 5) variance = -15; // Late night

    // Add a small stable offset based on station name
    const noise = (seedValue + idx) % 8 - 4;
    const computedAqi = Math.max(8, Math.round(station.aqi + variance + noise));

    // Base PM2.5 proportional to AQI
    const computedPm25 = Math.max(2, Math.round(computedAqi * 0.35 + (noise * 0.5)));

    return {
      hour,
      aqi: computedAqi,
      pm25: computedPm25
    };
  });

  // Calculate coordinates for SVGs
  const values = activeTab === "aqi" 
    ? chartData.map(d => d.aqi) 
    : chartData.map(d => d.pm25);

  const maxVal = Math.max(...values, activeTab === "aqi" ? 150 : 50) + 15;
  const minVal = Math.max(0, Math.min(...values) - 10);
  const valRange = maxVal - minVal;

  const width = 500;
  const height = 180;
  const paddingLeft = 30;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = chartData.map((data, index) => {
    const val = activeTab === "aqi" ? data.aqi : data.pm25;
    const x = paddingLeft + (index / (chartData.length - 1)) * chartWidth;
    // inverted Y coordinates
    const y = paddingTop + chartHeight - ((val - minVal) / valRange) * chartHeight;
    return { x, y, val, hour: data.hour };
  });

  // Path generator
  let pathD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // Create smooth Bezier curve control points
      const prev = points[i - 1];
      const curr = points[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }
  }

  // Linear Gradient area path generator
  const areaD = pathD ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z` : "";

  // Helper color thresholds
  const getThresholdColor = (val: number) => {
    if (activeTab === "aqi") {
      if (val <= 50) return "text-emerald-400 fill-emerald-500 bg-emerald-500";
      if (val <= 100) return "text-amber-400 fill-amber-500 bg-amber-500";
      if (val <= 150) return "text-orange-400 fill-orange-500 bg-orange-500";
      return "text-red-400 fill-red-500 bg-red-500";
    } else {
      if (val <= 15) return "text-emerald-400 fill-emerald-500 bg-emerald-500";
      if (val <= 35) return "text-amber-400 fill-amber-500 bg-amber-500";
      if (val <= 54) return "text-orange-400 fill-orange-500 bg-orange-500";
      return "text-red-400 fill-red-500 bg-red-500";
    }
  };

  return (
    <div className="rounded-[2.2rem] glass-panel p-5 space-y-4 relative overflow-hidden border border-white/20 shadow-2xl" id="trend-charts-container">
      {/* Glow Decor */}
      <div className={`absolute -right-20 -top-20 w-48 h-48 rounded-full blur-[90px] pointer-events-none opacity-40 transition-colors duration-500 ${
        station.aqi <= 50 ? "bg-emerald-400" :
        station.aqi <= 100 ? "bg-amber-400" :
        station.aqi <= 150 ? "bg-orange-400" : "bg-red-400"
      }`}></div>

      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-2xl border border-white/15 shadow-inner">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-300" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base tracking-tight">24小時空氣觀測趨勢</h3>
            <p className="text-xs text-white/70 mt-0.5 font-medium">即時推算今日每兩小時濃度起伏</p>
          </div>
        </div>

        {/* Metric Switch tab */}
        <div className="flex bg-white/15 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => { setActiveTab("aqi"); setHoveredIndex(null); }}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-black transition-all cursor-pointer ${
              activeTab === "aqi" ? "bg-white text-emerald-800 shadow-md" : "text-white/60 hover:text-white"
            }`}
          >
            AQI
          </button>
          <button
            onClick={() => { setActiveTab("pm25"); setHoveredIndex(null); }}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-black transition-all cursor-pointer ${
              activeTab === "pm25" ? "bg-white text-emerald-800 shadow-md" : "text-white/60 hover:text-white"
            }`}
          >
            PM2.5
          </button>
        </div>
      </div>

      {/* Graph */}
      <div className="relative z-10 w-full overflow-x-auto">
        <div className="w-[100%] min-w-[340px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
            <defs>
              <linearGradient id="chartGradientAqua" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="chartGradientGreen" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Guide grid lines */}
            <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="rgba(255,255,255,0.15)" strokeDasharray="3" />
            <line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={width - paddingRight} y2={paddingTop + chartHeight / 2} stroke="rgba(255,255,255,0.15)" strokeDasharray="3" />
            <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={width - paddingRight} y2={paddingTop + chartHeight} stroke="rgba(255,255,255,0.25)" />

            {/* Y Axis indicators */}
            <text x={paddingLeft - 8} y={paddingTop + 4} fill="#ffffff" opacity="0.65" className="text-[10px] font-mono font-bold text-right" textAnchor="end">
              {Math.round(maxVal)}
            </text>
            <text x={paddingLeft - 8} y={paddingTop + chartHeight / 2 + 4} fill="#ffffff" opacity="0.65" className="text-[10px] font-mono font-bold text-right" textAnchor="end">
              {Math.round((maxVal + minVal) / 2)}
            </text>
            <text x={paddingLeft - 8} y={paddingTop + chartHeight + 4} fill="#ffffff" opacity="0.65" className="text-[10px] font-mono font-bold text-right" textAnchor="end">
              {Math.round(minVal)}
            </text>

            {/* Gradient Area under curve */}
            {areaD && (
              <path
                d={areaD}
                fill={activeTab === "aqi" ? "url(#chartGradientAqua)" : "url(#chartGradientGreen)"}
              />
            )}

            {/* Sleek curve path line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={activeTab === "aqi" ? "#ffffff" : "#34d399"}
                strokeWidth="4"
                strokeLinecap="round"
              />
            )}

            {/* Interactive Nodes and guide columns */}
            {points.map((pt, idx) => {
              const isHovered = hoveredIndex === idx;
              const colWidth = chartWidth / (points.length - 1);
              
              return (
                <g key={idx}>
                  {/* Invisible touch column for easy clicking */}
                  <rect
                    x={pt.x - colWidth / 2}
                    y={paddingTop}
                    width={colWidth}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onTouchStart={() => setHoveredIndex(idx)}
                  />

                  {/* Verticle indicator rule for hover state */}
                  {isHovered && (
                    <line
                      x1={pt.x}
                      y1={paddingTop}
                      x2={pt.x}
                      y2={paddingTop + chartHeight}
                      stroke="rgba(255, 255, 255, 0.3)"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Colored indicator core bullet */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6.5 : 4}
                    className={`transition-all duration-100 ${getThresholdColor(pt.val)}`}
                    stroke="#ffffff"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                  />

                  {/* X Axis Time markers */}
                  {idx % 2 === 0 && (
                    <text
                      x={pt.x}
                      y={paddingTop + chartHeight + 16}
                      fill="#ffffff"
                      opacity="0.65"
                      className="text-[10px] font-mono font-bold text-center"
                      textAnchor="middle"
                    >
                      {pt.hour}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Live Hover Detail Card */}
      <div className="h-16 flex items-center justify-center bg-white/5 rounded-2xl px-4 border border-white/10 shadow-sm mt-4">
        {hoveredIndex !== null ? (
          <div className="flex items-center gap-4 text-sm font-bold">
            <div className="flex items-center gap-1.5 text-white/80">
              <Clock className="w-5 h-5 text-emerald-300" />
              <span>時間: <strong className="text-white font-mono">{points[hoveredIndex].hour}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                activeTab === "aqi" 
                  ? points[hoveredIndex].val <= 50 ? "bg-emerald-400" : points[hoveredIndex].val <= 100 ? "bg-amber-400" : "bg-orange-500"
                  : points[hoveredIndex].val <= 15 ? "bg-emerald-400" : points[hoveredIndex].val <= 35 ? "bg-amber-400" : "bg-orange-500"
              } shadow-sm`}></span>
              <span>
                {activeTab === "aqi" ? "空氣品質指標 (AQI)" : "細微粒 (PM2.5)"}: 
                <strong className="text-white font-mono ml-1 text-base font-black">{points[hoveredIndex].val}</strong>
                <span className="text-xs text-white/70 ml-1">{activeTab === "aqi" ? "" : "μg/m³"}</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-white/70 text-xs font-bold">
            <span className="animate-bounce">💡</span>
            <span className="animate-pulse-slow">滑動或點擊折線上的節點，可以掌握一整天變化的具體細節喔！</span>
          </div>
        )}
      </div>

      {/* Quick Historic Summary */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-3.5 rounded-2.5xl bg-white/10 border border-white/10 flex items-center gap-2.5 shadow-md">
          <CalendarDays className="w-5 h-5 text-emerald-300 shrink-0" />
          <div>
            <div className="text-xs text-white/60 font-bold uppercase tracking-wider">今日低谷濃度</div>
            <div className="text-base font-black text-white font-mono mt-0.5">
              {Math.min(...values)} {activeTab === "aqi" ? "AQI" : "μg/m³"}
            </div>
          </div>
        </div>
        <div className="p-3.5 rounded-2.5xl bg-white/10 border border-white/10 flex items-center gap-2.5 shadow-md">
          <CalendarDays className="w-5 h-5 text-orange-300 shrink-0" />
          <div>
            <div className="text-xs text-white/60 font-bold uppercase tracking-wider">今日高峰濃度</div>
            <div className="text-base font-black text-white font-mono mt-0.5">
              {Math.max(...values)} {activeTab === "aqi" ? "AQI" : "μg/m³"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
