"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Search,
  MapPin,
  X,
  ArrowLeft,
  Clock3,
} from "lucide-react";

import { usePlaceSearch } from "@/lib/usePlaceSearch";
import type { PlaceSuggestion } from "@/types/places";


interface Props {
  onSelect: (place: PlaceSuggestion) => void;
}


const RECENT_STORAGE_KEY =
  "leave-by-recent-destinations";

const MAX_RECENT_DESTINATIONS = 8;


export default function PlaceAutocomplete({
  onSelect,
}: Props) {

  /* ==========================================================
     STATE
  ========================================================== */

  const [query, setQuery] = useState("");

  const [selected, setSelected] = useState(false);

  const [isOpen, setIsOpen] = useState(false);

  const [recentDestinations, setRecentDestinations] =
    useState<PlaceSuggestion[]>([]);


  /* ==========================================================
     REF
  ========================================================== */

  const searchInputRef =
    useRef<HTMLInputElement>(null);


  /* ==========================================================
     GOOGLE PLACES SEARCH
  ========================================================== */

  const {
    suggestions,
    loading,
  } = usePlaceSearch(
    selected ? "" : query
  );


  /* ==========================================================
     LOAD RECENT DESTINATIONS
  ========================================================== */

  useEffect(() => {

    try {

      const stored =
        localStorage.getItem(
          RECENT_STORAGE_KEY
        );

      if (!stored) return;

      const parsed: PlaceSuggestion[] =
        JSON.parse(stored);

      if (Array.isArray(parsed)) {
        setRecentDestinations(parsed);
      }

    } catch {

      setRecentDestinations([]);

    }

  }, []);


  /* ==========================================================
     OPEN SEARCH
  ========================================================== */

  function openSearch() {

    setIsOpen(true);

    setSelected(false);

    /*
      IMPORTANT:

      The input is already mounted in the DOM.

      We focus it immediately as part of the
      user's tap interaction.

      This is the important difference for iOS.
    */

    searchInputRef.current?.focus();

  }


  /* ==========================================================
     CLOSE SEARCH
  ========================================================== */

  function closeSearch() {

    /*
      Remove focus first.
    */

    searchInputRef.current?.blur();

    setIsOpen(false);

    setQuery("");

    setSelected(true);

  }


  /* ==========================================================
     CLEAR SEARCH
  ========================================================== */

  function handleClear() {

    setQuery("");

    setSelected(false);

    /*
      Keep the keyboard active.
    */

    searchInputRef.current?.focus();

  }


  /* ==========================================================
     SAVE RECENT DESTINATION
  ========================================================== */

  function saveRecentDestination(
    place: PlaceSuggestion
  ) {

    setRecentDestinations((current) => {

      const filtered =
        current.filter(
          (item) =>
            item.placeId !== place.placeId
        );


      const updated = [
        place,
        ...filtered,
      ].slice(
        0,
        MAX_RECENT_DESTINATIONS
      );


      try {

        localStorage.setItem(
          RECENT_STORAGE_KEY,
          JSON.stringify(updated)
        );

      } catch {
        // Ignore localStorage errors
      }


      return updated;

    });

  }


  /* ==========================================================
     SELECT DESTINATION
  ========================================================== */

  function handleSelect(
    place: PlaceSuggestion
  ) {

    saveRecentDestination(place);


    setQuery(
      place.fullText.replace(
        /, Trinidad and Tobago$/,
        ""
      )
    );


    setSelected(true);


    onSelect(place);


    /*
      Blur before closing.
    */

    searchInputRef.current?.blur();

    setIsOpen(false);

  }


  /* ==========================================================
     BODY SCROLL LOCK
  ========================================================== */

  useEffect(() => {

    if (!isOpen) return;


    const originalOverflow =
      document.body.style.overflow;


    document.body.style.overflow =
      "hidden";


    return () => {

      document.body.style.overflow =
        originalOverflow;

    };

  }, [isOpen]);


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="relative w-full">


      {/* ======================================================
          ALWAYS-MOUNTED SEARCH INPUT

          IMPORTANT:

          This input exists in the DOM even before the
          full-screen search is opened.

          We only visually hide it when the search is closed.
      ====================================================== */}

      <input
        ref={searchInputRef}
        value={query}
        onChange={(e) => {

          setSelected(false);

          setQuery(e.target.value);

        }}
        placeholder="Search destination..."
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        inputMode="search"
        tabIndex={isOpen ? 0 : -1}
        aria-hidden={!isOpen}
        className={`
          fixed
          left-[-9999px]
          top-0
          h-1
          w-1
          opacity-0
          pointer-events-none
        `}
      />


      {/* ======================================================
          NORMAL SEARCH BAR
      ====================================================== */}

      <button
        type="button"
        onClick={openSearch}
        className="
          flex
          w-full
          items-center
          gap-3
          rounded-2xl
          border
          border-zinc-800
          bg-zinc-950
          px-4
          py-3
          text-left
          transition
          active:scale-[0.99]
        "
      >

        <Search
          size={20}
          className="shrink-0 text-zinc-400"
        />

        <span
          className={
            query
              ? "min-w-0 flex-1 truncate text-white"
              : "min-w-0 flex-1 truncate text-zinc-500"
          }
        >
          {query || "Search destination..."}
        </span>

      </button>


      {/* ======================================================
          FULL SCREEN SEARCH
      ====================================================== */}

      {isOpen && (

        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            flex-col
            bg-[#090A0F]
          "
        >

          {/* ==================================================
              TOP SEARCH BAR
          ================================================== */}

          <div
            className="
              shrink-0
              px-4
              pb-3
              pt-[calc(env(safe-area-inset-top)+12px)]
            "
          >

            <div className="flex items-center gap-2">


              {/* ==============================================
                  BACK BUTTON
              ============================================== */}

              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  text-zinc-300
                  transition
                  active:scale-90
                "
              >

                <ArrowLeft size={22} />

              </button>


              {/* ==============================================
                  VISIBLE SEARCH FIELD
              ============================================== */}

              <div
                className="
                  flex
                  min-w-0
                  flex-1
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

                <Search
                  size={20}
                  className="shrink-0 text-zinc-400"
                />


                {/*
                  This visible input mirrors the actual search
                  input.

                  We use a second input here because the
                  permanently mounted input must remain
                  available for iOS keyboard activation.
                */}

                <input
                  value={query}
                  onChange={(e) => {

                    setSelected(false);

                    setQuery(e.target.value);

                  }}
                  onFocus={() => {

                    /*
                      Keep the permanently mounted input
                      synchronized with the visible field.
                    */

                    searchInputRef.current?.focus();

                  }}
                  placeholder="Search destination..."
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="search"
                  className="
                    min-w-0
                    flex-1
                    bg-transparent
                    text-white
                    outline-none
                    placeholder:text-zinc-500
                  "
                />


                {/* ==========================================
                    CLEAR BUTTON
                ========================================== */}

                {query.length > 0 && (

                  <button
                    type="button"
                    onClick={handleClear}
                    aria-label="Clear search"
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
                      active:scale-90
                    "
                  >

                    <X size={17} />

                  </button>

                )}

              </div>

            </div>

          </div>


          {/* ==================================================
              SEARCH CONTENT
          ================================================== */}

          <div
            className="
              min-h-0
              flex-1
              overflow-y-auto
              overscroll-contain
              px-4
              pb-[calc(env(safe-area-inset-bottom)+24px)]
            "
          >

            {/* ==================================================
                RECENT DESTINATIONS
            ================================================== */}

            {query.length === 0 &&
              recentDestinations.length > 0 && (

              <div>

                <div className="mb-3 flex items-center gap-2 px-1">

                  <Clock3
                    size={17}
                    className="text-zinc-500"
                  />

                  <p className="text-sm font-medium text-zinc-400">
                    Recent
                  </p>

                </div>


                <div
                  className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-zinc-800
                    bg-zinc-950
                  "
                >

                  {recentDestinations.map(
                    (place, index) => (

                    <button
                      key={place.placeId}
                      type="button"
                      onClick={() =>
                        handleSelect(place)
                      }
                      className={`
                        flex
                        w-full
                        items-start
                        gap-3
                        px-4
                        py-4
                        text-left
                        transition
                        active:bg-zinc-800
                        ${
                          index !==
                          recentDestinations.length - 1
                            ? "border-b border-zinc-800"
                            : ""
                        }
                      `}
                    >

                      <div
                        className="
                          mt-0.5
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-zinc-900
                        "
                      >

                        <Clock3
                          size={17}
                          className="text-zinc-500"
                        />

                      </div>


                      <div className="min-w-0">

                        <p className="truncate font-medium text-white">
                          {place.mainText}
                        </p>

                        <p className="truncate text-sm text-zinc-500">
                          {place.secondaryText.replace(
                            /, Trinidad and Tobago$/,
                            ""
                          )}
                        </p>

                      </div>

                    </button>

                  ))}

                </div>

              </div>

            )}


            {/* ==================================================
                NO RECENT DESTINATIONS
            ================================================== */}

            {query.length === 0 &&
              recentDestinations.length === 0 && (

              <div
                className="
                  flex
                  flex-col
                  items-center
                  justify-center
                  px-6
                  pt-24
                  text-center
                "
              >

                <div
                  className="
                    mb-4
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-full
                    bg-blue-500/10
                  "
                >

                  <Search
                    size={24}
                    className="text-blue-300"
                  />

                </div>

                <p className="font-medium text-zinc-300">
                  Search for a destination
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Find a place to calculate when you should leave.
                </p>

              </div>

            )}


            {/* ==================================================
                LOADING
            ================================================== */}

            {query.length > 0 &&
              loading && (

              <div className="px-1 py-6 text-sm text-zinc-500">
                Searching...
              </div>

            )}


            {/* ==================================================
                GOOGLE AUTOCOMPLETE RESULTS
            ================================================== */}

            {query.length > 0 &&
              !loading &&
              suggestions.length > 0 && (

              <div
                className="
                  overflow-hidden
                  rounded-2xl
                  border
                  border-zinc-800
                  bg-zinc-950
                "
              >

                {suggestions.map(
                  (place, index) => (

                  <button
                    key={place.placeId}
                    type="button"
                    onClick={() =>
                      handleSelect(place)
                    }
                    className={`
                      flex
                      w-full
                      items-start
                      gap-3
                      px-4
                      py-4
                      text-left
                      transition
                      active:bg-zinc-800
                      ${
                        index !==
                        suggestions.length - 1
                          ? "border-b border-zinc-800"
                          : ""
                      }
                    `}
                  >

                    <div
                      className="
                        mt-0.5
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-blue-500/10
                      "
                    >

                      <MapPin
                        size={18}
                        className="text-blue-400"
                      />

                    </div>


                    <div className="min-w-0">

                      <p className="truncate font-medium text-white">
                        {place.mainText}
                      </p>

                      <p className="truncate text-sm text-zinc-500">
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


            {/* ==================================================
                NO RESULTS
            ================================================== */}

            {query.length > 0 &&
              !loading &&
              suggestions.length === 0 && (

              <div
                className="
                  px-1
                  py-10
                  text-center
                  text-sm
                  text-zinc-500
                "
              >
                No destinations found.
              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
}