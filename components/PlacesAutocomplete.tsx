"use client";

import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { usePlaceSearch } from "@/lib/usePlaceSearch";
import type { PlaceSuggestion } from "@/types/places";

interface Props {
  onSelect: (place: PlaceSuggestion) => void;
}

export default function PlaceAutocomplete({
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(false);

  const {
    suggestions,
    loading,
  } = usePlaceSearch(selected ? "" : query);

  return (
    <div className="relative w-full">

      <div
        className="
        flex items-center gap-3
        rounded-2xl
        border border-zinc-800
        bg-zinc-950
        px-4 py-3
        "
      >

        <Search
          size={20}
          className="text-zinc-400"
        />

        <input
          value={query}
          onChange={(e) => {
            setSelected(false);
            setQuery(e.target.value);
          }}
          placeholder="Search destination..."
          className="
          flex-1
          bg-transparent
          outline-none
          text-white
          "
        />

      </div>


      {loading && (
        <div
          className="
          absolute
          top-full
          mt-2
          w-full
          rounded-2xl
          border border-zinc-800
          bg-zinc-950
          p-4
          text-sm
          text-zinc-400
          shadow-xl
          z-[999]
          "
        >
          Searching...
        </div>
      )}


      {!selected && suggestions.length > 0 && (
        <div
          className="
          absolute
          top-full
          left-0
          mt-2
          w-full
          max-h-80
          overflow-y-auto
          rounded-2xl
          border border-zinc-800
          bg-zinc-950
          shadow-2xl
          z-[999]
          "
        >

          {suggestions.map((place) => (

            <button
              key={place.placeId}
              onClick={() => {
                setSelected(true);
                setQuery(place.fullText.replace(/, Trinidad and Tobago$/, ""));
                onSelect(place);
              }}
              className="
              w-full
              flex
              items-start
              gap-3
              px-4
              py-4
              text-left
              hover:bg-zinc-900
              "
            >

              <MapPin
                size={18}
                className="
                text-blue-400
                mt-1
                shrink-0
                "
              />


              <div>

                <p className="font-medium">
                  {place.mainText}
                </p>

                <p className="text-sm text-zinc-500">
                  {place.secondaryText.replace(/, Trinidad and Tobago$/, "")}
                </p>

              </div>

            </button>

          ))}

        </div>
      )}

    </div>
  );
}