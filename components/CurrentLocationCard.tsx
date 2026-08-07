"use client";

import Card from "./ui/Card";
import { LocateFixed, CheckCircle2 } from "lucide-react";

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
            className="text-blue-400"
            size={22}
          />
        </div>


        <div className="flex-1">

          <p className="text-sm text-zinc-400">
            Current Location
          </p>


          {loading && !location && (
            <h2 className="font-semibold">
              Getting location...
            </h2>
          )}


          {location && (
            <>

              <h2 className="font-semibold">
                {location.address ?? "Location found"}
              </h2>


              <div className="flex items-center gap-1 mt-1">

                <CheckCircle2
                  size={14}
                  className="text-green-400"
                />

                <p className="text-sm text-zinc-500">
                  Updated just now
                </p>

              </div>

            </>
          )}


          {error && !location && (
            <p className="text-red-400 text-sm">
              {error}
            </p>
          )}


        </div>

      </div>

    </Card>
  );
}