import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const defaultWeeklyActivity = [
    { date: "Mon", transactions: 120, alerts: 5 },
    { date: "Tue", transactions: 132, alerts: 8 },
    { date: "Wed", transactions: 101, alerts: 3 },
    { date: "Thu", transactions: 154, alerts: 12 },
    { date: "Fri", transactions: 190, alerts: 15 },
    { date: "Sat", transactions: 230, alerts: 20 },
    { date: "Sun", transactions: 210, alerts: 18 }
  ];
  const defaultDrugDistribution = [
    { name: "Opioids/Fentanyl", count: 45, color: "#ef4444" },
    { name: "Stimulants", count: 32, color: "#3b82f6" },
    { name: "Prescription", count: 28, color: "#22c55e" },
    { name: "Psychedelics", count: 18, color: "#a855f7" },
    { name: "Cannabis", count: 14, color: "#eab308" }
  ];

  try {
    const mapIncidents = await prisma.mapIncident.findMany();

    if (!mapIncidents || mapIncidents.length === 0) {
      return NextResponse.json({
        success: true,
        data: { weeklyActivity: defaultWeeklyActivity, drugDistribution: defaultDrugDistribution }
      });
    }

    // Drug distribution (already working — unchanged)
    const distributionMap: Record<string, number> = {};
    mapIncidents.forEach(inc => {
      if (!inc.drugCategory) return;
      const mainCategory = (String(inc.drugCategory).split(' - ')[0] || inc.drugCategory).trim();
      if (mainCategory) {
        distributionMap[mainCategory] = (distributionMap[mainCategory] || 0) + 1;
      }
    });
    const colors = ["#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#eab308"];
    const drugDistribution = Object.keys(distributionMap).map((key, i) => ({
      name: key,
      count: distributionMap[key],
      color: colors[i % colors.length]
    }));

    // Weekly activity — now built from real incident dates instead of hardcoded numbers
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayCounts: Record<string, { transactions: number; alerts: number }> = {};
    dayNames.forEach(d => { dayCounts[d] = { transactions: 0, alerts: 0 }; });

    mapIncidents.forEach(inc => {
      const day = dayNames[new Date(inc.date).getDay()];
      dayCounts[day].transactions += 1;
      if (inc.riskScore >= 70) {
        dayCounts[day].alerts += 1;
      }
    });

    // Reorder to start on Monday, matching the original chart's layout
    const orderedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weeklyActivity = orderedDays.map(day => ({
      date: day,
      transactions: dayCounts[day].transactions,
      alerts: dayCounts[day].alerts
    }));

    return NextResponse.json({
      success: true,
      data: {
        weeklyActivity,
        drugDistribution: drugDistribution.length > 0 ? drugDistribution : defaultDrugDistribution
      }
    });
  } catch (error: any) {
    console.error("[/api/v1/dashboard/charts] Prisma query failed:", error);
    return NextResponse.json({
      success: true,
      data: { weeklyActivity: defaultWeeklyActivity, drugDistribution: defaultDrugDistribution }
    });
  }
}