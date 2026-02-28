// app/api/trace-stream/route.ts
import { NextRequest } from "next/server";

/*
 * Nextjs Backend Api Route for clients to access the streams
 *
 */

export const GET = async (req: NextRequest) => {
  const traceId = req.nextUrl.searchParams.get("traceId");
  if (!traceId) {
    return new Response(JSON.stringify({ error: "traceId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // The URL of your Go backend SSE endpoint
  let interceptUrl = process.env.INTERCEPT_URL || "http://localhost:7000";
  const backendUrl = `${interceptUrl}/traces/stream?traceId=${traceId}`;

  const backendRes = await fetch(backendUrl, {
    method: "GET",
  });

  if (!backendRes.ok) {
    return new Response("Failed to connect to backend SSE", { status: 500 });
  }

  // Forward SSE as a stream
  const reader = backendRes.body?.getReader();
  if (!reader) {
    return new Response("Backend has no body", { status: 500 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // Forward bytes to client
        controller.enqueue(value);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
