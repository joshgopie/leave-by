import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {

  const lat = request.nextUrl.searchParams.get("lat");
  const lng = request.nextUrl.searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Missing coordinates" },
      { status: 400 }
    );
  }


  try {

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );


    const data = await response.json();


    const interpolatedResult = data.results?.find(
      (result: any) =>
      result.geometry?.location_type === "ROOFTOP"
    );

    const address = interpolatedResult?.formatted_address?.replace(/^[A-Z0-9]+\+\w+,\s*/, "").replace(/, Trinidad and Tobago$/, "");


    if (!address) {
      throw new Error("No address found");
    }


    return NextResponse.json({
      address,
    });


  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to get address" },
      { status: 500 }
    );

  }
}