import React from "react";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function Button({
  children,
  className = "",
  ...props
}: ButtonProps) {

  return (
    <button
      {...props}
      className={`
        w-full
        rounded-2xl
        bg-blue-600
        py-4
        font-semibold
        text-white
        transition-all
        duration-300
        active:scale-95
        ${className}
      `}
    >
      {children}
    </button>
  );
}