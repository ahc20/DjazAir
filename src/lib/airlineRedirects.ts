export interface AirlineRedirect {
  name: string;
  website: string;
  searchUrl: string;
  logo?: string;
}

export interface FlightSegment {
  origin: string;
  destination: string;
  date: string;
  passengers: number;
}

/**
 * Génère les URLs de recherche pour les vraies compagnies aériennes
 */
export function getAirlineRedirects(
  segments: FlightSegment[],
  cabinClass: string = "Economy"
): AirlineRedirect[] {
  const redirects: AirlineRedirect[] = [];

  // Compagnies principales pour les vols vers l'Algérie
  const algeriaAirlines: AirlineRedirect[] = [
    {
      name: "Air Algérie",
      website: "https://www.airalgerie.dz",
      searchUrl: "https://www.airalgerie.dz/fr/vols/recherche",
      logo: "🇩🇿",
    },
    {
      name: "Air France",
      website: "https://www.airfrance.fr",
      searchUrl: "https://www.airfrance.fr/fr/recherche-vols",
      logo: "🇫🇷",
    },
    {
      name: "Tassili Airlines",
      website: "https://www.tassiliairlines.dz",
      searchUrl: "https://www.tassiliairlines.dz/fr/vols",
      logo: "🇩🇿",
    },
  ];

  // Compagnies pour les vols depuis l'Algérie vers le Moyen-Orient
  const middleEastAirlines: AirlineRedirect[] = [
    {
      name: "Emirates",
      website: "https://www.emirates.com",
      searchUrl: "https://www.emirates.com/fr/french/",
      logo: "🇦🇪",
    },
    {
      name: "Qatar Airways",
      website: "https://www.qatarairways.com",
      searchUrl: "https://www.qatarairways.com/fr-fr/",
      logo: "🇶🇦",
    },
    {
      name: "Etihad Airways",
      website: "https://www.etihad.com",
      searchUrl: "https://www.etihad.com/fr/",
      logo: "🇦🇪",
    },
    {
      name: "Turkish Airlines",
      website: "https://www.turkishairlines.com",
      searchUrl: "https://www.turkishairlines.com/fr-fr/",
      logo: "🇹🇷",
    },
    {
      name: "EgyptAir",
      website: "https://www.egyptair.com",
      searchUrl: "https://www.egyptair.com/fr/",
      logo: "🇪🇬",
    },
  ];

  // Ajouter les compagnies pour chaque segment
  segments.forEach((segment, index) => {
    if (index === 0) {
      // Premier segment : vers l'Algérie
      redirects.push(...algeriaAirlines);
    } else {
      // Deuxième segment : depuis l'Algérie
      redirects.push(...middleEastAirlines);
    }
  });

  return redirects;
}

/**
 * Génère une URL de recherche avec paramètres pour une compagnie spécifique
 */
export function generateSearchUrl(
  airline: AirlineRedirect,
  segment: FlightSegment,
  cabinClass: string
): string {
  const { origin, destination, date, passengers } = segment;
  
  // Format de date pour les URLs (YYYY-MM-DD)
  const formattedDate = date;
  
  // Paramètres de base pour chaque compagnie
  const baseParams = {
    origin: origin,
    destination: destination,
    date: formattedDate,
    passengers: passengers.toString(),
    cabin: cabinClass.toLowerCase(),
  };

  // URLs spécifiques pour chaque compagnie
  switch (airline.name.toLowerCase()) {
    case "air algérie":
      return `${airline.searchUrl}?from=${origin}&to=${destination}&date=${formattedDate}&passengers=${passengers}`;
    
    case "air france":
      return `${airline.searchUrl}?departure=${origin}&arrival=${destination}&date=${formattedDate}&passengers=${passengers}`;
    
    case "emirates":
      return `${airline.searchUrl}?from=${origin}&to=${destination}&date=${formattedDate}&adults=${passengers}`;
    
    case "qatar airways":
      return `${airline.searchUrl}?from=${origin}&to=${destination}&date=${formattedDate}&adults=${passengers}`;
    
    case "turkish airlines":
      return `${airline.searchUrl}?from=${origin}&to=${destination}&date=${formattedDate}&adults=${passengers}`;
    
    default:
      // URL générique avec paramètres
      return `${airline.searchUrl}?origin=${origin}&destination=${destination}&date=${formattedDate}&passengers=${passengers}`;
  }
}

/**
 * Ouvre une nouvelle fenêtre avec la recherche de vol
 */
export function openAirlineSearch(
  airline: AirlineRedirect,
  segment: FlightSegment,
  cabinClass: string
): void {
  const searchUrl = generateSearchUrl(airline, segment, cabinClass);
  
  // Ouvrir dans une nouvelle fenêtre
  window.open(searchUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Ouvre tous les sites des compagnies dans des onglets séparés
 */
export function openAllAirlines(
  segments: FlightSegment[],
  cabinClass: string
): void {
  const redirects = getAirlineRedirects(segments, cabinClass);
  
  redirects.forEach((airline, index) => {
    const segment = segments[index % segments.length];
    setTimeout(() => {
      openAirlineSearch(airline, segment, cabinClass);
    }, index * 500); // Délai de 500ms entre chaque ouverture
  });
}
