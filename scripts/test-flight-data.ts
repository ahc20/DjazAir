import { ExchangeRateService } from "../src/server/rates/rates";
import { VolzScraper } from "../src/server/flightAPI/volzScraper";

async function testExtraction() {
    console.log("🧪 Début des tests de données de vol...");

    // 1. Tester ForexAlgerie
    const rateService = new ExchangeRateService();
    try {
        const parallelRate = await rateService.getParallelRateFromForexAlgerie();
        console.log("📈 Taux Parallèle (ForexAlgerie):", parallelRate.rate, "DZD");
    } catch (error) {
        console.error("❌ Erreur ForexAlgerie:", error);
    }

    // 2. Tester Volz Scraper
    const volz = new VolzScraper();
    try {
        // Utiliser une date confirmée par le browser subagent: aujourd'hui ou demain
        const testDate = "2026-03-01";
        console.log(`🚀 [Volz] Test avec la date: ${testDate}`);

        const results = await volz.searchFlights({
            origin: "ALG",
            destination: "CDG",
            departureDate: testDate,
            passengers: 1,
            cabinClass: "ECONOMY"
        } as any);

        if (results.success && results.data && results.data.length > 0) {
            console.log("✅ Volz Scraper: ", results.data.length, "vols trouvés");
            console.log("💰 Premier prix:", results.data[0].totalPrice.amount, results.data[0].totalPrice.currency);
            console.log("✈️ Première compagnie:", results.data[0].flights[0].airline);
        } else {
            console.log("⚠️ Volz Scraper: Aucun vol trouvé (ou erreur)", results.error);
            // On peut ajouter un log dans le scraper lui-même pour voir le JSON brut si besoin
        }
    } catch (error) {
        console.error("❌ Erreur Volz Scraper:", error);
    }
}

testExtraction();
