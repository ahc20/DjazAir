import { DjazAirFlight } from "@/types/djazair";

// Interface pour l'analyse Gemini
export interface GeminiAnalysis {
    recommendation: {
        flightId: string;
        title: string;
        reason: string;
    };
    savingsExplanation: string;
    tips: string[];
    comparisonSummary: string;
}

// Interface pour les vols classiques
interface ClassicFlight {
    id: string;
    airline: string;
    price: { amount: number };
    duration: string;
    stops: number;
}

/**
 * Client Gemini pour l'analyse de vols
 */
export class GeminiClient {
    private apiKey: string;
    private baseUrl = "https://generativelanguage.googleapis.com/v1beta";

    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || "";
    }

    /**
     * Vérifie si l'API Gemini est disponible
     */
    isAvailable(): boolean {
        return !!this.apiKey;
    }

    /**
     * Analyse les résultats de vols et génère des recommandations
     */
    async analyzeFlightResults(
        djazairFlights: DjazAirFlight[],
        classicFlights: ClassicFlight[],
        searchParams: {
            origin: string;
            destination: string;
            departureDate: string;
            returnDate?: string;
        }
    ): Promise<GeminiAnalysis | null> {
        if (!this.isAvailable()) {
            console.log("⚠️ Gemini API non configurée");
            return null;
        }

        try {
            // Préparer le contexte pour Gemini
            const djazairSummary = djazairFlights.slice(0, 3).map(f => ({
                id: f.id,
                price: f.totalPriceEUR,
                priceDZD: f.totalPriceDZD,
                duration: f.totalDuration,
                segments: f.segments.length,
                airlines: Array.from(new Set(f.segments.map(s => s.airline))).join(", "),
                savings: f.savings?.amount || 0
            }));

            const classicSummary = classicFlights.slice(0, 3).map(f => ({
                id: f.id,
                price: f.price.amount,
                airline: f.airline,
                duration: f.duration,
                stops: f.stops
            }));

            const prompt = `Tu es un expert en voyage et comparateur de vols pour DjazAir, une plateforme qui aide les voyageurs à économiser en passant par Alger.

CONTEXTE DE RECHERCHE:
- Trajet: ${searchParams.origin} → ${searchParams.destination}
- Date départ: ${searchParams.departureDate}
${searchParams.returnDate ? `- Date retour: ${searchParams.returnDate}` : '- Aller simple'}

VOLS DJAZAIR (via Alger avec taux DZD avantageux):
${JSON.stringify(djazairSummary, null, 2)}

VOLS CLASSIQUES (directs ou escales standard):
${JSON.stringify(classicSummary, null, 2)}

INSTRUCTIONS:
Analyse ces options et réponds en JSON strict avec cette structure:
{
  "recommendation": {
    "flightId": "ID du meilleur vol",
    "title": "Titre court (ex: 'Meilleure économie' ou 'Meilleur rapport qualité/prix')",
    "reason": "Explication en 1-2 phrases pourquoi ce vol est recommandé"
  },
  "savingsExplanation": "Explication claire des économies DjazAir grâce au taux de change DZD (2-3 phrases)",
  "tips": ["Conseil 1", "Conseil 2", "Conseil 3"],
  "comparisonSummary": "Résumé comparatif en 2-3 phrases"
}

Réponds UNIQUEMENT avec le JSON, sans markdown ni commentaires.`;

            const response = await fetch(
                `${this.baseUrl}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [{ text: prompt }]
                            }
                        ],
                        generationConfig: {
                            temperature: 0.3,
                            maxOutputTokens: 1024,
                        }
                    })
                }
            );

            if (!response.ok) {
                console.error("❌ Erreur Gemini:", response.status, response.statusText);
                return null;
            }

            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textResponse) {
                console.error("❌ Réponse Gemini vide");
                return null;
            }

            // Parser la réponse JSON
            try {
                // Nettoyer la réponse (enlever les backticks markdown si présents)
                const cleanJson = textResponse
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim();

                const analysis: GeminiAnalysis = JSON.parse(cleanJson);
                console.log("✅ Analyse Gemini générée avec succès");
                return analysis;
            } catch (parseError) {
                console.error("❌ Erreur parsing JSON Gemini:", parseError);
                console.log("Réponse brute:", textResponse);
                return null;
            }

        } catch (error) {
            console.error("❌ Erreur appel Gemini:", error);
            return null;
        }
    }
}

// Export singleton
export const geminiClient = new GeminiClient();
