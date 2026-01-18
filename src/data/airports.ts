/**
 * Base de données complète des codes IATA des aéroports internationaux
 * Source: IATA (International Air Transport Association)
 */

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  continent: string;
}

export const AIRPORTS: Record<string, Airport> = {
  // VILLES (Code Métropolitain / Multi-aéroports)
  "PAR": { code: "PAR", name: "Tous les aéroports", city: "Paris", country: "France", continent: "Europe" },
  "LON": { code: "LON", name: "Tous les aéroports", city: "Londres", country: "Royaume-Uni", continent: "Europe" },
  "NYC": { code: "NYC", name: "Tous les aéroports", city: "New York", country: "États-Unis", continent: "Amérique du Nord" },
  "TYO": { code: "TYO", name: "Tous les aéroports", city: "Tokyo", country: "Japon", continent: "Asie" },
  "BJS": { code: "BJS", name: "Tous les aéroports", city: "Pékin", country: "Chine", continent: "Asie" },
  "WAS": { code: "WAS", name: "Tous les aéroports", city: "Washington", country: "États-Unis", continent: "Amérique du Nord" },
  "YTO": { code: "YTO", name: "Tous les aéroports", city: "Toronto", country: "Canada", continent: "Amérique du Nord" },
  "YMQ": { code: "YMQ", name: "Tous les aéroports", city: "Montréal", country: "Canada", continent: "Amérique du Nord" },
  "MOW": { code: "MOW", name: "Tous les aéroports", city: "Moscou", country: "Russie", continent: "Europe" },
  "BER": { code: "BER", name: "Tous les aéroports", city: "Berlin", country: "Allemagne", continent: "Europe" },
  "ROM": { code: "ROM", name: "Tous les aéroports", city: "Rome", country: "Italie", continent: "Europe" },
  "MIL": { code: "MIL", name: "Tous les aéroports", city: "Milan", country: "Italie", continent: "Europe" },
  "IST": { code: "IST", name: "Tous les aéroports", city: "Istanbul", country: "Turquie", continent: "Europe" },

  // FRANCE
  "CDG": { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France", continent: "Europe" },
  "ORY": { code: "ORY", name: "Orly", city: "Paris", country: "France", continent: "Europe" },
  "BVA": { code: "BVA", name: "Beauvais-Tillé", city: "Paris", country: "France", continent: "Europe" },
  "NCE": { code: "NCE", name: "Côte d'Azur", city: "Nice", country: "France", continent: "Europe" },
  "LYS": { code: "LYS", name: "Lyon-Saint Exupéry", city: "Lyon", country: "France", continent: "Europe" },
  "MRS": { code: "MRS", name: "Marseille Provence", city: "Marseille", country: "France", continent: "Europe" },
  "TLS": { code: "TLS", name: "Toulouse-Blagnac", city: "Toulouse", country: "France", continent: "Europe" },
  "BOD": { code: "BOD", name: "Mérignac", city: "Bordeaux", country: "France", continent: "Europe" },
  "NTE": { code: "NTE", name: "Atlantique", city: "Nantes", country: "France", continent: "Europe" },
  "LIL": { code: "LIL", name: "Lesquin", city: "Lille", country: "France", continent: "Europe" },
  "MLH": { code: "MLH", name: "Bâle-Mulhouse", city: "Mulhouse", country: "France", continent: "Europe" },
  "SXB": { code: "SXB", name: "Entzheim", city: "Strasbourg", country: "France", continent: "Europe" },
  "MPL": { code: "MPL", name: "Méditerranée", city: "Montpellier", country: "France", continent: "Europe" },

  // ALGÉRIE (Complet)
  "ALG": { code: "ALG", name: "Houari Boumediene", city: "Alger", country: "Algérie", continent: "Afrique" },
  "ORN": { code: "ORN", name: "Ahmed Ben Bella", city: "Oran", country: "Algérie", continent: "Afrique" },
  "CZL": { code: "CZL", name: "Mohamed Boudiaf", city: "Constantine", country: "Algérie", continent: "Afrique" },
  "AAE": { code: "AAE", name: "Rabah Bitat", city: "Annaba", country: "Algérie", continent: "Afrique" },
  "BJA": { code: "BJA", name: "Soummam - Abane Ramdane", city: "Béjaïa", country: "Algérie", continent: "Afrique" },
  "TLM": { code: "TLM", name: "Messali El Hadj", city: "Tlemcen", country: "Algérie", continent: "Afrique" },
  "QSF": { code: "QSF", name: "Ain Arnat", city: "Sétif", country: "Algérie", continent: "Afrique" },
  "BSK": { code: "BSK", name: "Mohamed Khider", city: "Biskra", country: "Algérie", continent: "Afrique" },
  "GJL": { code: "GJL", name: "Ferhat Abbas", city: "Jijel", country: "Algérie", continent: "Afrique" },
  "TMR": { code: "TMR", name: "Aguenar - Hadj Bey Akhamok", city: "Tamanrasset", country: "Algérie", continent: "Afrique" },
  "CBH": { code: "CBH", name: "Boudghene Ben Ali Lotfi", city: "Béchar", country: "Algérie", continent: "Afrique" },
  "ELU": { code: "ELU", name: "Guemar", city: "El Oued", country: "Algérie", continent: "Afrique" },

  // CHINE & ASIE
  "PEK": { code: "PEK", name: "Beijing Capital", city: "Pékin", country: "Chine", continent: "Asie" },
  "PKX": { code: "PKX", name: "Beijing Daxing", city: "Pékin", country: "Chine", continent: "Asie" },
  "PVG": { code: "PVG", name: "Pudong", city: "Shanghai", country: "Chine", continent: "Asie" },
  "SHA": { code: "SHA", name: "Hongqiao", city: "Shanghai", country: "Chine", continent: "Asie" },
  "CAN": { code: "CAN", name: "Baiyun", city: "Canton", country: "Chine", continent: "Asie" },
  "HKG": { code: "HKG", name: "International", city: "Hong Kong", country: "Chine", continent: "Asie" },
  "SZX": { code: "SZX", name: "Bao'an", city: "Shenzhen", country: "Chine", continent: "Asie" },
  "TPE": { code: "TPE", name: "Taoyuan", city: "Taipei", country: "Taïwan", continent: "Asie" },
  "HND": { code: "HND", name: "Haneda", city: "Tokyo", country: "Japon", continent: "Asie" },
  "NRT": { code: "NRT", name: "Narita", city: "Tokyo", country: "Japon", continent: "Asie" },
  "KIX": { code: "KIX", name: "Kansai", city: "Osaka", country: "Japon", continent: "Asie" },
  "ICN": { code: "ICN", name: "Incheon", city: "Séoul", country: "Corée du Sud", continent: "Asie" },
  "SIN": { code: "SIN", name: "Changi", city: "Singapour", country: "Singapour", continent: "Asie" },
  "BKK": { code: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "Thaïlande", continent: "Asie" },
  "DMK": { code: "DMK", name: "Don Mueang", city: "Bangkok", country: "Thaïlande", continent: "Asie" },
  "KUL": { code: "KUL", name: "Kuala Lumpur Intl", city: "Kuala Lumpur", country: "Malaisie", continent: "Asie" },
  "SGN": { code: "SGN", name: "Tan Son Nhat", city: "Ho Chi Minh-Ville", country: "Vietnam", continent: "Asie" },
  "HAN": { code: "HAN", name: "Noi Bai", city: "Hanoï", country: "Vietnam", continent: "Asie" },
  "CGK": { code: "CGK", name: "Soekarno-Hatta", city: "Jakarta", country: "Indonésie", continent: "Asie" },
  "DPS": { code: "DPS", name: "Ngurah Rai", city: "Denpasar (Bali)", country: "Indonésie", continent: "Asie" },
  "MNL": { code: "MNL", name: "Ninoy Aquino", city: "Manille", country: "Philippines", continent: "Asie" },
  "DEL": { code: "DEL", name: "Indira Gandhi", city: "New Delhi", country: "Inde", continent: "Asie" },
  "BOM": { code: "BOM", name: "Chhatrapati Shivaji", city: "Mumbai", country: "Inde", continent: "Asie" },

  // MOYEN-ORIENT
  "DXB": { code: "DXB", name: "International", city: "Dubaï", country: "Émirats Arabes Unis", continent: "Asie" },
  "DWC": { code: "DWC", name: "Al Maktoum", city: "Dubaï", country: "Émirats Arabes Unis", continent: "Asie" },
  "AUH": { code: "AUH", name: "International", city: "Abu Dhabi", country: "Émirats Arabes Unis", continent: "Asie" },
  "DOH": { code: "DOH", name: "Hamad", city: "Doha", country: "Qatar", continent: "Asie" },
  "JED": { code: "JED", name: "King Abdulaziz", city: "Djeddah", country: "Arabie Saoudite", continent: "Asie" },
  "RUH": { code: "RUH", name: "King Khalid", city: "Riyad", country: "Arabie Saoudite", continent: "Asie" },
  "MED": { code: "MED", name: "Prince Mohammad", city: "Médine", country: "Arabie Saoudite", continent: "Asie" },
  "AMM": { code: "AMM", name: "Queen Alia", city: "Amman", country: "Jordanie", continent: "Asie" },
  "BEY": { code: "BEY", name: "Rafic Hariri", city: "Beyrouth", country: "Liban", continent: "Asie" },
  "TLV": { code: "TLV", name: "Ben Gurion", city: "Tel Aviv", country: "Israël", continent: "Asie" },
  "KWI": { code: "KWI", name: "International", city: "Koweït", country: "Koweït", continent: "Asie" },
  "MCT": { code: "MCT", name: "International", city: "Mascate", country: "Oman", continent: "Asie" },

  // EUROPE (Majors & Hubs)
  "LHR": { code: "LHR", name: "Heathrow", city: "Londres", country: "Royaume-Uni", continent: "Europe" },
  "LGW": { code: "LGW", name: "Gatwick", city: "Londres", country: "Royaume-Uni", continent: "Europe" },
  "STN": { code: "STN", name: "Stansted", city: "Londres", country: "Royaume-Uni", continent: "Europe" },
  "LTN": { code: "LTN", name: "Luton", city: "Londres", country: "Royaume-Uni", continent: "Europe" },
  "FRA": { code: "FRA", name: "Frankfurt", city: "Francfort", country: "Allemagne", continent: "Europe" },
  "MUC": { code: "MUC", name: "Munich", city: "Munich", country: "Allemagne", continent: "Europe" },

  "HAM": { code: "HAM", name: "Hamburg", city: "Hambourg", country: "Allemagne", continent: "Europe" },
  "DUS": { code: "DUS", name: "Düsseldorf", city: "Düsseldorf", country: "Allemagne", continent: "Europe" },
  "MAD": { code: "MAD", name: "Barajas", city: "Madrid", country: "Espagne", continent: "Europe" },
  "BCN": { code: "BCN", name: "El Prat", city: "Barcelone", country: "Espagne", continent: "Europe" },
  "FCO": { code: "FCO", name: "Fiumicino", city: "Rome", country: "Italie", continent: "Europe" },
  "CIA": { code: "CIA", name: "Ciampino", city: "Rome", country: "Italie", continent: "Europe" },
  "MXP": { code: "MXP", name: "Malpensa", city: "Milan", country: "Italie", continent: "Europe" },
  "LIN": { code: "LIN", name: "Linate", city: "Milan", country: "Italie", continent: "Europe" },
  "BGY": { code: "BGY", name: "Orio al Serio", city: "Milan", country: "Italie", continent: "Europe" },
  "AMS": { code: "AMS", name: "Schiphol", city: "Amsterdam", country: "Pays-Bas", continent: "Europe" },
  "BRU": { code: "BRU", name: "Zaventem", city: "Bruxelles", country: "Belgique", continent: "Europe" },
  "CRL": { code: "CRL", name: "Charleroi", city: "Bruxelles", country: "Belgique", continent: "Europe" },
  "GVA": { code: "GVA", name: "Cointrin", city: "Genève", country: "Suisse", continent: "Europe" },
  "ZRH": { code: "ZRH", name: "Kloten", city: "Zurich", country: "Suisse", continent: "Europe" },
  "VIE": { code: "VIE", name: "Schwechat", city: "Vienne", country: "Autriche", continent: "Europe" },
  "LIS": { code: "LIS", name: "Humberto Delgado", city: "Lisbonne", country: "Portugal", continent: "Europe" },
  "OPO": { code: "OPO", name: "Francisco Sá Carneiro", city: "Porto", country: "Portugal", continent: "Europe" },

  "SAW": { code: "SAW", name: "Sabiha Gökçen", city: "Istanbul", country: "Turquie", continent: "Europe" },
  "ATH": { code: "ATH", name: "Elefthérios-Venizélos", city: "Athènes", country: "Grèce", continent: "Europe" },
  "SVO": { code: "SVO", name: "Sheremetyevo", city: "Moscou", country: "Russie", continent: "Europe" },
  "DME": { code: "DME", name: "Domodedovo", city: "Moscou", country: "Russie", continent: "Europe" },
  "VKO": { code: "VKO", name: "Vnukovo", city: "Moscou", country: "Russie", continent: "Europe" },
  "LED": { code: "LED", name: "Pulkovo", city: "Saint-Pétersbourg", country: "Russie", continent: "Europe" },
  "WAW": { code: "WAW", name: "Chopin", city: "Varsovie", country: "Pologne", continent: "Europe" },
  "PRG": { code: "PRG", name: "Václav Havel", city: "Prague", country: "République Tchèque", continent: "Europe" },
  "BUD": { code: "BUD", name: "Ferenc Liszt", city: "Budapest", country: "Hongrie", continent: "Europe" },
  "OSL": { code: "OSL", name: "Gardermoen", city: "Oslo", country: "Norvège", continent: "Europe" },
  "ARN": { code: "ARN", name: "Arlanda", city: "Stockholm", country: "Suède", continent: "Europe" },
  "CPH": { code: "CPH", name: "Kastrup", city: "Copenhague", country: "Danemark", continent: "Europe" },
  "HEL": { code: "HEL", name: "Vantaa", city: "Helsinki", country: "Finlande", continent: "Europe" },
  "DUB": { code: "DUB", name: "Dublin", city: "Dublin", country: "Irlande", continent: "Europe" },

  // AFRIQUE & MAGHREB
  "TUN": { code: "TUN", name: "Carthage", city: "Tunis", country: "Tunisie", continent: "Afrique" },
  "CMN": { code: "CMN", name: "Mohammed V", city: "Casablanca", country: "Maroc", continent: "Afrique" },
  "RAK": { code: "RAK", name: "Menara", city: "Marrakech", country: "Maroc", continent: "Afrique" },
  "CAI": { code: "CAI", name: "International", city: "Le Caire", country: "Égypte", continent: "Afrique" },
  "DKR": { code: "DKR", name: "Blaise Diagne", city: "Dakar", country: "Sénégal", continent: "Afrique" },
  "ABJ": { code: "ABJ", name: "Félix-Houphouët-Boigny", city: "Abidjan", country: "Côte d'Ivoire", continent: "Afrique" },
  "BKO": { code: "BKO", name: "Modibo Keïta", city: "Bamako", country: "Mali", continent: "Afrique" },
  "NIM": { code: "NIM", name: "Diori Hamani", city: "Niamey", country: "Niger", continent: "Afrique" },
  "OUA": { code: "OUA", name: "Thomas Sankara", city: "Ouagadougou", country: "Burkina Faso", continent: "Afrique" },
  "JNB": { code: "JNB", name: "O.R. Tambo", city: "Johannesburg", country: "Afrique du Sud", continent: "Afrique" },
  "CPT": { code: "CPT", name: "International", city: "Le Cap", country: "Afrique du Sud", continent: "Afrique" },
  "LOS": { code: "LOS", name: "Murtala Muhammed", city: "Lagos", country: "Nigeria", continent: "Afrique" },
  "ADD": { code: "ADD", name: "Bole", city: "Addis-Abeba", country: "Éthiopie", continent: "Afrique" },
  "NBO": { code: "NBO", name: "Jomo Kenyatta", city: "Nairobi", country: "Kenya", continent: "Afrique" },
  "TIP": { code: "TIP", name: "Mitiga", city: "Tripoli", country: "Libye", continent: "Afrique" },
  "NKC": { code: "NKC", name: "Oumtounsy", city: "Nouakchott", country: "Mauritanie", continent: "Afrique" },

  // AMÉRIQUE DU NORD
  "JFK": { code: "JFK", name: "John F. Kennedy", city: "New York", country: "États-Unis", continent: "Amérique du Nord" },
  "EWR": { code: "EWR", name: "Newark Liberty", city: "New York", country: "États-Unis", continent: "Amérique du Nord" },
  "LGA": { code: "LGA", name: "LaGuardia", city: "New York", country: "États-Unis", continent: "Amérique du Nord" },
  "LAX": { code: "LAX", name: "International", city: "Los Angeles", country: "États-Unis", continent: "Amérique du Nord" },
  "SFO": { code: "SFO", name: "International", city: "San Francisco", country: "États-Unis", continent: "Amérique du Nord" },
  "MIA": { code: "MIA", name: "International", city: "Miami", country: "États-Unis", continent: "Amérique du Nord" },
  "ORD": { code: "ORD", name: "O'Hare", city: "Chicago", country: "États-Unis", continent: "Amérique du Nord" },
  "IAD": { code: "IAD", name: "Dulles", city: "Washington", country: "États-Unis", continent: "Amérique du Nord" },
  "ATL": { code: "ATL", name: "Hartsfield-Jackson", city: "Atlanta", country: "États-Unis", continent: "Amérique du Nord" },
  "YYZ": { code: "YYZ", name: "Pearson", city: "Toronto", country: "Canada", continent: "Amérique du Nord" },
  "YUL": { code: "YUL", name: "Pierre Elliott Trudeau", city: "Montréal", country: "Canada", continent: "Amérique du Nord" },
  "YVR": { code: "YVR", name: "International", city: "Vancouver", country: "Canada", continent: "Amérique du Nord" },

  // AMÉRIQUE DU SUD
  "GRU": { code: "GRU", name: "Guarulhos", city: "São Paulo", country: "Brésil", continent: "Amérique du Sud" },
  "GIG": { code: "GIG", name: "Galeão", city: "Rio de Janeiro", country: "Brésil", continent: "Amérique du Sud" },
  "EZE": { code: "EZE", name: "Ezeiza", city: "Buenos Aires", country: "Argentine", continent: "Amérique du Sud" },
  "BOG": { code: "BOG", name: "El Dorado", city: "Bogotá", country: "Colombie", continent: "Amérique du Sud" },
  "SCL": { code: "SCL", name: "Arturo Merino Benítez", city: "Santiago", country: "Chili", continent: "Amérique du Sud" },
  "LIM": { code: "LIM", name: "Jorge Chávez", city: "Lima", country: "Pérou", continent: "Amérique du Sud" },

  // OCÉANIE
  "SYD": { code: "SYD", name: "Kingsford Smith", city: "Sydney", country: "Australie", continent: "Océanie" },
  "MEL": { code: "MEL", name: "Tullamarine", city: "Melbourne", country: "Australie", continent: "Océanie" },
  "BNE": { code: "BNE", name: "Brisbane", city: "Brisbane", country: "Australie", continent: "Océanie" },
  "PER": { code: "PER", name: "Perth", city: "Perth", country: "Australie", continent: "Océanie" },
  "AKL": { code: "AKL", name: "Auckland", city: "Auckland", country: "Nouvelle-Zélande", continent: "Océanie" }
};

// Fonction utilitaire pour valider un code aéroport
export function isValidAirportCode(code: string): boolean {
  return code in AIRPORTS;
}

// Fonction utilitaire pour obtenir les informations d'un aéroport
export function getAirportInfo(code: string): Airport | null {
  return AIRPORTS[code] || null;
}

// Fonction utilitaire pour obtenir le nom complet d'un aéroport
export function getAirportDisplayName(code: string): string {
  const airport = AIRPORTS[code];
  if (!airport) return code;
  return `${airport.name} (${code})`;
}

// Fonction utilitaire pour obtenir la ville d'un aéroport
export function getAirportCity(code: string): string {
  const airport = AIRPORTS[code];
  if (!airport) return code;
  return airport.city;
}

// Fonction pour rechercher des aéroports par ville ou nom
export function searchAirports(query: string): Airport[] {
  const lowerQuery = query.toLowerCase();

  return Object.values(AIRPORTS).filter(airport =>
    airport.code.toLowerCase().includes(lowerQuery) ||
    airport.name.toLowerCase().includes(lowerQuery) ||
    airport.city.toLowerCase().includes(lowerQuery) ||
    airport.country.toLowerCase().includes(lowerQuery)
  ).sort((a, b) => {
    // 1. Exact City Match
    if (a.city.toLowerCase() === lowerQuery && b.city.toLowerCase() !== lowerQuery) return -1;
    if (b.city.toLowerCase() === lowerQuery && a.city.toLowerCase() !== lowerQuery) return 1;

    // 2. City Starts With
    const aCityStart = a.city.toLowerCase().startsWith(lowerQuery);
    const bCityStart = b.city.toLowerCase().startsWith(lowerQuery);
    if (aCityStart && !bCityStart) return -1;
    if (!aCityStart && bCityStart) return 1;

    // 3. Exact Code Match
    if (a.code.toLowerCase() === lowerQuery && b.code.toLowerCase() !== lowerQuery) return -1;
    if (b.code.toLowerCase() === lowerQuery && a.code.toLowerCase() !== lowerQuery) return 1;

    return 0;
  });
}

// Fonction pour obtenir tous les aéroports d'un pays
export function getAirportsByCountry(country: string): Airport[] {
  return Object.values(AIRPORTS).filter(airport =>
    airport.country.toLowerCase() === country.toLowerCase()
  );
}

// Fonction pour obtenir tous les aéroports d'un continent
export function getAirportsByContinent(continent: string): Airport[] {
  return Object.values(AIRPORTS).filter(airport =>
    airport.continent.toLowerCase() === continent.toLowerCase()
  );
}
