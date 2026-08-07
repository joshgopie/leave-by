"use client";

import { useEffect, useState } from "react";
import type { PlaceSuggestion } from "@/types/places";

export function usePlaceSearch(query: string) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/places?q=${encodeURIComponent(query)}`
        );

        const data = await response.json();

        setSuggestions(data);

      } catch (error) {
        console.error(
          "Place search failed:",
          error
        );

        setSuggestions([]);

      } finally {
        setLoading(false);
      }

    }, 400); // wait 400ms after typing

    
    return () => clearTimeout(timer);

  }, [query]);


  return {
    suggestions,
    loading,
  };
}