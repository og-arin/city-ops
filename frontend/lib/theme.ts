// frontend/lib/theme.ts
// Single source of truth for all design tokens.
// Import from here — never hand-roll hex values in components.

import type { Layer, WorkOrderStatus, Severity } from "./types";

export const LAYER_COLORS: Record<Layer, string> = {
  road: "#9AA3B2",
  water: "#3B9EFF",
  electric: "#F5A623",
  telecom: "#B980F0",
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
  bgBase: "#10131A",
  surface: "#1B2029",
  border: "#2A3140",
  textPrimary: "#E8EBF0",
  textMuted: "#8890A0",
  accent: "#2DD4BF",
} as const;
