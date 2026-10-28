"use client";

import React from "react";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  border?: boolean;
}

const sizeClasses = {
  xs: "w-7 h-7 text-xs",
  sm: "w-9 h-9 text-sm",
  md: "w-11 h-11 text-base",
  lg: "w-16 h-16 text-xl",
  xl: "w-24 h-24 text-3xl",
};

export function Avatar({ src, alt, size = "md", className = "", border = true }: AvatarProps) {
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const initial = alt ? alt.charAt(0).toUpperCase() : "🐾";

  return (
    <div
      className={`relative shrink-0 rounded-full overflow-hidden bg-cream-200 flex items-center justify-center font-bold text-brown-dark select-none ${sizeClass} ${
        border ? "border-2 border-white shadow-xs" : ""
      } ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          className="object-cover"
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
