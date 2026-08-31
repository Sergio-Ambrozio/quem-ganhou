import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { authorizeAdmin } from "./admin-auth.ts";
import {
  handleAdminCreateDiscussao,
  parseCreateDiscussaoBody,
  type CreateDiscussaoInput,
  type DiscussaoInsertResult,
} from "./admin-discussoes.ts";

function basicHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

const validBody = {
  titulo: "  Quem joga melhor?  ",
  descricao: "  Contexto  ",
  personalidade_a_id: "  aaa  ",
  personalidade_b_id: "bbb",
};

describe("parseCreateDiscussaoBody", () => {
  it("requires a JSON object", () => {
    assert.deepEqual(parseCreateDiscussaoBody(null), {
      ok: false,
      error: "Corpo da requisicao invalido",
    });
    assert.equal(parseCreateDiscussaoBody([]).ok, false);
    assert.equal(parseCreateDiscussaoBody("x").ok, false);
  });

  it("requires a non-empty titulo", () => {
    assert.deepEqual(
      parseCreateDiscussaoBody({
        titulo: "   ",
        personalidade_a_id: "a",
        personalidade_b_id: "b",
      }),
      { ok: false, error: "Campo obrigatorio: titulo" }
    );
  });

  it("requires both personality ids", () => {
    assert.deepEqual(
      parseCreateDiscussaoBody({ titulo: "Debate", personalidade_a_id: "a" }),
      {
        ok: false,
        error: "Campos obrigatorios: personalidade_a_id, personalidade_b_id",
      }
    );
  });

  it("rejects the same personality twice", () => {
    assert.deepEqual(
      parseCreateDiscussaoBody({
        titulo: "Debate",
        personalidade_a_id: "a",
        personalidade_b_id: "a",
      }),
      { ok: false, error: "Selecione dois comentaristas diferentes" }
    );
  });

  it("trims fields and treats empty descricao as null", () => {
    assert.deepEqual(parseCreateDiscussaoBody(validBody), {
      ok: true,
      value: {
        titulo: "Quem joga melhor?",
        descricao: "Contexto",
        personalidade_a_id: "aaa",
        personalidade_b_id: "bbb",
      },
    });

    assert.deepEqual(
      parseCreateDiscussaoBody({
        titulo: "Debate",
        descricao: "   ",
        personalidade_a_id: "a",
        personalidade_b_id: "b",
      }),
      {
        ok: true,
        value: {
          titulo: "Debate",
          descricao: null,
          personalidade_a_id: "a",
          personalidade_b_id: "b",
        },
      }
    );
  });
});

describe("handleAdminCreateDiscussao", () => {
  let inserted: CreateDiscussaoInput | null;
  let insertCalls: number;

  async function insertOk(
    row: CreateDiscussaoInput
  ): Promise<DiscussaoInsertResult> {
    insertCalls += 1;
    inserted = row;
    return { data: { id: "created-id" }, error: null };
  }

  function resetInsert() {
    inserted = null;
    insertCalls = 0;
  }

  it("returns 401 without a password and does not insert", async () => {
    resetInsert();
    const previous = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = "s3cret";
    try {
      const result = await handleAdminCreateDiscussao({
        auth: authorizeAdmin(null),
        jsonBody: validBody,
        insertDiscussao: insertOk,
      });
      assert.deepEqual(result, { status: 401, challenge: true });
      assert.equal(insertCalls, 0);
    } finally {
      if (previous === undefined) {
        delete process.env.ADMIN_PASSWORD;
      } else {
        process.env.ADMIN_PASSWORD = previous;
      }
    }
  });

  it("returns 401 for the wrong password", async () => {
    resetInsert();
    const previous = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = "s3cret";
    try {
      const result = await handleAdminCreateDiscussao({
        auth: authorizeAdmin(basicHeader("admin", "nope")),
        jsonBody: validBody,
        insertDiscussao: insertOk,
      });
      assert.deepEqual(result, { status: 401, challenge: true });
      assert.equal(insertCalls, 0);
    } finally {
      if (previous === undefined) {
        delete process.env.ADMIN_PASSWORD;
      } else {
        process.env.ADMIN_PASSWORD = previous;
      }
    }
  });

  it("fails closed when ADMIN_PASSWORD is missing", async () => {
    resetInsert();
    const previous = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD;
    try {
      const result = await handleAdminCreateDiscussao({
        auth: authorizeAdmin(basicHeader("admin", "anything")),
        jsonBody: validBody,
        insertDiscussao: insertOk,
      });
      assert.deepEqual(result, { status: 401, challenge: false });
      assert.equal(insertCalls, 0);
    } finally {
      if (previous === undefined) {
        delete process.env.ADMIN_PASSWORD;
      } else {
        process.env.ADMIN_PASSWORD = previous;
      }
    }
  });

  it("returns 400 for invalid JSON and bad bodies without inserting", async () => {
    resetInsert();
    const invalidJson = await handleAdminCreateDiscussao({
      auth: { ok: true },
      jsonBody: null,
      jsonParseError: true,
      insertDiscussao: insertOk,
    });
    assert.equal(invalidJson.status, 400);

    const missingTitulo = await handleAdminCreateDiscussao({
      auth: { ok: true },
      jsonBody: {
        personalidade_a_id: "a",
        personalidade_b_id: "b",
      },
      insertDiscussao: insertOk,
    });
    assert.deepEqual(missingTitulo, {
      status: 400,
      body: { erro: "Campo obrigatorio: titulo" },
    });

    const sameIds = await handleAdminCreateDiscussao({
      auth: { ok: true },
      jsonBody: {
        titulo: "Debate",
        personalidade_a_id: "a",
        personalidade_b_id: "a",
      },
      insertDiscussao: insertOk,
    });
    assert.equal(sameIds.status, 400);
    assert.equal(insertCalls, 0);
  });

  it("returns 201 with the created row id when authorized", async () => {
    resetInsert();
    const previous = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = "s3cret";
    try {
      const result = await handleAdminCreateDiscussao({
        auth: authorizeAdmin(basicHeader("anyone", "s3cret")),
        jsonBody: validBody,
        insertDiscussao: insertOk,
      });
      assert.deepEqual(result, { status: 201, body: { id: "created-id" } });
      assert.deepEqual(inserted, {
        titulo: "Quem joga melhor?",
        descricao: "Contexto",
        personalidade_a_id: "aaa",
        personalidade_b_id: "bbb",
      });
    } finally {
      if (previous === undefined) {
        delete process.env.ADMIN_PASSWORD;
      } else {
        process.env.ADMIN_PASSWORD = previous;
      }
    }
  });

  it("maps a missing personality foreign key to 400", async () => {
    const result = await handleAdminCreateDiscussao({
      auth: { ok: true },
      jsonBody: {
        titulo: "Debate",
        personalidade_a_id: "a",
        personalidade_b_id: "b",
      },
      insertDiscussao: async () => ({
        data: null,
        error: { code: "23503", message: "fk" },
      }),
    });
    assert.deepEqual(result, {
      status: 400,
      body: { erro: "Personalidades nao encontradas" },
    });
  });
});
