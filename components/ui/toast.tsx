"use client";

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
        bottom-6
        left-1/2
        -translate-x-1/2
        z-[9999]
        w-[calc(100%-2rem)]
        max-w-md
        rounded-2xl
        border
        border-red-500/30
        bg-zinc-950
        px-5
        py-4
        text-red-400
        shadow-2xl
        shadow-red-950/30
    "
    >
      <div className="flex items-center justify-between gap-4">
        <p>{message}</p>

        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}