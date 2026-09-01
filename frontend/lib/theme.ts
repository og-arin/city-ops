// frontend/lib/theme.ts
// Fixed color tokens that don't shift between light/dark theme — status and
// severity badges stay bold/flat by design, and Mapbox paint properties need
// literal values (CSS custom properties don't reach the GL canvas). Base UI
// tokens (bg/surface/border/text/accent) live in globals.css as CSS vars and
// already respond to the [data-theme] toggle — don't duplicate them here.

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