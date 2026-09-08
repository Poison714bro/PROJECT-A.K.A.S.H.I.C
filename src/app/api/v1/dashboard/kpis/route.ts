import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const activeTargets = await prisma.intelEntity.count({ where: { status: 'Active' } });
    const highRiskAlerts = await prisma.feedEntry.count({
      where: { OR: [{ severity: 'critical' }, { severity: 'high' }] }
    });

    const wallets = await prisma.cryptoWallet.findMany();
    const cryptoVolumeUSD = wallets.reduce((acc, w) => acc + (w.observedVolumeUSD || 0), 0);

    // TODO: replace these with real Prisma queries once you tell me
    // which models/fields track investigations, arrests, listings, and trend rate
    const openInvestigations = await prisma.intelEntity.count({ where: { status: 'Investigating' } }); // guess — adjust to your actual status value
    const interceptedListings = await prisma.feedEntry.count(); // guess — adjust to whichever model represents "listings"
    const globalArrestsEuropolContext = 270; // still hardcoded — no matching model yet
    const networkTrendRate = "+12.5%"; // still hardcoded — needs a real trend calculation

    return NextResponse.json({
      success: true,
      data: {
        activeTargets,
        highRiskAlerts,
        cryptoVolumeUSD,
        openInvestigations,
        globalArrestsEuropolContext,
        interceptedListings,
        networkTrendRate
      }
    });
  } catch (error: any) {
    console.error('[/api/v1/network/default] Prisma query failed:', error);
    // No more silent fake-data fallback — the frontend needs to know this failed
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}