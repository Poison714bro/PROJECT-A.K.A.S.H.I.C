import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || searchParams.get('keyword') || "").toLowerCase();

    const entities = await prisma.intelEntity.findMany();
    const results = [];

    for (const entity of entities) {
      const alias = (entity.primaryAlias || "").toLowerCase();
      const summary = (entity.summary || "").toLowerCase();
      if (alias.includes(q) || summary.includes(q)) {
        results.push({
          id: entity.id,
          label: entity.primaryAlias,
          type: "entity",
          category: entity.category,
          view: "dossier"
        });
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: "Internal Server Error" } }, { status: 500 });
  }
}
