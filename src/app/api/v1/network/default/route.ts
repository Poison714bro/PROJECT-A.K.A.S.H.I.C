import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 150;

    const entities = await prisma.intelEntity.findMany({
      orderBy: { riskScore: 'desc' },
      take: limit
    });
    const entityIds = entities.map(e => e.id);

    const edges = await prisma.graphEdge.findMany({
      where: {
        sourceId: { in: entityIds },
        targetId: { in: entityIds }
      },
      take: 500
    });

    const nodes = entities.map(e => ({
      id: e.id,
      label: e.primaryAlias,
      type: 'evidenceNode',
      nodeType: 'username',
      suspectRole: e.category,
      riskScore: e.riskScore,
      metadata: { 'Status': e.status },
      details: e.summary
    }));

    const formattedEdges = edges.map(edge => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      label: edge.label,
      contactMethod: 'darknet'
    }));

    return NextResponse.json({ success: true, data: { nodes, edges: formattedEdges } });
  } catch (error: any) {
    console.error("[/api/v1/network/default] Prisma query failed:", error);
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
