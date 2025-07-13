import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentClassFromBatch(batch: string, section?: string): string {
  if (!batch) return '';
  const now = new Date();
  const currentYear = now.getFullYear();
  const [start, end] = batch.split('-').map(Number);
  if (!start || !end) return '';
  let yearNum = currentYear - start + 1;
  if (yearNum < 1) yearNum = 1;
  if (yearNum > 2) return 'Graduated';
  let yearStr = '';
  if (yearNum === 1) yearStr = 'I MCA';
  else if (yearNum === 2) yearStr = 'II MCA';
  if (section) yearStr += ` ${section}`;
  return yearStr;
}

// Utility function to get user role from localStorage
export function getUserRole(): string {
  if (typeof window === "undefined") return "admin"
  
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    return user.role || (user.user && user.user.role) || "admin"
  } catch {
    return "admin"
  }
}

// Utility function to check if user is admin
export function isAdmin(): boolean {
  return getUserRole() === "admin"
}
