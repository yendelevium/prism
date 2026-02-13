"use server";

import {
  listSpansByTraceId,
  getSpanById,
} from "@/backend/span/span.service";
import type { Span } from "@/backend/span/span.types";
import { requireUser } from "@/backend/auth/auth.utils";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function listSpansByTraceIdAction(
  traceId: string,
): Promise<ActionResult<Span[]>> {
  if (!traceId || traceId.trim().length === 0) {
    return { success: false, error: "traceId is required" };
  }

  try {
    await requireUser();
    const spans = await listSpansByTraceId(traceId);
    return { success: true, data: spans };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to list spans", error);
    return { success: false, error: message };
  }
}

export async function getSpanByIdAction(
  spanId: string,
): Promise<ActionResult<Span | null>> {
  if (!spanId || spanId.trim().length === 0) {
    return { success: false, error: "spanId is required" };
  }

  try {
    await requireUser();
    const span = await getSpanById(spanId);
    return { success: true, data: span ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get span", error);
    return { success: false, error: message };
  }
}