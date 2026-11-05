import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn() joins CSS class names and resolves Tailwind conflicts.
 * Example: cn("px-2", isBig && "px-6") -> "px-6"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
