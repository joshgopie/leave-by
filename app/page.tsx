"use client";

import { useEffect, useRef, useState } from "react";

import Header from "@/components/Header";
import CurrentLocationCard from "@/components/CurrentLocationCard";
import DestinationCard from "@/components/DestinationCard";
import ArrivalTimeCard from "@/components/ArrivalTimeCard";
import ResultCard from "@/components/ResultCard";
import Toast from "@/components/ui/toast";

import type { PlaceSuggestion } from "@/types/places";
import { useLocation } from "@/lib/useLocation";

// --------------------------------------------------
// ROUTE RECALCULATION CONFIGURATION
// --------------------------------------------------

// Minimum distance the user must move before an
// automatic Leave Now recalculation is considered.
const ROUTE_RECALCULATION_DISTANCE_METERS = 100;

// Prevent repeated route API calls from happening
// too frequently.
const ROUTE_RECALCULATION_COOLDOWN_MS = 30_000;

// --------------------------------------------------
// DISTANCE CALCULATION
// --------------------------------------------------

function getDistanceInMeters(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
): number {
  const earthRadius = 6371000;

  const latitudeDifference =
    ((latitude2 - latitude1) * Math.PI) / 180;

  const longitudeDifference =
    ((longitude2 - longitude1) * Math.PI) / 180;

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos((latitude1 * Math.PI) / 180) *
      Math.cos((latitude2 * Math.PI) / 180) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}

// --------------------------------------------------
// PAGE
// --------------------------------------------------

export default function Home() {
  // ==================================================
  // STATE
  // ==================================================

  const [calculationError, setCalculationError] =
    useState<string | null>(null);

  const [hasCalculated, setHasCalculated] =
    useState(false);

  const [destination, setDestination] =
    useState<PlaceSuggestion | null>(null);

  const [arrivalTime, setArrivalTime] =
    useState("");

  const [arrivalDate, setArrivalDate] =
    useState("");

  const [leaveTime, setLeaveTime] =
    useState("");

  const [estimatedArrivalTime, setEstimatedArrivalTime] =
    useState("");

  const [mode, setMode] =
    useState<"arrive" | "leaveNow">("arrive");

  // --------------------------------------------------
  // CACHED ARRIVE BY RESULT
  // --------------------------------------------------

  // Saves the last Arrive By calculation so we can
  // restore it without making another API call.
  const [lastArriveBy, setLastArriveBy] = useState<{
    destinationPlaceId: string;
    arrivalDate: string;
    arrivalTime: string;
    leaveTime: string;
    routeInfo: {
      travelMinutes: number;
      distanceKm: number;
      trafficDelay: number;
      description: string;
    };
  } | null>(null);

  // --------------------------------------------------
  // CACHED LEAVE NOW RESULT
  // --------------------------------------------------

  // Saves the last Leave Now calculation so we can
  // restore it without making another API call.
  const [lastLeaveNow, setLastLeaveNow] = useState<{
    destinationPlaceId: string;
    leaveTime: string;
    estimatedArrivalTime: string;
    routeInfo: {
      travelMinutes: number;
      distanceKm: number;
      trafficDelay: number;
      description: string;
    };
  } | null>(null);

  // --------------------------------------------------
  // CURRENT ROUTE INFORMATION
  // --------------------------------------------------

  const [routeInfo, setRouteInfo] = useState({
    travelMinutes: 0,
    distanceKm: 0,
    trafficDelay: 0,
    description: "",
  });

  // ==================================================
  // REFS
  // ==================================================

  // Used to scroll to the ResultCard after a
  // user-initiated calculation.
  const resultRef =
    useRef<HTMLDivElement | null>(null);

  // Keeps the calculation state available inside
  // effects without relying on asynchronous React state.
  const hasCalculatedRef =
    useRef(false);

  // Tracks the destination used by the last Leave Now
  // calculation.
  const leaveNowDestinationRef =
    useRef<string | null>(null);

  // Tracks whether the Leave Now destination was
  // changed while in Leave Now mode.
  const leaveNowDestinationChangedRef =
    useRef(false);

  // --------------------------------------------------
  // AUTOMATIC ROUTE RECALCULATION REFS
  // --------------------------------------------------

  // Location used for the most recent successful
  // route calculation.
  const lastRouteLocationRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Time of the most recent successful route
  // calculation.
  const lastRouteCalculationTimeRef =
    useRef<number>(0);

  // Prevents multiple route API requests from running
  // at the same time.
  const routeCalculationInProgressRef =
    useRef(false);

  // ==================================================
  // CURRENT LOCATION
  // ==================================================

  const {
    location,
    loading,
    error,
  } = useLocation();

  // ==================================================
  // CALCULATE ROUTE
  // ==================================================

  async function calculateLeaveTime(
    calculationMode: "arrive" | "leaveNow" = mode,
    values?: {
      arrivalDate?: string;
      arrivalTime?: string;
      destination?: PlaceSuggestion;
    },
    options?: {
      scrollToResult?: boolean;
    }
  ) {
    // ------------------------------------------------
    // PREVENT OVERLAPPING REQUESTS
    // ------------------------------------------------

    if (routeCalculationInProgressRef.current) {
      return;
    }

    // ------------------------------------------------
    // CHECK CURRENT LOCATION
    // ------------------------------------------------

    if (!location) {
      setCalculationError(
        "We can't calculate your route because your current location is unavailable."
      );

      return;
    }

    // ------------------------------------------------
    // USE FRESH VALUES
    // ------------------------------------------------

    const selectedArrivalDate =
      values?.arrivalDate ?? arrivalDate;

    const selectedArrivalTime =
      values?.arrivalTime ?? arrivalTime;

    const selectedDestination =
      values?.destination ?? destination;

    if (!selectedDestination) {
      setCalculationError(
        "Please select a destination."
      );

      return;
    }

    // ------------------------------------------------
    // CREATE DEPARTURE TIMESTAMP
    // ------------------------------------------------

    let departureTime: string;

    if (calculationMode === "leaveNow") {
      departureTime = new Date().toISOString();
    } else {
      if (
        !selectedArrivalDate ||
        !selectedArrivalTime
      ) {
        setCalculationError(
          "Please select an arrival date and time."
        );

        return;
      }

      const dateParts =
        selectedArrivalDate.split("-");

      const timeParts =
        selectedArrivalTime.split(":");

      if (dateParts.length !== 3) {
        setCalculationError(
          "The selected arrival date is invalid."
        );

        return;
      }

      if (timeParts.length !== 2) {
        setCalculationError(
          "The selected arrival time is invalid."
        );

        return;
      }

      const year = Number(dateParts[0]);
      const month = Number(dateParts[1]);
      const day = Number(dateParts[2]);

      const hours = Number(timeParts[0]);
      const minutes = Number(timeParts[1]);

      if (
        !Number.isFinite(year) ||
        !Number.isFinite(month) ||
        !Number.isFinite(day) ||
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes)
      ) {
        setCalculationError(
          "The selected arrival date or time is invalid."
        );

        return;
      }

      const requestedArrival = new Date(
        year,
        month - 1,
        day,
        hours,
        minutes,
        0,
        0
      );

      if (
        Number.isNaN(
          requestedArrival.getTime()
        )
      ) {
        setCalculationError(
          "The selected arrival date or time is invalid."
        );

        return;
      }

      if (requestedArrival <= new Date()) {
        setCalculationError(
          "That arrival time has already passed. Please choose a future date and time."
        );

        return;
      }

      departureTime =
        requestedArrival.toISOString();
    }

    // ------------------------------------------------
    // BEGIN ROUTE CALCULATION
    // ------------------------------------------------

    routeCalculationInProgressRef.current =
      true;

    // ------------------------------------------------
    // RESET PREVIOUS ERROR / RESULT DISPLAY
    // ------------------------------------------------

    setCalculationError(null);
    setLeaveTime("");
    setEstimatedArrivalTime("");

    try {
      // ------------------------------------------------
      // CALL ROUTE API
      // ------------------------------------------------

      const response = await fetch(
        "/api/routes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            origin: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
            destinationPlaceId:
              selectedDestination.placeId,
            departureTime,
            mode: calculationMode,
          }),
        }
      );

      // ------------------------------------------------
      // HANDLE API ERROR
      // ------------------------------------------------

      if (!response.ok) {
        const errorData =
          await response.json().catch(
            () => null
          );

        console.error(
          "Route API error:",
          errorData
        );

        setCalculationError(
          "We couldn't calculate your route right now. Please try again."
        );

        return;
      }

      const data =
        await response.json();

      // ------------------------------------------------
      // VALIDATE GOOGLE RESPONSE
      // ------------------------------------------------

      if (
        !data.duration ||
        !data.staticDuration
      ) {
        console.error(
          "Invalid route response:",
          data
        );

        setCalculationError(
          "Google couldn't calculate a route for this request."
        );

        return;
      }

      // ------------------------------------------------
      // CALCULATE TRAVEL TIME
      // ------------------------------------------------

      const trafficSeconds = Number(
        String(data.duration).replace(
          "s",
          ""
        )
      );

      const normalSeconds = Number(
        String(data.staticDuration).replace(
          "s",
          ""
        )
      );

      const trafficMinutes = Math.ceil(
        trafficSeconds / 60
      );

      const normalMinutes = Math.ceil(
        normalSeconds / 60
      );

      const trafficDelay = Math.max(
        0,
        trafficMinutes - normalMinutes
      );

      // ------------------------------------------------
      // CALCULATE RESULT
      // ------------------------------------------------

      if (calculationMode === "arrive") {
        const arrival = new Date(
          `${selectedArrivalDate}T${selectedArrivalTime}:00`
        );

        if (
          Number.isNaN(arrival.getTime())
        ) {
          setCalculationError(
            "The selected arrival date or time is invalid."
          );

          return;
        }

        const leave = new Date(
          arrival.getTime() -
            trafficMinutes * 60000
        );

        const calculatedLeaveTime =
          leave.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          });

        setLeaveTime(
          calculatedLeaveTime
        );

        // Save Arrive By result for later
        // restoration without another API call.
        setLastArriveBy({
          destinationPlaceId:
            selectedDestination.placeId,
          arrivalDate:
            selectedArrivalDate,
          arrivalTime:
            selectedArrivalTime,
          leaveTime:
            calculatedLeaveTime,
          routeInfo: {
            travelMinutes:
              trafficMinutes,
            distanceKm: Number(
              (
                data.distanceMeters / 1000
              ).toFixed(1)
            ),
            trafficDelay,
            description:
              data.description ?? "",
          },
        });
      } else {
        // ------------------------------------------------
        // LEAVE NOW RESULT
        // ------------------------------------------------

        const now = new Date(
          departureTime
        );

        if (
          Number.isNaN(now.getTime())
        ) {
          setCalculationError(
            "The current time could not be determined."
          );

          return;
        }

        const estimatedArrival =
          new Date(
            now.getTime() +
              trafficMinutes * 60000
          );

        const formattedEstimatedArrival =
          estimatedArrival.toLocaleTimeString(
            [],
            {
              hour: "numeric",
              minute: "2-digit",
            }
          );

        setEstimatedArrivalTime(
          formattedEstimatedArrival
        );

        setLeaveTime("Now");

        // Save Leave Now result for later
        // restoration without another API call.
        setLastLeaveNow({
          destinationPlaceId:
            selectedDestination.placeId,
          leaveTime: "Now",
          estimatedArrivalTime:
            formattedEstimatedArrival,
          routeInfo: {
            travelMinutes:
              trafficMinutes,
            distanceKm: Number(
              (
                data.distanceMeters / 1000
              ).toFixed(1)
            ),
            trafficDelay,
            description:
              data.description ?? "",
          },
        });
      }

      // ------------------------------------------------
      // SAVE CURRENT ROUTE INFORMATION
      // ------------------------------------------------

      setRouteInfo({
        travelMinutes:
          trafficMinutes,
        distanceKm: Number(
          (
            data.distanceMeters / 1000
          ).toFixed(1)
        ),
        trafficDelay,
        description:
          data.description ?? "",
      });

      // ------------------------------------------------
      // MARK CALCULATION AS COMPLETE
      // ------------------------------------------------

      setHasCalculated(true);
      hasCalculatedRef.current = true;

      // Save the location and time used for this
      // successful route calculation.
      lastRouteLocationRef.current = {
        latitude: location.latitude,
        longitude: location.longitude,
      };

      lastRouteCalculationTimeRef.current =
        Date.now();

      // ------------------------------------------------
      // SCROLL TO RESULT
      // ------------------------------------------------

      // User-initiated calculations scroll to the
      // ResultCard. Automatic GPS recalculations
      // explicitly disable this behavior.
      if (
        options?.scrollToResult !== false
      ) {
        setTimeout(() => {
          resultRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      }
    } catch (error) {
      console.error(
        "Route calculation failed:",
        error
      );

      setCalculationError(
        "Something went wrong while calculating your route. Please try again."
      );
    } finally {
      // Allow future calculations once this
      // request has completely finished.
      routeCalculationInProgressRef.current =
        false;
    }
  }

  // ==================================================
  // AUTOMATIC LEAVE NOW RECALCULATION
  // ==================================================

  useEffect(() => {
    // No current location means there is nothing
    // to evaluate.
    if (!location) {
      return;
    }

    // Only recalculate an existing result.
    if (!hasCalculatedRef.current) {
      return;
    }

    // Automatic recalculation is only for Leave Now.
    if (mode !== "leaveNow") {
      return;
    }

    // A destination is required.
    if (!destination) {
      return;
    }

    // We need a previous route location to compare
    // against.
    if (!lastRouteLocationRef.current) {
      return;
    }

    // Never start another request while one is
    // already running.
    if (
      routeCalculationInProgressRef.current
    ) {
      return;
    }

    // ------------------------------------------------
    // CHECK DISTANCE MOVED
    // ------------------------------------------------

    const distanceMoved =
      getDistanceInMeters(
        lastRouteLocationRef.current.latitude,
        lastRouteLocationRef.current.longitude,
        location.latitude,
        location.longitude
      );

    if (
      distanceMoved <
      ROUTE_RECALCULATION_DISTANCE_METERS
    ) {
      return;
    }

    // ------------------------------------------------
    // CHECK TIME SINCE LAST CALCULATION
    // ------------------------------------------------

    const timeSinceLastCalculation =
      Date.now() -
      lastRouteCalculationTimeRef.current;

    if (
      timeSinceLastCalculation <
      ROUTE_RECALCULATION_COOLDOWN_MS
    ) {
      return;
    }

    // ------------------------------------------------
    // AUTOMATIC RECALCULATION
    // ------------------------------------------------

    // Update the existing ResultCard silently.
    // Do not scroll the user back to it.
    calculateLeaveTime(
      "leaveNow",
      undefined,
      {
        scrollToResult: false,
      }
    );
  }, [
    location,
    mode,
    destination,
  ]);

  // ==================================================
  // UI
  // ==================================================

  return (
    <main>
      <div
        className="mx-auto max-w-xl space-y-4 px-6 pb-6"
        style={{
          paddingTop:
            "calc(env(safe-area-inset-top) + 1.5rem)",
          paddingBottom:
            "calc(env(safe-area-inset-bottom) + 1.5rem)",
        }}
      >
        <Header />

        <CurrentLocationCard
          location={location}
          loading={loading}
          error={error}
        />

        {calculationError && (
          <Toast
            message={calculationError}
            onClose={() =>
              setCalculationError(null)
            }
          />
        )}

        <DestinationCard
          // ------------------------------------------------
          // CLEAR DESTINATION
          // ------------------------------------------------

          onClear={() => {
            setDestination(null);

            setHasCalculated(false);
            hasCalculatedRef.current = false;

            setLeaveTime("");
            setEstimatedArrivalTime("");

            // Reset automatic recalculation tracking.
            lastRouteLocationRef.current =
              null;

            lastRouteCalculationTimeRef.current =
              0;
          }}

          // ------------------------------------------------
          // SELECT DESTINATION
          // ------------------------------------------------

          onSelect={(place) => {
            if (mode === "leaveNow") {
              // Destination changed while in Leave Now.
              leaveNowDestinationChangedRef.current =
                true;

              setDestination(place);

              // Destination changes are user initiated,
              // so this calculation should still scroll
              // to the ResultCard.
              calculateLeaveTime(
                "leaveNow",
                {
                  destination: place,
                }
              );

              return;
            }

            // Arrive By:
            // Only change the destination.
            // Do not automatically recalculate.
            setDestination(place);

            setHasCalculated(false);
            hasCalculatedRef.current = false;
          }}
        />

        <ArrivalTimeCard
          value={arrivalTime}
          onChange={setArrivalTime}
          mode={mode}
          onModeChange={(newMode) => {
            if (newMode === mode) {
              return;
            }

            // ------------------------------------------------
            // SWITCH TO ARRIVE BY
            // ------------------------------------------------

            if (newMode === "arrive") {
              // If the destination changed while in
              // Leave Now, require a new arrival date
              // and time.
              if (
                mode === "leaveNow" &&
                (
                  leaveNowDestinationRef.current !==
                    destination?.placeId ||
                  !arrivalDate ||
                  !arrivalTime
                )
              ) {
                setCalculationError(
                  "Please select an arrival date and time."
                );

                setMode("arrive");

                setHasCalculated(false);
                hasCalculatedRef.current =
                  false;

                return;
              }

              // Restore a cached Arrive By result
              // when it matches the current destination.
              if (
                lastArriveBy &&
                lastArriveBy.destinationPlaceId ===
                  destination?.placeId
              ) {
                setMode("arrive");

                setArrivalDate(
                  lastArriveBy.arrivalDate
                );

                setArrivalTime(
                  lastArriveBy.arrivalTime
                );

                setLeaveTime(
                  lastArriveBy.leaveTime
                );

                setRouteInfo(
                  lastArriveBy.routeInfo
                );

                setEstimatedArrivalTime("");

                setHasCalculated(true);
                hasCalculatedRef.current =
                  true;

                return;
              }

              // Otherwise simply switch to Arrive By.
              setMode("arrive");

              return;
            }

            // ------------------------------------------------
            // SWITCH TO LEAVE NOW
            // ------------------------------------------------

            if (newMode === "leaveNow") {
              // Remember which destination the current
              // Leave Now calculation belongs to.
              leaveNowDestinationRef.current =
                destination?.placeId ?? null;

              leaveNowDestinationChangedRef.current =
                false;

              // Restore a cached Leave Now result
              // when it matches the current destination.
              if (
                lastLeaveNow &&
                lastLeaveNow.destinationPlaceId ===
                  destination?.placeId
              ) {
                setMode("leaveNow");

                setLeaveTime(
                  lastLeaveNow.leaveTime
                );

                setEstimatedArrivalTime(
                  lastLeaveNow.estimatedArrivalTime
                );

                setRouteInfo(
                  lastLeaveNow.routeInfo
                );

                setHasCalculated(true);
                hasCalculatedRef.current =
                  true;

                return;
              }

              // No matching cached result.
              // Calculate a fresh Leave Now route.
              setMode("leaveNow");

              calculateLeaveTime(
                "leaveNow"
              );

              return;
            }

            setMode(newMode);
          }}
          onDateChange={setArrivalDate}
          onCalculate={calculateLeaveTime}
        />

        {/* ------------------------------------------------
            RESULT
        ------------------------------------------------ */}

        {hasCalculated && leaveTime && (
          <div ref={resultRef}>
            <ResultCard
              mode={mode}
              leaveTime={leaveTime}
              location={location}
              destination={destination}
              arrivalTime={
                mode === "arrive"
                  ? arrivalTime
                  : estimatedArrivalTime
              }
              routeInfo={routeInfo}
              onClose={() => {
                setHasCalculated(false);
                hasCalculatedRef.current =
                  false;

                setLeaveTime("");
                setEstimatedArrivalTime("");
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}