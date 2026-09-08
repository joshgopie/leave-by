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
          border-zinc-800
          bg-zinc-950/95
          px-5
          py-5
          text-white
          shadow-2xl
          backdrop-blur-xl
        "
      >
        <div className="flex items-center gap-4">

          {/* ICON */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600/15">
            <AlertCircle
              size={22}
              className="text-red-400"
            />
          </div>

          {/* MESSAGE */}
          <p className="min-w-0 flex-1 text-sm font-medium leading-relaxed text-zinc-100">
            {message}
          </p>

          {/* OK BUTTON */}
          <button
            type="button"
            onClick={onClose}
            className="
              shrink-0
              rounded-xl
              bg-blue-600
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              shadow-lg
              shadow-blue-950/30
              transition
              active:scale-95
              hover:bg-blue-500
            "
          >
            OK
          </button>

        </div>
      </div>
    </div>
  );
}
