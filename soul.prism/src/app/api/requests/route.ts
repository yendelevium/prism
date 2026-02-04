import { NextResponse, type NextRequest } from "next/server";
import {
  createRequest,
  deleteRequest,
  getRequestById,
  getRequestsByCollection,
  updateRequest,
} from "@/backend/request/request.service";
import type { CreateRequestInput, UpdateRequestInput } from "@/backend/request/request.types";
import { Prisma, type HttpMethod } from "@prisma/client";

export const runtime = "nodejs";

const allowedMethods: ReadonlySet<HttpMethod> = new Set([
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
]);

function errorDetails(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
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
    if (isNotFoundError(error)) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 },
      );
    }
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
      : "";

  if (!name || !method || !url || !collectionId || !createdById) {
    return NextResponse.json(
      { error: "name, method, url, collectionId, and createdById are required" },
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
    if (error instanceof Error && error.message === "Collection not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === "User not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
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
    if (isNotFoundError(error)) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        error: "Failed to delete request",
        details: process.env.NODE_ENV === "production" ? undefined : errorDetails(error),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const url = new URL(request.url);
  const requestId = url.searchParams.get("id");

  if (!requestId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  let body: UpdateRequestInput | null = null;
  try {
    body = (await request.json()) as UpdateRequestInput;
  } catch {
    body = null;
  }

  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updates: UpdateRequestInput = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: "name must be a non-empty string" },
        { status: 400 },
      );
    }
    updates.name = body.name.trim();
  }

  if (body.method !== undefined) {
    const method = parseMethod(body.method);
    if (!method) {
      return NextResponse.json(
        { error: "method must be a valid HTTP method" },
        { status: 400 },
      );
    }
    updates.method = method;
  }

  if (body.url !== undefined) {
    if (typeof body.url !== "string" || body.url.trim().length === 0) {
      return NextResponse.json(
        { error: "url must be a non-empty string" },
        { status: 400 },
      );
    }
    updates.url = body.url.trim();
  }

  if (body.headers !== undefined) {
    if (
      body.headers !== null &&
      (typeof body.headers !== "object" || Array.isArray(body.headers))
    ) {
      return NextResponse.json(
        { error: "headers must be an object or null" },
        { status: 400 },
      );
    }
    updates.headers = body.headers;
  }

  if (body.body !== undefined) {
    if (body.body !== null && typeof body.body !== "string") {
      return NextResponse.json(
        { error: "body must be a string or null" },
        { status: 400 },
      );
    }
    updates.body = body.body;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "At least one field must be provided" },
      { status: 400 },
    );
  }

  try {
    const updated = await updateRequest(requestId, updates);
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        error: "Failed to update request",
        details: process.env.NODE_ENV === "production" ? undefined : errorDetails(error),
      },
      { status: 500 },
    );
  }
}
