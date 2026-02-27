"use client";

import { use, useEffect, useRef } from "react";
import { Span } from "@/@types/spanItem";
import { InterceptorSpan } from "@/@types/intercept";
import { useRequestStore } from "@/stores/useRequestStore";
import { useSpanStore } from "@/stores/useSpanStore";

function mapInterceptorSpanToSpan(span: InterceptorSpan): Span {
  return {
    id: span.id,
    trace_id: span.trace_id,
    span_id: span.span_id,
    parent_span_id: span.parent_span_id || null,
    operation: span.operation,
    service_name: span.service_name,
    start_time: span.start_time,
    duration: span.duration,
    status:
      span.status.toLowerCase() === "ok"
        ? "ok"
        : span.status.toLowerCase() === "error"
          ? "error"
          : "unset",
    tags: span.tags,
  };
}

export default function SpanDetailsSync() {
  const execution = useRequestStore((s) => s.execution);
  const setSpans = useSpanStore((s) => s.setSpans);
  const addSpan = useSpanStore((s) => s.addSpan);

  const eventSourceRef = useRef<EventSource | null>(null);
  const prevTraceIdRef = useRef<string | null>(null);

  useEffect(() => {
    const traceId = execution?.traceId ?? null;

    if (!traceId) return;

    // If trace changed → reset everything
    if (prevTraceIdRef.current !== traceId) {
      prevTraceIdRef.current = traceId;

      // Clear existing spans
      setSpans([]);

      // Close previous SSE connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Open new SSE connection
      const es = new EventSource(`/api/trace-stream?traceId=${traceId}`);

      let completed = false;

      es.onopen = () => {
        console.log("SSE connected");
      };

      es.onmessage = (event) => {
        try {
          const interceptorSpan: InterceptorSpan = JSON.parse(event.data);
          const mappedSpan = mapInterceptorSpanToSpan(interceptorSpan);

          // Append span
          addSpan(mappedSpan);
        } catch (err) {
          console.error("Failed to parse SSE span:", err);
        }
      };

      // Event listener that detects when trace is complete
      es.addEventListener("complete", () => {
        completed = true;
        es.close();
      });

      es.onerror = (err) => {
        console.log("SSE state:", es.readyState);
        console.log("Completed flag:", completed);
        if (!completed) {
          console.error("SSE failed unexpectedly. Attempting reconnect...");
        }
      };

      eventSourceRef.current = es;
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [execution?.traceId, setSpans]);

  return null;
}
