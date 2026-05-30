import React, { useState, useEffect } from "react";
import { StationData } from "./types";
import AQIDashboard from "./components/AQIDashboard";
import CitySelector from "./components/CitySelector";
import TrendCharts from "./components/TrendCharts";
import AlertBoard from "./components/AlertBoard";
import { 
  Activity, 
  Map, 
  TrendingUp, 
  Bell, 
  ShieldAlert, 
  Sparkles, 
  Sun, 
  Moon, 
  Download,
  AlertCircle
} from "lucide-react";

const STATION_COORDINATES: Record<string, { lat: number; lon: number }> = {
  "基隆": { lat: 25.13, lon: 121.74 },
  "陽明": { lat: 25.16, lon: 121.52 },
  "士林": { lat: 25.09, lon: 121.52 },
  "中山": { lat: 25.06, lon: 121.53 },
  "萬華": { lat: 25.03, lon: 121.50 },
  "古亭": { lat: 25.02, lon: 121.52 },
  "汐止": { lat: 25.06, lon: 121.66 },
  "板橋": { lat: 25.01, lon: 121.46 },
  "土城": { lat: 24.97, lon: 121.44 },
  "新莊": { lat: 25.04, lon: 121.45 },
  "淡水": { lat: 25.17, lon: 121.44 },
  "林口": { lat: 25.07, lon: 121.38 },
  "桃園": { lat: 24.99, lon: 121.31 },
  "中壢": { lat: 24.95, lon: 121.22 },
  "平鎮": { lat: 24.92, lon: 121.21 },
  "新竹": { lat: 24.80, lon: 120.97 },
  "竹東": { lat: 24.73, lon: 121.09 },
  "苗栗": { lat: 24.56, lon: 120.82 },
  "三義": { lat: 24.40, lon: 120.76 },
  "豐原": { lat: 24.25, lon: 120.72 },
  "沙鹿": { lat: 24.22, lon: 120.56 },
  "台中": { lat: 24.15, lon: 120.68 },
  "大里": { lat: 24.10, lon: 120.68 },
  "彰化": { lat: 24.08, lon: 120.54 },
  "二林": { lat: 23.90, lon: 120.37 },
  "南投": { lat: 23.91, lon: 120.68 },
  "埔里": { lat: 23.96, lon: 120.97 },
  "斗六": { lat: 23.71, lon: 120.54 },
  "崙背": { lat: 23.76, lon: 120.35 },
  "嘉義": { lat: 23.48, lon: 120.44 },
  "朴子": { lat: 23.46, lon: 120.24 },
  "新營": { lat: 23.31, lon: 120.31 },
  "安南": { lat: 23.04, lon: 120.18 },
  "台南": { lat: 22.98, lon: 120.20 },
  "美濃": { lat: 22.90, lon: 120.53 },
  "左營": { lat: 22.67, lon: 120.30 },
  "前金": { lat: 22.62, lon: 120.29 },
  "小港": { lat: 22.56, lon: 120.33 },
  "鳳山": { lat: 22.62, lon: 120.35 },
  "屏東": { lat: 22.67, lon: 120.48 },
  "潮州": { lat: 22.55, lon: 120.54 },
  "恆春": { lat: 22.00, lon: 120.74 },
  "宜蘭": { lat: 24.75, lon: 121.75 },
  "冬山": { lat: 24.64, lon: 121.79 },
  "花蓮": { lat: 23.97, lon: 121.60 },
  "台東": { lat: 22.75, lon: 121.15 },
  "澎湖": { lat: 23.56, lon: 119.56 },
  "金門": { lat: 24.43, lon: 118.36 },
  "馬祖": { lat: 26.16, lon: 119.92 }
};

export default function App() {
  const [stations, setStations] = useState<StationData[]>([]);
  const [selectedStationName, setSelectedStationName] = useState<string>("板橋");
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "cities" | "trends" | "alerts">("dashboard");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to gorgeous dark / ambient slate theme
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  // High fidelity GPS tracking state variables
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "detecting" | "success" | "error">("idle");
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string>("");
  const [isUsingGps, setIsUsingGps] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const triggerToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4500);
  };

  // Dynamically resolve selectedStation from current station name
  const selectedStation = stations.find(s => s.sitename === selectedStationName) || stations[0] || null;

  // Fetch AQI stations from our full-stack Express secure proxy
  const fetchStations = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const controller = new AbortController();
      const signalId = setTimeout(() => controller.abort(), 6500); // 6.5s timeout on API level

      const res = await fetch("/api/aqi", { signal: controller.signal });
      clearTimeout(signalId);

      if (!res.ok) throw new Error("API responded with an error check status");
      
      const payload = await res.json();
      if (payload && payload.success && Array.isArray(payload.data)) {
        setStations(payload.data);

        const now = new Date();
        setLastUpdated(now.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      }
    } catch (err) {
      console.error("AirCare failed to obtain live air records, recovering cleanly:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Setup periodic refresh and install event capturing
  useEffect(() => {
    fetchStations();

    // Auto update every 5 minutes as requested
    const pollId = setInterval(() => {
      fetchStations(true);
    }, 5 * 60 * 1000);

    // Capture standard install prompts on chrome/android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      clearInterval(pollId);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Geolocation-based station matching
  const detectAndSetClosestStation = () => {
    if (!navigator.geolocation) {
      const msg = "抱歉，您的裝置或瀏覽器不支援 GPS 地理定位服務。";
      setGpsStatus("error");
      setGpsErrorMessage(msg);
      triggerToast(msg, "error");
      return;
    }

    setDetectingLocation(true);
    setGpsStatus("detecting");
    setGpsErrorMessage("");
    triggerToast("正在讀取 GPS 衛星定位系統運作，請授權定位...", "info");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsCoords({ lat: latitude, lon: longitude });

        let closestStation: StationData | null = null;
        let minDistance = Infinity;

        stations.forEach((station) => {
          const coords = STATION_COORDINATES[station.sitename];
          if (coords) {
            // Standard Euclidean distance squared mapping
            const dist = Math.pow(coords.lat - latitude, 2) + Math.pow(coords.lon - longitude, 2);
            if (dist < minDistance) {
              minDistance = dist;
              closestStation = station;
            }
          }
        });

        if (closestStation) {
          const matchedName = (closestStation as StationData).sitename;
          setSelectedStationName(matchedName);
          setIsUsingGps(true);
          setGpsStatus("success");
          triggerToast(`📍 定位配對成功！已自動切換至最近「${matchedName}」測站`, "success");
          setActiveTab("dashboard");
        } else {
          setGpsStatus("error");
          setGpsErrorMessage("定位已讀取，但在資料庫中未能成功配對鄰接之專屬大氣觀測點。");
          triggerToast("定位已讀取，但附近無配對大氣測站資料。已還原預設。", "error");
        }
        setDetectingLocation(false);
      },
      (error) => {
        console.warn("Location fetch blocked:", error);
        let errorMsg = "GPS 定位失敗。";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "您拒絕了定位權限。請於瀏覽器/手機設定中允許定位，並再按一次立即偵測！";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "無法取得您的位置資訊，請檢查裝置的 GPS 定位是否已經開通。";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "讀取 GPS 訊號逾時。請移動到收訊優良的區域，或是手動挑選縣市觀測！";
        }
        setGpsStatus("error");
        setGpsErrorMessage(errorMsg);
        triggerToast(errorMsg, "error");
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Launch browser-native install banner
  const triggerNativeInstall = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    console.log(`Native install prompt result is: ${outcome}`);
    setInstallPromptEvent(null);
    setCanInstall(false);
  };

  return (
    <div id="aircare-root-container" className={`min-h-screen ${isDarkMode ? "bg-gradient-to-b from-[#0b1329] via-[#102452] to-[#0d3625] text-white" : "bg-gradient-to-b from-[#1e3a8a] to-[#10b981] text-white"} font-sans transition-colors duration-300 pb-28 relative overflow-x-hidden w-full max-w-md mx-auto shadow-2xl`}>
      
      {/* Premium Atmospheric Background Elements */}
      <div className="absolute top-0 left-0 right-0 h-64 overflow-hidden pointer-events-none z-0">
        <div id="glow-ambient-orb" className={`absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[100px] opacity-30 transition-all duration-[1200ms] ${
          selectedStation 
            ? selectedStation.aqi <= 50 ? "bg-emerald-400" :
              selectedStation.aqi <= 100 ? "bg-amber-400" :
              selectedStation.aqi <= 150 ? "bg-orange-400" : "bg-red-400"
            : "bg-sky-400"
        }`}></div>
      </div>

      {/* App Top Brand Header Bar with iOS Status Bar safe area gap */}
      <header id="app-brand-header" className="relative z-10 flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-5 bg-slate-950/40 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          {/* Logo Brand Widget */}
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform shrink-0">
            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight tracking-tight text-white flex items-center gap-1.5">
              AirCare <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-black border border-white/25">TW</span>
            </h1>
            <p className="text-[10px] text-white/70 uppercase tracking-widest font-semibold">智慧空氣守護者</p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2.5">
          {canInstall && (
            <button
              onClick={triggerNativeInstall}
              className="flex items-center gap-1.5 bg-white text-emerald-700 font-bold text-xs px-4 py-2 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>安裝 App</span>
            </button>
          )}

          {/* Theme custom selector */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl bg-white/10 border border-white/20 text-white hover:text-white/80 hover:bg-white/15 outline-none active:scale-95 transition-all"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-200" />}
          </button>
        </div>
      </header>

      {/* Main Contents Box with subtle transitions */}
      <main className="relative z-10 px-4 mt-4 space-y-4">
        {activeTab === "dashboard" && (
          <AQIDashboard
            station={selectedStation}
            onRefresh={() => fetchStations()}
            refreshing={refreshing}
            lastUpdated={lastUpdated}
            isUsingGps={isUsingGps}
            gpsCoords={gpsCoords}
          />
        )}

        {activeTab === "cities" && (
          <CitySelector
            stations={stations}
            selectedStation={selectedStation}
            onSelectStation={(st) => {
              setSelectedStationName(st.sitename);
              setIsUsingGps(false); // Reset GPS mode if manually selection made
              setActiveTab("dashboard");
            }}
            onDetectLocation={detectAndSetClosestStation}
            detectingLocation={detectingLocation}
            gpsCoords={gpsCoords}
            gpsStatus={gpsStatus}
            gpsErrorMessage={gpsErrorMessage}
            isUsingGps={isUsingGps}
          />
        )}

        {activeTab === "trends" && (
          <TrendCharts
            station={selectedStation}
          />
        )}

        {activeTab === "alerts" && (
          <AlertBoard
            currentStation={selectedStation}
          />
        )}
      </main>

      {/* iOS Style High Fidelity Bottom Tab Bar */}
      <nav id="app-bottom-navbar" className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 px-4 pb-6 pt-3 bg-white/10 backdrop-blur-2xl border-t border-white/20 shadow-2xl flex justify-around items-center rounded-t-[32px] safe-bottom-bar">
        
        {/* Tab 1: Monitor */}
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all relative ${
            activeTab === "dashboard" ? "text-white font-extrabold" : "text-white/50 hover:text-white/80"
          }`}
        >
          <Activity className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold">品質監測</span>
          {activeTab === "dashboard" && (
            <span className="absolute bottom-0 w-1 h-1 rounded-full bg-white shadow-md shadow-white"></span>
          )}
        </button>

        {/* Tab 2: Cities */}
        <button
          id="tab-cities"
          onClick={() => setActiveTab("cities")}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all relative ${
            activeTab === "cities" ? "text-white font-extrabold" : "text-white/50 hover:text-white/80"
          }`}
        >
          <Map className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold">地區觀測</span>
          {activeTab === "cities" && (
            <span className="absolute bottom-0 w-1 h-1 rounded-full bg-white shadow-md shadow-white"></span>
          )}
        </button>

        {/* Tab 3: Trends */}
        <button
          onClick={() => setActiveTab("trends")}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all relative ${
            activeTab === "trends" ? "text-white font-extrabold" : "text-white/50 hover:text-white/80"
          }`}
        >
          <TrendingUp className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold">趨勢分析</span>
          {activeTab === "trends" && (
            <span className="absolute bottom-0 w-1 h-1 rounded-full bg-white shadow-md shadow-white"></span>
          )}
        </button>

        {/* Tab 4: Alerts */}
        <button
          id="tab-alerts"
          onClick={() => setActiveTab("alerts")}
          className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-2xl transition-all relative ${
            activeTab === "alerts" ? "text-white font-extrabold" : "text-white/50 hover:text-white/80"
          }`}
        >
          <Bell className="w-5.5 h-5.5" />
          <span className="text-[10px] font-bold">通報設定</span>
          {activeTab === "alerts" && (
            <span className="absolute bottom-0 w-1 h-1 rounded-full bg-white shadow-md shadow-white"></span>
          )}
        </button>

      </nav>

      {/* High-Fidelity Custom Floating Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-28 left-4 right-4 z-50 max-w-sm mx-auto transition-transform duration-300 ease-out transform">
          <div className={`p-4.5 rounded-2.5xl shadow-2xl flex items-start gap-3 backdrop-blur-xl border ${
            toast.type === "success" 
              ? "bg-emerald-950/95 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40" 
              : toast.type === "error"
              ? "bg-rose-950/95 border-rose-500/40 text-rose-100 shadow-rose-950/40"
              : "bg-slate-900/95 border-emerald-500/20 text-slate-100 shadow-slate-950/40"
          }`}>
            <span className="text-base shrink-0 mt-0.5 select-none">
              {toast.type === "success" ? "🟢" : toast.type === "error" ? "⚠️" : "💡"}
            </span>
            <div className="flex-1 text-xs font-bold leading-relaxed">{toast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
