import { NextResponse, type NextRequest } from "next/server";
import {
  createWorkspace,
  listWorkspacesForUser,
} from "@/backend/workspace/workspace.service";
import type { CreateWorkspaceInput } from "@/backend/workspace/workspace.types";

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

  const workspaces = listWorkspacesForUser(userId);
  return NextResponse.json({ data: workspaces }, { status: 200 });
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

  const workspace = createWorkspace(body, userId);
  return NextResponse.json({ data: workspace }, { status: 201 });
}
