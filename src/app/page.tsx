"use client";

import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import TelemetryBar from "@/components/layout/TelemetryBar";
import Dashboard from "@/components/views/Dashboard";
import MapView from "@/components/views/MapView";
import EvidenceGraph from "@/components/views/EvidenceGraph";
import InvestigationManager from "@/components/views/InvestigationManager";
import EntityResolution from "@/components/views/EntityResolution";
import TimelineReconstructor from "@/components/views/TimelineReconstructor";
import IntelligenceDossier from "@/components/views/IntelligenceDossier";
import MovementTracker from "@/components/views/MovementTracker";
import ReportInvestigations from "@/components/views/ReportInvestigations";
import ReportListings from "@/components/views/ReportListings";
import ReportFinancial from "@/components/views/ReportFinancial";
import ReportAlerts from "@/components/views/ReportAlerts";
import ScraplingHarvester from "@/components/views/ScraplingHarvester";
import LoginView from "@/components/views/LoginView";
import UnauthorizedView from "@/components/views/UnauthorizedView";
import AdminConsole from "@/components/views/AdminConsole";
import { useAppStore } from "@/lib/store";

export type ViewType = "dashboard" | "map" | "evidence" | "investigations" | "entity-resolution" | "timeline-reconstructor" | "dossier" | "movement-tracker" | "report-investigations" | "report-listings" | "report-financial" | "report-alerts" | "admin-console" | "scraper";

// Define clearance requirements for each view
const VIEW_CLEARANCE_REQUIREMENTS: Record<ViewType, number> = {
  "dashboard": 1,
  "report-alerts": 1,
  "report-listings": 1,
  "map": 1,
  "evidence": 2,
  "entity-resolution": 2,
  "timeline-reconstructor": 2,
  "movement-tracker": 2,
  "investigations": 2,
  "report-investigations": 2,
  "report-financial": 2,
  "dossier": 2,
  "scraper": 1,
  "admin-console": 3,
};

export default function Home() {
  const activeView = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const currentUser = useAppStore((s) => s.currentUser);

  // Check if current user has clearance for the active view
  const requiredClearance = VIEW_CLEARANCE_REQUIREMENTS[activeView] || 3;
  const hasClearance = (currentUser?.clearanceLevel || 0) >= requiredClearance;

  // Enforce zero-trust boundary: revert to dashboard if attempting to access forbidden views
  useEffect(() => {
    if (isAuthenticated && !hasClearance) {
      setActiveView("dashboard");
    }
  }, [isAuthenticated, hasClearance, setActiveView]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderView = () => {
    if (!hasClearance) {
      return <UnauthorizedView requiredClearance={requiredClearance} />;
    }

    switch (activeView) {
      case "dashboard": return <Dashboard />;
      case "map": return <MapView />;
      case "evidence": return <EvidenceGraph />;
      case "investigations": return <InvestigationManager />;
      case "entity-resolution": return <EntityResolution />;
      case "timeline-reconstructor": return <TimelineReconstructor />;
      case "movement-tracker": return <MovementTracker />;
      case "dossier": return <IntelligenceDossier />;
      case "report-investigations": return <ReportInvestigations />;
      case "report-listings": return <ReportListings />;
      case "report-financial": return <ReportFinancial />;
      case "report-alerts": return <ReportAlerts />;
      case "admin-console": return <AdminConsole />;
      case "scraper": return <ScraplingHarvester />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--background)]">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
        <TelemetryBar />
      </div>
    </div>
  );
}

