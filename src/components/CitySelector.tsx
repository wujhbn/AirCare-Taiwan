import React, { useState } from "react";
import { StationData } from "../types";
import { Search, MapPin, Check, ChevronRight } from "lucide-react";
import { TAIWAN_COUNTIES } from "../utils/aqiHelpers";

interface CitySelectorProps {
  stations: StationData[];
  selectedStation: StationData | null;
  onSelectStation: (station: StationData) => void;
  onDetectLocation: () => void;
  detectingLocation: boolean;
}

export default function CitySelector({
  stations,
  selectedStation,
  onSelectStation,
  onDetectLocation,
  detectingLocation
}: CitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<"all" | "north" | "central" | "south" | "east">("all");

  const regions = {
    north: ["台北市", "新北市", "基隆市", "桃園市", "新竹市", "新竹縣", "宜蘭縣"],
    central: ["苗栗縣", "台中市", "彰化縣", "南投縣", "雲林縣"],
    south: ["嘉義市", "嘉義縣", "台南市", "高雄市", "屏東縣"],
    east: ["花蓮縣", "台東縣", "澎湖縣", "金門縣", "連江縣"]
  };

  const getStationRegion = (county: string): "north" | "central" | "south" | "east" => {
    if (regions.north.includes(county)) return "north";
    if (regions.central.includes(county)) return "central";
    if (regions.south.includes(county)) return "south";
    return "east";
  };

  const filteredStations = stations.filter(station => {
    // Search filter
    const matchesSearch = 
      station.sitename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.county.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Region filter
    if (selectedRegion === "all") return matchesSearch;
    return matchesSearch && getStationRegion(station.county) === selectedRegion;
  });

  return (
    <div className="space-y-4 px-1 text-white" id="city-selector">
      {/* Location button */}
      <button
        id="location-btn"
        onClick={onDetectLocation}
        disabled={detectingLocation}
        className="w-full flex items-center justify-between p-4.5 rounded-3xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl transition-all duration-200 active:scale-95 text-left group cursor-pointer"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-white/15 text-white border border-white/10 group-hover:scale-105 transition-transform shadow-md">
            <MapPin className="w-5.5 h-5.5 text-emerald-300" />
          </div>
          <div>
            <div className="font-extrabold text-white text-sm tracking-tight">定位目前位置</div>
            <div className="text-white/70 text-xs mt-0.5 font-medium">自動媒合離您最近的監測站</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white font-bold">
          {detectingLocation ? (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-emerald-300">定位中...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full border border-white/10 hover:bg-white/20 transition-colors">
              <span>立即偵測</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </button>

      {/* Search and Region Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/60" />
          <input
            id="station-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋測站名稱或城市 (如：板橋、台中)..."
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all shadow-md font-medium"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mt-2">
          {([
            { id: "all", label: "全部" },
            { id: "north", label: "北部" },
            { id: "central", label: "中部" },
            { id: "south", label: "南部" },
            { id: "east", label: "東部離島" },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedRegion(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all cursor-pointer ${
                selectedRegion === tab.id
                  ? "bg-white text-emerald-900 shadow-xl border border-white"
                  : "bg-white/10 text-white/75 border border-white/10 hover:text-white hover:bg-white/15"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Station List Cards */}
      <div className="grid grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1 pb-16">
        {filteredStations.length > 0 ? (
          filteredStations.map(station => {
            const isSelected = selectedStation?.sitename === station.sitename;
            
            // Render color badges matching safety
            let badgeColor = "bg-emerald-400";
            if (station.aqi > 50 && station.aqi <= 100) badgeColor = "bg-amber-400";
            else if (station.aqi > 100 && station.aqi <= 150) badgeColor = "bg-orange-400";
            else if (station.aqi > 150) badgeColor = "bg-red-400";

            return (
              <button
                key={`${station.county}-${station.sitename}`}
                id={`station-card-${station.sitename}`}
                onClick={() => onSelectStation(station)}
                className={`flex flex-col justify-between p-4 rounded-2.5xl text-left transition-all relative cursor-pointer ${
                  isSelected
                    ? "bg-white/25 border-2 border-white text-white shadow-2xl scale-[1.01]"
                    : "glass-panel hover:bg-white/15 hover:border-white/30 text-white/90"
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  <div>
                    <span className="text-[10px] text-white/60 font-bold tracking-wider uppercase">{station.county}</span>
                    <h4 className="font-black text-white text-sm mt-0.5 flex items-center gap-1 leading-tight">
                      {station.sitename}
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                    </h4>
                  </div>
                  {/* AQI Pill */}
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white/10 border border-white/10">
                    <span className={`w-1.5 h-1.5 rounded-full ${badgeColor}`}></span>
                    <span className="text-xs font-mono font-bold text-white">{station.aqi}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between w-full text-[11px] text-white/80 font-semibold gap-1">
                  <div className="flex gap-2">
                    <span>細微粒: <strong className="font-mono text-white">{station.pm25}</strong></span>
                    <span>{station.temp}°C</span>
                  </div>
                  <span className={`text-[10px] font-black ${
                    station.aqi <= 50 ? "text-emerald-300" :
                    station.aqi <= 100 ? "text-amber-300" :
                    station.aqi <= 150 ? "text-orange-300" : "text-red-300"
                  }`}>
                    {station.status}
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-12 rounded-3xl border border-dashed border-white/20 bg-white/5 backdrop-blur-sm">
            <span className="text-white/60 text-xs font-semibold">沒有找到相符合的空氣觀測站</span>
          </div>
        )}
      </div>
    </div>
  );
}
