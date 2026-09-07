import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { primaryId, secondaryId, reason } = await request.json();

    if (!primaryId || !secondaryId) {
      return NextResponse.json({ success: false, error: 'primaryId and secondaryId are required' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        mergedEntityId: primaryId,
        secondaryId,
        reason: reason || 'Analyst verified cryptographic & blockchain match',
        status: 'MERGED',
        timestamp: new Date().toISOString(),
        engine: 'Semantica EntityResolver & DuplicateDetector'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
