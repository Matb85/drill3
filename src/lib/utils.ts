import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merges Tailwind classes with conditional values
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
