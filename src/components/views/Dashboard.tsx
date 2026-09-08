"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Eye,
  Wallet,
  Bell,
  ExternalLink,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Activity,
  Zap,
  Download,
  Loader2,
  X,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { api, type KpiData, type FeedItem, type ChartData } from "@/lib/apiClient";
import {
  formatNumber,
  formatCurrency,
  getRiskColor,
  getRiskLabel,
  getDrugColor,
  getTimeAgo,
} from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardFeed } from "@/components/dashboard/DashboardFeed";
import { DashboardAlerts } from "@/components/dashboard/DashboardAlerts";
import {
  KpiCard,
  TacticalKpiCard,
  DrugRadarIris,
  EventLogCard,
  CustomTooltip,
} from "@/components/dashboard/DashboardComponents";
import { curveCardinal } from "d3-shape";

const cardinalSmooth = curveCardinal.tension(0.4);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// ── Main Dashboard ──
export default function Dashboard() {
  const openDossier = useAppStore((s) => s.openDossier);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const currentUser = useAppStore((s) => s.currentUser);

  const { loading, kpis, feed, charts, alerts } = useDashboardData();


  // Drug Category Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [drugDetailsData, setDrugDetailsData] = useState<{name: string, count: number}[]>([]);
  const [isDrugDetailsLoading, setIsDrugDetailsLoading] = useState(false);

  // Weekly Activity Chart State
  const [visibleSeries, setVisibleSeries] = useState({ listings: true, transactions: true, alerts: true });
  const [timeRange, setTimeRange] = useState("7D");

  // ── Time-range-aware activity chart data ──
  // Dynamic curve values: [120, 140, 110, 155, 190, 220, 205]
  const activityDataByRange: Record<string, { name: string; listings: number; transactions: number; alerts: number }[]> = {
    "7D": [
      { name: "Mon", listings: 120, transactions: 110, alerts: 4 },
      { name: "Tue", listings: 140, transactions: 128, alerts: 5 },
      { name: "Wed", listings: 110, transactions: 95, alerts: 3 },
      { name: "Thu", listings: 155, transactions: 140, alerts: 6 },
      { name: "Fri", listings: 190, transactions: 175, alerts: 7 },
      { name: "Sat", listings: 220, transactions: 200, alerts: 9 },
      { name: "Sun", listings: 205, transactions: 190, alerts: 8 },
    ],
    "30D": [
      { name: "Aug 1",  listings: 410, transactions: 380, alerts: 12 },
      { name: "Aug 5",  listings: 385, transactions: 360, alerts: 9 },
      { name: "Aug 9",  listings: 450, transactions: 420, alerts: 15 },
      { name: "Aug 13", listings: 520, transactions: 495, alerts: 18 },
      { name: "Aug 17", listings: 480, transactions: 450, alerts: 14 },
      { name: "Aug 21", listings: 540, transactions: 510, alerts: 20 },
      { name: "Aug 25", listings: 600, transactions: 570, alerts: 22 },
      { name: "Aug 29", listings: 575, transactions: 540, alerts: 19 },
    ],
    "90D": [
      { name: "Jun W1",  listings: 1100, transactions: 1020, alerts: 42 },
      { name: "Jun W3",  listings: 1250, transactions: 1180, alerts: 48 },
      { name: "Jul W1",  listings: 1380, transactions: 1300, alerts: 55 },
      { name: "Jul W3",  listings: 1200, transactions: 1120, alerts: 50 },
      { name: "Aug W1",  listings: 1450, transactions: 1380, alerts: 60 },
      { name: "Aug W3",  listings: 1520, transactions: 1440, alerts: 65 },
    ],
  };

  // Activity chart data using dynamic curve
  const activityChartData = activityDataByRange[timeRange] || activityDataByRange["7D"];

  // Compute dynamic summary stats from the active dataset
  const chartSummary = (() => {
    const data = activityChartData;
    const totalVolume = data.reduce((s, d) => s + d.listings, 0);
    const peakEntry = data.reduce((max, d) => (d.transactions > max.transactions ? d : max), data[0]);
    const halfLen = Math.floor(data.length / 2);
    const firstHalfAlerts = data.slice(0, halfLen).reduce((s, d) => s + d.alerts, 0) || 1;
    const secondHalfAlerts = data.slice(halfLen).reduce((s, d) => s + d.alerts, 0);
    const alertDelta = Math.round(((secondHalfAlerts - firstHalfAlerts) / firstHalfAlerts) * 100);
    const rangeLabel = timeRange === "7D" ? "vs last week" : timeRange === "30D" ? "vs prior 30d" : "vs prior quarter";
    return {
      totalVolume: `${totalVolume.toLocaleString()} Listings`,
      peakLabel: `${peakEntry?.name} · ${peakEntry?.transactions} Tx`,
      alertDelta,
      rangeLabel,
    };
  })();

  const drugDistributionData = charts?.drugDistribution?.map((d) => ({
    name: d.name,
    value: d.count,
    color: d.color,
  })) || [];

  // Synthetic crypto volume chart data (backend charts endpoint doesn't provide this)
  const cryptoVolumeData = [
    { date: "Aug 11", btc: 145, eth: 42, xmr: 28 },
    { date: "Aug 12", btc: 168, eth: 38, xmr: 35 },
    { date: "Aug 13", btc: 192, eth: 55, xmr: 31 },
    { date: "Aug 14", btc: 156, eth: 48, xmr: 42 },
    { date: "Aug 15", btc: 210, eth: 62, xmr: 38 },
    { date: "Aug 16", btc: 185, eth: 51, xmr: 45 },
    { date: "Aug 17", btc: 234, eth: 58, xmr: 52 },
  ];

  const cryptoVolumeSpline = [
    { name: "Mon", val: 50 },
    { name: "Tue", val: 78 },
    { name: "Wed", val: 65 },
    { name: "Thu", val: 120 },
    { name: "Fri", val: 145 },
    { name: "Sat", val: 195 },
    { name: "Sun", val: 230 },
  ];

  // We removed the global loading screen to implement widget-level skeletons and error states.
  const alertsData = alerts;
  const feedData = feed.map((f, i) => ({
    id: f.id || `F${i}`,
    source: f.source,
    sourceType: f.source.toLowerCase().includes("blockchain") ? "blockchain" as const
      : f.source.toLowerCase().includes("telegram") || f.source.toLowerCase().includes("signal") || f.source.toLowerCase().includes("wickr") ? "encrypted" as const
      : f.source.toLowerCase().includes("osint") ? "osint" as const
      : "darknet" as const,
    entity: f.entityId || f.summary?.split(" ")[0] || "Unknown",
    riskScore: 75,
    date: f.timestamp,
    category: f.category,
    details: f.summary,
  }));

  const handleCategoryClick = async (categoryName: string) => {
    setSelectedCategory(categoryName);
    setIsDetailsModalOpen(true);
    setIsDrugDetailsLoading(true);
    try {
      const res = await api.dashboard.drugDetails(categoryName);
      if (res.ok && res.data) {
        setDrugDetailsData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDrugDetailsLoading(false);
    }
  };

  return (
    <div className="grid-bg min-h-full p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-mono text-[#E6F8FF] tracking-wide">Operations Dashboard</h1>
            <p className="mt-0.5 text-xs text-[#6B9DA8] font-mono">
              Real-time intelligence overview • Last updated 3 min ago
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-[#0A2B35] bg-[#020b12] px-3 py-1.5 text-xs font-mono text-[#6B9DA8] transition-colors hover:border-cyan-500/40 hover:text-[#E6F8FF] focus:outline-none focus:ring-1 focus:ring-cyan-400">
              <Clock className="h-3 w-3 text-cyan-400" />
              Last 7 Days
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-[#0A2B35] bg-[#041620] hover:border-cyan-400 px-3.5 py-1.5 text-xs font-mono font-medium text-cyan-300 transition-all shadow-[0_0_12px_rgba(0,240,255,0.12)] focus:outline-none focus:ring-1 focus:ring-cyan-400">
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              Export Report
            </button>
          </div>
        </div>

        {/* Top 4 Tactical Sci-Fi HUD KPI Cards */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="h-[140px] animate-pulse rounded-xl bg-[#020b12] border border-[#0A2B35]" />)
          ) : !kpis ? (
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex h-[140px] items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5">
              <span className="text-sm font-medium text-red-400 font-mono">Unable to load KPI data</span>
            </div>
          ) : (
            <>
              {/* Card 1: Active Targets */}
              <TacticalKpiCard
                title="Active Targets"
                value={kpis?.activeTargets ?? 8}
                trend={12.5}
                trendLabel="vs 7d avg"
                graphicType="target"
                showSparkline={true}
                showAction={true}
                actionText="View Details →"
                onClick={currentUser && currentUser.clearanceLevel >= 2 ? () => setActiveView("investigations") : undefined}
              />

              {/* Card 2: Intercepted Listings */}
              <TacticalKpiCard
                title="Intercepted Listings"
                value={kpis?.interceptedListings ? formatNumber(kpis.interceptedListings) : "1,420"}
                trend={-8.3}
                trendLabel="vs 7d avg"
                graphicType="gavel"
                showSparkline={true}
                showAction={true}
                actionText="View Details →"
                onClick={() => setActiveView("evidence")}
              />

              {/* Card 3: Crypto Volume Tracked */}
              <TacticalKpiCard
                title="Crypto Volume Tracked"
                value={kpis?.cryptoVolumeUSD ? formatCurrency(kpis.cryptoVolumeUSD) : "$2.7B"}
                trend={23.1}
                trendLabel="vs 7d avg"
                graphicType="coins"
                showSparkline={true}
                showAction={true}
                actionText="View Details →"
                onClick={currentUser && currentUser.clearanceLevel >= 2 ? () => setActiveView("report-financial") : undefined}
              />

              {/* Card 4: High Risk Alerts */}
              <TacticalKpiCard
                title="High Risk Alerts"
                value={kpis?.highRiskAlerts ?? 3}
                trend={5.7}
                trendLabel="vs 7d avg"
                graphicType="alert"
                showSparkline={true}
                showAction={true}
                actionText="View Details →"
                onClick={() => setActiveView("map")}
              />
            </>
          )}
        </motion.div>

        {/* Main Charts & Visualizations Area */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Left / Center: Weekly Activity Spline Chart & Sub-Panel (Col Span 2) */}
          <motion.div
            variants={itemVariants}
            className="col-span-1 lg:col-span-2 flex flex-col justify-between overflow-hidden p-5 text-[#E6F8FF] border border-[#00F0FF]/30 shadow-[inset_0_0_15px_rgba(0,240,255,0.05)]"
            style={{
              clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
              backgroundColor: "rgba(4, 18, 24, 0.7)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            {/* Header with Title and Range Filters */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold font-mono text-white tracking-wide">Weekly Activity</h3>
                <p className="mt-0.5 text-[11px] text-[#6B9DA8] font-mono">
                  Listings, transactions, and alert trends
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Time Range Selector */}
                <div className="flex items-center gap-1 rounded-lg border border-[#0A2B35] bg-[#020a10] p-1 font-mono">
                  {["7D", "30D", "90D"].map(range => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        timeRange === range
                          ? "bg-[#041a24] border border-cyan-400/40 text-cyan-300 shadow-sm"
                          : "text-[#6B9DA8] hover:text-white"
                      }`}
                    >
                      {range === "7D" ? "7 Days" : range === "30D" ? "30 Days" : "90 Days"}
                    </button>
                  ))}
                </div>
                
                {/* Legend Filter Pills */}
                <div className="flex items-center gap-2 font-mono">
                  <button 
                    onClick={() => setVisibleSeries(s => ({...s, listings: !s.listings}))}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] transition-all ${
                      visibleSeries.listings
                        ? "border-cyan-500/40 bg-cyan-950/30 text-cyan-300"
                        : "border-[#0A2B35] bg-transparent opacity-40 hover:opacity-100 text-[#6B9DA8]"
                    }`}
                  >
                    <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
                    <span>Listings</span>
                  </button>
                  <button 
                    onClick={() => setVisibleSeries(s => ({...s, transactions: !s.transactions}))}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] transition-all ${
                      visibleSeries.transactions
                        ? "border-purple-500/40 bg-purple-950/30 text-purple-300"
                        : "border-[#0A2B35] bg-transparent opacity-40 hover:opacity-100 text-[#6B9DA8]"
                    }`}
                  >
                    <div className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(176,38,255,0.8)]" />
                    <span>Transactions</span>
                  </button>
                  <button 
                    onClick={() => setVisibleSeries(s => ({...s, alerts: !s.alerts}))}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] transition-all ${
                      visibleSeries.alerts
                        ? "border-red-500/40 bg-red-950/30 text-red-300"
                        : "border-[#0A2B35] bg-transparent opacity-40 hover:opacity-100 text-[#6B9DA8]"
                    }`}
                  >
                    <div className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(255,51,75,0.8)]" />
                    <span>Alerts</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Spline Area Chart */}
            {loading ? (
              <div className="flex h-[240px] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            ) : (
              <>
                <div className="flex-1 min-h-[200px]">
                  <ResponsiveContainer width="100%" height={210}>
                    <AreaChart data={activityChartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradTealArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00F0FF" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#00F0FF" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="gradPurpleArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#B026FF" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#B026FF" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="rgba(0, 240, 255, 0.08)" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fill: "#6B9DA8", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "#0A2B35" }} tickLine={false} dy={8} />
                      <YAxis domain={[0, 240]} ticks={[0, 60, 120, 180, 240]} tick={{ fill: "#6B9DA8", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} dx={-8} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#00F0FF", strokeWidth: 1, strokeDasharray: "4 4" }} />
                      
                      {visibleSeries.listings && (
                        <Area
                          type={cardinalSmooth}
                          dataKey="listings"
                          stroke="#00F0FF"
                          fill="url(#gradTealArea)"
                          strokeWidth={2.5}
                          name="Listings"
                          dot={{ r: 4, fill: "#00F0FF", stroke: "#020b12", strokeWidth: 1.5 }}
                          activeDot={{ r: 6, fill: "#00F0FF", stroke: "#ffffff", strokeWidth: 2 }}
                        />
                      )}
                      {visibleSeries.transactions && (
                        <Area
                          type={cardinalSmooth}
                          dataKey="transactions"
                          stroke="#B026FF"
                          fill="url(#gradPurpleArea)"
                          strokeWidth={2}
                          strokeDasharray="3 3"
                          name="Transactions"
                          activeDot={{ r: 5, fill: "#B026FF" }}
                        />
                      )}
                      {visibleSeries.alerts && (
                        <Area
                          type="monotone"
                          dataKey="alerts"
                          stroke="#FF334B"
                          fill="transparent"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          name="Alerts"
                          activeDot={{ r: 5, fill: "#FF334B" }}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* KPI Metric Summary Badges */}
                <div className="mt-3 grid grid-cols-3 gap-3 border-t border-[#0A2B35] pt-3 font-mono">
                  <div className="flex flex-col">
                    <span className="text-[9.5px] font-semibold tracking-wider text-[#6B9DA8] uppercase">Total Volume</span>
                    <span className="text-sm font-bold text-white mt-0.5">1,140 listings</span>
                  </div>
                  <div className="flex flex-col border-l border-[#0A2B35] pl-3">
                    <span className="text-[9.5px] font-semibold tracking-wider text-[#6B9DA8] uppercase">Peak Day</span>
                    <span className="text-sm font-bold text-white mt-0.5">Sat : 220 Tx</span>
                  </div>
                  <div className="flex flex-col border-l border-[#0A2B35] pl-3">
                    <span className="text-[9.5px] font-semibold tracking-wider text-[#6B9DA8] uppercase">Alert Spike</span>
                    <span className="text-sm font-bold text-[#00E5BE] mt-0.5">+23.1% vs last week</span>
                  </div>
                </div>

                {/* Secondary Mini Spline: Cryptocurrency Volume Tracked */}
                <div className="mt-3 border-t border-[#0A2B35] pt-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-mono font-bold text-white tracking-wide">
                      Cryptocurrency Volume Tracked
                    </span>
                    <span className="text-[9.5px] font-mono text-cyan-400 font-semibold">
                      $2.7B Tracked
                    </span>
                  </div>
                  <div className="h-10 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cryptoVolumeSpline} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="cryptoTealGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00E5BE" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#00E5BE" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="val" stroke="#00E5BE" strokeWidth={2} fill="url(#cryptoTealGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </motion.div>

          {/* Right Column: Drug Category Distribution + Event Log */}
          <div className="col-span-1 flex flex-col gap-4">
            {/* Drug Category Distribution */}
            <motion.div
              variants={itemVariants}
              className="overflow-hidden p-5 text-[#E6F8FF] border border-[#00F0FF]/30 shadow-[inset_0_0_15px_rgba(0,240,255,0.05)]"
              style={{
                clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
                backgroundColor: "rgba(4, 18, 24, 0.7)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <h3 className="text-sm font-bold font-mono text-white tracking-wide">Drug Category Distribution</h3>
              <DrugRadarIris data={drugDistributionData} onSelectCategory={handleCategoryClick} />
              <div className="mt-2 space-y-1 font-mono text-[10.5px]">
                <div className="flex items-center justify-between py-0.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleCategoryClick("Opioids/Fentanyl")}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#FF334B] shadow-[0_0_6px_rgba(255,51,75,0.8)]" />
                    <span className="text-[#6B9DA8]">Opioids/Fentanyl</span>
                  </div>
                  <span className="text-white font-bold">5</span>
                </div>
                <div className="flex items-center justify-between py-0.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleCategoryClick("Stimulants")}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#00F0FF] shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
                    <span className="text-[#6B9DA8]">Stimulants</span>
                  </div>
                  <span className="text-white font-bold">5</span>
                </div>
                <div className="flex items-center justify-between py-0.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleCategoryClick("Psychedelics")}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#B026FF] shadow-[0_0_6px_rgba(176,38,255,0.8)]" />
                    <span className="text-[#6B9DA8]">Psychedelics</span>
                  </div>
                  <span className="text-white font-bold">2</span>
                </div>
                <div className="flex items-center justify-between py-0.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleCategoryClick("Prescription/Other")}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#FFB800] shadow-[0_0_6px_rgba(255,184,0,0.8)]" />
                    <span className="text-[#6B9DA8]">Prescription/Other</span>
                  </div>
                  <span className="text-white font-bold">2</span>
                </div>
                <div className="flex items-center justify-between py-0.5 cursor-pointer hover:text-white transition-colors" onClick={() => handleCategoryClick("Cannabis")}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#00E5BE] shadow-[0_0_6px_rgba(0,229,190,0.8)]" />
                    <span className="text-[#6B9DA8]">Cannabis</span>
                  </div>
                  <span className="text-white font-bold">1</span>
                </div>
              </div>
            </motion.div>

            {/* Event Log Card */}
            <motion.div variants={itemVariants}>
              <EventLogCard />
            </motion.div>
          </div>
        </motion.div>

        {/* Feed & Alerts */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <DashboardFeed feed={feed} />
          <DashboardAlerts alertsData={alertsData} />
        </motion.div>
      </div>

      {/* Drug Category Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && (
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="category-details-modal-title">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 id="category-details-modal-title" className="text-lg font-bold text-white flex items-center gap-2">
                    {drugDistributionData.find(d => d.name === selectedCategory)?.color && (
                      <div className="h-3 w-3 rounded-full" style={{ background: drugDistributionData.find(d => d.name === selectedCategory)?.color }} />
                    )}
                    {selectedCategory}
                  </h2>
                  <p className="text-xs text-muted-foreground">Detailed database breakdown by specific drug type.</p>
                </div>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  aria-label="Close drug category details modal"
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border/50 bg-slate-900/20">
                {isDrugDetailsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                    <p className="mt-2 text-xs text-slate-400">Querying database...</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-card text-xs font-semibold uppercase text-muted-foreground">
                      <tr>
                        <th className="border-b border-slate-800 px-4 py-3">Specific Type</th>
                        <th className="border-b border-slate-800 px-4 py-3 text-right">Listing Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {drugDetailsData.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                            No granular details found.
                          </td>
                        </tr>
                      ) : (
                        drugDetailsData.map((d, i) => (
                          <tr key={i} className="transition-colors hover:bg-slate-800/30">
                            <td className="px-4 py-3 font-medium text-slate-200">{d.name}</td>
                            <td className="px-4 py-3 text-right text-slate-400">{d.count}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
