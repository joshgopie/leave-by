
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query?.trim()) {
    return NextResponse.json([]);
  }

  try {
    // 1. Get autocomplete suggestions
    const response = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY!,
          "X-Goog-FieldMask":
            "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
        },
        body: JSON.stringify({
          input: query,
          includedRegionCodes: ["TT"],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Google Places autocomplete failed");
    }

    const data = await response.json();

    const predictions = data.suggestions ?? [];

    // 2. Retrieve coordinates for each suggestion concurrently
    const suggestions = await Promise.all(
      predictions.map(async (item: any) => {
        const prediction = item.placePrediction;

        const detailsResponse = await fetch(
          `https://places.googleapis.com/v1/places/${encodeURIComponent(
            prediction.placeId
          )}`,
          {
            headers: {
              "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY!,
              "X-Goog-FieldMask": "location",
            },
          }
        );

        if (!detailsResponse.ok) {
          console.error(
            "Place Details failed:",
            prediction.placeId,
            detailsResponse.status
          );

          return null;
        }

        const details = await detailsResponse.json();

        const location = details.location;

        if (
          typeof location?.latitude !== "number" ||
          typeof location?.longitude !== "number"
        ) {
          return null;
        }

        // 3. Return the complete PlaceSuggestion
        return {
          placeId: prediction.placeId,
          mainText:
            prediction.structuredFormat.mainText.text,
          secondaryText:
            prediction.structuredFormat.secondaryText?.text ?? "",
          fullText: prediction.text.text,
          latitude: location.latitude,
          longitude: location.longitude,
        };
      })
    );

    // Remove suggestions where coordinates could not be retrieved
    return NextResponse.json(
      suggestions.filter((item) => item !== null)
    );

  } catch (error) {
    console.error("Place search error:", error);

    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}
