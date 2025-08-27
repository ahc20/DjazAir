'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Plane, Users, Calendar, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { searchFormSchema, type SearchFormData } from '@/lib/zod';
import { getAirportSuggestions, formatAirportOption, type AirportCode } from '@/lib/iata';
import { cn } from '@/lib/utils';

interface SearchFormProps {
  onSubmit: (data: SearchFormData) => void;
  isLoading?: boolean;
}

export function SearchForm({ onSubmit, isLoading = false }: SearchFormProps) {
  const [originSuggestions, setOriginSuggestions] = useState<AirportCode[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<AirportCode[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      adults: 1,
      children: 0,
      infants: 0,
      cabin: 'ECONOMY',
    },
  });

  const watchedOrigin = watch('origin');
  const watchedDestination = watch('destination');

  const handleOriginChange = (value: string) => {
    setValue('origin', value.toUpperCase());
    if (value.length >= 1) {
      const suggestions = getAirportSuggestions(value);
      setOriginSuggestions(suggestions);
      setShowOriginSuggestions(true);
    } else {
      setShowOriginSuggestions(false);
    }
  };

  const handleDestinationChange = (value: string) => {
    setValue('destination', value.toUpperCase());
    if (value.length >= 1) {
      const suggestions = getAirportSuggestions(value);
      setDestinationSuggestions(suggestions);
      setShowDestinationSuggestions(true);
    } else {
      setShowDestinationSuggestions(false);
    }
  };

  const selectOrigin = (code: AirportCode) => {
    setValue('origin', code);
    setShowOriginSuggestions(false);
  };

  const selectDestination = (code: AirportCode) => {
    setValue('destination', code);
    setShowDestinationSuggestions(false);
  };

  const onFormSubmit = (data: SearchFormData) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Plane className="h-6 w-6" />
          Recherche de vols
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Origine et Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Aéroport de départ</label>
              <div className="relative">
                <Input
                  {...register('origin')}
                  placeholder="CDG, LHR, FRA..."
                  className={cn(errors.origin && 'border-red-500')}
                  onChange={(e) => handleOriginChange(e.target.value)}
                  onFocus={() => watchedOrigin && watchedOrigin.length >= 1 && setShowOriginSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
                />
                {showOriginSuggestions && originSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {originSuggestions.map((code) => (
                      <button
                        key={code}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        onClick={() => selectOrigin(code)}
                      >
                        {formatAirportOption(code)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.origin && (
                <p className="text-sm text-red-500">{errors.origin.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Aéroport de destination</label>
              <div className="relative">
                <Input
                  {...register('destination')}
                  placeholder="DXB, BKK, SIN..."
                  className={cn(errors.destination && 'border-red-500')}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  onFocus={() => watchedDestination && watchedDestination.length >= 1 && setShowDestinationSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
                />
                {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {destinationSuggestions.map((code) => (
                      <button
                        key={code}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        onClick={() => selectDestination(code)}
                      >
                        {formatAirportOption(code)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.destination && (
                <p className="text-sm text-red-500">{errors.destination.message}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de départ</label>
              <Input
                {...register('departDate')}
                type="date"
                className={cn(errors.departDate && 'border-red-500')}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.departDate && (
                <p className="text-sm text-red-500">{errors.departDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date de retour (optionnel)</label>
              <Input
                {...register('returnDate')}
                type="date"
                className={cn(errors.returnDate && 'border-red-500')}
                min={watch('departDate') || new Date().toISOString().split('T')[0]}
              />
              {errors.returnDate && (
                <p className="text-sm text-red-500">{errors.returnDate.message}</p>
              )}
            </div>
          </div>

          {/* Passagers et Classe */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Adultes
              </label>
              <Input
                {...register('adults', { valueAsNumber: true })}
                type="number"
                min="1"
                max="9"
                className={cn(errors.adults && 'border-red-500')}
              />
              {errors.adults && (
                <p className="text-sm text-red-500">{errors.adults.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Enfants</label>
              <Input
                {...register('children', { valueAsNumber: true })}
                type="number"
                min="0"
                max="8"
                className={cn(errors.children && 'border-red-500')}
              />
              {errors.children && (
                <p className="text-sm text-red-500">{errors.children.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nourrissons</label>
              <Input
                {...register('infants', { valueAsNumber: true })}
                type="number"
                min="0"
                max="8"
                className={cn(errors.infants && 'border-red-500')}
              />
              {errors.infants && (
                <p className="text-sm text-red-500">{errors.infants.message}</p>
              )}
            </div>
          </div>

          {/* Classe de cabine */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Classe de cabine
            </label>
            <Select {...register('cabin')}>
              <option value="ECONOMY">Économique</option>
              <option value="PREMIUM_ECONOMY">Économique Premium</option>
              <option value="BUSINESS">Affaires</option>
              <option value="FIRST">Première</option>
            </Select>
            {errors.cabin && (
              <p className="text-sm text-red-500">{errors.cabin.message}</p>
            )}
          </div>

          {/* Bouton de recherche */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Recherche en cours...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Rechercher des vols
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
