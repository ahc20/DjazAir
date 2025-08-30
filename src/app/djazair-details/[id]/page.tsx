"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DjazAirFlight } from "@/types/djazair";

export default function DjazAirDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [flight, setFlight] = useState<DjazAirFlight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer les détails du vol depuis le localStorage ou l'API
    const storedFlight = localStorage.getItem(`djazair-flight-${params.id}`);
    if (storedFlight) {
      setFlight(JSON.parse(storedFlight));
      setLoading(false);
    } else {
      // Si pas de vol stocké, rediriger vers la page de recherche
      router.push('/search');
    }
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">🔍 Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Vol non trouvé</h1>
          <p className="text-gray-600 mb-4">Le vol demandé n'existe pas ou a expiré</p>
          <button 
            onClick={() => router.push('/search')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retour à la recherche
          </button>
        </div>
      </div>
    );
  }

  const isRoundTrip = !!flight.returnDate;

  return (
    <div className="min-h-screen bg-gray-50 py-4 lg:py-8">
      <div className="max-w-4xl mx-auto px-3 lg:px-4">
        {/* Header avec navigation */}
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <span className="mr-2">←</span> Retour aux résultats
          </button>
          
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              ✈️ Détails DjazAir - {isRoundTrip ? 'Aller-Retour' : 'Aller Simple'}
            </h1>
            <p className="text-blue-100 text-lg">
              {flight.origin} → {flight.destination}
              {isRoundTrip && ` → ${flight.origin}`}
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-blue-200">Prix total:</span>
                <div className="text-2xl font-bold">{flight.totalPriceEUR}€</div>
                {flight.totalPriceDZD && (
                  <div className="text-blue-100">{flight.totalPriceDZD.toLocaleString()} DZD</div>
                )}
              </div>
              <div>
                <span className="text-blue-200">Durée totale:</span>
                <div className="text-xl font-bold">{flight.totalDuration}</div>
              </div>
              <div>
                <span className="text-blue-200">Type:</span>
                <div className="text-xl font-bold">{isRoundTrip ? 'AR' : 'AS'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Informations générales */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Informations Générales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Détails du voyage</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Date de départ:</strong> {new Date(flight.departureDate).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}</div>
                {flight.returnDate && (
                  <div><strong>Date de retour:</strong> {new Date(flight.returnDate).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}</div>
                )}
                <div><strong>Durée totale:</strong> {flight.totalDuration}</div>
                <div><strong>Économies:</strong> {flight.savings.amount}€ ({flight.savings.percentage}%)</div>
                <div><strong>Prix de référence:</strong> {flight.savings.comparedTo}€</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Escales</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Aéroport d'escale:</strong> {flight.layover.airport}</div>
                <div><strong>Durée d'escale:</strong> {flight.layover.duration}</div>
                <div><strong>Localisation:</strong> {flight.layover.location}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Détails des segments */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">✈️ Détails des Segments</h2>
          <div className="space-y-6">
            {flight.segments.map((segment, index) => {
              const isReturnSegment = index >= 2;
              const segmentType = isReturnSegment ? 'Retour' : 'Aller';
              const segmentNumber = isReturnSegment ? index - 1 : index + 1;
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-blue-600">
                      {segmentType} {segmentNumber} : {segment.origin} → {segment.destination}
                    </h3>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-800">
                        {segment.priceEUR.toFixed(2)}€
                      </div>
                      {segment.priceDZD && (
                        <div className="text-sm text-gray-600">
                          {segment.priceDZD.toFixed(0)} DZD
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Informations de vol</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Compagnie:</strong> {segment.airline}</div>
                        <div><strong>Numéro de vol:</strong> {segment.flightNumber}</div>
                        <div><strong>Durée:</strong> {segment.duration}</div>
                        <div><strong>Devise:</strong> {segment.currency}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Horaires</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Départ:</strong> {new Date(segment.departureTime).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} {segment.origin}
                        </div>
                        <div>
                          <strong>Arrivée:</strong> {new Date(segment.arrivalTime).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} {segment.destination}
                        </div>
                        <div>
                          <strong>Date:</strong> {new Date(segment.departureTime).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long' 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informations sur les bagages et services */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">👜 Bagages et Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Bagages inclus</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <strong>Bagage à main:</strong> 1 pièce (7kg max)
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <strong>Bagage en soute:</strong> 1 pièce (23kg max)
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <strong>Accessoires personnels:</strong> 1 sac à dos/poche
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Services inclus</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <strong>Collation à bord</strong>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <strong>Boissons non-alcoolisées</strong>
                </div>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <strong>Assistance en escale</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conditions et restrictions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">⚠️ Conditions et Restrictions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Conditions de réservation</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Modification possible jusqu'à 24h avant le départ</div>
                <div>• Frais de modification : 50€ par segment</div>
                <div>• Remboursement possible avec frais de 100€</div>
                <div>• Nom et prénom doivent correspondre au passeport</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Restrictions importantes</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Passeport valide 6 mois après le retour</div>
                <div>• Visa requis selon la nationalité</div>
                <div>• Vaccins recommandés (consulter votre médecin)</div>
                <div>• Respect des horaires d'escale obligatoire</div>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Actions</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => window.open('https://www.airalgerie.dz', '_blank')}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
            >
              🎫 Réserver sur Air Algérie
            </button>
            <button 
              onClick={() => window.open('https://www.booking.com', '_blank')}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
            >
              🏨 Réserver l'hôtel d'escale
            </button>
            <button 
              onClick={() => router.back()}
              className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-center"
            >
              ↩️ Retour aux résultats
            </button>
          </div>
        </div>

        {/* Informations sur l'arbitrage DjazAir */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">ℹ️ Comment fonctionne DjazAir ?</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>Principe de l'arbitrage :</strong> DjazAir utilise la différence entre le taux de change officiel (1 EUR = 150 DZD) 
              et le taux parallèle (1 EUR = 260 DZD) pour vous proposer des vols moins chers.
            </p>
            <p>
              <strong>Processus :</strong> Votre vol est divisé en segments, avec une escale obligatoire à Alger. 
              Le segment algérien est facturé en DZD au taux officiel, puis converti au taux parallèle pour le calcul final.
            </p>
            <p>
              <strong>Économies garanties :</strong> Cette méthode vous permet d'économiser en moyenne 15-25% 
              par rapport aux vols directs traditionnels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
