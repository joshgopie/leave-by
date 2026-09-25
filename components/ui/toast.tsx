"use client";

import { AlertCircle } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export default function Toast({
  message,
  onClose,
}: ToastProps) {
  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        pointer-events-none
      "
      role="alert"
    >
      <div
        className="
          pointer-events-auto
          w-[calc(100%-1.5rem)]
          max-w-lg
          rounded-3xl
          border
          border-white/[0.12]
          bg-white/[0.08]
          px-5
          py-5
          text-white
          shadow-2xl
          shadow-black/30
          backdrop-blur-2xl
        "
      >
        <div className="flex items-center gap-4">

          {/* ICON */}
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              border-red-400/10
              bg-red-500/15
            "
          >
            <AlertCircle
              size={22}
              className="text-red-400"
            />
          </div>

          {/* MESSAGE */}
          <p
            className="
              min-w-0
              flex-1
              text-sm
              font-medium
              leading-relaxed
              text-white/90
            "
          >
            {message}
          </p>

          {/* OK BUTTON */}
          <button
            type="button"
            onClick={onClose}
            className="
              shrink-0
              rounded-xl
              bg-blue-500/80
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-lg
              shadow-blue-950/30
              transition
              hover:bg-blue-400/90
              active:scale-95
            "
          >
            OK
          </button>

        </div>
      </div>
    </div>
  );
}