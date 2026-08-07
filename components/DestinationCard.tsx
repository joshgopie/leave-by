"use client";

import Card from "./ui/Card";
import { MapPin } from "lucide-react";
import PlaceAutocomplete from "./PlacesAutocomplete";
import type { PlaceSuggestion } from "@/types/places";


interface DestinationCardProps {
  onSelect: (place: PlaceSuggestion) => void;
}


export default function DestinationCard({
  onSelect,
}: DestinationCardProps) {

  return (
    <div className="relative z-50">

      <Card>

        <div className="space-y-4">

          <div className="flex items-center gap-3">

            <div className="rounded-2xl bg-green-500/20 p-3">

              <MapPin
                className="text-green-400"
                size={22}
              />

            </div>


            <div>

              <p className="text-sm text-zinc-400">
                Destination
              </p>

              <h2 className="font-semibold">
                Where are you going?
              </h2>

            </div>

          </div>


          <PlaceAutocomplete
            onSelect={onSelect}
          />

        </div>

      </Card>

    </div>
  );
}