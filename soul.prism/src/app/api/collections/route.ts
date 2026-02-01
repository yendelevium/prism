import { NextResponse, type NextRequest } from "next/server";
import {
  createCollection,
  deleteCollection,
  getCollectionById,
  listCollectionsByWorkspace,
} from "@/backend/collection/collection.service";
import type { CreateCollectionInput } from "@/backend/collection/collection.types";

export const runtime = "nodejs";

function getUserId(request: NextRequest): string | null {
  const userId = request.headers.get("x-user-id");
  if (!userId || userId.trim().length === 0) {
    return null;
  }
  return userId;
}

function errorDetails(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id" }, { status: 401 });
  }

  const url = new URL(request.url);
  const collectionId = url.searchParams.get("id");
  const workspaceId = url.searchParams.get("workspaceId");

  try {
    if (collectionId) {
      const collection = await getCollectionById(collectionId);
      if (!collection) {
        return NextResponse.json(
          { error: "Collection not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ data: collection }, { status: 200 });
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 },
      );
    }

    const collections = await listCollectionsByWorkspace(workspaceId);
    return NextResponse.json({ data: collections }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch collections",
        details: process.env.NODE_ENV === "production" ? undefined : errorDetails(error),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id" }, { status: 401 });
  }

  let body: CreateCollectionInput | null = null;
  try {
    body = (await request.json()) as CreateCollectionInput;
  } catch {
    body = null;
  }

  if (
    !body ||
    typeof body.name !== "string" ||
    body.name.trim().length === 0 ||
    typeof body.workspaceId !== "string" ||
    body.workspaceId.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "Invalid body: name and workspaceId are required" },
      { status: 400 },
    );
  }

  try {
    const collection = await createCollection(body, userId);
    return NextResponse.json({ data: collection }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create collection",
        details: process.env.NODE_ENV === "production" ? undefined : errorDetails(error),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id" }, { status: 401 });
  }

  const url = new URL(request.url);
  const collectionId = url.searchParams.get("id");

  if (!collectionId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const deleted = await deleteCollection(collectionId);
    return NextResponse.json({ data: deleted }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to delete collection",
        details: process.env.NODE_ENV === "production" ? undefined : errorDetails(error),
      },
      { status: 500 },
    );
  }
}
