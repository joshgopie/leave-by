import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json([]);
  }

  try {
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

    const data = await response.json();

    const suggestions =
      data.suggestions?.map((item: any) => ({
        placeId: item.placePrediction.placeId,
        mainText:
          item.placePrediction.structuredFormat.mainText.text,
        secondaryText:
          item.placePrediction.structuredFormat.secondaryText?.text ?? "",
        fullText:
          item.placePrediction.text.text,
      })) ?? [];

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}