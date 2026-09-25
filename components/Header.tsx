import { Sun, Moon } from "lucide-react";

export default function Header() {
  const hour = new Date().getHours();

  /* const greeting =
    hour < 12
      ? <>
        Good Morning, Drive Safely
      </>
      : hour < 18
      ? "Good Afternoon"
      : (<>
          Good Night, Drive Safely

      </>);*/

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.25)]">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 text-blue-300"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
            <circle cx="6" cy="12" r="2" />
          </svg>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Leave By
          </h1>

          <p className="text-xs font-medium text-blue-200/70">
            Know when to go.
          </p>
        </div>
      </div>
    </div>
  );
}