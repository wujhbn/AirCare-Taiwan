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
  const [showAlertModal, setShowAlertModal] = useState(false);
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

  const playWarningBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playTone = (freq1: number, freq2: number, startTime: number, duration: number) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(freq1, startTime);
        
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(freq2, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(startTime);
        osc2.start(startTime);
        osc1.stop(startTime + duration);
        osc2.stop(startTime + duration);
      };

      playTone(880, 1100, ctx.currentTime, 0.35);
      playTone(880, 1100, ctx.currentTime + 0.45, 0.35);
    } catch (e) {
      console.warn("Audio Context beep failed:", e);
    }
  };

  const triggerTestAlert = () => {
    if (!currentStation) return;
    
    // Simulate high pollution notification alert
    const title = `⚠️ 台灣空氣警戒 - ${currentStation.sitename}測站`;
    const message = `細懸浮微粒 (PM2.5) 濃度已達 ${currentStation.pm25} μg/m³，空氣品質屬於「${currentStation.status}」，請關閉窗戶，外出請配戴口罩！`;
    
    // Always trigger the warning audio and modal overlay immediately
    playWarningBeep();
    setShowAlertModal(true);
    
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

      {/* Immersive Warning screen popup modal (空氣品質緊急警戒畫面) */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm overflow-hidden bg-slate-900/95 border-2 border-red-500/40 rounded-[2.2rem] shadow-[0_0_50px_rgba(239,68,68,0.4)] p-6 text-white flex flex-col gap-4 animate-scale-up">
            
            {/* Pulsing Light Alert Header */}
            <div className="flex items-center gap-2.5 bg-red-500/15 border border-red-500/30 px-3.5 py-2 rounded-2xl text-red-400 font-extrabold text-xs tracking-wider uppercase animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444] animate-ping" />
              <span>🚨 系統即時空氣特別預警 (測試)</span>
            </div>

            {/* Main Station info details */}
            <div className="space-y-1 mt-1">
              <span className="text-xs text-white/50 font-black tracking-widest block uppercase font-mono">
                {currentStation?.county || "偵測測站"}
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight leading-snug">
                {currentStation?.sitename || "位置"}測站 ── 空氣不良警告
              </h2>
            </div>

            {/* Visual metrics panel display */}
            <div className="grid grid-cols-2 gap-3.5 bg-white/5 p-4 rounded-3xl border border-white/10 shadow-inner">
              <div className="text-center p-2 border-r border-white/10 flex flex-col justify-center items-center">
                <span className="text-[10px] text-white/50 block font-bold uppercase tracking-widest font-mono">AQI 氣質指數</span>
                <span className="text-4xl font-black text-amber-400 mt-1 block">
                  {currentStation?.aqi || "--"}
                </span>
                <span className="text-[10px] font-black text-white bg-amber-500/25 border border-amber-500/35 px-2.5 py-0.5 rounded-full mt-2 inline-block">
                  {currentStation?.status || "普通"}
                </span>
              </div>
              <div className="text-center p-2 flex flex-col justify-center items-center">
                <span className="text-[10px] text-white/50 block font-bold uppercase tracking-widest font-mono">PM2.5 細懸浮微粒</span>
                <span className="text-3xl font-black text-rose-300 mt-1 block font-mono">
                  {currentStation?.pm25 || "--"}<span className="text-xs font-normal text-white/50 ml-1">μg</span>
                </span>
                <span className="text-[10px] text-white/40 block mt-2 font-mono">
                  單位: μg/m³
                </span>
              </div>
            </div>

            {/* Safety guidelines text block */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase text-white/80 tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                防護應變措施指引：
              </h4>
              <ul className="text-xs text-white/85 space-y-2 bg-red-500/5 p-3.5 rounded-2xl border border-red-500/10 font-medium leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold font-mono">·</span>
                  <span>長輩、孩童、肺敏感患者建議減少戶外遠足或粗重活動。</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold font-mono">·</span>
                  <span>外出人員應正確佩帶好口罩，返回室內後適當清洗。</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400 font-bold font-mono">·</span>
                  <span>建議合閉門窗，啟動室內防霾空氣淨化器。</span>
                </li>
              </ul>
            </div>

            {/* Instruction tooltip about native OS push limitation */}
            <div className="text-[10px] bg-sky-500/10 p-3.5 rounded-2.5xl border border-sky-500/20 text-white/70 space-y-1.5">
              <p className="font-bold text-sky-200 flex items-center gap-1">
                <span>💡 手機沒看到系統橫幅通知？</span>
              </p>
              <p className="leading-relaxed">
                因 iOS Safari 與 Android 行動端安全規範，
                若要在<strong>關閉網頁後仍即時接收警報</strong>，
                請點擊瀏覽器分享選單，點選<strong>「加入主畫面」(Install PWA)</strong> 重新開啟 APP，再點選「啟用通知」允許系統通知權限。
              </p>
            </div>

            {/* Close Button element */}
            <button
              onClick={() => setShowAlertModal(false)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-97 text-white font-extrabold text-center text-sm tracking-wider transition-all shadow-[0_4px_15px_rgba(239,68,68,0.3)] cursor-pointer mt-1"
            >
              確認指引，關閉警報
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
