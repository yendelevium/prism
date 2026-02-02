import { NextResponse, type NextRequest } from "next/server";
import {
  createWorkspace,
  listWorkspacesForUser,
} from "@/backend/workspace/workspace.service";
import type { CreateWorkspaceInput } from "@/backend/workspace/workspace.types";

export const runtime = "nodejs";

function getUserId(request: NextRequest): string | null {
  const userId = request.headers.get("x-user-id");
  if (!userId || userId.trim().length === 0) {
    return null;
  }
  return userId;
}

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id" }, { status: 401 });
  }

  try {
    const workspaces = await listWorkspacesForUser(userId);
    return NextResponse.json({ data: workspaces }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to list workspaces", error);
    return NextResponse.json(
      {
        error: "Failed to list workspaces",
        details: process.env.NODE_ENV === "production" ? undefined : message,
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

  let body: CreateWorkspaceInput | null = null;
  try {
    body = (await request.json()) as CreateWorkspaceInput;
  } catch {
    body = null;
  }

  if (!body || typeof body.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json(
      { error: "Invalid body: name is required" },
      { status: 400 },
    );
  }

  try {
    const workspace = await createWorkspace(body, userId);
    return NextResponse.json({ data: workspace }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create workspace", error);
    return NextResponse.json(
      {
        error: "Failed to create workspace",
        details: process.env.NODE_ENV === "production" ? undefined : message,
      },
      { status: 500 },
    );
  }
}
