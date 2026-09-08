const LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions";

const CATEGORIES = [
    "NARCOTICS_SALE", "NARCOTICS_PRODUCTION", "MONEY_LAUNDERING",
    "WEAPONS", "FRAUD", "LOGISTICS_SHIPPING", "RECRUITMENT", "GENERAL_CHATTER"
];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

interface AnalysisResult {
    category: string;
    severity: string;
    riskScore: number;
    summary: string;
}

export async function analyzeIntel(rawText: string, source: string): Promise<AnalysisResult> {
    const systemPrompt = `You are a threat-intel classifier. Given raw scraped text from a dark-web/encrypted-platform source, respond with ONLY valid JSON, no markdown, no commentary, matching this exact shape:
{"category": one of ${JSON.stringify(CATEGORIES)}, "severity": one of ${JSON.stringify(SEVERITIES)}, "riskScore": number 0-100, "summary": "2-3 sentence investigator-facing summary"}`;

    const res = await fetch(LM_STUDIO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "qwen2.5-7b-instruct",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Source: ${source}\n\nText:\n${rawText.slice(0, 4000)}` }
            ],
            temperature: 0.2,
            max_tokens: 500
        })
    });

    if (!res.ok) throw new Error(`LM Studio error: ${res.status} ${await res.text()}`);

    const data = await res.json();
    const raw = data.choices[0].message.content.trim();

    const clean = raw.replace(/^```json\s*|```$/g, "").trim();
    let parsed: AnalysisResult;
    try {
        parsed = JSON.parse(clean);
    } catch {
        throw new Error(`Model returned non-JSON: ${raw}`);
    }

    if (!CATEGORIES.includes(parsed.category)) parsed.category = "GENERAL_CHATTER";
    if (!SEVERITIES.includes(parsed.severity)) parsed.severity = "LOW";
    parsed.riskScore = Math.max(0, Math.min(100, Number(parsed.riskScore) || 0));

    return parsed;
}