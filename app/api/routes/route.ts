
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const {
      origin,
      destinationPlaceId,
      departureTime,
      mode,
      destinationLatitude,
      destinationLongitude,
      destinationName,
      arrivalTime,
    } = await request.json();

    if (!origin || !destinationPlaceId) {
      return NextResponse.json(
        { error: "Missing route information" },
        { status: 400 }
      );
    }

    // ==================================================
    // ARRIVE BY - GOOGLE MAPS SCRAPER
    // ==================================================

    if (mode === "arrive") {
      if (
        typeof destinationLatitude !== "number" ||
        typeof destinationLongitude !== "number" ||
        !destinationName ||
        !arrivalTime
      ) {
        return NextResponse.json(
          { error: "Missing Arrive By information" },
          { status: 400 }
        );
      }

      const response = await fetch(
        "http://127.0.0.1:8000/route",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            origin_lat: origin.latitude,
            origin_lng: origin.longitude,
            destination_place_id: destinationPlaceId,
            destination_lat: destinationLatitude,
            destination_lng: destinationLongitude,
            destination_name: destinationName,
            arrival_time: arrivalTime,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Google Maps Scraper Error:", data);

        return NextResponse.json(
          { error: "Google Maps scraper failed", details: data },
          { status: 500 }
        );
      }

      const route = data.routes?.[0];

      if (!route) {
        return NextResponse.json(
          { error: "No route found by Google Maps" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        route: {
          leaveTime: route.leave_time,
          typicalTime: route.typical_time,
          distance: route.distance,
          description: route.route,
        },
      });
    }

    // ==================================================
    // LEAVE NOW - EXISTING GOOGLE ROUTES API
    // ==================================================

    const safeDepartureTime =
      mode === "leaveNow"
        ? new Date(Date.now() + 5_000).toISOString()
        : departureTime;

    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY!,
          "X-Goog-FieldMask":
            "routes.duration,routes.staticDuration,routes.distanceMeters,routes.description",
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: origin.latitude,
                longitude: origin.longitude,
              },
            },
          },
          destination: {
            placeId: destinationPlaceId,
          },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE_OPTIMAL",
          trafficModel: "BEST_GUESS",
          departureTime: safeDepartureTime,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Google Routes Error:", data);

      return NextResponse.json(
        { error: "Google Routes failed", details: data },
        { status: 500 }
      );
    }

    const route = data.routes?.[0];

    if (!route) {
      return NextResponse.json(
        { error: "No route found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      duration: route.duration,
      staticDuration: route.staticDuration,
      distanceMeters: route.distanceMeters,
      description: route.description,
    });
  } catch (error) {
    console.error("Route API Error:", error);

    return NextResponse.json(
      { error: "Route calculation failed" },
      { status: 500 }
    );
  }
}
