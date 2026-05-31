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
  gpsCoords?: { lat: number; lon: number } | null;
  gpsStatus?: "idle" | "detecting" | "success" | "error";
  gpsErrorMessage?: string;
  isUsingGps?: boolean;
}

export default function CitySelector({
  stations,
  selectedStation,
  onSelectStation,
  onDetectLocation,
  detectingLocation,
  gpsCoords,
  gpsStatus,
  gpsErrorMessage,
  isUsingGps
}: CitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<"all" | "north" | "zhumiao" | "central" | "yunjianan" | "gaoping" | "yilan" | "huadong" | "other">("all");

  const regions = {
    north: ["台北市", "臺北市", "新北市", "基隆市", "桃園市"],
    zhumiao: ["新竹市", "新竹縣", "苗栗縣"],
    central: ["台中市", "臺中市", "彰化縣", "南投縣"],
    yunjianan: ["雲林縣", "嘉義市", "嘉義縣", "台南市", "臺南市"],
    gaoping: ["高雄市", "屏東縣"],
    yilan: ["宜蘭縣"],
    huadong: ["花蓮縣", "台東縣", "臺東縣"],
    other: ["澎湖縣", "金門縣", "連江縣"]
  };

  const getStationRegion = (county: string): "north" | "zhumiao" | "central" | "yunjianan" | "gaoping" | "yilan" | "huadong" | "other" => {
    if (regions.north.includes(county)) return "north";
    if (regions.zhumiao.includes(county)) return "zhumiao";
    if (regions.central.includes(county)) return "central";
    if (regions.yunjianan.includes(county)) return "yunjianan";
    if (regions.gaoping.includes(county)) return "gaoping";
    if (regions.yilan.includes(county)) return "yilan";
    if (regions.huadong.includes(county)) return "huadong";
    return "other";
  };

  const filteredStations = stations.filter(station => {
    // Search filter
    const normalizedSearch = searchQuery.toLowerCase().replace(/台/g, '臺');
    const normalizedSitename = station.sitename.toLowerCase().replace(/台/g, '臺');
    const normalizedCounty = station.county.toLowerCase().replace(/台/g, '臺');
    
    const matchesSearch = 
      normalizedSitename.includes(normalizedSearch) ||
      normalizedCounty.includes(normalizedSearch);
    
    // Region filter
    if (selectedRegion === "all") return matchesSearch;
    return matchesSearch && getStationRegion(station.county) === selectedRegion;
  });

  const getNormalizedCounty = (county: string) => county.replace(/台/g, "臺");

  // Get unique counties present in the filtered result
  const presentCountiesRaw = Array.from(new Set(filteredStations.map(s => s.county)));

  // Normalize county order for perfect sorting matching TAIWAN_COUNTIES
  const normalizedCountyOrder = TAIWAN_COUNTIES.map(getNormalizedCounty);

  const sortedCounties = presentCountiesRaw.sort((a, b) => {
    const indexA = normalizedCountyOrder.indexOf(getNormalizedCounty(a));
    const indexB = normalizedCountyOrder.indexOf(getNormalizedCounty(b));
    const orderA = indexA === -1 ? 999 : indexA;
    const orderB = indexB === -1 ? 999 : indexB;
    return orderA - orderB;
  });

  return (
    <div className="space-y-4 px-1 text-white" id="city-selector">
      {/* Location button with dynamic high-fidelity feedback */}
      <button
        id="location-btn"
        onClick={onDetectLocation}
        disabled={detectingLocation}
        className={`w-full flex flex-col gap-3 p-4.5 rounded-3xl backdrop-blur-lg border shadow-xl transition-all duration-200 active:scale-97 text-left group cursor-pointer ${
          isUsingGps 
            ? "bg-emerald-950/40 border-emerald-500/50 hover:bg-emerald-950/50" 
            : gpsStatus === "error"
            ? "bg-rose-950/30 border-rose-500/40 hover:bg-rose-950/40"
            : "bg-white/10 border-white/20 hover:bg-white/15"
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3.5">
            <div className={`p-2.5 rounded-2xl border group-hover:scale-105 transition-transform shadow-md ${
              isUsingGps 
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/20" 
                : gpsStatus === "error"
                ? "bg-rose-500/20 text-rose-300 border-rose-500/20"
                : "bg-white/15 text-white border-white/10"
            }`}>
              <MapPin className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="font-extrabold text-white text-base tracking-tight flex items-center gap-1.5">
                <span>定位目前位置</span>
                {isUsingGps && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950 font-black tracking-widest uppercase">
                    使用中
                  </span>
                )}
              </div>
              <div className="text-white/75 text-sm mt-0.5 font-medium">自動媒合離您最近的監測站</div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-sm font-bold shrink-0">
            {detectingLocation ? (
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>定位中...</span>
              </div>
            ) : (
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors ${
                isUsingGps 
                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-200" 
                  : "bg-white/10 border-white/10 hover:bg-white/20 text-white"
              }`}>
                <span>{isUsingGps ? "重新偵測" : "立即偵測"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </div>

        {/* Dynamic sub-statuses to satisfy 'showing current detected location' */}
        {(gpsStatus === "success" && gpsCoords && selectedStation) && (
          <div className="w-full mt-1 p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-100 font-semibold leading-relaxed flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>GPS 偵測成功！</span>
            </div>
            <div className="text-emerald-300/90 font-mono">
              經緯座標：({gpsCoords.lat.toFixed(5)}° N, {gpsCoords.lon.toFixed(5)}° E)
            </div>
            <div className="mt-0.5 text-white bg-emerald-900/60 self-start px-2 py-1 rounded-md text-xs font-black">
              已自動配對至最鄰近的「{selectedStation.sitename}」測站（位於 {selectedStation.county}）
            </div>
          </div>
        )}

        {gpsStatus === "error" && gpsErrorMessage && (
          <div className="w-full mt-1 p-3 rounded-2xl bg-rose-950/50 border border-rose-500/30 text-xs text-rose-200 font-semibold leading-relaxed flex flex-col gap-1 shadow-inner">
            <div className="flex items-center gap-1.5 text-rose-300">
              <span className="text-sm">⚠️</span>
              <span className="font-bold">定位偵測受阻</span>
            </div>
            <div className="text-white/80 leading-normal">{gpsErrorMessage}</div>
            <div className="text-xs text-rose-300/70 mt-0.5">提示：若使用 iOS 裝置，請於「設定 &gt; 隱私權與安全性 &gt; 定位服務」中，確認已開放您的瀏覽器定位權限喔！</div>
          </div>
        )}
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
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 text-base focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all shadow-md font-medium"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mt-2">
          {([
            { id: "all", label: "全部" },
            { id: "north", label: "北部空品區" },
            { id: "zhumiao", label: "竹苗空品區" },
            { id: "central", label: "中部空品區" },
            { id: "yunjianan", label: "雲嘉南空品區" },
            { id: "gaoping", label: "高屏空品區" },
            { id: "yilan", label: "宜蘭空品區" },
            { id: "huadong", label: "花東空品區" },
            { id: "other", label: "其他" },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedRegion(tab.id as any)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold tracking-wider transition-all cursor-pointer ${
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
        {sortedCounties.length > 0 ? (
          sortedCounties.map(county => {
            const countyStations = filteredStations.filter(s => s.county === county);
            
            return (
              <React.Fragment key={county}>
                {/* County/City Group Header - Full Width */}
                <div className="col-span-2 mt-4.5 mb-1.5 first:mt-0">
                  <div className="px-3.5 py-2.5 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl flex items-center justify-between text-xs font-black tracking-widest text-white/95 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                      <span>{county}</span>
                    </div>
                    <span className="text-[10px] text-white/50 bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/5 font-mono font-bold">
                      {countyStations.length} 個測站
                    </span>
                  </div>
                </div>

                {/* Individual Station Cards under this County */}
                {countyStations.map(station => {
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
                          <span className="text-xs text-white/60 font-bold tracking-wider uppercase">{station.county}</span>
                          <h4 className="font-black text-white text-base mt-0.5 flex items-center gap-1 leading-tight">
                            {station.sitename}
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                          </h4>
                        </div>
                        {/* AQI Pill */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/10 border border-white/10">
                          <span className={`w-1.5 h-1.5 rounded-full ${badgeColor}`}></span>
                          <span className="text-sm font-mono font-bold text-white">{station.aqi}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between w-full text-xs text-white/80 font-semibold gap-1">
                        <div className="flex gap-2">
                          <span>細微粒: <strong className="font-mono text-white text-sm">{station.pm25}</strong></span>
                          <span>{station.temp}°C</span>
                        </div>
                        <span className={`text-xs font-black ${
                          station.aqi <= 50 ? "text-emerald-300" :
                          station.aqi <= 100 ? "text-amber-300" :
                          station.aqi <= 150 ? "text-orange-300" : "text-red-300"
                        }`}>
                          {station.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </React.Fragment>
            );
          })
        ) : (
          <div className="col-span-2 text-center py-12 rounded-3xl border border-dashed border-white/20 bg-white/5 backdrop-blur-sm">
            <span className="text-white/60 text-sm font-semibold">沒有找到相符合的空氣觀測站</span>
          </div>
        )}
      </div>
    </div>
  );
}
