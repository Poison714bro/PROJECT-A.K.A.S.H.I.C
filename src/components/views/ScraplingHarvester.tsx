"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  Zap,
  Shield,
  Search,
  Download,
  Terminal,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Plus,
  Trash2,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  GitBranch,
  Eye,
  Sliders,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/apiClient";

interface ScrapedItem {
  title: string;
  price?: string;
  price_value?: number | null;
  currency?: string;
  availability?: string;
  in_stock?: boolean | null;
  description?: string;
  url?: string;
  attributes?: Record<string, any>;
}

interface ThreatEntities {
  btc_wallets?: string[];
  onion_links?: string[];
  pgp_keys?: string[];
  vendor_handles?: string[];
  keywords_detected?: string[];
  emails?: string[];
}

interface HarvestResult {
  success: boolean;
  url: string;
  status_code: number;
  fetcher_type: string;
  engine: string;
  title: string;
  text: string;
  items: ScrapedItem[];
  links: string[];
  execution_time_ms: number;
  threat_entities?: ThreatEntities;
  error?: string | null;
}

const PRESETS = [
  {
    id: "quotes",
    label: "Quotes Live Demo",
    url: "https://quotes.toscrape.com/",
    fetcher: "static" as const,
    item_selector: ".quote",
    fields: [
      { key: "title", selector: "span.text" },
      { key: "description", selector: "small.author" },
      { key: "url", selector: "a::attr(href)" },
    ],
  },
  {
    id: "ecommerce",
    label: "E-Commerce Catalog",
    url: "https://books.toscrape.com/",
    fetcher: "static" as const,
    item_selector: ".product_pod",
    fields: [
      { key: "title", selector: "h3 a" },
      { key: "price", selector: ".price_color" },
      { key: "availability", selector: ".availability" },
      { key: "url", selector: "h3 a::attr(href)" },
    ],
  },
  {
    id: "market-intel",
    label: "Market Intel / Supplies",
    url: "https://market.cyber-intel.org/supplies",
    fetcher: "stealthy" as const,
    item_selector: ".listing-item",
    fields: [
      { key: "title", selector: ".item-title" },
      { key: "price", selector: ".item-price" },
      { key: "availability", selector: ".stock-state" },
      { key: "vendor", selector: ".vendor-alias" },
    ],
  },
];

export default function ScraplingHarvester() {
  const [url, setUrl] = useState("https://quotes.toscrape.com/");
  const [fetcherType, setFetcherType] = useState<"static" | "dynamic" | "stealthy">("static");
  const [mode, setMode] = useState<"structured" | "raw">("structured");
  const [itemSelector, setItemSelector] = useState(".quote");
  const [fieldMappings, setFieldMappings] = useState<{ key: string; selector: string }[]>([
    { key: "title", selector: "span.text" },
    { key: "description", selector: "small.author" },
    { key: "url", selector: "a::attr(href)" },
  ]);

  const [timeoutSec, setTimeoutSec] = useState(25);
  const [allowPrivateIps, setAllowPrivateIps] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [injectedToGraph, setInjectedToGraph] = useState(false);

  // Execution state
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<HarvestResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  const steps = [
    "SSRF Guard Policy Check",
    `Initializing Scrapling Engine (${fetcherType.toUpperCase()})`,
    "Executing TLS Handshake & Request",
    "Adaptive DOM & Selector Parsing",
    "Pydantic Validation & Entity Correlation",
  ];

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setUrl(preset.url);
    setFetcherType(preset.fetcher);
    setItemSelector(preset.item_selector);
    setFieldMappings(preset.fields);
  };

  const handleAddField = () => {
    setFieldMappings([...fieldMappings, { key: `field_${fieldMappings.length + 1}`, selector: "" }]);
  };

  const handleRemoveField = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, field: "key" | "selector", val: string) => {
    const updated = [...fieldMappings];
    updated[index][field] = val;
    setFieldMappings(updated);
  };

  const handleExecuteHarvest = async () => {
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setCurrentStep(0);
    setInjectedToGraph(false);

    // Step animation simulator
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 450);

    try {
      const field_selectors: Record<string, string> = {};
      if (mode === "structured") {
        fieldMappings.forEach((m) => {
          if (m.key.trim() && m.selector.trim()) {
            field_selectors[m.key.trim()] = m.selector.trim();
          }
        });
      }

      const res = await api.scraper.harvest({
        url: url.trim(),
        fetcher_type: fetcherType,
        item_selector: mode === "structured" ? itemSelector.trim() : undefined,
        field_selectors: mode === "structured" ? field_selectors : undefined,
        timeout: timeoutSec,
        allow_private_ips: allowPrivateIps,
      });

      clearInterval(stepInterval);
      setCurrentStep(steps.length);

      if (res.ok && res.data) {
        setResult(res.data);
      } else {
        setErrorMsg(res.error || "Failed to execute harvest request.");
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setErrorMsg(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleInjectToGraph = async () => {
    if (!result) return;
    try {
      const itemsSummary = (result.items || [])
        .map((it) => `Item: ${it.title} | Price: ${it.price || "N/A"} | URL: ${it.url || result.url}`)
        .join("\n");
      const combinedText = `Harvested from ${result.url} via Scrapling (${result.engine}):\n${result.title}\n${itemsSummary}\n${result.text.slice(0, 2000)}`;

      await api.ingest.pipeline(combinedText, `Scrapling [${result.engine}] - ${new URL(result.url).hostname}`);
      setInjectedToGraph(true);
      setTimeout(() => setInjectedToGraph(false), 4000);
    } catch (err) {
      console.warn("Failed to inject to graph pipeline:", err);
    }
  };

  const handleDownloadJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = `scrapling_harvest_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(u);
  };

  const generatedPythonCode = `from semantica.ingest import ScraplingFetcher, ScrapedItem

# 1. Initialize Scrapling Fetcher Engine
fetcher = ScraplingFetcher(
    fetcher_type="${fetcherType}",
    timeout=${timeoutSec},
    allow_private_ips=${allowPrivateIps ? "True" : "False"}
)

# 2. Execute Structured Scrape
items = fetcher.scrape_items(
    urls="${url}",
    item_selector="${itemSelector}",
    field_selectors={
${fieldMappings.map((m) => `        "${m.key}": "${m.selector}",`).join("\n")}
    }
)

for item in items:
    print(item.title, item.price_value, item.currency, item.in_stock, item.url)
`;

  const filteredItems = (result?.items || []).filter((it) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      it.title.toLowerCase().includes(q) ||
      (it.price && it.price.toLowerCase().includes(q)) ||
      (it.description && it.description.toLowerCase().includes(q)) ||
      (it.url && it.url.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col h-full bg-[#05080C] text-[#E6F8FF] font-mono p-4 space-y-4 overflow-y-auto custom-scrollbar">
      {/* ── Top Tactical Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[rgba(0,229,255,0.15)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] animate-pulse" />
            <span className="text-[10px] tracking-widest text-[#00E5FF] uppercase font-bold">
              INTELLIGENCE INGESTION // SCRAPLING HARVESTER
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#E6F8FF] flex items-center gap-2 mt-0.5">
            <Globe className="h-5 w-5 text-[#00E5FF]" />
            Scrapling Web Harvester
          </h1>
        </div>

        {/* Engine Status Badges */}
        <div className="flex items-center gap-2 flex-wrap text-[10px]">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0A141D] border border-[rgba(0,229,255,0.3)] text-[#00E5FF]">
            <Zap className="h-3 w-3 text-[#00E5FF]" />
            HTTP/3 STATIC
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0A141D] border border-[rgba(176,38,255,0.3)] text-[#B026FF]">
            <Cpu className="h-3 w-3 text-[#B026FF]" />
            HEADLESS DYNAMIC
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0A141D] border border-[rgba(0,230,118,0.3)] text-[#00E676]">
            <Shield className="h-3 w-3 text-[#00E676]" />
            STEALTHY BYPASS
          </span>
        </div>
      </div>

      {/* ── Main Input & Config Panel ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Control Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded border border-[rgba(0,229,255,0.2)] bg-[#090E14] shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-3">
            {/* Target URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#6B9DA8] flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-[#00E5FF]" />
                  Target URL
                </label>
                <span className="text-[10px] text-[#6B9DA8]">SSRF Guard Enforced</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://target-domain.com/catalog"
                  className="w-full bg-[#05080C] border border-[rgba(0,229,255,0.25)] rounded px-3 py-2 text-xs text-[#E6F8FF] placeholder-[#475569] focus:outline-none focus:border-[#00E5FF] focus:shadow-[0_0_10px_rgba(0,229,255,0.2)] font-mono"
                />
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[10px] uppercase tracking-wider text-[#6B9DA8]/70">Presets:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleApplyPreset(p)}
                  className="px-2 py-0.5 rounded text-[10px] bg-[#111C24] border border-[rgba(0,229,255,0.15)] text-[#6B9DA8] hover:text-[#00E5FF] hover:border-[#00E5FF] transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Engine Selection Segmented Control */}
            <div className="pt-2 border-t border-[rgba(0,229,255,0.1)]">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B9DA8] block mb-2">
                Scrapling Engine Architecture
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "static", title: "Static HTTP/3", subtitle: "curl_cffi Fast", color: "#00E5FF" },
                  { id: "dynamic", title: "Dynamic JS", subtitle: "Playwright Headless", color: "#B026FF" },
                  { id: "stealthy", title: "Stealthy Bypass", subtitle: "Anti-Bot Evasion", color: "#00E676" },
                ].map((eng) => {
                  const isSelected = fetcherType === eng.id;
                  return (
                    <button
                      key={eng.id}
                      onClick={() => setFetcherType(eng.id as any)}
                      className={`p-2.5 rounded text-left transition-all border ${
                        isSelected
                          ? "bg-[#111C24] shadow-[0_0_12px_rgba(0,229,255,0.15)]"
                          : "bg-[#05080C] hover:bg-[#0B1218] opacity-75 hover:opacity-100"
                      }`}
                      style={{
                        borderColor: isSelected ? eng.color : "rgba(0,229,255,0.15)",
                      }}
                    >
                      <div className="text-[11px] font-bold" style={{ color: isSelected ? eng.color : "#E6F8FF" }}>
                        {eng.title}
                      </div>
                      <div className="text-[9px] text-[#6B9DA8]">{eng.subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="pt-2 border-t border-[rgba(0,229,255,0.1)] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B9DA8]">Extraction Mode</span>
              <div className="flex bg-[#05080C] p-0.5 rounded border border-[rgba(0,229,255,0.15)]">
                <button
                  onClick={() => setMode("structured")}
                  className={`px-3 py-1 rounded text-[10.5px] transition-all ${
                    mode === "structured" ? "bg-[#00E5FF] text-[#05080C] font-bold" : "text-[#6B9DA8] hover:text-[#E6F8FF]"
                  }`}
                >
                  Structured Selectors
                </button>
                <button
                  onClick={() => setMode("raw")}
                  className={`px-3 py-1 rounded text-[10.5px] transition-all ${
                    mode === "raw" ? "bg-[#00E5FF] text-[#05080C] font-bold" : "text-[#6B9DA8] hover:text-[#E6F8FF]"
                  }`}
                >
                  Raw Page Ingest
                </button>
              </div>
            </div>

            {/* Adaptive Selectors Builder (Shown in structured mode) */}
            {mode === "structured" && (
              <div className="space-y-2 pt-2 border-t border-[rgba(0,229,255,0.1)]">
                <div>
                  <label className="text-[11px] text-[#6B9DA8] block mb-1">
                    Container Selector <span className="text-[#00E5FF]">(CSS or XPath)</span>
                  </label>
                  <input
                    type="text"
                    value={itemSelector}
                    onChange={(e) => setItemSelector(e.target.value)}
                    placeholder=".product_pod or //div[@class='item']"
                    className="w-full bg-[#05080C] border border-[rgba(0,229,255,0.2)] rounded px-2.5 py-1.5 text-xs text-[#E6F8FF] focus:outline-none focus:border-[#00E5FF]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] text-[#6B9DA8]">Field Mappings</label>
                    <button
                      onClick={handleAddField}
                      className="text-[10px] text-[#00E5FF] hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Field
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {fieldMappings.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={m.key}
                          onChange={(e) => handleFieldChange(idx, "key", e.target.value)}
                          placeholder="field"
                          className="w-1/3 bg-[#05080C] border border-[rgba(0,229,255,0.15)] rounded px-2 py-1 text-[11px] text-[#00E5FF] focus:outline-none focus:border-[#00E5FF]"
                        />
                        <input
                          type="text"
                          value={m.selector}
                          onChange={(e) => handleFieldChange(idx, "selector", e.target.value)}
                          placeholder="CSS / XPath selector"
                          className="flex-1 bg-[#05080C] border border-[rgba(0,229,255,0.15)] rounded px-2 py-1 text-[11px] text-[#E6F8FF] focus:outline-none focus:border-[#00E5FF]"
                        />
                        <button
                          onClick={() => handleRemoveField(idx)}
                          className="p-1 text-[#6B9DA8] hover:text-red-400 transition-colors"
                          title="Remove Field"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Toggle */}
            <div className="pt-2 border-t border-[rgba(0,229,255,0.1)]">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[10px] text-[#6B9DA8] hover:text-[#00E5FF] flex items-center gap-1 transition-colors"
              >
                <Sliders className="h-3 w-3" />
                {showAdvanced ? "Hide Advanced Guardrails" : "Show Advanced Guardrails"}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] text-[#6B9DA8] block mb-1">Timeout (seconds)</label>
                    <input
                      type="number"
                      value={timeoutSec}
                      onChange={(e) => setTimeoutSec(Number(e.target.value))}
                      className="w-full bg-[#05080C] border border-[rgba(0,229,255,0.15)] rounded px-2 py-1 text-xs text-[#E6F8FF]"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer pb-1">
                      <input
                        type="checkbox"
                        checked={allowPrivateIps}
                        onChange={(e) => setAllowPrivateIps(e.target.checked)}
                        className="rounded border-[rgba(0,229,255,0.3)] text-[#00E5FF] focus:ring-0"
                      />
                      <span className="text-[10px] text-[#6B9DA8]">Allow Internal Loopback</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Execute Button */}
            <div className="pt-3 border-t border-[rgba(0,229,255,0.15)] flex items-center gap-3">
              <button
                onClick={handleExecuteHarvest}
                disabled={loading || !url.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-[#00E5FF] hover:bg-[#00B4D8] text-[#05080C] font-bold text-xs py-2.5 rounded transition-all duration-200 disabled:opacity-50 shadow-[0_0_15px_rgba(0,229,255,0.3)] cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    HARVESTING WITH SCRAPLING...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    EXECUTE LIVE HARVEST
                  </>
                )}
              </button>

              <button
                onClick={() => setShowCodeModal(true)}
                className="px-3 py-2.5 rounded border border-[rgba(0,229,255,0.25)] bg-[#111C24] text-[#6B9DA8] hover:text-[#00E5FF] hover:border-[#00E5FF] transition-all"
                title="View Python Code"
              >
                <Code2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Telemetry & Execution Pipeline Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Progress Tracker Card */}
          <div className="p-4 rounded border border-[rgba(0,229,255,0.2)] bg-[#090E14] space-y-3">
            <div className="flex items-center justify-between border-b border-[rgba(0,229,255,0.1)] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B9DA8] flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-[#00E5FF]" />
                Harvest Pipeline Execution
              </span>
              {loading && <span className="text-[10px] text-[#00E5FF] animate-pulse">RUNNING</span>}
            </div>

            <div className="space-y-2 py-1">
              {steps.map((st, i) => {
                const isPassed = !loading && result ? true : currentStep > i;
                const isCurrent = loading && currentStep === i;
                return (
                  <div key={i} className="flex items-center gap-2.5 text-xs">
                    <span
                      className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] shrink-0 ${
                        isPassed
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : isCurrent
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse"
                          : "bg-gray-800 text-gray-500 border border-gray-700"
                      }`}
                    >
                      {isPassed ? <Check className="h-2.5 w-2.5" /> : i + 1}
                    </span>
                    <span className={isPassed ? "text-emerald-300" : isCurrent ? "text-cyan-300 font-bold" : "text-[#6B9DA8]/60"}>
                      {st}
                    </span>
                  </div>
                );
              })}
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="overflow-hidden">
                  <div className="font-bold">Execution Failed</div>
                  <div className="text-[11px] opacity-90 truncate">{errorMsg}</div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics if Harvested */}
          {result && (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded bg-[#090E14] border border-[rgba(0,229,255,0.15)]">
                <div className="text-[10px] text-[#6B9DA8] uppercase">Items Extracted</div>
                <div className="text-xl font-bold text-[#00E5FF] mt-0.5">{result.items.length}</div>
              </div>
              <div className="p-3 rounded bg-[#090E14] border border-[rgba(0,229,255,0.15)]">
                <div className="text-[10px] text-[#6B9DA8] uppercase">Execution Latency</div>
                <div className="text-xl font-bold text-[#00E676] mt-0.5">{result.execution_time_ms} ms</div>
              </div>
              <div className="p-3 rounded bg-[#090E14] border border-[rgba(0,229,255,0.15)]">
                <div className="text-[10px] text-[#6B9DA8] uppercase">Status Code</div>
                <div className="text-xl font-bold text-[#E6F8FF] mt-0.5">{result.status_code || 200} OK</div>
              </div>
              <div className="p-3 rounded bg-[#090E14] border border-[rgba(0,229,255,0.15)]">
                <div className="text-[10px] text-[#6B9DA8] uppercase">Engine Used</div>
                <div className="text-xs font-bold text-[#B026FF] mt-1.5 truncate">{result.engine}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Extracted Results & Threat Telemetry Data Grid ─────────────── */}
      {result && (
        <div className="p-4 rounded border border-[rgba(0,229,255,0.2)] bg-[#090E14] space-y-4">
          {/* Results Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[rgba(0,229,255,0.1)] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00E5FF]">Extracted Records</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#111C24] text-[#6B9DA8] border border-[rgba(0,229,255,0.2)]">
                {filteredItems.length} records
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search filter */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-[#6B9DA8]" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter extracted items..."
                  className="bg-[#05080C] border border-[rgba(0,229,255,0.2)] rounded pl-8 pr-3 py-1 text-xs text-[#E6F8FF] focus:outline-none focus:border-[#00E5FF] w-48 font-mono"
                />
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleInjectToGraph}
                className="px-2.5 py-1 rounded bg-[#111C24] border border-[rgba(0,229,255,0.3)] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#05080C] transition-all text-xs flex items-center gap-1 font-bold"
              >
                <GitBranch className="h-3 w-3" />
                {injectedToGraph ? "INJECTED TO GRAPH!" : "Send to Evidence Graph"}
              </button>

              <button
                onClick={handleDownloadJSON}
                className="px-2.5 py-1 rounded bg-[#111C24] border border-[rgba(0,229,255,0.2)] text-[#6B9DA8] hover:text-[#00E5FF] transition-all text-xs flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Export JSON
              </button>
            </div>
          </div>

          {/* Intelligence / Cybercrime Entities Banner if found */}
          {result.threat_entities &&
            Object.values(result.threat_entities).some((arr) => Array.isArray(arr) && arr.length > 0) && (
              <div className="p-3 rounded bg-[#0D151D] border border-[rgba(176,38,255,0.3)] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#B026FF] flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Detected Intelligence Indicators
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {result.threat_entities.btc_wallets?.map((w, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-[#16232D] text-amber-300 border border-amber-500/30 text-[10px]">
                      WAL: {w.slice(0, 10)}...{w.slice(-4)}
                    </span>
                  ))}
                  {result.threat_entities.vendor_handles?.map((v, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-[#16232D] text-cyan-300 border border-cyan-500/30 text-[10px]">
                      HANDLE: {v}
                    </span>
                  ))}
                  {result.threat_entities.keywords_detected?.map((d, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-[#16232D] text-red-300 border border-red-500/30 text-[10px]">
                      TAG: {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Records Table */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-[#6B9DA8] text-xs">
              No items matching filter. Raw text length: {result.text.length} characters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(0,229,255,0.15)] text-[#6B9DA8] text-[10px] uppercase tracking-wider">
                    <th className="py-2 px-3">Title / Item</th>
                    <th className="py-2 px-3">Price / Value</th>
                    <th className="py-2 px-3">Availability</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3">Source URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(0,229,255,0.08)]">
                  {filteredItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#0D151D] transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#E6F8FF] max-w-xs truncate">
                        {item.title || "Untitled"}
                      </td>
                      <td className="py-2.5 px-3">
                        {item.price ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 text-[11px] font-bold">
                            {item.price}
                          </span>
                        ) : (
                          <span className="text-[#6B9DA8]/40">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {item.in_stock === true ? (
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 text-[10px]">
                            In Stock
                          </span>
                        ) : item.in_stock === false ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/25 text-[10px]">
                            Out of Stock
                          </span>
                        ) : (
                          <span className="text-[#6B9DA8] text-[11px]">{item.availability || "Unknown"}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#6B9DA8] max-w-sm truncate text-[11px]">
                        {item.description || "No snippet extracted"}
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#00E5FF] hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Link
                          </a>
                        ) : (
                          <span className="text-[#6B9DA8]/40">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Python Reproducibility Code Modal ──────────────────────────── */}
      <AnimatePresence>
        {showCodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#090E14] border border-[rgba(0,229,255,0.3)] rounded-lg p-5 max-w-2xl w-full space-y-4 shadow-[0_0_30px_rgba(0,229,255,0.2)]"
            >
              <div className="flex items-center justify-between border-b border-[rgba(0,229,255,0.15)] pb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-[#00E5FF]" />
                  <span className="font-bold text-sm text-[#E6F8FF]">Reproducible Semantica + Scrapling Python Snippet</span>
                </div>
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="text-[#6B9DA8] hover:text-[#E6F8FF] text-xs px-2 py-1"
                >
                  ✕
                </button>
              </div>

              <div className="relative">
                <pre className="p-3.5 rounded bg-[#05080C] border border-[rgba(0,229,255,0.15)] text-[11px] text-cyan-200 overflow-x-auto max-h-80 custom-scrollbar">
                  {generatedPythonCode}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPythonCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-[#111C24] border border-[rgba(0,229,255,0.3)] text-xs text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#05080C] transition-all flex items-center gap-1 font-bold"
                >
                  {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedCode ? "COPIED" : "COPY CODE"}
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="px-4 py-1.5 rounded bg-[#111C24] border border-[rgba(0,229,255,0.2)] text-xs text-[#6B9DA8] hover:text-[#E6F8FF]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
