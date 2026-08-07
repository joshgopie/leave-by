import { InputHTMLAttributes } from "react";
import clsx from "clsx";

interface Props extends InputHTMLAttributes<HTMLInputElement> {}

export default function Input({
  className,
  ...props
}: Props) {
  return (
    <input
      className={clsx(
        "w-full",
        "rounded-2xl",
        "bg-zinc-950",
        "border",
        "border-zinc-800",
        "px-4",
        "py-4",
        "text-white",
        "placeholder:text-zinc-500",
        "focus:border-blue-500",
        "focus:outline-none",
        "transition-all",
        className
      )}
      {...props}
    />
  );
}