"use client";

import Card from "./ui/Card";
import { LocateFixed } from "lucide-react";

interface Props {
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;

  loading: boolean;

  error: string | null;
}

export default function CurrentLocationCard({
  location,
  loading,
  error,
}: Props) {
  return (
    <Card>
      <div className="flex items-center gap-3">

        <div className="rounded-2xl bg-blue-500/20 p-3">
          <LocateFixed
            className="text-blue-200/50"
            size={22}
          />
        </div>

        <div className="flex-1">

          <p className="text-sm text-zinc-400">
            My Current Location
          </p>

          {/* FINDING LOCATION */}
          {loading && !location && !error && (
            <>
              {/* <h2 className="font-semibold">
                Getting location...
              </h2> */}

              <div className="mt-1 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                </span>

                <h2 className="font-semibold text-amber-400/80">
                  Finding your location
                </h2>
              </div>
            </>
          )}

          {/* LOCATION FOUND */}
          {location &&  (
            <>
              <h2 className="font-semibold">
                {location.address ?? "Location found"}
              </h2>

              <div className="mt-1 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
                </span>

                <p className="text-sm font-semibold text-green-400/80">
                  Updated just now
                </p>
              </div>
            </>
          )}

          {/* LOCATION ERROR */}
          {error &&(
            <>

              <div className="mt-1 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-400" />
                </span>

                <p className="text-sm font-semibold text-red-400/80">
                  Unable to find current location
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </Card>
  );
}