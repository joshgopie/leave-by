import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {

  try {

    const body = await request.json();

    const {
      origin,
      destinationPlaceId,
      departureTime,
    } = body;


    if (!origin || !destinationPlaceId) {
      return NextResponse.json(
        { error: "Missing route information" },
        { status: 400 }
      );
    }


    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "X-Goog-Api-Key":
            process.env.GOOGLE_MAPS_API_KEY!,

          "X-Goog-FieldMask":
            "routes.duration,routes.staticDuration,routes.distanceMeters",
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


          routingPreference:
            "TRAFFIC_AWARE",

          departureTime: 
            departureTime,

        }),
      }
    );


    const data = await response.json();


    if (!response.ok) {

      console.error(
        "Google Routes Error:",
        data
      );


      return NextResponse.json(
        {
          error: "Google Routes failed",
          details: data,
        },
        {
          status: 500,
        }
      );

    }


    const route = data.routes?.[0];


    if (!route) {

      return NextResponse.json(
        {
          error: "No route found",
        },
        {
          status: 404,
        }
      );

    }


    return NextResponse.json({

      duration:
      route.duration,

    staticDuration:
      route.staticDuration,

  distanceMeters:
    route.distanceMeters,

    });


  } catch (error) {

    console.error(
      "Route API Error:",
      error
    );


    return NextResponse.json(
      {
        error: "Route calculation failed",
      },
      {
        status: 500,
      }
    );

  }

}