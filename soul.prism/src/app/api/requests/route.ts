import { NextResponse, type NextRequest } from "next/server";
import {
  createRequest,
  deleteRequest,
  getRequestById,
  getRequestsByCollection,
} from "@/backend/request/request.service";
import type { CreateRequestInput } from "@/backend/request/request.types";
import type { HttpMethod } from "@prisma/client";

export const runtime = "nodejs";

const allowedMethods: ReadonlySet<HttpMethod> = new Set([
  "GET",
  "POST",
  "PUT",
  "DELETE",
]);

function errorDetails(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function parseMethod(value: unknown): HttpMethod | null {
  if (typeof value !== "string") {
    return null;
  }

  const upper = value.toUpperCase() as HttpMethod;
  return allowedMethods.has(upper) ? upper : null;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const requestId = url.searchParams.get("id");
  const collectionId = url.searchParams.get("collectionId");

  try {
    if (requestId) {
      const found = await getRequestById(requestId);
      if (!found) {
        return NextResponse.json(
          { error: "Request not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ data: found }, { status: 200 });
    }

    if (!collectionId) {
      return NextResponse.json(
        { error: "collectionId is required" },
        { status: 400 },
      );
    }

    const requests = await getRequestsByCollection(collectionId);
    return NextResponse.json({ data: requests }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch requests",
        details: process.env.NODE_ENV === "production" ? undefined : errorDetails(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let body: CreateRequestInput | null = null;
  try {
    body = (await request.json()) as CreateRequestInput;
  } catch {
    body = null;
  }

  if (!body) {
    return NextResponse.json(
      { error: "Invalid body" },
      { status: 400 },
    );
  }

  const method = parseMethod(body.method);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const collectionId =
    typeof body.collectionId === "string" ? body.collectionId.trim() : "";
  const createdById =
    typeof body.createdById === "string" && body.createdById.trim().length > 0
      ? body.createdById.trim()
      : "user_01";

  if (!name || !method || !url || !collectionId) {
    return NextResponse.json(
      { error: "name, method, url, and collectionId are required" },
      { status: 400 },
    );
  }

  try {
    const created = await createRequest({
      name,
      method,
      url,
      headers: body.headers ?? null,
      body: body.body ?? null,
      collectionId,
      createdById,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create request",
        details: process.env.NODE_ENV === "production" ? undefined : errorDetails(error),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const requestId = url.searchParams.get("id");

  if (!requestId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const deleted = await deleteRequest(requestId);
    return NextResponse.json({ data: deleted }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete request",
        details: process.env.NODE_ENV === "production" ? undefined : errorDetails(error),
      },
      { status: 500 },
    );
  }
}
