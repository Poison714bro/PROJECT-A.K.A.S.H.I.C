"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  Bell,
  User,
  ChevronDown,
  X,
  Filter,
  Clock,
  AlertTriangle,
  Wifi,
  MapPin,
  GitBranch,
  FolderOpen,
  Menu,
  Shield,
} from "lucide-react";
import { alertsData, mapPinsData, graphNodesData, kanbanData } from "@/lib/mockData";
import { getTimeAgo } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

// Build searchable items once
interface SearchResult {
  id: string;
  label: string;
  type: "pin" | "node" | "case";
  category: string;
  icon: React.ElementType;
  view: "map" | "evidence" | "investigations";
}

function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [];
  for (const pin of mapPinsData) {
    results.push({ id: pin.id, label: pin.label, type: "pin", category: pin.drugCategory, icon: MapPin, view: "map" });
  }
  for (const node of graphNodesData) {
    results.push({ id: node.id, label: node.label, type: "node", category: node.type, icon: GitBranch, view: "evidence" });
  }
  for (const col of kanbanData) {
    for (const card of col.cards) {
      results.push({ id: card.id, label: card.title, type: "case", category: card.priority, icon: FolderOpen, view: "investigations" });
    }
  }
  return results;
}

const searchIndex = buildSearchIndex();

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notificationsList, setNotificationsList] = useState(alertsData);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const navigateToEntity = useAppStore((s) => s.navigateToEntity);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const currentUser = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);
  const demoTimeoutActive = useAppStore((s) => s.demoTimeoutActive);
  const setDemoTimeoutActive = useAppStore((s) => s.setDemoTimeoutActive);
  const setInactivityLoggedOut = useAppStore((s) => s.setInactivityLoggedOut);
  const updateUserClearance = useAppStore((s) => s.updateUserClearance);

  const markAllAsRead = () => {
    setNotificationsList((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
  };

  const userInitials = (currentUser?.username || "Agent Torres")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AT";
  const displayName = currentUser?.username || "Agent Torres";
  const displayRole = currentUser?.role ? `${currentUser.role} (Clearance L${currentUser.clearanceLevel || 1})` : "Cyber Division Lead";

  const unreadAlerts = notificationsList.filter((a) => !a.acknowledged).length;

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const userClearance = currentUser?.clearanceLevel || 1;
    return searchIndex.filter((item) => {
      const requiredClearance = item.view === "map" || item.view === "evidence" || item.view === "investigations" ? 2 : 1;
      if (userClearance < requiredClearance) return false;
      return item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
    }).slice(0, 8);
  }, [searchQuery, currentUser?.clearanceLevel]);

  // Search history is now memory-only to comply with zero-trust storage policies

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const timeoutDuration = demoTimeoutActive ? 15000 : 600000; // 15s vs 10m

  // Auto-Logout for Inactivity
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log(`User inactive for ${timeoutDuration}ms. Logging out.`);
        setInactivityLoggedOut(true);
        logout();
      }, timeoutDuration);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(event => document.addEventListener(event, resetTimer));
    
    // Initialize timer
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [logout, timeoutDuration]);

  const saveSearchHistory = (newHistory: string[]) => {
    setSearchHistory(newHistory);
  };

  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;
    
    // Add to history
    const uniqueHistory = [query, ...searchHistory.filter(q => q !== query)].slice(0, 5);
    saveSearchHistory(uniqueHistory);
    
    // Removed console.log to prevent logging potentially sensitive search queries (like PGP keys)
    setSearchFocused(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
    searchInputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchSubmit(searchQuery);
    }
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveSearchHistory([]);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "pin") {
      navigateToEntity(result.id, "pin", "map");
    } else if (result.type === "node") {
      navigateToEntity(result.id, "node", "evidence");
    } else {
      setActiveView("investigations");
    }
    onSearchChange("");
    setSearchFocused(false);
  };

  return (
    <header className="z-header flex h-16 shrink-0 items-center justify-between border-b border-border bg-[var(--header-bg)] px-4 md:px-6 backdrop-blur-md relative">
      <div className="flex flex-1 items-center gap-3">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 -ml-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-lg"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {/* Advanced Search */}
        <div className="relative max-w-lg flex-1" ref={searchRef}>
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-all duration-200 ${
              searchFocused
                ? "border-primary/50 bg-slate-900/80 shadow-lg shadow-cyan-500/5"
                : "border-border bg-slate-900/20 opacity-70 hover:opacity-100 hover:bg-slate-900/40"
            }`}
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search wallets, aliases, locations, case IDs..."
              aria-label="Search intelligence entities and cases"
              className="w-full bg-transparent text-sm text-foreground placeholder-slate-600 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                aria-label="Clear search query"
                className="text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1 border-l border-border pl-2">
              <kbd className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-700">
                Ctrl+K
              </kbd>
            </div>
          </div>

          {/* Search Results / History Dropdown */}
          {searchFocused && (searchQuery.length >= 2 ? searchResults.length > 0 : searchHistory.length > 0) && (
            <div className="search-results-dropdown absolute left-0 right-0 top-12 z-dropdown overflow-hidden rounded-xl border border-border bg-[var(--card)] shadow-2xl shadow-black/50">
              {searchQuery.length >= 2 && searchResults.length > 0 && (
                <>
                  <div className="border-b border-border px-4 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {searchResults.length} results
                    </span>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {searchResults.map((result) => {
                      const Icon = result.icon;
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800/50">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate text-xs font-medium text-foreground">{result.label}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {result.type === "pin" ? "Map Location" : result.type === "node" ? "Evidence Entity" : "Investigation Case"}
                              {" • "}{result.id}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[9px] text-muted-foreground">
                            {result.view === "map" ? "Map" : result.view === "evidence" ? "Graph" : "Cases"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {searchQuery.length < 2 && searchHistory.length > 0 && (
                <>
                  <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-slate-900/50">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Recent Searches
                    </span>
                    <button 
                      onClick={clearHistory}
                      className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors focus:outline-none focus:ring-1 focus:ring-red-400 rounded px-1"
                    >
                      Clear History
                    </button>
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {searchHistory.map((historyItem, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          onSearchChange(historyItem);
                          handleSearchSubmit(historyItem);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-800/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">{historyItem}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Live Indicator */}
        <div className="mr-2 flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1">
          <Wifi className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-medium text-emerald-400">LIVE</span>
          <div className="live-dot" />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            aria-label="View notifications"
            className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-slate-800/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadAlerts > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-lg shadow-red-500/30">
                {unreadAlerts}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 z-dropdown w-96 rounded-xl border border-border bg-[var(--card)] shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-semibold text-foreground">Alerts</span>
                  <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400">
                    {unreadAlerts} new
                  </span>
                </div>
                <button 
                  onClick={() => markAllAsRead()}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-1 focus-visible:ring-primary rounded px-1"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-80 divide-y divide-slate-800/50 overflow-auto">
                {notificationsList.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 transition-colors hover:bg-slate-800/30 ${
                      !alert.acknowledged ? "bg-slate-900/40" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                          alert.severity === "critical"
                            ? "bg-red-500/15 text-red-400 border border-red-500/20"
                            : alert.severity === "high"
                            ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
                            : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                        }`}
                      >
                        <AlertTriangle className="h-3 w-3" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">{alert.title}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                          {alert.description}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-600">
                          <span>{alert.source}</span>
                          <span>•</span>
                          <span>{getTimeAgo(alert.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border px-4 py-2.5">
                <button 
                  onClick={() => {
                    setActiveView("report-alerts");
                    setShowNotifications(false);
                  }}
                  className="w-full rounded-lg bg-slate-800/50 py-1.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-slate-800 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  View All Alerts →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Clearance Level Pill & Admin Console Link */}
        <div className="hidden sm:flex items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${
            currentUser?.clearanceLevel === 3
              ? "bg-red-950/60 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
              : currentUser?.clearanceLevel === 2
              ? "bg-amber-950/60 border-amber-500/50 text-amber-400"
              : "bg-cyan-950/60 border-cyan-500/50 text-cyan-400"
          }`}>
            <span className={`h-2 w-2 rounded-full ${
              currentUser?.clearanceLevel === 3 ? "bg-red-500 animate-ping" : currentUser?.clearanceLevel === 2 ? "bg-amber-500" : "bg-cyan-400"
            }`} />
            <span>L{currentUser?.clearanceLevel || 1} • {currentUser?.role?.toUpperCase() || "ANALYST"}</span>
          </div>

          {currentUser?.clearanceLevel === 3 && (
            <button
              onClick={() => setActiveView("admin-console")}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/40 px-2.5 py-1 text-xs font-semibold text-red-300 hover:bg-red-900/60 transition-colors"
              title="Open Security & Cryptographic Console"
            >
              <Shield className="h-3.5 w-3.5 text-red-400" />
              <span>Console</span>
            </button>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            aria-label="User profile settings"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-800/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">
              {userInitials}
            </div>
            <div className="hidden flex-col md:flex text-left">
              <span className="text-xs font-medium text-foreground">{displayName}</span>
              <span className="text-[10px] text-muted-foreground">{displayRole}</span>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 z-dropdown w-64 rounded-xl border border-border bg-[var(--card)] shadow-2xl shadow-black/50">
              <div className="border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-bold text-white">
                    {userInitials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{displayName}</p>
                    <p className="text-[11px] text-muted-foreground">{displayRole}</p>
                  </div>
                </div>
              </div>
              <div className="p-2 space-y-1">

                <button 
                  onClick={() => setDemoTimeoutActive(!demoTimeoutActive)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-slate-800/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Demo: 15s Timeout
                  </div>
                  <div className={`flex h-3 w-6 items-center rounded-full transition-colors ${demoTimeoutActive ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                    <div className={`h-2.5 w-2.5 rounded-full bg-white transition-transform ${demoTimeoutActive ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </div>
                </button>

                {currentUser?.clearanceLevel === 3 && (
                  <button 
                    onClick={() => {
                      setActiveView("admin-console");
                      setShowProfile(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-300 transition-colors hover:bg-red-950/40 hover:text-red-200"
                  >
                    <Shield className="h-3.5 w-3.5 text-red-400" />
                    Security Command Console
                  </button>
                )}

                <button 
                  onClick={() => {
                    setActiveView("dashboard");
                    setShowProfile(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-slate-800/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <User className="h-3.5 w-3.5" />
                  Profile Settings
                </button>
                <button 
                  onClick={() => logout()}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <X className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
