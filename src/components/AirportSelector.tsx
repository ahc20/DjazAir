"use client";

import React, { useState, useRef, useEffect } from 'react';
import { searchAirports, Airport, getAirportDisplayName } from '@/data/airports';

interface AirportSelectorProps {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export default function AirportSelector({
  value,
  onChange,
  placeholder = "Rechercher un aéroport...",
  label,
  error
}: AirportSelectorProps) {
  const [searchQuery, setSearchQuery] = useState(value ? getAirportDisplayName(value) : '');
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mettre à jour l'affichage quand la valeur change
  useEffect(() => {
    if (value && value !== searchQuery) {
      setSearchQuery(getAirportDisplayName(value));
    }
  }, [value]);

  // Rechercher les aéroports en fonction de la requête
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchAirports(searchQuery).slice(0, 10); // Limiter à 10 résultats
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
    setSelectedIndex(-1);
  }, [searchQuery]);

  // Fermer la dropdown quand on clique dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);

    // Si l'input est vidé, réinitialiser la valeur
    if (!newValue) {
      onChange('');
    }
  };

  const handleSuggestionClick = (airport: Airport) => {
    setSearchQuery(`${airport.city} - ${airport.name} (${airport.code})`);
    onChange(airport.code);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3 border rounded-lg text-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
          autoComplete="off"
        />

        {/* Icône d'avion */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          ✈️
        </div>
      </div>

      {/* Dropdown des suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((airport, index) => (
            <div
              key={airport.code}
              onClick={() => handleSuggestionClick(airport)}
              className={`
                px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0
                hover:bg-blue-50 transition-colors
                ${index === selectedIndex ? 'bg-blue-50' : ''}
              `}
            >
              <div className="flex justify-between items-center group">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-lg text-gray-900">{airport.city}</span>
                    <span className="text-sm text-gray-500 font-medium">{airport.country}</span>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <span>{airport.name}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded font-mono group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                      {airport.code}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Message d'aide */}
      {searchQuery.length >= 1 && searchQuery.length < 2 && (
        <p className="mt-2 text-sm text-gray-500">
          Tapez au moins 2 caractères pour rechercher un aéroport...
        </p>
      )}

      {/* Aucun résultat */}
      {searchQuery.length >= 2 && suggestions.length === 0 && (
        <p className="mt-2 text-sm text-gray-500">
          Aucun aéroport trouvé. Essayez avec le code IATA (ex: CDG, JFK) ou le nom de la ville.
        </p>
      )}
    </div>
  );
}
