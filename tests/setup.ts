// Configuration globale pour Vitest
import { beforeAll, afterAll, vi } from "vitest";

// Mock des variables d'environnement pour les tests
// Note: NODE_ENV est géré automatiquement par Vitest
process.env.EXCHANGE_BASE_URL = "https://api.exchangerate.host";
process.env.NEXT_PUBLIC_DEFAULT_PARALLEL_RATE_DZD = "262";

// Mock de fetch global pour les tests
global.fetch = vi.fn();

// Configuration des mocks avant tous les tests
beforeAll(() => {
  // Mock des réponses d'API
  vi.mocked(fetch).mockImplementation((url: string | URL | Request) => {
    const urlString = typeof url === "string" ? url : url.toString();
    if (urlString.includes("exchangerate.host")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            rates: { DZD: 150.5 },
            base: "EUR",
            date: "2024-01-01",
          }),
      } as Response);
    }

    // Mock par défaut
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    } as Response);
  });
});

// Nettoyage après tous les tests
afterAll(() => {
  vi.clearAllMocks();
});
