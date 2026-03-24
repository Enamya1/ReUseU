/**
 * useLocation Hook
 * Handles geolocation functionality
 */

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_MAP_CENTER } from '../config';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface LocationError {
  code: string;
  message: string;
}

interface UseLocationReturn {
  location: LocationCoords | null;
  error: LocationError | null;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationCoords | null>;
  calculateDistance: (from: LocationCoords, to: LocationCoords) => number;
  formatDistance: (distanceKm: number) => string;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistanceKm = (from: LocationCoords, to: LocationCoords): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const radiusKm = 6371;
  
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return radiusKm * c;
};

/**
 * Format distance for display
 */
const formatDistanceLabel = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      setError({
        code: 'PERMISSION_ERROR',
        message: 'Failed to request location permission',
      });
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<LocationCoords | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setError({
          code: 'PERMISSION_DENIED',
          message: 'Location permission denied',
        });
        setIsLoading(false);
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: LocationCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setLocation(coords);
      setIsLoading(false);
      return coords;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError({
        code: 'LOCATION_ERROR',
        message: errorMessage,
      });
      setIsLoading(false);
      return null;
    }
  }, [requestPermission]);

  // Get location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const calculateDistance = useCallback((from: LocationCoords, to: LocationCoords): number => {
    return calculateDistanceKm(from, to);
  }, []);

  const formatDistance = useCallback((distanceKm: number): string => {
    return formatDistanceLabel(distanceKm);
  }, []);

  return {
    location,
    error,
    isLoading,
    requestPermission,
    getCurrentLocation,
    calculateDistance,
    formatDistance,
  };
};
