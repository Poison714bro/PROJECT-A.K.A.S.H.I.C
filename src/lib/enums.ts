/**
 * Central Integer-to-Label Enum Mappings for PROJECT A.K.A.S.H.I.C
 *
 * All integer constants used in the Prisma schema are defined here.
 * API routes resolve integers → labels server-side using these maps.
 */

// ── Entity Categories (C1–C10) ──
export const EntityCategory: Record<number, string> = {
  1: "Narcotics Trafficker",
  2: "Money Launderer",
  3: "Weapons Dealer",
  4: "Darknet Market Operator",
  5: "Precursor Supplier",
  6: "Drug Courier",
  7: "Crypto Mixer Operator",
  8: "Escrow / Market Admin",
  9: "Lab Operator",
  10: "Informant / CI",
};

// ── Feed Source (S1–S6) ──
export const FeedSource: Record<number, string> = {
  1: "Darknet Forum Scraper",
  2: "Blockchain Monitor",
  3: "Telegram Intel",
  4: "Marketplace Scraper",
  5: "Law Enforcement Tip",
  6: "OSINT Scraper",
};

// ── Feed Source Type (T1–T6) ──
export const FeedSourceType: Record<number, string> = {
  1: "osint",
  2: "blockchain",
  3: "encrypted",
  4: "darknet",
  5: "humint",
  6: "sigint",
};

// ── Feed Category (FC1–FC10) ──
export const FeedCategory: Record<number, string> = {
  1: "Opioids/Fentanyl",
  2: "Stimulants",
  3: "Cannabis",
  4: "Psychedelics",
  5: "Prescription/Other",
  6: "Precursor Chemicals",
  7: "Payment Flow",
  8: "Market Operations",
  9: "Law Enforcement Action",
  10: "Weapons/Other",
};

// ── Feed Severity (SV1–SV4) ──
export const FeedSeverity: Record<number, string> = {
  1: "low",
  2: "medium",
  3: "high",
  4: "critical",
};

// ── Edge Labels (L1–L8) ──
export const EdgeLabel: Record<number, string> = {
  1: "Shared Wallet",
  2: "Same Vendor Alias",
  3: "Supplier → Distributor",
  4: "Co-Conspirator",
  5: "Financial Laundering",
  6: "PGP Key Overlap",
  7: "Encrypted Comms",
  8: "Operates Market",
};

// ── Map City Labels (1–20) ──
export const MapCityLabel: Record<number, string> = {
  1: "Delhi",
  2: "Mumbai",
  3: "Kolkata",
  4: "Chennai",
  5: "Bangalore",
  6: "Hyderabad",
  7: "Pune",
  8: "Ahmedabad",
  9: "Jaipur",
  10: "Lucknow",
  11: "Rotterdam",
  12: "Berlin",
  13: "London",
  14: "Amsterdam",
  15: "Frankfurt",
  16: "Warsaw",
  17: "Ludhiana",
  18: "Chandigarh",
  19: "Amritsar",
  20: "Goa",
};

// ── Raw Ingest Source Names (I1–I6) ──
export const RawIngestSource: Record<number, string> = {
  1: "darknet-crawler-01",
  2: "blockchain-watcher",
  3: "telegram-bot",
  4: "marketplace-scraper",
  5: "le-tip-line",
  6: "osint-aggregator",
};

// ── User Roles ──
export const UserRole: Record<number, string> = {
  1: "Analyst",
  2: "Senior",
  3: "Lead",
};

// ── Drug Category Colors (keyed by FeedCategory integer) ──
export const DrugCategoryColor: Record<number, string> = {
  1: "#FF4500",  // Opioids/Fentanyl
  2: "#00FFFF",  // Stimulants
  3: "#39FF14",  // Cannabis
  4: "#B026FF",  // Psychedelics
  5: "#FFD700",  // Prescription/Other
  6: "#ef4444",  // Precursor Chemicals
  7: "#f59e0b",  // Payment Flow
  8: "#6366f1",  // Market Operations
  9: "#22c55e",  // Law Enforcement Action
  10: "#dc2626", // Weapons/Other
};

// ────────────────────────────────────────────────────
// Utility lookup functions
// ────────────────────────────────────────────────────

export function getEntityCategoryLabel(id: number): string {
  return EntityCategory[id] ?? `Category ${id}`;
}

export function getFeedSourceLabel(id: number): string {
  return FeedSource[id] ?? `Source ${id}`;
}

export function getFeedSourceTypeLabel(id: number): string {
  return FeedSourceType[id] ?? `Type ${id}`;
}

export function getFeedCategoryLabel(id: number): string {
  return FeedCategory[id] ?? `Category ${id}`;
}

export function getFeedSeverityLabel(id: number): string {
  return FeedSeverity[id] ?? `Severity ${id}`;
}

export function getEdgeLabelText(id: number): string {
  return EdgeLabel[id] ?? `Edge ${id}`;
}

export function getMapCityName(id: number): string {
  return MapCityLabel[id] ?? `City ${id}`;
}

export function getRawIngestSourceName(id: number): string {
  return RawIngestSource[id] ?? `Source ${id}`;
}

export function getUserRoleLabel(id: number): string {
  return UserRole[id] ?? `Role ${id}`;
}

export function getDrugCategoryColor(id: number): string {
  return DrugCategoryColor[id] ?? "#888888";
}

// ────────────────────────────────────────────────────
// Reverse lookups: label → integer
// ────────────────────────────────────────────────────

function invertMap(map: Record<number, string>): Record<string, number> {
  const inverted: Record<string, number> = {};
  for (const [k, v] of Object.entries(map)) {
    inverted[v.toLowerCase()] = Number(k);
  }
  return inverted;
}

export const EntityCategoryByLabel = invertMap(EntityCategory);
export const FeedSourceByLabel = invertMap(FeedSource);
export const FeedSourceTypeByLabel = invertMap(FeedSourceType);
export const FeedCategoryByLabel = invertMap(FeedCategory);
export const FeedSeverityByLabel = invertMap(FeedSeverity);
export const EdgeLabelByText = invertMap(EdgeLabel);
export const MapCityLabelByName = invertMap(MapCityLabel);
