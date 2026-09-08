import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapPinsData } from '@/lib/mockData';

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
      const start = new Date(startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`);
      const end = new Date(endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`);
      where.date = { gte: start, lte: end };
    }
    if (categoriesParam) {
      const cats = categoriesParam.split(',').map(c => c.trim()).filter(Boolean);
      if (cats.length > 0) {
        where.OR = cats.map(cat => ({
          drugCategory: { contains: cat }
        }));
      }
    }
    if (riskMin || riskMax) {
      where.riskScore = {
        gte: riskMin ? parseFloat(riskMin) : 0,
        lte: riskMax ? parseFloat(riskMax) : 100
      };
    }

    let incidents = await prisma.mapIncident.findMany({ where, take: 2000 });

    // Fallback gracefully to mock data if query yielded no pins (e.g. database not seeded or filters slightly offset)
    if (incidents.length === 0) {
      let filtered = mapPinsData;
      if (startDate && endDate) {
        filtered = filtered.filter(p => p.date >= startDate && p.date <= endDate);
      }
      if (categoriesParam) {
        const cats = categoriesParam.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
        if (cats.length > 0) {
          filtered = filtered.filter(p => cats.some(cat => p.drugCategory.toLowerCase().includes(cat)));
        }
      }
      if (riskMin || riskMax) {
        const min = riskMin ? parseFloat(riskMin) : 0;
        const max = riskMax ? parseFloat(riskMax) : 100;
        filtered = filtered.filter(p => p.riskScore >= min && p.riskScore <= max);
      }

      const fallbackPins = filtered.map(pin => ({
        id: pin.id,
        lat: pin.lat,
        lng: pin.lng,
        city: pin.label.split(',')[0].trim(),
        country: "India",
        drugCategory: pin.drugCategory,
        riskScore: pin.riskScore,
        entityId: pin.entityId || (pin.linkedNodeIds && pin.linkedNodeIds[0]) || pin.id,
        date: pin.date,
        label: pin.label,
        quantityEst: pin.details,
        sourceType: "osint",
        originRoute: pin.originRoute || []
      }));

      return NextResponse.json({ success: true, data: fallbackPins });
    }

    const pins = incidents.map(inc => {
      const parts = inc.label.split(',');
      return {
        id: inc.id,
        lat: inc.lat,
        lng: inc.lng,
        city: parts[0]?.trim() || "Unknown",
        country: parts[1]?.trim() || "India",
        drugCategory: inc.drugCategory,
        riskScore: inc.riskScore,
        entityId: inc.entityId || inc.id,
        date: inc.date.toISOString(),
        label: inc.label,
        quantityEst: inc.details,
        sourceType: "osint",
        originRoute: inc.originRoute ? JSON.parse(inc.originRoute) : []
      };
    });

    return NextResponse.json({ success: true, data: pins });
  } catch (error: any) {
    console.error("[/api/v1/map/pins] Prisma query failed:", error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}