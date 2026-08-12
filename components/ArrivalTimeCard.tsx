"use client";

import { useEffect, useState } from "react";
import Card from "./ui/Card";
import { Clock3 } from "lucide-react";

interface ArrivalTimeCardProps {
  value: string;
  onChange: (value: string) => void;
  mode: "arrive" | "leaveNow";
  onModeChange: (mode: "arrive" | "leaveNow") => void;
}

export default function ArrivalTimeCard({
  value,
  onChange,
  mode,
  onModeChange,
}: ArrivalTimeCardProps) {
  const [displayTime, setDisplayTime] = useState("");

  // Set default arrival time to the next 15-minute interval
  useEffect(() => {
    if (!value) {
      const now = new Date();

      let hours = now.getHours();
      let minutes = now.getMinutes();

      minutes = Math.ceil(minutes / 15) * 15;

      if (minutes === 60) {
        minutes = 0;
        hours += 1;

        if (hours === 24) {
          hours = 0;
        }
      }

      onChange(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`
      );
    }
  }, [value, onChange]);

  // Convert 24-hour value to 12-hour display
  useEffect(() => {
    if (!value) return;

    const [hours, minutes] = value.split(":").map(Number);

    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);

    setDisplayTime(
      date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    );
  }, [value]);

  return (
    <Card>
      <div className="space-y-5">

        {/* Mode buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onModeChange("arrive")}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              mode === "arrive"
                ? "bg-amber-500 text-black"
                : "bg-zinc-800 text-white"
            }`}
          >
            Arrive By
          </button>

          <button
            type="button"
            onClick={() => onModeChange("leaveNow")}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              mode === "leaveNow"
                ? "bg-amber-500 text-black"
                : "bg-zinc-800 text-white"
            }`}
          >
            Leave now
          </button>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-500/20 p-3">
            <Clock3
              className="text-amber-400"
              size={22}
            />
          </div>

          <div>
            <p className="text-sm text-zinc-400">
              {mode === "arrive" ? "Arrive By" : "Leave Now"}
            </p>

            <h2 className="font-semibold">
              {mode === "arrive"
                ? "What time do you need to arrive?"
                : "Travel duration will be calculated based on your current time"}
            </h2>
          </div>
        </div>

        {/* Time picker */}
        {mode === "arrive" &&(
          <label
          className="
            relative
            flex
            items-center
            justify-between
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-950
            px-5
            py-4
            cursor-pointer
            overflow-hidden
          "
        >
          <span className="text-2xl font-semibold">
            {displayTime}
          </span>

          <Clock3
            className="text-zinc-400"
            size={20}
          />

          <input
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="
              absolute
              inset-0
              h-full
              w-full
              cursor-pointer
              opacity-0
            "
          />
        </label>
        )}
      </div>
    </Card>
  );
}