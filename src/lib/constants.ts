// Constantes de l'application
export const APP_NAME = "DjazAir";
export const APP_DESCRIPTION = "Simulateur d'Arbitrage Aérien";
export const APP_VERSION = "1.0.0";

// URLs et endpoints
export const EXTERNAL_URLS = {
  GOOGLE_TRAVEL: "https://www.google.com/travel/flights",
  AMADEUS_DEV: "https://developers.amadeus.com/",
  KIWI_TEQUILA: "https://tequila.kiwi.com/portal",
  EXCHANGE_RATE: "https://api.exchangerate.host",
} as const;

// Messages et textes
export const LEGAL_DISCLAIMER =
  "Cette application ne vend pas de billets en dinars algériens et ne réalise aucune opération de change. Les calculs 'via Alger' sont des SIMULATIONS basées sur des hypothèses administrateur ou des saisies utilisateur. Pour réserver, vous serez redirigé vers des canaux officiels. Vérifiez vos conditions de visa et le risque de correspondance.";

export const APP_FEATURES = {
  SEARCH: "Recherche de vols multi-critères",
  ARBITRAGE: 'Simulation d\'arbitrage "via Alger"',
  COMPARISON: "Comparaison des prix directs vs escales",
  REDIRECTION: "Redirection vers canaux officiels",
} as const;

// Configuration par défaut
export const DEFAULT_CONFIG = {
  EUR_TO_DZD_CUSTOM_RATE: 262,
  MIN_SAVINGS_PERCENT: 15.0,
  RISK_BUFFER_MINUTES: 120,
  SHOW_VIA_ALGIERS: true,
} as const;
