import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: any) {
  if (process.env.ENABLE_TEST_ROUTES !== "true" || process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found or Forbidden", { status: 404 });
  }

  console.log("WHOAMI Headers:", Object.fromEntries(req.headers));
  console.log("WHOAMI Cookies:", req.cookies.getAll());

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "No user found from Clerk context" }, { status: 401 });
  }

  return NextResponse.json({ userId });
}
