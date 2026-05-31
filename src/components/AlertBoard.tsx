import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Smartphone, 
  Info, 
  Download, 
  Wifi, 
  WifiOff, 
  Share, 
  PlusSquare, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  Sun,
  Moon
} from "lucide-react";
import { StationData } from "../types";

interface AlertBoardProps {
  currentStation: StationData | null;
  isDarkMode?: boolean;
  setIsDarkMode?: (dark: boolean) => void;
}

export default function AlertBoard({ currentStation, isDarkMode = true, setIsDarkMode }: AlertBoardProps) {
  const [notificationStatus, setNotificationStatus] = useState<"default" | "granted" | "denied">("default");
  const [testTriggered, setTestTriggered] = useState(false);
  const [activeInstructionTab, setActiveInstructionTab] = useState<"ios" | "android">("ios");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check navigation notification setting
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationStatus(Notification.permission);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      setTestTriggered(true);
      setTimeout(() => setTestTriggered(false), 5000);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      
      if (permission === "granted") {
        showMockNotification("通知功能已成功啟用！", "當所在地區空氣品質轉差時，AirCare 會發送警報給您。");
      }
    } catch (err) {
      console.warn("Notification request error:", err);
    }
  };

  const showMockNotification = async (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      // 1. Try displaying via registered Service Worker (standard & mandatory on mobile devices like Android Chrome & iOS PWA)
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration && "showNotification" in registration) {
            await registration.showNotification(title, {
              body,
              icon: "/icons/icon-192.png",
              badge: "/icons/icon-192.png",
              tag: "aircare-alert",
              vibrate: [200, 100, 200], // Haptic vibration on mobile
            } as any);
            return;
          }
        } catch (swErr) {
          console.warn("ServiceWorker showNotification failed, trying fallback:", swErr);
        }
      }

      // 2. Standard Desktop / Fallback constructor
      try {
        new Notification(title, {
          body,
          icon: "/icons/icon-192.png",
          tag: "aircare-alert",
        });
      } catch (err) {
        console.warn("Standard Notification constructor failed:", err);
        // If everything fails (e.g., standard iOS Safari inside in-app browser), trigger the styled in-app banner fallback
        setTestTriggered(true);
        setTimeout(() => setTestTriggered(false), 5000);
      }
    } else {
      // In-app fallback prompt
      setTestTriggered(true);
      setTimeout(() => setTestTriggered(false), 5000);
    }
  };

  const triggerTestAlert = () => {
    if (!currentStation) return;
    
    // Simulate high pollution notification alert
    const title = `⚠️ 台灣空氣警戒 - ${currentStation.sitename}測站`;
    const message = `細懸浮微粒 (PM2.5) 濃度已達 ${currentStation.pm25} μg/m³，空氣品質屬於「${currentStation.status}」，請關閉窗戶，外出請配戴口罩！`;
    
    showMockNotification(title, message);
  };

  return (
    <div className="space-y-4 px-1 text-white" id="alert-board">
      
      {/* Network State Banner */}
      <div className={`p-4.5 rounded-[2.2rem] border backdrop-blur-md shadow-2xl transition-all duration-300 flex items-center justify-between ${
        isOnline 
          ? "bg-emerald-500/20 border-emerald-500/30 text-white" 
          : "bg-amber-500/20 border-amber-500/30 text-white"
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`p-2.5 rounded-2xl ${isOnline ? "bg-emerald-500/35 border-emerald-500/20" : "bg-amber-500/35 border-amber-500/20"} border shadow-sm`}>
            {isOnline ? <Wifi className="w-5.5 h-5.5 text-emerald-300" /> : <WifiOff className="w-5.5 h-5.5 text-amber-300 shrink-0" />}
          </div>
          <div>
            <span className="font-extrabold text-base block tracking-tight">
              {isOnline ? "網路通訊已建立" : "離線模式運作中 (Offline Code)"}
            </span>
            <span className="text-xs text-white/80 block mt-0.5 font-medium leading-relaxed">
              {isOnline 
                ? "即時擷取環保署 80 個測站最新大氣數據" 
                : "AirCare 已將歷史測站、介面快取。數據保持可用！"}
            </span>
          </div>
        </div>
        <span className={`text-xs uppercase tracking-widest font-black px-2.5 py-1 rounded-full border shadow-inner ${
          isOnline ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/20" : "bg-amber-500/10 text-amber-200 border-amber-500/20"
        }`}>
          {isOnline ? "Live" : "Cached"}
        </span>
      </div>

      {/* Visual Settings */}
      {setIsDarkMode && (
        <div className="p-4 rounded-3xl glass-panel flex items-center justify-between border border-white/20 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/15 shadow-inner">
              {isDarkMode ? <Moon className="w-5 h-5 text-indigo-300" /> : <Sun className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <h3 className="font-black text-white text-base">視覺風格</h3>
              <p className="text-xs text-white/70 mt-0.5 font-medium">{isDarkMode ? "深色模式 (Cosmic 護眼)" : "淺色模式 (清新明亮)"}</p>
            </div>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="px-4 py-2 rounded-full text-sm font-black transition-all cursor-pointer shadow-md bg-white/15 text-white/90 border border-white/20 hover:bg-white/25 active:scale-95 shrink-0"
          >
            切換模式
          </button>
        </div>
      )}

      {/* Smart Air Notifications Config */}
      <div className="p-5 rounded-[2.2rem] glass-panel space-y-4 relative overflow-hidden border border-white/20 shadow-2xl">
        {/* Decoration */}
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/15 shadow-inner">
              <Bell className="w-4.5 h-4.5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">系統即時空氣預警</h3>
              <p className="text-xs text-white/70 mt-0.5 font-medium">當 AQI &gt; 100 或 PM2.5 超標時，發送警報通知</p>
            </div>
          </div>
          
          <button
            id="notification-ask-btn"
            onClick={requestNotificationPermission}
            className={`px-4 py-2 rounded-full text-sm font-black transition-all cursor-pointer shadow-md shrink-0 ${
              notificationStatus === "granted"
                ? "bg-white/15 text-white/90 border border-white/20"
                : "bg-white text-emerald-800 hover:scale-105 active:scale-95 border border-white"
            }`}
          >
            {notificationStatus === "granted" ? "已啟用" : "啟用通知"}
          </button>
        </div>

        {/* Dynamic testing panel */}
        <div className="p-4 rounded-2.5xl bg-white/5 border border-white/10 text-sm text-white/90 space-y-3">
          <p className="leading-relaxed font-medium text-xs">
            透過 PWA 的背景執行緒，當空氣品質突然急劇惡化時，APP 會在手機上方通知列發送警告，提醒家中的敏感老人及孩童防護。
          </p>
          <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-white/10">
            <span className="text-xs text-white/60 font-bold font-mono">
              通知測試功能：
            </span>
            <button
              id="trigger-alert-btn"
              onClick={triggerTestAlert}
              className="text-xs text-emerald-300 font-extrabold hover:text-emerald-200 flex items-center gap-1 active:scale-95 transition-all cursor-pointer bg-white/10 px-2.5 py-1 rounded-full border border-white/10 shadow-sm"
            >
              <span>發送一則測試警報</span>
              <span>⚡</span>
            </button>
          </div>
        </div>

        {/* Fallback mock alert banner */}
        {testTriggered && (
          <div className="p-3.5 bg-sky-500/20 border border-sky-400/30 rounded-2.5xl flex items-center gap-2.5 text-xs text-white font-medium shadow-md">
            <CheckCircle2 className="w-5 h-5 text-sky-300 shrink-0" />
            <p className="leading-relaxed">
              【模擬推播】<strong>{currentStation?.sitename}測站空氣拉警報</strong> - PM2.5 已偏高，外出建議攜帶醫用口罩防護。
            </p>
          </div>
        )}
      </div>


    </div>
  );
}
