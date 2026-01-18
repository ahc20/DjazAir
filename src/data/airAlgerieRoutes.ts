/**
 * Air Algérie Valid Routes - Only real destinations from Algiers (ALG)
 * Source: Public timetable information from Air Algérie
 * Last updated: January 2026
 * 
 * IMPORTANT: This list should be regularly updated from official sources
 */

export interface AirAlgerieRoute {
    destination: string;
    destinationName: string;
    country: string;
    region: 'europe' | 'middle_east' | 'africa' | 'asia';
    frequency: 'daily' | 'weekly' | 'seasonal';
}

/**
 * Valid Air Algérie destinations from Algiers (ALG)
 */
export const airAlgerieRoutesFromALG: AirAlgerieRoute[] = [
    // FRANCE
    { destination: 'CDG', destinationName: 'Paris Charles de Gaulle', country: 'France', region: 'europe', frequency: 'daily' },
    { destination: 'ORY', destinationName: 'Paris Orly', country: 'France', region: 'europe', frequency: 'daily' },
    { destination: 'LYS', destinationName: 'Lyon', country: 'France', region: 'europe', frequency: 'daily' },
    { destination: 'MRS', destinationName: 'Marseille', country: 'France', region: 'europe', frequency: 'daily' },
    { destination: 'NCE', destinationName: 'Nice', country: 'France', region: 'europe', frequency: 'weekly' },
    { destination: 'TLS', destinationName: 'Toulouse', country: 'France', region: 'europe', frequency: 'weekly' },
    { destination: 'BOD', destinationName: 'Bordeaux', country: 'France', region: 'europe', frequency: 'weekly' },
    { destination: 'NTE', destinationName: 'Nantes', country: 'France', region: 'europe', frequency: 'weekly' },
    { destination: 'LIL', destinationName: 'Lille', country: 'France', region: 'europe', frequency: 'weekly' },
    { destination: 'MLH', destinationName: 'Mulhouse', country: 'France', region: 'europe', frequency: 'weekly' },
    { destination: 'SXB', destinationName: 'Strasbourg', country: 'France', region: 'europe', frequency: 'weekly' },
    { destination: 'MPL', destinationName: 'Montpellier', country: 'France', region: 'europe', frequency: 'weekly' },

    // AUTRES PAYS EUROPÉENS
    { destination: 'LHR', destinationName: 'Londres Heathrow', country: 'UK', region: 'europe', frequency: 'daily' },
    { destination: 'BRU', destinationName: 'Bruxelles', country: 'Belgique', region: 'europe', frequency: 'daily' },
    { destination: 'FRA', destinationName: 'Francfort', country: 'Allemagne', region: 'europe', frequency: 'daily' },
    { destination: 'GVA', destinationName: 'Genève', country: 'Suisse', region: 'europe', frequency: 'weekly' },
    { destination: 'ZRH', destinationName: 'Zürich', country: 'Suisse', region: 'europe', frequency: 'weekly' },
    { destination: 'MAD', destinationName: 'Madrid', country: 'Espagne', region: 'europe', frequency: 'weekly' },
    { destination: 'BCN', destinationName: 'Barcelone', country: 'Espagne', region: 'europe', frequency: 'weekly' },
    { destination: 'FCO', destinationName: 'Rome', country: 'Italie', region: 'europe', frequency: 'weekly' },
    { destination: 'MXP', destinationName: 'Milan', country: 'Italie', region: 'europe', frequency: 'weekly' },
    { destination: 'VIE', destinationName: 'Vienne', country: 'Autriche', region: 'europe', frequency: 'weekly' },
    { destination: 'IST', destinationName: 'Istanbul', country: 'Turquie', region: 'europe', frequency: 'daily' },

    // MOYEN-ORIENT
    { destination: 'DXB', destinationName: 'Dubaï', country: 'EAU', region: 'middle_east', frequency: 'daily' },
    { destination: 'DOH', destinationName: 'Doha', country: 'Qatar', region: 'middle_east', frequency: 'weekly' },
    { destination: 'JED', destinationName: 'Djeddah', country: 'Arabie Saoudite', region: 'middle_east', frequency: 'daily' },
    { destination: 'RUH', destinationName: 'Riyad', country: 'Arabie Saoudite', region: 'middle_east', frequency: 'weekly' },
    { destination: 'AMM', destinationName: 'Amman', country: 'Jordanie', region: 'middle_east', frequency: 'weekly' },
    { destination: 'BEY', destinationName: 'Beyrouth', country: 'Liban', region: 'middle_east', frequency: 'weekly' },

    // AFRIQUE DU NORD
    { destination: 'TUN', destinationName: 'Tunis', country: 'Tunisie', region: 'africa', frequency: 'daily' },
    { destination: 'CMN', destinationName: 'Casablanca', country: 'Maroc', region: 'africa', frequency: 'daily' },
    { destination: 'CAI', destinationName: 'Le Caire', country: 'Égypte', region: 'africa', frequency: 'weekly' },
    { destination: 'TIP', destinationName: 'Tripoli', country: 'Libye', region: 'africa', frequency: 'weekly' },
    { destination: 'NKC', destinationName: 'Nouakchott', country: 'Mauritanie', region: 'africa', frequency: 'weekly' },

    // AFRIQUE SUBSAHARIENNE
    { destination: 'DSS', destinationName: 'Dakar', country: 'Sénégal', region: 'africa', frequency: 'weekly' },
    { destination: 'ABJ', destinationName: 'Abidjan', country: 'Côte d\'Ivoire', region: 'africa', frequency: 'weekly' },
    { destination: 'BKO', destinationName: 'Bamako', country: 'Mali', region: 'africa', frequency: 'weekly' },
    { destination: 'NIM', destinationName: 'Niamey', country: 'Niger', region: 'africa', frequency: 'weekly' },
    { destination: 'OUA', destinationName: 'Ouagadougou', country: 'Burkina Faso', region: 'africa', frequency: 'weekly' },

    // ASIE (destinations limitées)
    { destination: 'PEK', destinationName: 'Pékin', country: 'Chine', region: 'asia', frequency: 'weekly' },
];

/**
 * Valid destinations TO Algiers
 */
export const airAlgerieRoutesToALG: string[] = airAlgerieRoutesFromALG.map(r => r.destination);

/**
 * Check if a route from ALG to destination is valid
 */
export function isValidAirAlgerieRoute(destination: string): boolean {
    return airAlgerieRoutesToALG.includes(destination.toUpperCase());
}

/**
 * Check if a route TO ALG is valid (same as from, bidirectional)
 */
export function isValidRouteToAlgiers(origin: string): boolean {
    return airAlgerieRoutesToALG.includes(origin.toUpperCase());
}

/**
 * Get all valid destinations from Algiers
 */
export function getValidDestinationsFromALG(): string[] {
    return [...airAlgerieRoutesToALG];
}

/**
 * Get route info for a destination
 */
export function getRouteInfo(destination: string): AirAlgerieRoute | undefined {
    return airAlgerieRoutesFromALG.find(r => r.destination === destination.toUpperCase());
}

/**
 * Check if a complete DjazAir route is feasible
 * Origin -> ALG -> Destination
 * Both legs must be valid Air Algérie routes
 */
export function isValidDjazAirRoute(origin: string, destination: string): boolean {
    const originValid = isValidRouteToAlgiers(origin);
    const destinationValid = isValidAirAlgerieRoute(destination);
    return originValid && destinationValid;
}

/**
 * Get list of valid DjazAir destinations from a given origin
 */
export function getValidDjazAirDestinations(origin: string): string[] {
    if (!isValidRouteToAlgiers(origin)) {
        return [];
    }
    // All destinations from ALG are valid DjazAir destinations (except origin itself)
    return airAlgerieRoutesToALG.filter(dest => dest !== origin.toUpperCase());
}
