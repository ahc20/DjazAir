import { NextRequest, NextResponse } from "next/server";
import { geminiClient, GeminiAnalysis } from "@/lib/geminiClient";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { djazairFlights, classicFlights, searchParams } = body;

        console.log("🤖 Demande d'analyse Gemini...");

        if (!geminiClient.isAvailable()) {
            console.log("⚠️ Gemini API non configurée, skip analyse IA");
            return NextResponse.json({
                success: false,
                error: "Gemini API non configurée",
                analysis: null
            });
        }

        const analysis = await geminiClient.analyzeFlightResults(
            djazairFlights || [],
            classicFlights || [],
            searchParams || {}
        );

        if (analysis) {
            console.log("✅ Analyse Gemini terminée");
            return NextResponse.json({
                success: true,
                analysis
            });
        } else {
            return NextResponse.json({
                success: false,
                error: "Échec de l'analyse Gemini",
                analysis: null
            });
        }

    } catch (error: any) {
        console.error("❌ Erreur API AI Analysis:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            analysis: null
        }, { status: 500 });
    }
}
