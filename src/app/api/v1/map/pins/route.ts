import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const categoriesParam = searchParams.get('drugCategory');
    const riskMin = searchParams.get('riskMin');
    const riskMax = searchParams.get('riskMax');

    const where: any = {};

    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }
    if (categoriesParam) {
      where.drugCategory = { in: categoriesParam.split(',') };
    }
    if (riskMin || riskMax) {
      where.riskScore = {
        gte: riskMin ? parseFloat(riskMin) : 0,
        lte: riskMax ? parseFloat(riskMax) : 100
      };
    }

    const incidents = await prisma.mapIncident.findMany({ where, take: 2000 });

    const pins = incidents.map(inc => ({
      id: inc.id,
      lat: inc.lat,
      lng: inc.lng,
      city: inc.label.split(',')[0] || "Unknown",
      country: inc.label.split(',')[1]?.trim() || "Unknown",
      drugCategory: inc.drugCategory,
      riskScore: inc.riskScore,
      entityId: inc.entityId || inc.id,
      date: inc.date.toISOString(),
      label: inc.label,
      quantityEst: inc.details,
      sourceType: "osint",
      originRoute: inc.originRoute ? JSON.parse(inc.originRoute) : []
    }));

<<<<<<< Updated upstream
    // Simulate network latency for Project A.K.A.S.H.I.C. telemetry realism
    await new Promise((resolve) => setTimeout(resolve, 200));

=======
>>>>>>> Stashed changes
    return NextResponse.json({ success: true, data: pins });
  } catch (error: any) {
    console.error("[/api/v1/map/pins] Prisma query failed:", error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}