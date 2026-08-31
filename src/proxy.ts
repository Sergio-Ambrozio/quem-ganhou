import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorizeAdmin, unauthorizedAdminResponse } from "@/lib/admin-auth";

export function proxy(request: NextRequest) {
  const result = authorizeAdmin(request.headers.get("authorization"));
  if (result.ok) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  // Missing ADMIN_PASSWORD: fail closed, do not prompt for a password that cannot work.
  return unauthorizedAdminResponse(result.reason !== "not_configured");
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"],
};
