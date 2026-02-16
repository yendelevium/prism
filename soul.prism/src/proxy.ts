import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Logged-in users visiting landing/auth pages → redirect to /dashboard
  if (userId) {
    const path = req.nextUrl.pathname;
    if (
      path === "/" ||
      path.startsWith("/sign-in") ||
      path.startsWith("/sign-up")
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Protect non-public routes
  if (!userId && !isPublicRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
