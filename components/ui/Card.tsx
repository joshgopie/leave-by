import { ReactNode } from "react";
import clsx from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({
  children,
  className,
}: CardProps) {
  return (
    <div
      className={clsx(
        "relative rounded-3xl",
        "border border-white/[0.12]",
        "bg-white/[0.07]",
        "shadow-[0_8px_32px_rgba(0,0,0,0.25)]",
        "p-5",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />

      <div className="relative">
        {children}
      </div>
    </div>
  );
}