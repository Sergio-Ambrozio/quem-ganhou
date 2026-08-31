import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  authorizeAdmin,
  parseBasicAuth,
  passwordsMatch,
  unauthorizedAdminResponse,
} from "./admin-auth.ts";

function basicHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

describe("parseBasicAuth", () => {
  it("returns null when the header is missing", () => {
    assert.equal(parseBasicAuth(null), null);
  });

  it("parses username and password, including colons in the password", () => {
    assert.deepEqual(parseBasicAuth(basicHeader("admin", "p:ass:word")), {
      username: "admin",
      password: "p:ass:word",
    });
  });
});

describe("passwordsMatch", () => {
  it("accepts the expected password and rejects others", () => {
    assert.equal(passwordsMatch("secret", "secret"), true);
    assert.equal(passwordsMatch("secret", "other"), false);
  });
});

describe("authorizeAdmin", () => {
  const original = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    delete process.env.ADMIN_PASSWORD;
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = original;
    }
  });

  it("fails closed when ADMIN_PASSWORD is missing", () => {
    assert.deepEqual(authorizeAdmin(basicHeader("admin", "anything")), {
      ok: false,
      reason: "not_configured",
    });
  });

  it("fails closed when ADMIN_PASSWORD is empty", () => {
    process.env.ADMIN_PASSWORD = "";
    assert.deepEqual(authorizeAdmin(basicHeader("admin", "")), {
      ok: false,
      reason: "not_configured",
    });
  });

  it("rejects a missing Authorization header", () => {
    process.env.ADMIN_PASSWORD = "s3cret";
    assert.deepEqual(authorizeAdmin(null), { ok: false, reason: "missing" });
  });

  it("rejects the wrong password", () => {
    process.env.ADMIN_PASSWORD = "s3cret";
    assert.deepEqual(authorizeAdmin(basicHeader("admin", "nope")), {
      ok: false,
      reason: "invalid",
    });
  });

  it("accepts the password from ADMIN_PASSWORD (username is ignored)", () => {
    process.env.ADMIN_PASSWORD = "s3cret";
    assert.deepEqual(authorizeAdmin(basicHeader("anyone", "s3cret")), {
      ok: true,
    });
  });
});

describe("unauthorizedAdminResponse", () => {
  it("challenges the browser only when a password is configured", () => {
    const challenged = unauthorizedAdminResponse(true);
    assert.equal(challenged.status, 401);
    assert.match(
      challenged.headers.get("WWW-Authenticate") ?? "",
      /Basic realm=/
    );

    const locked = unauthorizedAdminResponse(false);
    assert.equal(locked.status, 401);
    assert.equal(locked.headers.get("WWW-Authenticate"), null);
  });
});
