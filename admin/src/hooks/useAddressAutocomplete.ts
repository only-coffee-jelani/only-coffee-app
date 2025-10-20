import { useState, useCallback, useRef, useEffect } from 'react';

export interface AddressSuggestion {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

// Geoapify API Key - Free tier: 3000 requests/day
const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || '';

export function useAddressAutocomplete() {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const getAddressSuggestions = useCallback(async (input: string) => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Clear suggestions if input is too short
    if (input.length < 2) {
      setSuggestions([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Debounce the API call
    debounceTimer.current = setTimeout(async () => {
      try {
        // Use Geoapify - True autocomplete with typeahead
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&apiKey=${GEOAPIFY_API_KEY}&limit=5&country=us`;

        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Geoapify returns FeatureCollection with features array
        const features = data.features || [];

        if (!features || features.length === 0) {
          setSuggestions([]);
          setError(null);
          setLoading(false);
          return;
        }

        // Format results from Geoapify
        const formatted: AddressSuggestion[] = features.map((feature: any, index: number) => {
          const props = feature.properties || {};
          const coords = feature.geometry?.coordinates || [0, 0];

          return {
            id: `${props.place_id || index}`,
            address: props.address_line1 || props.address_line2 || props.name || '',
            city: props.city || '',
            state: props.state || '',
            zipCode: props.postcode || '',
            latitude: coords[1],  // GeoJSON is [lon, lat]
            longitude: coords[0],
            displayName: props.formatted || `${props.address_line1 || ''}, ${props.city || ''}, ${props.state || ''}`,
          };
        });

        setSuggestions(formatted);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 200); // 200ms debounce for faster typeahead
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    loading,
    error,
    getAddressSuggestions,
    clearSuggestions,
  };
}

