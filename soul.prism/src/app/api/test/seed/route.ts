import { NextResponse } from "next/server";
import { getPrisma } from "@/backend/prisma";

export async function POST(req: Request) {
  // CRITICAL: Block route everywhere except tests.
  if (process.env.ENABLE_TEST_ROUTES !== "true" || process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found or Forbidden", { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  switch (action) {
    case "reset": {
      const prisma = getPrisma();
      
      // PostgreSQL is strictly case-sensitive when identifiers are enclosed in double quotes.
      // Since schema.prisma defines exact PascalCase models without @@map overrides, 
      // Prisma generated exact PascalCase tables in PostgreSQL.
      // E.g. `User`, `Workspace`, `UserWorkspace`.
      const tables = [
        "WorkflowRunStep", "WorkflowRun", "WorkflowStep", "Workflow",
        "Execution", "GRPCRequest", "GraphQLRequest", "Request",
        "Environment", "Collection", "UserWorkspace", "Workspace",
        "User", "Span"
      ];

      for (const table of tables) {
        // Enclose in double quotes to preserve PascalCase in Postgres
        try {
          await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
        } catch (err) {
          // Fallback log to help debug missing tables in Test setup
          console.warn(`Failed truncating table ${table}:`, err);
        }
      }
      return NextResponse.json({ success: true });
    }

    case "workspace": {
      const payload = await req.json();
      const { userId, role } = payload;
      const prisma = getPrisma();

      // Ensure the user exists mirroring their generated Clerk profile
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId, email: `${userId}@e2e.test`, name: "E2E Tester" },
      });

      const workspace = await prisma.workspace.create({
        data: { name: `e2e-workspace-${Date.now()}` },
      });

      await prisma.userWorkspace.create({
        data: { userId, workspaceId: workspace.id, role },
      });

      return NextResponse.json({ workspaceId: workspace.id, success: true });
    }

    case "collection": {
      const payload = await req.json();
      const prisma = getPrisma();
      const coll = await prisma.collection.create({
        data: {
          name: "e2e-collection",
          workspaceId: payload.workspaceId,
          createdById: payload.userId,
        },
      });
      return NextResponse.json({ collectionId: coll.id });
    }

    case "request": {
      const payload = await req.json();
      const prisma = getPrisma();
      const reqRecord = await prisma.request.create({
        data: {
          name: payload.name || "e2e-request",
          url: payload.url || "https://httpbin.org/get",
          method: "GET",
          collectionId: payload.collectionId,
          createdById: payload.userId,
        },
      });
      return NextResponse.json({ requestId: reqRecord.id });
    }

    // Default catch
    default:
      return NextResponse.json({ error: "Action not recognized" }, { status: 400 });
  }
}
