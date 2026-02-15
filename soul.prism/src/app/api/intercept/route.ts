// src/app/api/intercept/route.ts
import { NextResponse } from "next/server";
import "server-only";
import type { InterceptorResponse } from "@/@types/intercept";

export async function POST(req: Request) {
  const payload = await req.json();

  try {
    const res = await fetch("http://localhost:7000/rest/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as InterceptorResponse;

    return NextResponse.json(data);
  } catch {
    console.error("[ERROR]: Failed to fetch from interceptor!");
    return NextResponse.json(
      { error: "Interceptor service unavailable" },
      { status: 502 },
    );
  }
}
