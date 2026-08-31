import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_REALM = "Quem Ganhou Admin";

export function getAdminPassword(): string | undefined {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return undefined;
  }
  return password;
}

export function passwordsMatch(provided: string, expected: string): boolean {
  const providedDigest = createHash("sha256").update(provided).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(providedDigest, expectedDigest);
}

export function parseBasicAuth(
  authorizationHeader: string | null
): { username: string; password: string } | null {
  if (!authorizationHeader) {
    return null;
  }

  const space = authorizationHeader.indexOf(" ");
  if (space === -1) {
    return null;
  }

  const scheme = authorizationHeader.slice(0, space);
  const encoded = authorizationHeader.slice(space + 1).trim();
  if (scheme.toLowerCase() !== "basic" || !encoded) {
    return null;
  }

  let decoded: string;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return null;
  }

  const colon = decoded.indexOf(":");
  if (colon === -1) {
    return null;
  }

  return {
    username: decoded.slice(0, colon),
    password: decoded.slice(colon + 1),
  };
}

export type AdminAuthResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "missing" | "invalid" };

export function authorizeAdmin(
  authorizationHeader: string | null
): AdminAuthResult {
  const expected = getAdminPassword();
  if (!expected) {
    return { ok: false, reason: "not_configured" };
  }

  const parsed = parseBasicAuth(authorizationHeader);
  if (!parsed) {
    return { ok: false, reason: "missing" };
  }

  if (!passwordsMatch(parsed.password, expected)) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true };
}

export function unauthorizedAdminResponse(challenge: boolean): Response {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
  });
  if (challenge) {
    headers.set(
      "WWW-Authenticate",
      `Basic realm="${ADMIN_REALM}", charset="UTF-8"`
    );
  }
  return new Response("Authentication required", { status: 401, headers });
}
