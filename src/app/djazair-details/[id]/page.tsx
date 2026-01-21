"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DjazAirFlight } from "@/types/djazair";
import {
  getAirlineRedirects,
  openAirlineSearch,
  openAllAirlines,
  type AirlineRedirect,
  type FlightSegment as RedirectSegment
} from "@/lib/airlineRedirects";
import { getAirlineLogo, getAirlineName } from "@/data/airlineLogos";
import { DjazAirLogo } from "@/components/ui/DjazAirLogo";
import Image from "next/image";

// Extended type with comparison data
interface DjazAirFlightWithComparison extends DjazAirFlight {
  classicPriceReference?: number | null;
  actualSavings?: number | null;
}

export default function DjazAirDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [flight, setFlight] = useState<DjazAirFlightWithComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [realPriceData, setRealPriceData] = useState<{ priceDZD: number; priceEUR: number } | null>(null);
  const [checkingPrice, setCheckingPrice] = useState(false);

  useEffect(() => {
    const storedFlight = localStorage.getItem(`djazair-flight-${params.id}`);
    if (storedFlight) {
      const parsedFlight = JSON.parse(storedFlight);
      setFlight(parsedFlight);
      setLoading(false);

      // Trigger real price check
      checkRealPrice(parsedFlight);
    } else {
      router.push('/search');
    }
  }, [params.id, router]);

  const [verifiedSegments, setVerifiedSegments] = useState<Record<string, { priceDZD: number; priceEUR: number }>>({});

  // Calculate total price dynamically
  const displayedTotalPrice = React.useMemo(() => {
    if (!flight) return 0;
    return flight.segments.reduce((total, segment, index) => {
      const verified = verifiedSegments[index];
      return total + (verified ? verified.priceEUR : segment.priceEUR);
    }, 0);
  }, [flight, verifiedSegments]);

  const checkRealPrice = async (flightData: DjazAirFlightWithComparison) => {
    setCheckingPrice(true);
    try {
      // Find segments that need verification (DZD segments)
      // Usually segments departing from or arriving at ALG depending on direction, AND priced in DZD
      // For simplicity in this iteration: Verify the segment that has priceDZD or is the "long leg" from ALG

      const dzdSegmentIndex = flightData.segments.findIndex(s => s.currency === 'DZD' || s.priceDZD);

      if (dzdSegmentIndex !== -1) {
        const segment = flightData.segments[dzdSegmentIndex];
        const res = await fetch('/api/check-real-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: segment.origin,
            destination: segment.destination,
            departureDate: segment.departureTime,
            // No return date for single segment check usually, unless it's a RT ticket
            // If it's part of a RT loop, we might need to check RT price?
            // For "4 reservations separated", we check One-Way usually.
          })
        });
        const data = await res.json();
        if (data.success) {
          setVerifiedSegments(prev => ({
            ...prev,
            [dzdSegmentIndex]: data.data
          }));
          // Set realPriceData purely for the badge logic, but value comes from displayedTotalPrice
          setRealPriceData({
            priceDZD: data.data.priceDZD,
            priceEUR: data.data.priceEUR // This is just the segment price, don't use as total
          });
        }
      } else {
        // Fallback: if no specific DZD segment marked, maybe try the whole route if it was a simple search
        // But for consistent addition, we should probably stick to segment logic.
      }

    } catch (error) {
      console.error("Error checking real price", error);
    } finally {
      setCheckingPrice(false);
    }
  };

  // Helper to generate Google Flights URL
  const generateGoogleFlightsUrl = (origin: string, destination: string, date: Date, airlineName?: string): string => {
    const day = date.getDate().toString();
    const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const monthName = monthNames[date.getMonth()];
    const year = date.getFullYear();

    let searchQuery = `vol+aller+simple+${origin}+${destination}+${day}+${monthName}+${year}`;
    if (airlineName) {
      searchQuery = `vol+aller+simple+${encodeURIComponent(airlineName)}+${origin}+${destination}+${day}+${monthName}+${year}`;
    }

    return `https://www.google.com/travel/flights?q=${searchQuery}&curr=EUR&hl=fr`;
  };

  // Generate deep link URL for airline booking with prefilled data
  const generateBookingUrl = (segment: DjazAirFlightWithComparison['segments'][0]): string => {
    const origin = segment.origin;
    const destination = segment.destination;
    const departureDate = new Date(segment.departureTime);
    const dateStr = segment.departureTime.split('T')[0]; // YYYY-MM-DD
    const day = departureDate.getDate().toString().padStart(2, '0');
    const month = (departureDate.getMonth() + 1).toString().padStart(2, '0');
    const year = departureDate.getFullYear();
    const airlineName = segment.airline; // Keep original case for display match if needed
    const airlineCode = extractAirlineCode(segment.flightNumber);
    const airlineNameLower = airlineName.toLowerCase();

    // Air Algérie - Google Flights fallback due to session token requirement
    if (airlineNameLower.includes('air algérie') || airlineCode === 'AH') {
      return generateGoogleFlightsUrl(origin, destination, departureDate, 'Air Algérie');
    }

    // Air France - Google Flights fallback
    if (airlineNameLower.includes('air france') || airlineCode === 'AF') {
      return generateGoogleFlightsUrl(origin, destination, departureDate, 'Air France');
    }

    // ASL Airlines France - Google Flights fallback (User request due to session complexity)
    if (airlineNameLower.includes('asl') || airlineCode === '5O') {
      return generateGoogleFlightsUrl(origin, destination, departureDate, 'ASL Airlines');
    }

    // Transavia - Keep direct link, usually robust
    if (airlineNameLower.includes('transavia') || airlineCode === 'TO' || airlineCode === 'HV') {
      return `https://www.transavia.com/fr-FR/reservez-un-vol/vols/recherche/?` +
        `routeSelection=SINGLE&flyingFrom%5B%5D=${origin}&flyingTo%5B%5D=${destination}&` +
        `outboundDate=${year}-${month}-${day}&adultCount=1&childCount=0&infantCount=0`;
    }

    // Emirates
    if (airlineNameLower.includes('emirates') || airlineCode === 'EK') {
      return `https://www.emirates.com/fr/french/flight-booking-select.aspx?` +
        `departure=${origin}&arrival=${destination}&` +
        `depDate=${year}${month}${day}&tripType=O&adult=1&child=0&infant=0`;
    }

    // Qatar Airways
    if (airlineNameLower.includes('qatar') || airlineCode === 'QR') {
      return `https://www.qatarairways.com/fr-fr/booking/book-a-trip.html?` +
        `from=${origin}&to=${destination}&` +
        `departing=${year}-${month}-${day}&adults=1&children=0&infants=0&tripType=O`;
    }

    // Turkish Airlines
    if (airlineNameLower.includes('turkish') || airlineCode === 'TK') {
      return `https://www.turkishairlines.com/fr-fr/flights/booking/?` +
        `origin=${origin}&destination=${destination}&` +
        `departureDate=${dateStr}&adults=1&children=0&infants=0`;
    }

    // Etihad Airways
    if (airlineNameLower.includes('etihad') || airlineCode === 'EY') {
      return `https://www.etihad.com/fr/fly-etihad/book-your-flight?` +
        `origin=${origin}&destination=${destination}&` +
        `outboundDate=${year}${month}${day}&tripType=oneWay&adults=1`;
    }

    // Royal Air Maroc
    if (airlineNameLower.includes('royal air maroc') || airlineCode === 'AT') {
      return `https://www.royalairmaroc.com/fr-fr/booking?` +
        `origin=${origin}&destination=${destination}&` +
        `departureDate=${year}-${month}-${day}&adults=1&type=oneWay`;
    }

    // EgyptAir
    if (airlineNameLower.includes('egyptair') || airlineCode === 'MS') {
      return `https://www.egyptair.com/en/fly/book-flight?` +
        `departure=${origin}&arrival=${destination}&` +
        `date=${year}-${month}-${day}&adults=1`;
    }

    // Tassili Airlines - Google Flights fallback often better than their site
    if (airlineNameLower.includes('tassili') || airlineCode === 'SF') {
      return generateGoogleFlightsUrl(origin, destination, departureDate, 'Tassili Airlines');
    }

    // Fallback: Google Flights with precise search logic
    return generateGoogleFlightsUrl(origin, destination, departureDate);
  };

  // Extract airline code from flightNumber (e.g., "AF1655" -> "AF", "5O271" -> "5O")
  const extractAirlineCode = (flightNumber: string): string => {
    // Extract first 2 characters which represents the IATA code
    // This handles "AH4062" -> "AH" correctly instead of "AH4"
    return flightNumber.substring(0, 2).toUpperCase();
  };

  const handleOpenSegment = (segmentIndex: number) => {
    if (!flight) return;
    const segment = flight.segments[segmentIndex];
    const bookingUrl = generateBookingUrl(segment);
    window.open(bookingUrl, '_blank');
  };

  const handleBookAll = () => {
    if (!flight) return;
    setIsOpening(true);

    flight.segments.forEach((segment, index) => {
      setTimeout(() => {
        handleOpenSegment(index);
      }, index * 800);
    });

    setTimeout(() => {
      setIsOpening(false);
    }, flight.segments.length * 800 + 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-4 border-emerald-600 border-t-transparent mx-auto mb-6"></div>
          <p className="text-xl font-semibold text-emerald-900">🔍 Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (!flight) return null;

  const isRoundTrip = !!flight.returnDate;

  // Group segments logic
  const groupedSegments: any[] = [];
  if (flight) {
    for (let i = 0; i < flight.segments.length; i++) {
      const current = flight.segments[i];
      const next = flight.segments[i + 1];

      const currentAirlineCode = extractAirlineCode(current.flightNumber);
      const nextAirlineCode = next ? extractAirlineCode(next.flightNumber) : null;

      // Check if we can group with next segment (Round Trip)
      // Criteria: Same airline, A->B then B->A
      if (next &&
        currentAirlineCode === nextAirlineCode &&
        current.destination === next.origin &&
        current.origin === next.destination) {
        groupedSegments.push({
          type: 'round-trip',
          outbound: current,
          inbound: next,
          airlineCode: currentAirlineCode,
          originalIndex: i
        });
        i++;
      } else {
        groupedSegments.push({
          type: 'one-way',
          segment: current,
          airlineCode: currentAirlineCode,
          originalIndex: i
        });
      }
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header cohérent avec la homepage */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <DjazAirLogo className="h-8 w-8" />
              <span className="font-bold text-emerald-900 text-lg">DjazAir</span>
            </a>
            <button
              onClick={() => router.back()}
              className="text-sm text-stone-600 hover:text-emerald-600 font-medium transition-colors"
            >
              ← Retour
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header Principal */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-stone-100">
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 p-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 text-blue-100 mb-1">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-sm font-medium">
                    {isRoundTrip ? 'Aller-Retour' : 'Aller Simple'}
                  </span>
                  <span className="text-sm">• {flight.totalDuration}</span>
                </div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <span>{flight.origin}</span>
                  <span className="text-blue-200">✈</span>
                  <span>{flight.destination}</span>
                </h1>
                <p className="text-blue-100 mt-1">
                  Via Alger (ALG) • Économie DjazAir
                </p>
              </div>
              <div className="text-right bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <div className="text-sm text-blue-100 mb-1 flex items-center justify-end gap-2">
                  <span>Prix total {realPriceData ? 'réel' : 'estimé'}</span>
                  {checkingPrice && <span className="animate-pulse text-xs bg-white/20 px-1 rounded">Vérification...</span>}
                  {realPriceData && <span className="text-xs bg-green-500 text-white px-1 rounded font-bold">Vérifié ✅</span>}
                </div>
                <div className="text-4xl font-bold">
                  {displayedTotalPrice.toFixed(2)}€
                </div>
                {Object.keys(verifiedSegments).length > 0 ? (
                  (flight.classicPriceReference && (flight.classicPriceReference - displayedTotalPrice) > 0) ? (
                    <div className="text-green-300 font-bold text-sm bg-green-900/30 px-2 py-1 rounded inline-block mt-1">
                      <span className="block text-xs text-green-200">
                        Économie réelle: {(flight.classicPriceReference - displayedTotalPrice).toFixed(0)}€
                      </span>
                    </div>
                  ) : null
                ) : (
                  flight.actualSavings !== null && flight.actualSavings !== undefined ? (
                    flight.actualSavings > 0 ? (
                      <div className="text-green-300 font-bold text-sm bg-green-900/30 px-2 py-1 rounded inline-block mt-1">
                        Économie: -{flight.actualSavings.toFixed(2)}€
                      </div>
                    ) : flight.actualSavings < 0 ? (
                      <div className="text-red-300 font-bold text-sm bg-red-900/30 px-2 py-1 rounded inline-block mt-1">
                        Surcoût: +{Math.abs(flight.actualSavings).toFixed(2)}€
                      </div>
                    ) : null
                  ) : flight.classicPriceReference ? (
                    <div className="text-blue-200 text-sm mt-1">
                      vs Classique: {flight.classicPriceReference.toFixed(2)}€
                    </div>
                  ) : null
                )}
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 text-sm">
              <span className="text-xl">💡</span>
              <span>Ce voyage se compose de <strong>{flight.segments.length} réservations séparées</strong></span>
            </div>
            <button
              onClick={handleBookAll}
              disabled={isOpening}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              {isOpening ? (
                <>
                  <span className="animate-spin">🔄</span> Ouverture en cours...
                </>
              ) : (
                <>
                  <span>🚀</span> Réserver tout le voyage ({flight.segments.length} onglets)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Liste des Vols à Réserver */}
        <div className="space-y-6 mb-8">
          <h2 className="text-xl font-extrabold text-stone-800 flex items-center gap-2 tracking-tight">
            <span>🎫</span>
            <span>Vols à Réserver ({flight.segments.length})</span>
          </h2>

          {groupedSegments.map((group, index) => {
            if (group.type === 'round-trip') {
              const { outbound, inbound, airlineCode } = group;
              const logoUrl = getAirlineLogo(airlineCode);
              const airlineName = getAirlineName(airlineCode);

              // Helper for RT URL
              // Helper for RT URL
              const generateRoundTripUrl = () => {
                const depDate = new Date(outbound.departureTime);
                const retDate = new Date(inbound.departureTime);
                const airlineNameLower = airlineName.toLowerCase();

                // For airlines with tricky booking engines, use Google Flights Round Trip search
                if (['AH', 'AF', '5O', 'SF'].includes(airlineCode) ||
                  airlineNameLower.includes('air algérie') ||
                  airlineNameLower.includes('air france') ||
                  airlineNameLower.includes('asl') ||
                  airlineNameLower.includes('tassili')) {

                  const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

                  // Query: vol [Airline] [Origin] [Dest] [Date1] retour [Date2]
                  const q = `vol ${airlineName} ${outbound.origin} ${outbound.destination} ` +
                    `${depDate.getDate()} ${monthNames[depDate.getMonth()]} ${depDate.getFullYear()} ` +
                    `retour ${retDate.getDate()} ${monthNames[retDate.getMonth()]} ${retDate.getFullYear()}`;

                  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}&curr=EUR&hl=fr`;
                }

                // Fallback for others: use the single segment booking URL (often redirects to airline site where return can be added)
                return generateBookingUrl(outbound);
              };

              return (
                <div key={`group-${index}`} className="bg-white rounded-xl shadow-md overflow-hidden border border-blue-200 hover:shadow-lg transition-shadow relative">
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-bl-lg z-10">
                    Aller-Retour
                  </div>
                  <div className="p-6">
                    {/* Outbound Segment */}
                    {/* Outbound Segment */}
                    <div className="mb-6 border-b border-gray-100 pb-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-50 p-2 rounded-lg w-10 h-10 flex items-center justify-center">
                            <img
                              src={logoUrl}
                              alt={airlineName}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '<span style="font-size:20px">✈️</span>';
                              }}
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{airlineName}</h3>
                            <div className="text-xs text-gray-500">Aller • {outbound.flightNumber}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                            {new Date(outbound.departureTime).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-xl font-bold">{new Date(outbound.departureTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} <span className="text-sm font-normal text-gray-500">{outbound.origin}</span></div>
                        <div className="flex-1 flex flex-col items-center px-2">
                          <div className="text-xs font-bold text-gray-500 mb-3">{outbound.duration}</div>
                          <div className="w-full h-px bg-gray-300 relative"><span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">✈</span></div>
                        </div>
                        <div className="text-xl font-bold">{new Date(outbound.arrivalTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} <span className="text-sm font-normal text-gray-500">{outbound.destination}</span></div>
                      </div>
                    </div>

                    {/* Inbound Segment */}
                    <div className="mb-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-50 p-2 rounded-lg w-10 h-10 flex items-center justify-center">
                            <img
                              src={logoUrl}
                              alt={airlineName}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '<span style="font-size:20px">✈️</span>';
                              }}
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{airlineName}</h3>
                            <div className="text-xs text-gray-500">Retour • {inbound.flightNumber}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                            {new Date(inbound.departureTime).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-xl font-bold">{new Date(inbound.departureTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} <span className="text-sm font-normal text-gray-500">{inbound.origin}</span></div>
                        <div className="flex-1 flex flex-col items-center px-2">
                          <div className="text-xs font-bold text-gray-500 mb-3">{inbound.duration}</div>
                          <div className="w-full h-px bg-gray-300 relative"><span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">✈</span></div>
                        </div>
                        <div className="text-xl font-bold">{new Date(inbound.arrivalTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} <span className="text-sm font-normal text-gray-500">{inbound.destination}</span></div>
                      </div>
                    </div>

                    {/* Action - Consolidated */}
                    <div className="mt-6 flex items-center justify-between bg-stone-50 p-4 rounded-xl">
                      <div className="text-left">
                        <div className="text-sm text-stone-500">Prix total estimé</div>
                        <div className="text-2xl font-bold text-emerald-600">{(outbound.priceEUR + inbound.priceEUR).toFixed(2)}€</div>
                        {(outbound.priceDZD && inbound.priceDZD) && (
                          <div className="text-xs text-emerald-600 font-medium">~{(outbound.priceDZD + inbound.priceDZD).toLocaleString()} DZD</div>
                        )}
                      </div>
                      <button
                        onClick={() => window.open(generateRoundTripUrl(), '_blank')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow transition-colors flex items-center gap-2"
                      >
                        <span>🔄</span> Réserver l'Aller-Retour
                      </button>
                    </div>
                  </div>
                </div>
              );
            } else {
              // Single Segment Render (Existing Logic)
              const segment = group.segment;
              const airlineCode = group.airlineCode;
              const logoUrl = getAirlineLogo(airlineCode);
              const isReturn = segment.leg === "RETOUR"; // Naive check, mainly for display

              return (
                <div key={`group-${index}`} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-stone-100 hover:shadow-xl transition-shadow">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      {/* Info Vol */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-gray-50 p-2 rounded-lg w-12 h-12 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={logoUrl}
                              alt={segment.airline}
                              className="w-10 h-10 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.parentElement!.innerHTML = '<span style="font-size:24px">✈️</span>';
                              }}
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{getAirlineName(airlineCode) || segment.airline}</h3>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{segment.flightNumber}</span>
                              <span>• {isReturn ? 'Retour' : 'Aller'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-8 mb-4">
                          <div>
                            <div className="text-2xl font-bold text-gray-800">
                              {new Date(segment.departureTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-sm font-medium text-gray-600">{segment.origin}</div>
                          </div>
                          <div className="flex-1 flex flex-col items-center px-4">
                            <div className="text-xs font-bold text-gray-500 mb-3">{segment.duration}</div>
                            <div className="w-full h-px bg-gray-300 relative">
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-400">✈</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-800">
                              {new Date(segment.arrivalTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-sm font-medium text-gray-600">{segment.destination}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-1">
                            <span>📅</span>
                            {new Date(segment.departureTime).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                          <div className="flex items-center gap-1">
                            <span>🧳</span>
                            {segment.baggage?.weight
                              ? segment.baggage.weight
                              : (segment.baggage?.included
                                ? "Bagage inclus"
                                : "Bagage possible")
                            }
                          </div>
                        </div>
                      </div>

                      {/* Action Réserver */}
                      <div className="flex flex-col justify-center items-end border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6 min-w-[200px]">
                        <div className="text-right mb-4">
                          <div className="text-sm text-stone-500">
                            {verifiedSegments[group.originalIndex] ? 'Prix Vérifié ✅' : 'Prix estimé'}
                          </div>
                          <div className="text-2xl font-bold text-emerald-600">
                            {verifiedSegments[group.originalIndex]
                              ? verifiedSegments[group.originalIndex].priceEUR.toFixed(2)
                              : segment.priceEUR.toFixed(2)}€
                          </div>
                          {(verifiedSegments[group.originalIndex]?.priceDZD || segment.priceDZD) && (
                            <div className="text-xs text-emerald-600 font-medium">
                              ~{(verifiedSegments[group.originalIndex]?.priceDZD || segment.priceDZD).toLocaleString()} DZD
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const bookingUrl = generateBookingUrl(segment);
                            window.open(bookingUrl, '_blank');
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow transition-colors flex items-center justify-center gap-2"
                        >
                          <span>↗</span> Réserver ce vol
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>

        {/* Résumé Financier */}
        {flight.classicPriceReference && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-6 text-white mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>💰</span> Résumé Financier
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-white/60 text-sm mb-1">Coût Total (DjazAir)</div>
                <div className="text-3xl font-bold text-white">{flight.totalPriceEUR.toFixed(2)}€</div>
                <div className="text-xs text-white/50 mt-1">Via Alger • Payable en Dinar</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-white/60 text-sm mb-1">Vol Classique le moins cher</div>
                <div className={`text-3xl font-bold ${flight.actualSavings && flight.actualSavings > 0 ? 'text-gray-300 line-through' : 'text-white'}`}>
                  {flight.classicPriceReference.toFixed(2)}€
                </div>
                <div className="text-xs text-white/50 mt-1">Prix réel du marché</div>
              </div>
              {flight.actualSavings !== null && flight.actualSavings !== undefined && (
                <div className={`${flight.actualSavings > 0 ? 'bg-green-600/20 border-green-500/30' : 'bg-red-600/20 border-red-500/30'} border rounded-xl p-4 backdrop-blur-sm`}>
                  <div className={`${flight.actualSavings > 0 ? 'text-green-300' : 'text-red-300'} text-sm mb-1`}>
                    {flight.actualSavings > 0 ? 'Votre Économie' : 'Surcoût DjazAir'}
                  </div>
                  <div className={`text-3xl font-bold ${flight.actualSavings > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {flight.actualSavings > 0 ? '-' : '+'}{Math.abs(flight.actualSavings).toFixed(2)}€
                  </div>
                  <div className={`text-xs ${flight.actualSavings > 0 ? 'text-green-300/70' : 'text-red-300/70'} mt-1`}>
                    {flight.actualSavings > 0
                      ? `Soit ${((flight.actualSavings / flight.classicPriceReference) * 100).toFixed(0)}% d'économie`
                      : 'Pas d\'économie sur ce trajet'
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Warning Banner - Prix Estimés */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800">Prix indicatifs</p>
              <p className="text-sm text-amber-700">
                Les prix affichés sont des estimations basées sur les données DjazAir.
                Le prix final peut varier sur le site de réservation.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-sm text-gray-500 mb-8">
          <p>En cliquant sur "Réserver", vous serez redirigé vers les sites officiels des compagnies aériennes.</p>
          <p>DjazAir n'est pas une agence de voyage et n'encaisse aucun paiement.</p>
        </div>

      </div>
    </div>
  );
}
