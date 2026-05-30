import { AQICategory } from "../types";

export function getAQICategory(aqi: number): AQICategory {
  if (aqi <= 50) {
    return {
      label: "良好",
      color: "bg-emerald-500/15 border-emerald-500/30",
      textColor: "text-emerald-400",
      accentColor: "#10b981", 
      shadowColor: "rgba(16, 185, 129, 0.2)",
      bgGradient: "from-emerald-950 via-slate-950 to-slate-950",
      borderStroke: "stroke-emerald-500",
      description: "空氣品質優良，對健康無危害，適合各種戶外與休閒活動。",
      advice: "空氣極佳，適合深呼吸！出門去綠林或河濱公園散步大口吸氣吧。"
    };
  } else if (aqi <= 100) {
    return {
      label: "普通",
      color: "bg-amber-500/15 border-amber-500/30",
      textColor: "text-amber-400",
      accentColor: "#f59e0b",
      shadowColor: "rgba(245, 158, 11, 0.2)",
      bgGradient: "from-amber-950/80 via-slate-950 to-slate-950",
      borderStroke: "stroke-amber-400",
      description: "空氣品質尚可，但極敏感族群（如氣喘患者）在長期曝露下可能有些微影響。",
      advice: "品質普通，一般民眾活動如常。超敏感族群若感到不適再戴上口罩即可。"
    };
  } else if (aqi <= 150) {
    return {
      label: "對敏感族群不健康",
      color: "bg-orange-500/15 border-orange-500/40",
      textColor: "text-orange-400",
      accentColor: "#f97316",
      shadowColor: "rgba(249, 115, 22, 0.25)",
      bgGradient: "from-orange-950/80 via-slate-950 to-slate-950",
      borderStroke: "stroke-orange-400",
      description: "敏感族群（老人、孩童、心血管疾病患者）可能產生健康影響，一般大眾影響較小。",
      advice: "建議敏感族群配戴口罩，減少長時間或劇烈的戶外慢跑與運動強度。"
    };
  } else if (aqi <= 200) {
    return {
      label: "不健康",
      color: "bg-red-500/15 border-red-500/40",
      textColor: "text-red-400",
      accentColor: "#ef4444",
      shadowColor: "rgba(239, 68, 68, 0.3)",
      bgGradient: "from-red-950/80 via-slate-950 to-slate-950",
      borderStroke: "stroke-red-400",
      description: "對所有族群的健康都可能產生不良影響，呼吸道病徵的人可能會明顯不適。",
      advice: "建議大眾減少長時間待在戶外。呼吸敏感型者應緊閉門窗、開啟室內空氣清淨機。"
    };
  } else if (aqi <= 300) {
    return {
      label: "非常不健康",
      color: "bg-purple-500/15 border-purple-500/40",
      textColor: "text-purple-400",
      accentColor: "#a855f7",
      shadowColor: "rgba(168, 85, 247, 0.35)",
      bgGradient: "from-purple-950/80 via-slate-950 to-slate-950",
      borderStroke: "stroke-purple-400",
      description: "健康警告！此空氣品質對每個人都可能有嚴重的健康威脅，需高度防範。",
      advice: "應儘量留在室內，停止一切戶外體力消耗活動，室內空氣循環開啟過濾機制。"
    };
  } else {
    return {
      label: "危害",
      color: "bg-rose-950/40 border-rose-500/40",
      textColor: "text-rose-400",
      accentColor: "#e11d48",
      shadowColor: "rgba(225, 29, 72, 0.4)",
      bgGradient: "from-rose-950 via-slate-950 to-slate-950",
      borderStroke: "stroke-rose-400",
      description: "極度危險！可能引發全民突發急性呼吸障礙或心臟負擔驟升。",
      advice: "全民應緊閉室內門窗。非必要絕對不出門！若必須出門需配戴醫用 N95 等級口罩。"
    };
  }
}

/**
 * Normalizes values to display nice visual circular stroke dashboards
 */
export function getAQIProgress(aqi: number): number {
  // 300 is our maximum normal scale index
  return Math.min(100, Math.round((Math.max(0, aqi) / 300) * 100));
}

// Map Taiwan counties to coordinates for geographical listing
export const TAIWAN_COUNTIES = [
  "台北市", "新北市", "基隆市", "桃園市", "新竹市", "新竹縣", "苗栗縣",
  "台中市", "彰化縣", "南投縣", "雲林縣", "嘉義市", "嘉義縣", "台南市",
  "高雄市", "屏東縣", "宜蘭縣", "花蓮縣", "台東縣", "澎湖縣", "金門縣", "連江縣"
];
