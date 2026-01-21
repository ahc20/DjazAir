/**
 * Airline logos mapping - Using public CDN URLs for airline logos
 */
export const airlineLogos: Record<string, string> = {
    // African & Middle Eastern Airlines
    AH: "https://images.kiwi.com/airlines/64/AH.png", // Air Algérie
    AT: "https://images.kiwi.com/airlines/64/AT.png", // Royal Air Maroc
    TU: "https://images.kiwi.com/airlines/64/TU.png", // Tunisair
    MS: "https://images.kiwi.com/airlines/64/MS.png", // EgyptAir
    ET: "https://images.kiwi.com/airlines/64/ET.png", // Ethiopian Airlines
    EK: "https://images.kiwi.com/airlines/64/EK.png", // Emirates
    QR: "https://images.kiwi.com/airlines/64/QR.png", // Qatar Airways
    TK: "https://images.kiwi.com/airlines/64/TK.png", // Turkish Airlines
    RJ: "https://images.kiwi.com/airlines/64/RJ.png", // Royal Jordanian
    ME: "https://images.kiwi.com/airlines/64/ME.png", // Middle East Airlines

    // European Airlines
    AF: "https://images.kiwi.com/airlines/64/AF.png", // Air France
    BA: "https://images.kiwi.com/airlines/64/BA.png", // British Airways
    LH: "https://images.kiwi.com/airlines/64/LH.png", // Lufthansa
    IB: "https://images.kiwi.com/airlines/64/IB.png", // Iberia
    AZ: "https://images.kiwi.com/airlines/64/AZ.png", // ITA Airways
    KL: "https://images.kiwi.com/airlines/64/KL.png", // KLM
    LX: "https://images.kiwi.com/airlines/64/LX.png", // Swiss
    OS: "https://images.kiwi.com/airlines/64/OS.png", // Austrian Airlines
    SN: "https://images.kiwi.com/airlines/64/SN.png", // Brussels Airlines
    TP: "https://images.kiwi.com/airlines/64/TP.png", // TAP Portugal

    // Asian Airlines
    CA: "https://images.kiwi.com/airlines/64/CA.png", // Air China
    MU: "https://images.kiwi.com/airlines/64/MU.png", // China Eastern
    CZ: "https://images.kiwi.com/airlines/64/CZ.png", // China Southern
    HU: "https://images.kiwi.com/airlines/64/HU.png", // Hainan Airlines

    // Other
    SU: "https://images.kiwi.com/airlines/64/SU.png", // Aeroflot
    LY: "https://images.kiwi.com/airlines/64/LY.png", // El Al
    "5O": "https://images.kiwi.com/airlines/64/5O.png", // ASL Airlines France
    "50": "https://images.kiwi.com/airlines/64/5O.png", // Alias for ASL (often parsed as 50)
    TO: "https://images.kiwi.com/airlines/64/TO.png", // Transavia France
    XK: "https://images.kiwi.com/airlines/64/XK.png", // Air Corsica
    BJ: "https://images.kiwi.com/airlines/64/BJ.png", // Nouvelair
    PC: "https://images.kiwi.com/airlines/64/PC.png", // Pegasus
    V7: "https://images.kiwi.com/airlines/64/V7.png", // Volotea
    VY: "https://images.kiwi.com/airlines/64/VY.png", // Vueling
    X3: "https://images.kiwi.com/airlines/64/X3.png", // TUI fly
    TB: "https://images.kiwi.com/airlines/64/TB.png", // TUI fly Belgium
    SF: "https://images.kiwi.com/airlines/64/SF.png", // Tassili Airlines
    XY: "https://images.kiwi.com/airlines/64/XY.png", // Flynas
};

/**
 * Get airline logo URL by code
 */
export function getAirlineLogo(code: string): string {
    const normalizedCode = code.toUpperCase().trim();
    return airlineLogos[normalizedCode] || `https://images.kiwi.com/airlines/64/${normalizedCode}.png`;
}

/**
 * Airline names mapping
 */
export const airlineNames: Record<string, string> = {
    AH: "Air Algérie",
    AF: "Air France",
    EK: "Emirates",
    TK: "Turkish Airlines",
    QR: "Qatar Airways",
    ET: "Ethiopian Airlines",
    MS: "EgyptAir",
    RJ: "Royal Jordanian",
    ME: "Middle East Airlines",
    AT: "Royal Air Maroc",
    TU: "Tunisair",
    LY: "El Al",
    SU: "Aeroflot",
    LH: "Lufthansa",
    BA: "British Airways",
    IB: "Iberia",
    AZ: "ITA Airways",
    KL: "KLM",
    LX: "Swiss",
    OS: "Austrian Airlines",
    CA: "Air China",
    MU: "China Eastern",
    CZ: "China Southern",
    HU: "Hainan Airlines",
    VN: "Vietnam Airlines",
    TG: "Thai Airways",
    CX: "Cathay Pacific",
    SQ: "Singapore Airlines",
    MH: "Malaysia Airlines",
    JL: "Japan Airlines",
    NH: "All Nippon Airways",
    KE: "Korean Air",
    EY: "Etihad Airways",
    GF: "Gulf Air",
    WY: "Oman Air",
    SV: "Saudia",
    KU: "Kuwait Airways",
    "5O": "ASL Airlines France",
    "50": "ASL Airlines France", // Alias
    TO: "Transavia France",
    PC: "Pegasus Airlines",
    SN: "Brussels Airlines",
    TP: "TAP Portugal",
    V7: "Volotea",
    VY: "Vueling",
    X3: "TUI fly",
    TB: "TUI fly Belgium",
    SF: "Tassili Airlines",
    XY: "Flynas",
    BJ: "Nouvelair",
    XK: "Air Corsica",
};

/**
 * Get airline name by code
 */
export function getAirlineName(code: string): string {
    const normalizedCode = code.toUpperCase().trim();
    return airlineNames[normalizedCode] || code;
}
