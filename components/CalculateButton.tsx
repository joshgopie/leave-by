"use client";

import { Navigation } from "lucide-react";
import Button from "@/components/ui/Button";

interface CalculateButtonProps {
  onClick: () => void;
}

export default function CalculateButton({
  onClick,
}: CalculateButtonProps) {
  return (
    <Button onClick={onClick}>
      <div className="flex items-center justify-center gap-2">
        <Navigation size={20} />

        Calculate Leave Time
      </div>
    </Button>
  );
}