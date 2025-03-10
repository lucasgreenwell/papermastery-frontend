
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add helper functions for paper graph generation if needed
export function getRandomOffset(base: number, range: number): number {
  return base + (Math.random() * range * 2) - range;
}
