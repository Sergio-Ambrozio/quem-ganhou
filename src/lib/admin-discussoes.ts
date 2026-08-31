export type CreateDiscussaoInput = {
  titulo: string;
  descricao: string | null;
  personalidade_a_id: string;
  personalidade_b_id: string;
};

export type DiscussaoInsertResult = {
  data: { id: string } | null;
  error: { code?: string; message: string } | null;
};

export type CreateDiscussaoParseResult =
  | { ok: true; value: CreateDiscussaoInput }
  | { ok: false; error: string };

export type AdminAuthInput =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "missing" | "invalid" };

export type AdminCreateDiscussaoResponse =
  | { status: 201; body: { id: string } }
  | { status: 400; body: { erro: string } }
  | { status: 401; challenge: boolean }
  | { status: 500; body: { erro: string } };

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function parseCreateDiscussaoBody(
  body: unknown
): CreateDiscussaoParseResult {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Corpo da requisicao invalido" };
  }

  const record = body as Record<string, unknown>;
  const titulo = asNonEmptyString(record.titulo);
  if (!titulo) {
    return { ok: false, error: "Campo obrigatorio: titulo" };
  }

  const personalidade_a_id = asNonEmptyString(record.personalidade_a_id);
  const personalidade_b_id = asNonEmptyString(record.personalidade_b_id);
  if (!personalidade_a_id || !personalidade_b_id) {
    return {
      ok: false,
      error: "Campos obrigatorios: personalidade_a_id, personalidade_b_id",
    };
  }

  if (personalidade_a_id === personalidade_b_id) {
    return { ok: false, error: "Selecione dois comentaristas diferentes" };
  }

  let descricao: string | null = null;
  if (record.descricao !== undefined && record.descricao !== null) {
    if (typeof record.descricao !== "string") {
      return { ok: false, error: "Campo invalido: descricao" };
    }
    const trimmed = record.descricao.trim();
    descricao = trimmed || null;
  }

  return {
    ok: true,
    value: {
      titulo,
      descricao,
      personalidade_a_id,
      personalidade_b_id,
    },
  };
}

export async function handleAdminCreateDiscussao(options: {
  auth: AdminAuthInput;
  jsonBody: unknown;
  jsonParseError?: boolean;
  insertDiscussao: (
    row: CreateDiscussaoInput
  ) => Promise<DiscussaoInsertResult>;
}): Promise<AdminCreateDiscussaoResponse> {
  if (!options.auth.ok) {
    return { status: 401, challenge: options.auth.reason !== "not_configured" };
  }

  if (options.jsonParseError) {
    return { status: 400, body: { erro: "Corpo da requisicao invalido" } };
  }

  const parsed = parseCreateDiscussaoBody(options.jsonBody);
  if (!parsed.ok) {
    return { status: 400, body: { erro: parsed.error } };
  }

  let inserted: DiscussaoInsertResult;
  try {
    inserted = await options.insertDiscussao(parsed.value);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar discussao";
    return { status: 500, body: { erro: message } };
  }

  if (inserted.error) {
    if (inserted.error.code === "23503") {
      return { status: 400, body: { erro: "Personalidades nao encontradas" } };
    }
    return { status: 500, body: { erro: inserted.error.message } };
  }

  const id = inserted.data?.id;
  if (!id) {
    return { status: 500, body: { erro: "Erro ao criar discussao" } };
  }

  return { status: 201, body: { id } };
}
