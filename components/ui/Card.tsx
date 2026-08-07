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
        "rounded-3xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl shadow-lg shadow-black/20",
        "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}