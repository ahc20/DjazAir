// Codes IATA des aéroports principaux
export const MAJOR_AIRPORTS = {
  // Europe
  CDG: 'Paris Charles de Gaulle',
  ORY: 'Paris Orly',
  LHR: 'London Heathrow',
  LGW: 'London Gatwick',
  FRA: 'Frankfurt',
  MUC: 'Munich',
  AMS: 'Amsterdam Schiphol',
  MAD: 'Madrid Barajas',
  BCN: 'Barcelona El Prat',
  FCO: 'Rome Fiumicino',
  MXP: 'Milan Malpensa',
  ZRH: 'Zurich',
  VIE: 'Vienna',
  CPH: 'Copenhagen',
  ARN: 'Stockholm Arlanda',
  OSL: 'Oslo Gardermoen',
  HEL: 'Helsinki',
  
  // Afrique du Nord
  ALG: 'Alger Houari Boumediene',
  TUN: 'Tunis Carthage',
  RAK: 'Marrakech Menara',
  CMN: 'Casablanca Mohammed V',
  CAI: 'Cairo International',
  
  // Moyen-Orient
  DXB: 'Dubai International',
  AUH: 'Abu Dhabi International',
  DOH: 'Doha Hamad International',
  IST: 'Istanbul Airport',
  SAW: 'Istanbul Sabiha Gokcen',
  TLV: 'Tel Aviv Ben Gurion',
  AMM: 'Amman Queen Alia',
  BEY: 'Beirut Rafic Hariri',
  
  // Asie
  BKK: 'Bangkok Suvarnabhumi',
  SIN: 'Singapore Changi',
  HKG: 'Hong Kong International',
  NRT: 'Tokyo Narita',
  ICN: 'Seoul Incheon',
  PEK: 'Beijing Capital',
  PVG: 'Shanghai Pudong',
  DEL: 'Delhi Indira Gandhi',
  BOM: 'Mumbai Chhatrapati Shivaji',
  
  // Amériques
  JFK: 'New York JFK',
  LAX: 'Los Angeles International',
  ORD: 'Chicago O\'Hare',
  MIA: 'Miami International',
  YYZ: 'Toronto Pearson',
  YUL: 'Montreal Trudeau',
  GRU: 'São Paulo Guarulhos',
  EZE: 'Buenos Aires Ezeiza',
} as const;

export type AirportCode = keyof typeof MAJOR_AIRPORTS;

export function isValidIATA(code: string): code is AirportCode {
  return /^[A-Z]{3}$/.test(code) && code in MAJOR_AIRPORTS;
}

export function getAirportName(code: string): string {
  if (isValidIATA(code)) {
    return MAJOR_AIRPORTS[code];
  }
  return 'Aéroport inconnu';
}

export function getAirportSuggestions(query: string): AirportCode[] {
  if (!query || query.length < 1) return [];
  
  const upperQuery = query.toUpperCase();
  return Object.keys(MAJOR_AIRPORTS)
    .filter(code => 
      code.includes(upperQuery) || 
      MAJOR_AIRPORTS[code as AirportCode].toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 10) as AirportCode[];
}

export function formatAirportOption(code: AirportCode): string {
  return `${code} - ${MAJOR_AIRPORTS[code]}`;
}
