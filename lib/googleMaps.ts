export async function reverseGeocode(
  latitude: number,
  longitude: number
) {
  const response = await fetch(
    `/api/geocode?lat=${latitude}&lng=${longitude}`
  );

  if (!response.ok) {
    throw new Error("Failed to get address");
  }

  return response.json();
}