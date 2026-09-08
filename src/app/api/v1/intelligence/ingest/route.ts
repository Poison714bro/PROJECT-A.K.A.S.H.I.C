import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { analyzeIntel } from "@/lib/llm/analyze";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const { text, source, sourceType, entityId } = await req.json();

        if (!text || !source || !sourceType) {
            return NextResponse.json({ error: "text, source, sourceType required" }, { status: 400 });
        }

        const analysis = await analyzeIntel(text, source);

        const entry = await prisma.feedEntry.create({
            data: {
                source,
                sourceType,
                riskScore: analysis.riskScore,
                category: analysis.category,
                details: analysis.summary,
                timestamp: new Date(),
                severity: analysis.severity,
                entityId: entityId ?? null
            }
        });

        return NextResponse.json({ success: true, entry });
    } catch (err: any) {
        console.error("Ingestion error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}