// src/app/api/intercept/route.ts
import { NextResponse } from "next/server";
import "server-only";
import type {
  InterceptorResponse,
  GraphQLInterceptorResponse,
  GRPCInterceptorResponse,
  Protocol,
} from "@/@types/intercept";

export async function POST(req: Request) {
  const payload = await req.json();
  const protocol = (payload.protocol || "REST") as Protocol;

  try {
    let interceptUrl = process.env.INTERCEPT_URL || "http://localhost:7000";

    switch (protocol) {
      case "REST":
        interceptUrl = interceptUrl + "/rest";
        break;
      case "GRAPHQL":
        interceptUrl = interceptUrl + "/graphql";
        break;
      case "GRPC":
        interceptUrl = interceptUrl + "/grpc";
        break;
      default:
        interceptUrl = interceptUrl + "/rest";
    }

    const res = await fetch(interceptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data:
      | InterceptorResponse
      | GraphQLInterceptorResponse
      | GRPCInterceptorResponse;
    if (protocol === "GRPC") {
      data = (await res.json()) as GRPCInterceptorResponse;
    } else if (protocol === "GRAPHQL") {
      data = (await res.json()) as GraphQLInterceptorResponse;
    } else {
      data = (await res.json()) as InterceptorResponse;
    }

    return NextResponse.json(data);
  } catch {
    console.error("[ERROR]: Failed to fetch from interceptor!");
    return NextResponse.json(
      { error: "Interceptor service unavailable" },
      { status: 502 },
    );
  }
}
