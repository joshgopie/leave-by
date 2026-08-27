"use client";

/* ============================================================
   IMPORTS
============================================================ */

import { useState } from "react";
import { Search, MapPin, X } from "lucide-react";

import { usePlaceSearch } from "@/lib/usePlaceSearch";
import type { PlaceSuggestion } from "@/types/places";


/* ============================================================
   TYPES
============================================================ */

interface Props {
  onSelect: (place: PlaceSuggestion) => void;
}


/* ============================================================
   COMPONENT
============================================================ */

export default function PlaceAutocomplete({
  onSelect,
}: Props) {

  /* ==========================================================
     STATE
  ========================================================== */

  /*
    The text currently inside the search box.
  */
  const [query, setQuery] = useState("");


  /*
    Tracks whether the user has selected a destination.

    When true, we stop searching because the user has
    already selected a destination.
  */
  const [selected, setSelected] = useState(false);


  /* ==========================================================
     GOOGLE PLACES SEARCH
  ========================================================== */

  /*
    Our existing custom hook handles the Google Places
    autocomplete search.

    When a place is selected:

      selected = true
      query is temporarily ignored

    When the user starts typing again:

      selected = false
      searching resumes
  */

  const {
    suggestions,
    loading,
  } = usePlaceSearch(
    selected ? "" : query
  );


  /* ==========================================================
     CLEAR SEARCH
  ========================================================== */

  /*
    Clears the search field completely.

    We also set selected to false so the user can immediately
    start searching for another destination.
  */

  function handleClear() {
    setQuery("");
    setSelected(false);
  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="relative w-full">


      {/* ======================================================
          SEARCH INPUT
      ====================================================== */}

      <div
        className="
          flex
          items-center
          gap-3
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-950
          px-4
          py-3
        "
      >

        {/* ====================================================
            SEARCH ICON
        ==================================================== */}

        <Search
          size={20}
          className="shrink-0 text-zinc-400"
        />


        {/* ====================================================
            TEXT INPUT

            pr-8 gives the text enough room so it doesn't
            overlap with the X button.
        ==================================================== */}

        <input
          value={query}
          onChange={(e) => {
            setSelected(false);
            setQuery(e.target.value);
          }}
          placeholder="Search destination..."
          className="
            min-w-0
            flex-1
            bg-transparent
            text-white
            outline-none
            placeholder:text-zinc-500
            pr-8
          "
        />


        {/* ====================================================
            CLEAR BUTTON

            Only show the X when there is something to clear.

            This keeps the search bar clean when empty.
        ==================================================== */}

        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear destination search"
            className="
              flex
              h-7
              w-7
              shrink-0
              items-center
              justify-center
              rounded-full
              text-zinc-500
              transition
              hover:bg-zinc-800
              hover:text-white
              active:scale-90
            "
          >
            <X size={17} strokeWidth={2} />
          </button>
        )}

      </div>


      {/* ======================================================
          LOADING STATE
      ====================================================== */}

      {loading && (
        <div
          className="
            absolute
            left-0
            top-full
            z-[999]
            mt-2
            w-full
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-950
            p-4
            text-sm
            text-zinc-400
            shadow-xl
          "
        >
          Searching...
        </div>
      )}


      {/* ======================================================
          AUTOCOMPLETE RESULTS
      ====================================================== */}

      {!selected && suggestions.length > 0 && (
        <div
          className="
            absolute
            left-0
            top-full
            z-[999]
            mt-2
            max-h-80
            w-full
            overflow-y-auto
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-950
            shadow-2xl
          "
        >

          {/* ==================================================
              SUGGESTION LIST
          ================================================== */}

          {suggestions.map((place) => (

            <button
              key={place.placeId}
              type="button"
              onClick={() => {

                /*
                  Mark the destination as selected so
                  autocomplete stops searching.
                */

                setSelected(true);


                /*
                  Display the selected destination without
                  showing ", Trinidad and Tobago".
                */

                setQuery(
                  place.fullText.replace(
                    /, Trinidad and Tobago$/,
                    ""
                  )
                );


                /*
                  Send the selected place back to the
                  DestinationCard / parent component.
                */

                onSelect(place);
              }}
              className="
                flex
                w-full
                items-start
                gap-3
                px-4
                py-4
                text-left
                transition
                hover:bg-zinc-900
                active:bg-zinc-800
              "
            >

              {/* ==============================================
                  LOCATION ICON
              ============================================== */}

              <MapPin
                size={18}
                className="
                  mt-1
                  shrink-0
                  text-blue-400
                "
              />


              {/* ==============================================
                  PLACE INFORMATION
              ============================================== */}

              <div className="min-w-0">

                {/* Main place name */}

                <p className="font-medium text-white">
                  {place.mainText}
                </p>


                {/* Secondary location */}

                <p className="text-sm text-zinc-500">
                  {place.secondaryText.replace(
                    /, Trinidad and Tobago$/,
                    ""
                  )}
                </p>

              </div>

            </button>

          ))}

        </div>
      )}

    </div>
  );
}