"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Share2,
  MoreVertical,
  Info,
  Copy,
  BellRing,
  Clock,
  BarChart2,
  Download,
  PieChart,
  Wallet,
  Search,
  Bell,
  Eye,
  Filter,
  SortDesc,
  TrendingUp,
  Activity,
  Home,
  Briefcase,
  List,
  Lightbulb,
  Zap,
  Target,
  Settings,
} from "lucide-react";

// TypeScript interfaces
interface GoldData {
  buying_price_numeric: number;
  percent_change_numeric: number;
  change_direction: string;
  currency: string;
  statistics_numeric: {
    "Önceki Kapanış": number;
    "En Düşük": number;
    "En Yüksek": number;
    "Haftalık En Düşük": number;
    "Haftalık En Yüksek": number;
    "Aylık En Düşük": number;
    "Aylık En Yüksek": number;
    "Yıllık En Düşük": number;
    "Yıllık En Yüksek": number;
  };
  timestamp: string;
}

interface InvestmentParams {
  investmentAmount: number; // Gerçek yatırım miktarı (TL)
  entryPrice: number; // Giriş fiyatı (USD)
  goldAmount: number; // Kaç gram/ons altın aldı
  targetPrice: number; // Hedef fiyat (USD)
  stopLoss: number; // Zarar durdur fiyatı (USD)
  theme: string;
}

interface PortfolioTotals {
  totalInvestment: number; // TL
  totalCurrentValue: number; // TL
  totalProfitLoss: number; // TL
  totalProfitLossPercent: number;
  goldAmount: number;
  targetProfit: number; // TL
  potentialLoss: number; // TL
}

interface ExchangeRates {
  USDTRY: number;
}

// Utility functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const easeOutQuart = (t: number): number => 1 - Math.pow(1 - t, 4);

const GoldInvestmentTracker: React.FC = () => {
  const [investmentParams, setInvestmentParams] = useState<InvestmentParams>({
    investmentAmount: 1000, // TL cinsinden
    entryPrice: 3500.0, // USD
    goldAmount: 0,
    targetPrice: 3600.0, // USD
    stopLoss: 3400.0, // USD
    theme: "dark",
  });

  const [goldData, setGoldData] = useState<GoldData | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string>("");
  const [animatedTotalValue, setAnimatedTotalValue] = useState<number>(0);
  const [animatedTotalPercent, setAnimatedTotalPercent] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'position' | 'summary'>('position');

  // Döviz kuru çekme fonksiyonu
  const fetchExchangeRates = async (): Promise<ExchangeRates | null> => {
    try {
      const response = await fetch("https://doviz.dev/v1/usd.json");
      if (!response.ok) {
        throw new Error(`Döviz kuru API hatası: ${response.status}`);
      }
      const data = await response.json();
      return { USDTRY: data.USDTRY };
    } catch (err) {
      console.error("Döviz kuru çekme hatası:", err);
      // Fallback kur (yaklaşık değer)
      return { USDTRY: 34.0 };
    }
  };

  const calculatePortfolioTotals = (): PortfolioTotals => {
    if (!goldData || !exchangeRates) {
      return {
        totalInvestment: 0,
        totalCurrentValue: 0,
        totalProfitLoss: 0,
        totalProfitLossPercent: 0,
        goldAmount: 0,
        targetProfit: 0,
        potentialLoss: 0,
      };
    }

    const usdTryRate = exchangeRates.USDTRY;
    
    // TL yatırım tutarından kaç ons altın satın alındığını hesapla
    const entryPriceTL = investmentParams.entryPrice * usdTryRate;
    const goldAmount = investmentParams.investmentAmount / entryPriceTL;
    
    const totalInvestment = investmentParams.investmentAmount; // TL
    const currentPriceTL = goldData.buying_price_numeric * usdTryRate;
    const totalCurrentValue = goldAmount * currentPriceTL; // TL
    const totalProfitLoss = totalCurrentValue - totalInvestment; // TL
    const totalProfitLossPercent = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

    // Hedef kar ve potansiyel zarar hesaplama (TL cinsinden)
    const targetPriceTL = investmentParams.targetPrice * usdTryRate;
    const stopLossTL = investmentParams.stopLoss * usdTryRate;
    const targetProfit = (goldAmount * targetPriceTL) - totalInvestment;
    const potentialLoss = totalInvestment - (goldAmount * stopLossTL);

    return {
      totalInvestment,
      totalCurrentValue,
      totalProfitLoss,
      totalProfitLossPercent,
      goldAmount,
      targetProfit,
      potentialLoss,
    };
  };

  const fetchGoldData = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Önce döviz kurlarını al
      const rates = await fetchExchangeRates();
      if (rates) {
        setExchangeRates(rates);
      }

      const apiUrl = "http://192.168.8.8:5000/api/sorgu/emtia/XAUUSD";
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API yanıt hatası: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error("Geçerli altın verisi alınamadı");
      }

      setGoldData(result.data);

      const date = new Date().toLocaleDateString("tr-TR").replace(/\./g, "");
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      setTransactionId(`AU${date}${random}`);
    } catch (err: any) {
      console.error("Altın verisi çekme hatası:", err);
      setError(err.message || "Altın verileri çekilirken bir hata oluştu");
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  };

  const portfolioTotals = calculatePortfolioTotals();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const amountParam = urlParams.get("amount");
    const entryPriceParam = urlParams.get("entryPrice");
    const targetPriceParam = urlParams.get("targetPrice") || "3600";
    const stopLossParam = urlParams.get("stopLoss") || "3400";
    const themeParam = urlParams.get("theme") || "dark";

    if (amountParam && entryPriceParam) {
      try {
        const amount = Number(amountParam); // TL cinsinden
        const entryPrice = Number(entryPriceParam); // USD
        const targetPrice = Number(targetPriceParam); // USD
        const stopLoss = Number(stopLossParam); // USD

        if (isNaN(amount) || amount <= 0) {
          throw new Error("Yatırım miktarı geçerli bir pozitif sayı olmalı.");
        }

        if (isNaN(entryPrice) || entryPrice <= 0) {
          throw new Error("Giriş fiyatı geçerli bir pozitif sayı olmalı.");
        }

        setInvestmentParams({
          investmentAmount: amount, // TL
          entryPrice, // USD
          goldAmount: 0, // Hesaplanacak
          targetPrice, // USD
          stopLoss, // USD
          theme: themeParam,
        });

        fetchGoldData();
      } catch (err: any) {
        console.error("URL parametresi hatası:", err);
        setError(err.message || "URL parametreleri geçersiz");
        setIsLoading(false);
      }
    } else {
      fetchGoldData();
    }
  }, []);

  useEffect(() => {
    const duration = 1500;
    const frames = 60;
    const interval = duration / frames;

    let currentFrame = 0;
    const timer = setInterval(() => {
      currentFrame++;
      const progress = currentFrame / frames;
      const easedProgress = easeOutQuart(progress);

      setAnimatedTotalValue(portfolioTotals.totalProfitLoss * easedProgress);
      setAnimatedTotalPercent(portfolioTotals.totalProfitLossPercent * easedProgress);

      if (currentFrame >= frames) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [goldData, exchangeRates]);

  const isProfit = portfolioTotals.totalProfitLoss >= 0;

  // Generate performance chart data
  const buildPerformanceSeries = () => {
    const n = 10;
    const target = portfolioTotals.totalProfitLossPercent || 0;
    const trendUp = target >= 0;
    const base = trendUp ? Math.max(0, target * 0.1) : Math.min(0, target * 0.1);
    const arr: number[] = [];
    
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const ease = t * t * (3 - 2 * t);
      const noise = (Math.sin(i * 1.3) * (trendUp ? 0.6 : -0.6)) + (Math.random() - 0.5) * 0.3;
      arr.push(base + ease * target + noise);
    }
    
    const minV = Math.min(...arr, 0);
    const maxV = Math.max(...arr, target);
    const scaleY = (v: number) => {
      if (maxV === minV) return 40;
      return 70 - ((v - minV) / (maxV - minV)) * 60;
    };
    
    const xs = Array.from({ length: n }, (_, i) => 10 + (i * (180 / (n - 1))));
    const points = xs.map((x, i) => ({ x, y: scaleY(arr[i]) }));

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const dx = (p1.x - p0.x) / 2;
      const c1x = p0.x + dx;
      const c1y = p0.y;
      const c2x = p1.x - dx;
      const c2y = p1.y;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p1.x} ${p1.y}`;
    }

    return { d, points, minV, maxV };
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#050505] text-white max-w-md mx-auto min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#050505] text-white max-w-md mx-auto min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mx-auto mb-4 text-red-500 text-5xl">⚠️</div>
          <p className="text-red-500 mb-2">Hata Oluştu</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#050505] text-white max-w-md mx-auto min-h-screen" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}>
      
      {/* Profile Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between bg-[rgba(20,20,20,0.95)] backdrop-blur-[25px] border border-[rgba(40,40,40,0.3)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)' }}>
        <div className="flex items-center space-x-3">
          <div>
            <h3 className="text-xl font-bold text-[#F3F4F6]">Altın Yatırım</h3>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search size={18} className="text-[#9CA3AF]" />
          </div>
          <div className="relative">
            <Bell size={18} className="text-[#9CA3AF]" />
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white text-xs animate-pulse shadow-[0_4px_15px_rgba(251,191,36,0.3)]">
              2
            </div>
          </div>
        </div>
      </div>

      {/* Market Status */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-[rgba(251,191,36,0.08)] to-[rgba(251,191,36,0.03)] border border-[rgba(251,191,36,0.2)] rounded-lg px-2 py-1 text-xs font-semibold text-yellow-500 animate-[statusPulse_2s_ease-in-out_infinite]">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse inline-block"></div>
            Pozisyon Açık
          </div>
          <span className="text-xs text-[#9CA3AF]">
            Ons Altın: {exchangeRates ? `${formatCurrency((goldData?.buying_price_numeric || 0) * exchangeRates.USDTRY)} ₺` : 'Yükleniyor...'}
          </span>
        </div>
        <div className="text-right">
          <div className={`text-xs font-semibold ${goldData?.change_direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {goldData?.percent_change_numeric ? `${goldData.percent_change_numeric > 0 ? '+' : ''}${goldData.percent_change_numeric.toFixed(2)}%` : 'N/A'}
          </div>
          <div className="text-xs text-[#6B7280]">USD/TRY: {exchangeRates ? formatCurrency(exchangeRates.USDTRY) : 'Yükleniyor...'}</div>
        </div>
      </div>

      {/* Account Info */}
      <div className="px-6 py-4 flex items-center justify-between bg-[rgba(20,20,20,0.95)] backdrop-blur-[25px] border border-[rgba(40,40,40,0.3)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-[#D1D5DB]">Altın Yatırımı</span>
            <span className="text-xs text-[#6B7280]">{transactionId}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-[#D1D5DB]">Altın Miktarı</p>
          <p className="text-xs text-yellow-500 font-bold flex items-center">
            <Zap size={12} className="mr-1" />
            {portfolioTotals.goldAmount.toFixed(4)} oz
          </p>
        </div>
      </div>

      {/* Portfolio Value */}
      <div className="px-6 py-6 bg-[rgba(20,20,20,0.95)] backdrop-blur-[25px] border border-[rgba(40,40,40,0.3)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-[#9CA3AF]">Toplam yatırım değeri</span>
            <Info size={14} className="text-[#9CA3AF]" />
          </div>
          <Eye size={18} className="text-[#9CA3AF]" />
        </div>
        
        <div className="animate-[valueCount_2.5s_cubic-bezier(0.4,0,0.2,1)]">
          <div className="flex items-end space-x-1 mb-3">
            <h2 className="font-bold text-[#F3F4F6]" style={{ fontSize: 'clamp(26px, 7vw, 48px)' }}>
              {Math.floor(portfolioTotals.totalCurrentValue).toLocaleString("tr-TR")} ₺
            </h2>
            <span className="text-[#9CA3AF]" style={{ fontSize: 'clamp(16px, 4.5vw, 28px)' }}>
              ,{Math.round((portfolioTotals.totalCurrentValue % 1) * 100).toString().padStart(2, '0')}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className={`font-semibold text-xl ${isProfit ? 'text-green-500' : 'text-red-500'} ${isProfit ? 'text-shadow-[0_0_8px_rgba(16,185,129,0.2)]' : 'text-shadow-[0_0_8px_rgba(239,68,68,0.2)]'}`}>
              {isProfit ? '+' : ''}{formatCurrency(Math.abs(portfolioTotals.totalProfitLoss))} ₺
            </span>
            <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center animate-[trendBounce_0.8s_cubic-bezier(0.4,0,0.2,1)] shadow-[0_4px_15px_rgba(16,185,129,0.2)] ${
              isProfit 
                ? 'bg-green-500/20 text-green-500' 
                : 'bg-red-500/20 text-red-500'
            }`}>
              {isProfit ? <ArrowUp size={14} className="mr-1" /> : <ArrowDown size={14} className="mr-1" />}
              {Math.abs(portfolioTotals.totalProfitLossPercent).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 flex justify-between">
        {[
          { icon: Target, label: "Hedef\nBelirle" },
          { icon: TrendingUp, label: "Teknik\nAnaliz" },
          { icon: BarChart2, label: "Raporlar" },
          { icon: Settings, label: "Ayarlar" }
        ].map((action, index) => (
          <div key={index} className="text-center">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] hover:from-[#2A2A2A] hover:to-[#3A3A3A] text-[#E5E5E5] transition-all duration-300 hover:transform hover:translate-y-[-3px] hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(0,0,0,0.7)] border border-[rgba(50,50,50,0.4)] hover:border-[rgba(251,191,36,0.3)] flex items-center justify-center mb-2 cursor-pointer relative overflow-hidden group">
              <action.icon size={20} className="text-[#E5E5E5] relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(251,191,36,0.15)] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-600"></div>
            </div>
            <p className="text-xs text-[#9CA3AF] font-medium leading-tight whitespace-pre-line">
              {action.label}
            </p>
          </div>
        ))}
      </div>

      {/* Toggle Pills */}
      <div className="px-4 sm:px-6 py-4 flex flex-wrap justify-center gap-3">
        <button 
          onClick={() => setActiveTab('position')}
          className={`px-6 py-3 rounded-full text-sm font-semibold flex items-center transition-all duration-300 ${
            activeTab === 'position'
              ? 'bg-gradient-to-br from-yellow-600 to-yellow-700 text-white shadow-[0_4px_20px_rgba(251,191,36,0.3)]'
              : 'bg-[rgba(20,20,20,0.9)] text-[#9CA3AF] border border-[rgba(50,50,50,0.4)] hover:bg-[rgba(30,30,30,0.9)] hover:text-[#E5E5E5] hover:transform hover:translate-y-[-1px] hover:shadow-[0_4px_15px_rgba(0,0,0,0.4)]'
          }`}
        >
          <Wallet size={16} className="mr-2" />
          Pozisyon Detayı
        </button>
        <button 
          onClick={() => setActiveTab('summary')}
          className={`px-6 py-3 rounded-full text-sm font-semibold flex items-center transition-all duration-300 ${
            activeTab === 'summary'
              ? 'bg-gradient-to-br from-yellow-600 to-yellow-700 text-white shadow-[0_4px_20px_rgba(251,191,36,0.3)]'
              : 'bg-[rgba(20,20,20,0.9)] text-[#9CA3AF] border border-[rgba(50,50,50,0.4)] hover:bg-[rgba(30,30,30,0.9)] hover:text-[#E5E5E5] hover:transform hover:translate-y-[-1px] hover:shadow-[0_4px_15px_rgba(0,0,0,0.4)]'
          }`}
        >
          <BarChart2 size={16} className="mr-2" />
          K/Z Analizi
        </button>
      </div>

      {/* Position Details */}
      {activeTab === 'position' && (
        <div className="px-6 py-4 bg-[rgba(20,20,20,0.95)] backdrop-blur-[25px] border border-[rgba(40,40,40,0.3)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="space-y-4">
            {/* Investment Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[rgba(25,25,25,0.8)] rounded-xl p-4 border border-[rgba(50,50,50,0.3)] hover:bg-[rgba(30,30,30,0.8)] transition-all duration-300 group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#9CA3AF]">Yatırım Tutarı</span>
                  <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-all duration-300">
                    <Wallet size={16} className="text-blue-500" />
                  </div>
                </div>
                <p className="text-xl font-bold text-[#F3F4F6]">{formatCurrency(portfolioTotals.totalInvestment)} ₺</p>
              </div>
              
              <div className="bg-[rgba(25,25,25,0.8)] rounded-xl p-4 border border-[rgba(50,50,50,0.3)] hover:bg-[rgba(30,30,30,0.8)] transition-all duration-300 group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#9CA3AF]">Güncel Değer</span>
                  <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-all duration-300">
                    <TrendingUp size={16} className="text-green-500" />
                  </div>
                </div>
                <p className="text-xl font-bold text-[#F3F4F6]">{formatCurrency(portfolioTotals.totalCurrentValue)} ₺</p>
              </div>
            </div>

            {/* Gold Position Info */}
            <div className="bg-[rgba(25,25,25,0.8)] rounded-xl p-4 border border-[rgba(50,50,50,0.3)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#9CA3AF]">Altın Pozisyon Detayları</span>
                <div className="text-yellow-500">🏆</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#D1D5DB]">Altın Miktarı</span>
                  <span className="font-semibold text-yellow-500">{portfolioTotals.goldAmount.toFixed(4)} oz</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#D1D5DB]">Giriş Fiyatı</span>
                  <span className="font-semibold text-[#F3F4F6]">
                    {exchangeRates ? `${formatCurrency(investmentParams.entryPrice * exchangeRates.USDTRY)} ₺` : 'Yükleniyor...'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#D1D5DB]">Güncel Fiyat</span>
                  <span className="font-semibold text-[#F3F4F6]">
                    {exchangeRates && goldData ? `${formatCurrency(goldData.buying_price_numeric * exchangeRates.USDTRY)} ₺` : 'Yükleniyor...'}
                  </span>
                </div>
              </div>
            </div>

{/* Target & Stop Loss */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Target size={16} className="text-green-500" />
                  <span className="text-sm font-semibold text-green-400">Hedef Kar</span>
                </div>
                <div className="text-xs text-[#D1D5DB] mb-1">
                  TP: {exchangeRates ? `${formatCurrency(investmentParams.targetPrice * exchangeRates.USDTRY)} ₺` : 'Yükleniyor...'}
                </div>
                <div className="text-lg font-bold text-green-500">+{formatCurrency(Math.max(0, portfolioTotals.targetProfit))} ₺</div>
              </div>

              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <ArrowDown size={16} className="text-red-500" />
                  <span className="text-sm font-semibold text-red-400">Stop Loss</span>
                </div>
                <div className="text-xs text-[#D1D5DB] mb-1">
                  SL: {exchangeRates ? `${formatCurrency(investmentParams.stopLoss * exchangeRates.USDTRY)} ₺` : 'Yükleniyor...'}
                </div>
                <div className="text-lg font-bold text-red-500">-{formatCurrency(Math.max(0, portfolioTotals.potentialLoss))} ₺</div>
              </div>
            </div>

            {/* Risk Info */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Info size={16} className="text-blue-400" />
                <span className="text-sm font-semibold text-blue-400">Yatırım Bilgisi</span>
              </div>
              <p className="text-xs text-[#D1D5DB] leading-relaxed">
                Bu bir spot altın yatırımıdır. Altın fiyat hareketlerine göre kar/zarar oluşacaktır. 
                Hedef fiyata ulaştığında kar elde edebilir, stop loss seviyesinde zarar kesebilirsiniz.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* K/Z Summary */}
      {activeTab === 'summary' && (
        <div className="px-6 py-4 bg-[rgba(20,20,20,0.95)] backdrop-blur-[25px] border border-[rgba(40,40,40,0.3)] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[rgba(25,25,25,0.8)] rounded-xl p-4 border border-[rgba(50,50,50,0.3)] hover:bg-[rgba(30,30,30,0.8)] transition-all duration-300 group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#9CA3AF]">Başlangıç</span>
                  <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-all duration-300">
                    <TrendingUp size={16} className="text-blue-500" />
                  </div>
                </div>
                <p className="text-xl font-bold text-[#F3F4F6]">{formatCurrency(portfolioTotals.totalInvestment)} ₺</p>
              </div>
              
              <div className="bg-[rgba(25,25,25,0.8)] rounded-xl p-4 border border-[rgba(50,50,50,0.3)] hover:bg-[rgba(30,30,30,0.8)] transition-all duration-300 group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#9CA3AF]">Güncel Değer</span>
                  <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-all duration-300">
                    <BarChart2 size={16} className="text-green-500" />
                  </div>
                </div>
                <p className="text-xl font-bold text-[#F3F4F6]">{formatCurrency(portfolioTotals.totalCurrentValue)} ₺</p>
              </div>
            </div>

            {/* Profit/Loss Summary */}
            <div className="bg-[rgba(25,25,25,0.8)] rounded-xl p-4 border border-[rgba(50,50,50,0.3)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#9CA3AF]">Kâr/Zarar Durumu</span>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isProfit 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  {isProfit ? 'Kâr' : 'Zarar'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#D1D5DB]">Net Kâr/Zarar</span>
                  <span className={`font-semibold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                    {isProfit ? '+' : ''}{formatCurrency(Math.abs(portfolioTotals.totalProfitLoss))} ₺
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#D1D5DB]">Getiri Oranı</span>
                  <span className={`font-semibold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                    {isProfit ? '+' : ''}{Math.abs(portfolioTotals.totalProfitLossPercent).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Target Analysis */}
            <div className="bg-[rgba(25,25,25,0.8)] rounded-xl p-4 border border-[rgba(50,50,50,0.3)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#9CA3AF]">Hedef Analizi</span>
                <Target size={16} className="text-yellow-500" />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#D1D5DB]">Hedefe Kalan (USD)</span>
                  <span className="font-semibold text-yellow-500">
                    ${(investmentParams.targetPrice - (goldData?.buying_price_numeric || 0)).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#D1D5DB]">Hedefe Kalan (₺)</span>
                  <span className="font-semibold text-yellow-500">
                    {exchangeRates ? `${formatCurrency((investmentParams.targetPrice - (goldData?.buying_price_numeric || 0)) * exchangeRates.USDTRY)} ₺` : 'Yükleniyor...'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#D1D5DB]">Potansiyel Kar</span>
                  <span className="font-semibold text-green-500">
                    +{formatCurrency(Math.max(0, portfolioTotals.targetProfit))} ₺
                  </span>
                </div>

                <div className="w-full bg-[rgba(50,50,50,0.3)] rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-green-500 h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.min(100, Math.max(0, ((goldData?.buying_price_numeric || 0) - investmentParams.entryPrice) / (investmentParams.targetPrice - investmentParams.entryPrice) * 100))}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-[#9CA3AF] text-center">
                  Hedefe {Math.min(100, Math.max(0, ((goldData?.buying_price_numeric || 0) - investmentParams.entryPrice) / (investmentParams.targetPrice - investmentParams.entryPrice) * 100)).toFixed(1)}% ulaştı
                </div>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-[rgba(25,25,25,0.8)] rounded-xl p-4 border border-[rgba(50,50,50,0.3)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#9CA3AF]">Performans Eğrisi</span>
                <Activity size={16} className="text-yellow-500" />
              </div>
              
              <div className="h-32 bg-[rgba(20,20,20,0.5)] rounded-lg p-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 animate-pulse"></div>
                
                <svg className="w-full h-full relative z-10" viewBox="0 0 200 80">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(60,60,60,0.3)" strokeWidth="0.5"/>
                    </pattern>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={isProfit ? "#10B981" : "#EF4444"} stopOpacity="0.3"/>
                      <stop offset="100%" stopColor={isProfit ? "#10B981" : "#EF4444"} stopOpacity="0.05"/>
                    </linearGradient>
                  </defs>

                  <rect width="100%" height="100%" fill="url(#grid)" />
                  <path d="M 10 70 L 190 70" stroke="rgba(120,120,120,0.35)" strokeWidth="1" />
                  <path d="M 10 10 L 10 70" stroke="rgba(120,120,120,0.35)" strokeWidth="1" />

                  {(() => { 
                    const { d, points } = buildPerformanceSeries(); 
                    return (
                      <>
                        <path d={d} stroke={isProfit ? "#10B981" : "#EF4444"} strokeWidth="2.8" fill="none" strokeLinecap="round" filter="url(#glow)" />
                        <path d={`${d} L 190 80 L 10 80 Z`} fill="url(#chartGradient)" />
                        {points.map((p, idx) => (
                          <line key={idx} x1={p.x} y1={70} x2={p.x} y2={72} stroke="rgba(120,120,120,0.4)" strokeWidth="0.6" />
                        ))}
                        <circle cx={points[points.length-1].x} cy={points[points.length-1].y} r="2.5" fill={isProfit ? "#10B981" : "#EF4444"} />
                      </>
                    ) 
                  })()}
                </svg>
                
                <div className="absolute top-2 right-2 text-right">
                  <div className={`text-lg font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                    {isProfit ? '+' : ''}{portfolioTotals.totalProfitLossPercent.toFixed(2)}%
                  </div>
                  <div className="text-xs text-[#9CA3AF]">Toplam Getiri</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gold Market Info */}
      <div className="px-4 sm:px-6 py-3 bg-[rgba(20,20,20,0.95)] backdrop-blur-[25px] border border-[rgba(40,40,40,0.3)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-b border-[rgba(50,50,50,0.4)]">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#F3F4F6]">Altın Piyasa Verileri</h3>
          <div className="flex items-center space-x-3">
            <button className="text-xs text-[#9CA3AF] hover:text-[#D1D5DB] transition-colors flex items-center">
              <Activity size={14} className="mr-1" />
              Canlı
            </button>
            <button className="text-xs text-[#9CA3AF] hover:text-[#D1D5DB] transition-colors flex items-center">
              <Download size={14} className="mr-1" />
              İndir
            </button>
          </div>
        </div>
      </div>

      {/* Market Data */}
      <div className="pb-24">
        <div className="flex items-center justify-between gap-3 py-4 px-3 my-1 bg-[rgba(20,20,20,0.95)] cursor-pointer group relative">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-yellow-600/20 to-yellow-700/20 border border-yellow-500/30">
              <div className="text-2xl">🏆</div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 min-w-0">
                <p className="font-bold text-[#F3F4F6] text-base truncate">XAU/USD</p>
                <span className="px-2 py-0.5 bg-gradient-to-br from-[rgba(251,191,36,0.08)] to-[rgba(251,191,36,0.03)] border border-[rgba(251,191,36,0.2)] rounded text-yellow-400 text-xs">
                  SPOT
                </span>
              </div>
              <p className="text-sm text-[#9CA3AF] truncate">Ons Altın / Amerikan Doları</p>
              <p className="text-sm text-[#6B7280]">
                Önceki: {exchangeRates && goldData?.statistics_numeric["Önceki Kapanış"] ? 
                `${formatCurrency(goldData.statistics_numeric["Önceki Kapanış"] * exchangeRates.USDTRY)} ₺` : 'N/A'}
              </p>
            </div>
          </div>
          <div className="text-right ml-auto max-w-[42%] sm:max-w-none leading-tight">
            <p className="font-bold text-[#F3F4F6] font-[700] tracking-[0.5px]" style={{ fontSize: 'clamp(13px, 3.8vw, 18px)' }}>
              {exchangeRates && goldData ? `${formatCurrency(goldData.buying_price_numeric * exchangeRates.USDTRY)} ₺` : 'Yükleniyor...'}
            </p>
            <div className="flex items-center space-x-2 justify-end">
              <span className={`font-medium ${goldData?.change_direction === 'up' ? 'text-green-500' : 'text-red-500'} font-[700] tracking-[0.5px]`} style={{ fontSize: 'clamp(11px, 3.6vw, 16px)' }}>
                {goldData?.percent_change_numeric ? `${goldData.percent_change_numeric >= 0 ? '+' : ''}${goldData.percent_change_numeric.toFixed(2)}%` : 'N/A'}
              </span>
            </div>
            <p className="text-sm text-[#6B7280] mt-1">
              1 oz = {exchangeRates && goldData ? `${formatCurrency(goldData.buying_price_numeric * exchangeRates.USDTRY)} ₺` : 'Yükleniyor...'}
            </p>
          </div>
        </div>

        {/* Market Statistics */}
        {goldData?.statistics_numeric && exchangeRates && (
          <div className="px-6 py-4 bg-[rgba(20,20,20,0.95)] space-y-3">
            <h4 className="text-sm font-semibold text-[#F3F4F6] mb-3">Piyasa İstatistikleri</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[rgba(25,25,25,0.8)] rounded-lg p-3 border border-[rgba(50,50,50,0.3)]">
                <div className="text-xs text-[#9CA3AF] mb-1">Günlük En Düşük</div>
                <div className="font-semibold text-[#F3F4F6]">
                  {formatCurrency((goldData.statistics_numeric["En Düşük"] || 0) * exchangeRates.USDTRY)} ₺
                </div>
              </div>
              
              <div className="bg-[rgba(25,25,25,0.8)] rounded-lg p-3 border border-[rgba(50,50,50,0.3)]">
                <div className="text-xs text-[#9CA3AF] mb-1">Günlük En Yüksek</div>
                <div className="font-semibold text-[#F3F4F6]">
                  {formatCurrency((goldData.statistics_numeric["En Yüksek"] || 0) * exchangeRates.USDTRY)} ₺
                </div>
              </div>
              
              <div className="bg-[rgba(25,25,25,0.8)] rounded-lg p-3 border border-[rgba(50,50,50,0.3)]">
                <div className="text-xs text-[#9CA3AF] mb-1">Haftalık En Düşük</div>
                <div className="font-semibold text-[#F3F4F6]">
                  {formatCurrency((goldData.statistics_numeric["Haftalık En Düşük"] || 0) * exchangeRates.USDTRY)} ₺
                </div>
              </div>
              
              <div className="bg-[rgba(25,25,25,0.8)] rounded-lg p-3 border border-[rgba(50,50,50,0.3)]">
                <div className="text-xs text-[#9CA3AF] mb-1">Haftalık En Yüksek</div>
                <div className="font-semibold text-[#F3F4F6]">
                  {formatCurrency((goldData.statistics_numeric["Haftalık En Yüksek"] || 0) * exchangeRates.USDTRY)} ₺
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-[rgba(50,50,50,0.4)] px-6 py-4 max-w-md mx-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
        <div className="flex justify-between items-center">
          {[
            { icon: Home, label: "Ana Sayfa", active: false },
            { icon: TrendingUp, label: "Piyasa", active: false },
            { icon: Briefcase, label: "Altın", active: true },
            { icon: List, label: "Emirlerim", active: false },
            { icon: Lightbulb, label: "Fikirler", active: false }
          ].map((nav, index) => (
            <div key={index} className="text-center flex flex-col items-center justify-center">
              <nav.icon size={24} className={nav.active ? 'text-yellow-500' : 'text-[#9CA3AF] hover:text-[#E5E5E5] hover:transform hover:translate-y-[-2px] transition-all duration-300'} />
              <span className={`text-xs mt-1 block transition-all duration-300 ${
                nav.active 
                  ? 'text-yellow-500 font-semibold bg-gradient-to-br from-[rgba(251,191,36,0.08)] to-[rgba(251,191,36,0.03)] rounded-xl px-3 py-2' 
                  : 'text-[#9CA3AF] hover:text-[#E5E5E5]'
              }`}>
                {nav.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes avatarGlow {
          from { box-shadow: 0 0 25px rgba(251, 191, 36, 0.3); }
          to { box-shadow: 0 0 40px rgba(251, 191, 36, 0.6); }
        }
        
        @keyframes valueCount {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes trendBounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
          60% { transform: translateY(-4px); }
        }
        
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default GoldInvestmentTracker;