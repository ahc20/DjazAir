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
  // FRANCE
  "CDG": { code: "CDG", name: "Charles de Gaulle", city: "Paris", country: "France", continent: "Europe" },
  "ORY": { code: "ORY", name: "Orly", city: "Paris", country: "France", continent: "Europe" },
  "NCE": { code: "NCE", name: "Côte d'Azur", city: "Nice", country: "France", continent: "Europe" },
  "LYS": { code: "LYS", name: "Lyon-Saint Exupéry", city: "Lyon", country: "France", continent: "Europe" },
  "MRS": { code: "MRS", name: "Marseille Provence", city: "Marseille", country: "France", continent: "Europe" },
  "TLS": { code: "TLS", name: "Toulouse-Blagnac", city: "Toulouse", country: "France", continent: "Europe" },

  // ALGÉRIE
  "ALG": { code: "ALG", name: "Houari Boumediene", city: "Alger", country: "Algérie", continent: "Afrique" },
  "ORN": { code: "ORN", name: "Ahmed Ben Bella", city: "Oran", country: "Algérie", continent: "Afrique" },
  "CZL": { code: "CZL", name: "Mohamed Boudiaf", city: "Constantine", country: "Algérie", continent: "Afrique" },
  "AAE": { code: "AAE", name: "Rabah Bitat", city: "Annaba", country: "Algérie", continent: "Afrique" },

  // CHINE
  "PEK": { code: "PEK", name: "Beijing Capital International", city: "Pékin", country: "Chine", continent: "Asie" },
  "PVG": { code: "PVG", name: "Shanghai Pudong International", city: "Shanghai", country: "Chine", continent: "Asie" },
  "CAN": { code: "CAN", name: "Guangzhou Baiyun International", city: "Canton", country: "Chine", continent: "Asie" },
  "SZX": { code: "SZX", name: "Shenzhen Bao'an International", city: "Shenzhen", country: "Chine", continent: "Asie" },

  // ÉMIRATS ARABES UNIS
  "DXB": { code: "DXB", name: "Dubai International", city: "Dubaï", country: "Émirats Arabes Unis", continent: "Asie" },
  "AUH": { code: "AUH", name: "Abu Dhabi International", city: "Abu Dhabi", country: "Émirats Arabes Unis", continent: "Asie" },

  // QATAR
  "DOH": { code: "DOH", name: "Hamad International", city: "Doha", country: "Qatar", continent: "Asie" },

  // ARABIE SAOUDITE
  "RUH": { code: "RUH", name: "King Khalid International", city: "Riyad", country: "Arabie Saoudite", continent: "Asie" },
  "JED": { code: "JED", name: "King Abdulaziz International", city: "Jeddah", country: "Arabie Saoudite", continent: "Asie" },

  // TURQUIE
  "IST": { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turquie", continent: "Europe" },
  "SAW": { code: "SAW", name: "Sabiha Gökçen International", city: "Istanbul", country: "Turquie", continent: "Europe" },

  // ALLEMAGNE
  "FRA": { code: "FRA", name: "Frankfurt am Main", city: "Francfort", country: "Allemagne", continent: "Europe" },
  "MUC": { code: "MUC", name: "Munich", city: "Munich", country: "Allemagne", continent: "Europe" },
  "BER": { code: "BER", name: "Brandenburg", city: "Berlin", country: "Allemagne", continent: "Europe" },

  // ROYAUME-UNI
  "LHR": { code: "LHR", name: "Heathrow", city: "Londres", country: "Royaume-Uni", continent: "Europe" },
  "LGW": { code: "LGW", name: "Gatwick", city: "Londres", country: "Royaume-Uni", continent: "Europe" },
  "STN": { code: "STN", name: "Stansted", city: "Londres", country: "Royaume-Uni", continent: "Europe" },

  // ESPAGNE
  "MAD": { code: "MAD", name: "Adolfo Suárez Madrid-Barajas", city: "Madrid", country: "Espagne", continent: "Europe" },
  "BCN": { code: "BCN", name: "Josep Tarradellas Barcelona-El Prat", city: "Barcelone", country: "Espagne", continent: "Europe" },

  // ITALIE
  "FCO": { code: "FCO", name: "Leonardo da Vinci-Fiumicino", city: "Rome", country: "Italie", continent: "Europe" },
  "MXP": { code: "MXP", name: "Milano Malpensa", city: "Milan", country: "Italie", continent: "Europe" },

  // MAROC
  "CMN": { code: "CMN", name: "Mohammed V International", city: "Casablanca", country: "Maroc", continent: "Afrique" },
  "RAK": { code: "RAK", name: "Marrakech Menara", city: "Marrakech", country: "Maroc", continent: "Afrique" },

  // TUNISIE
  "TUN": { code: "TUN", name: "Tunis-Carthage International", city: "Tunis", country: "Tunisie", continent: "Afrique" },

  // ÉGYPTE
  "CAI": { code: "CAI", name: "Cairo International", city: "Le Caire", country: "Égypte", continent: "Afrique" },

  // ÉTATS-UNIS
  "JFK": { code: "JFK", name: "John F. Kennedy International", city: "New York", country: "États-Unis", continent: "Amérique du Nord" },
  "LAX": { code: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "États-Unis", continent: "Amérique du Nord" },
  "MIA": { code: "MIA", name: "Miami International", city: "Miami", country: "États-Unis", continent: "Amérique du Nord" },

  // CANADA
  "YYZ": { code: "YYZ", name: "Toronto Pearson International", city: "Toronto", country: "Canada", continent: "Amérique du Nord" },
  "YUL": { code: "YUL", name: "Pierre Elliott Trudeau International", city: "Montréal", country: "Canada", continent: "Amérique du Nord" },

  // JAPON
  "NRT": { code: "NRT", name: "Narita International", city: "Tokyo", country: "Japon", continent: "Asie" },
  "HND": { code: "HND", name: "Tokyo Haneda", city: "Tokyo", country: "Japon", continent: "Asie" },

  // SINGAPOUR
  "SIN": { code: "SIN", name: "Singapore Changi", city: "Singapour", country: "Singapour", continent: "Asie" },

  // AUSTRALIE
  "SYD": { code: "SYD", name: "Sydney Kingsford Smith", city: "Sydney", country: "Australie", continent: "Océanie" },
  "MEL": { code: "MEL", name: "Melbourne", city: "Melbourne", country: "Australie", continent: "Océanie" },

  // INDE
  "DEL": { code: "DEL", name: "Indira Gandhi International", city: "New Delhi", country: "Inde", continent: "Asie" },
  "BOM": { code: "BOM", name: "Chhatrapati Shivaji Maharaj International", city: "Mumbai", country: "Inde", continent: "Asie" },

  // RUSSIE
  "SVO": { code: "SVO", name: "Sheremetyevo International", city: "Moscou", country: "Russie", continent: "Europe" },

  // BRÉSIL
  "GRU": { code: "GRU", name: "São Paulo-Guarulhos International", city: "São Paulo", country: "Brésil", continent: "Amérique du Sud" },

  // AFRIQUE DU SUD
  "CPT": { code: "CPT", name: "Cape Town International", city: "Le Cap", country: "Afrique du Sud", continent: "Afrique" },
  "JNB": { code: "JNB", name: "OR Tambo International", city: "Johannesburg", country: "Afrique du Sud", continent: "Afrique" },

  // CORÉE DU SUD
  "ICN": { code: "ICN", name: "Incheon International", city: "Séoul", country: "Corée du Sud", continent: "Asie" },

  // THAÏLANDE
  "BKK": { code: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "Thaïlande", continent: "Asie" },

  // MALAISIE
  "KUL": { code: "KUL", name: "Kuala Lumpur International", city: "Kuala Lumpur", country: "Malaisie", continent: "Asie" },

  // INDONÉSIE
  "CGK": { code: "CGK", name: "Soekarno-Hatta International", city: "Jakarta", country: "Indonésie", continent: "Asie" },

  // PAYS-BAS
  "AMS": { code: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Pays-Bas", continent: "Europe" },

  // SUISSE
  "ZUR": { code: "ZUR", name: "Zurich Airport", city: "Zurich", country: "Suisse", continent: "Europe" },

  // AUTRICHE
  "VIE": { code: "VIE", name: "Vienna International Airport", city: "Vienne", country: "Autriche", continent: "Europe" },

  // BELGIQUE
  "BRU": { code: "BRU", name: "Brussels Airport", city: "Bruxelles", country: "Belgique", continent: "Europe" },

  // PORTUGAL
  "LIS": { code: "LIS", name: "Humberto Delgado Airport", city: "Lisbonne", country: "Portugal", continent: "Europe" },

  // GRÈCE
  "ATH": { code: "ATH", name: "Athens International Airport", city: "Athènes", country: "Grèce", continent: "Europe" },

  // POLOGNE
  "WAW": { code: "WAW", name: "Warsaw Chopin Airport", city: "Varsovie", country: "Pologne", continent: "Europe" },

  // RÉPUBLIQUE TCHÈQUE
  "PRG": { code: "PRG", name: "Václav Havel Airport Prague", city: "Prague", country: "République Tchèque", continent: "Europe" },

  // HONGRIE
  "BUD": { code: "BUD", name: "Budapest Ferenc Liszt International Airport", city: "Budapest", country: "Hongrie", continent: "Europe" },

  // NORVÈGE
  "OSL": { code: "OSL", name: "Oslo Airport", city: "Oslo", country: "Norvège", continent: "Europe" },

  // SUÈDE
  "ARN": { code: "ARN", name: "Stockholm Arlanda Airport", city: "Stockholm", country: "Suède", continent: "Europe" },

  // DANEMARK
  "CPH": { code: "CPH", name: "Copenhagen Airport", city: "Copenhague", country: "Danemark", continent: "Europe" },

  // FINLANDE
  "HEL": { code: "HEL", name: "Helsinki Airport", city: "Helsinki", country: "Finlande", continent: "Europe" },

  // IRLANDE
  "DUB": { code: "DUB", name: "Dublin Airport", city: "Dublin", country: "Irlande", continent: "Europe" },

  // IRAN
  "IKA": { code: "IKA", name: "Imam Khomeini International Airport", city: "Téhéran", country: "Iran", continent: "Asie" },

  // IRAK
  "BGW": { code: "BGW", name: "Baghdad International Airport", city: "Bagdad", country: "Irak", continent: "Asie" },

  // ISRAËL
  "TLV": { code: "TLV", name: "Ben Gurion Airport", city: "Tel Aviv", country: "Israël", continent: "Asie" },

  // JORDANIE
  "AMM": { code: "AMM", name: "Queen Alia International Airport", city: "Amman", country: "Jordanie", continent: "Asie" },

  // LIBAN
  "BEY": { code: "BEY", name: "Rafic Hariri International Airport", city: "Beyrouth", country: "Liban", continent: "Asie" },

  // PHILIPPINES
  "MNL": { code: "MNL", name: "Ninoy Aquino International Airport", city: "Manille", country: "Philippines", continent: "Asie" },

  // VIETNAM
  "SGN": { code: "SGN", name: "Tan Son Nhat International Airport", city: "Ho Chi Minh-Ville", country: "Vietnam", continent: "Asie" },
  "HAN": { code: "HAN", name: "Noi Bai International Airport", city: "Hanoï", country: "Vietnam", continent: "Asie" },

  // CAMBODGE
  "PNH": { code: "PNH", name: "Phnom Penh International Airport", city: "Phnom Penh", country: "Cambodge", continent: "Asie" },

  // MEXIQUE
  "MEX": { code: "MEX", name: "Mexico City International Airport", city: "Mexico", country: "Mexique", continent: "Amérique du Nord" },

  // ARGENTINE
  "EZE": { code: "EZE", name: "Ezeiza International Airport", city: "Buenos Aires", country: "Argentine", continent: "Amérique du Sud" },

  // CHILI
  "SCL": { code: "SCL", name: "Arturo Merino Benítez International Airport", city: "Santiago", country: "Chili", continent: "Amérique du Sud" },

  // PÉROU
  "LIM": { code: "LIM", name: "Jorge Chávez International Airport", city: "Lima", country: "Pérou", continent: "Amérique du Sud" },

  // COLOMBIE
  "BOG": { code: "BOG", name: "El Dorado International Airport", city: "Bogotá", country: "Colombie", continent: "Amérique du Sud" },

  // VENEZUELA
  "CCS": { code: "CCS", name: "Simón Bolívar International Airport", city: "Caracas", country: "Venezuela", continent: "Amérique du Sud" },

  // ÉQUATEUR
  "UIO": { code: "UIO", name: "Mariscal Sucre International Airport", city: "Quito", country: "Équateur", continent: "Amérique du Sud" },

  // NIGERIA
  "LOS": { code: "LOS", name: "Murtala Muhammed International Airport", city: "Lagos", country: "Nigeria", continent: "Afrique" },

  // KENYA
  "NBO": { code: "NBO", name: "Jomo Kenyatta International Airport", city: "Nairobi", country: "Kenya", continent: "Afrique" },

  // ÉTHIOPIE
  "ADD": { code: "ADD", name: "Addis Ababa Bole International Airport", city: "Addis-Abeba", country: "Éthiopie", continent: "Afrique" },

  // GHANA
  "ACC": { code: "ACC", name: "Kotoka International Airport", city: "Accra", country: "Ghana", continent: "Afrique" },

  // SÉNÉGAL
  "DKR": { code: "DKR", name: "Blaise Diagne International Airport", city: "Dakar", country: "Sénégal", continent: "Afrique" },

  // CÔTE D'IVOIRE
  "ABJ": { code: "ABJ", name: "Félix-Houphouët-Boigny International Airport", city: "Abidjan", country: "Côte d'Ivoire", continent: "Afrique" },

  // CAMEROUN
  "DLA": { code: "DLA", name: "Douala International Airport", city: "Douala", country: "Cameroun", continent: "Afrique" },

  // MADAGASCAR
  "TNR": { code: "TNR", name: "Ivato Airport", city: "Antananarivo", country: "Madagascar", continent: "Afrique" },

  // ÎLE MAURICE
  "MRU": { code: "MRU", name: "Sir Seewoosagur Ramgoolam International Airport", city: "Port Louis", country: "Île Maurice", continent: "Afrique" },

  // SEYCHELLES
  "SEZ": { code: "SEZ", name: "Seychelles International Airport", city: "Victoria", country: "Seychelles", continent: "Afrique" },

  // NOUVELLE-ZÉLANDE
  "AKL": { code: "AKL", name: "Auckland Airport", city: "Auckland", country: "Nouvelle-Zélande", continent: "Océanie" },

  // FIDJI
  "NAN": { code: "NAN", name: "Nadi International Airport", city: "Nadi", country: "Fidji", continent: "Océanie" },

  // PAPOUASIE-NOUVELLE-GUINÉE
  "POM": { code: "POM", name: "Jacksons International Airport", city: "Port Moresby", country: "Papouasie-Nouvelle-Guinée", continent: "Océanie" }
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
  );
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
