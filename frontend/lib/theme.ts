// frontend/lib/theme.ts
// Single source of truth for all design tokens.
// Import from here — never hand-roll hex values in components.

import type { Layer, WorkOrderStatus, Severity } from "./types";

export const LAYER_COLORS: Record<Layer, string> = {
  road: "#9AA3B2",
  drainage: "#00FFCC", // High-contrast bright cyan
  ward: "#8b5cf6",
} as const;

export const SEVERITY_COLORS: Record<Severity, string> = {
  red: "#FF4D4F",
  yellow: "#FFC53D",
} as const;

export const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  pending: "#8890A0",      // grey — not yet reviewed
  conflict: "#FF4D4F",     // red
  coordinating: "#FFC53D", // amber
  approved: "#2DD4BF",     // teal accent
  completed: "#34D399",    // green
  rejected: "#F87171",     // muted rose — distinct from active "conflict" red
} as const;


export const TOKENS = {
  bgBase: "#0A0A0A",
  surface: "#0A0A0A",
  border: "#1F1F1F",
  textPrimary: "#E8EBF0",
  textMuted: "#8890A0",
  accent: "#4A9EFF", // matches globals.css --accent
} as const;