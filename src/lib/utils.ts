
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add types for react-graph-vis if needed
declare global {
  interface Window {
    vis: any;
  }
}
