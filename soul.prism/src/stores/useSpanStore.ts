import { create } from "zustand";
import type { Span } from "@/@types/spanItem";

interface SpanState {
  spans: Span[];
  isLoading: boolean;
  setSpans: (s: Span[]) => void;
  addSpan: (s: Span) => void;
  setLoading: (l: boolean) => void;
}

export const useSpanStore = create<SpanState>((set) => ({
  spans: [],
  isLoading: false,
  setSpans: (spans) => set({ spans }),
  addSpan: (span) => set((state) => ({ spans: [...state.spans, span] })),
  setLoading: (isLoading) => set({ isLoading }),
}));
