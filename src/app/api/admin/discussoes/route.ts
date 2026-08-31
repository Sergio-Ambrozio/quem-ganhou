import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin, unauthorizedAdminResponse } from "@/lib/admin-auth";
import { handleAdminCreateDiscussao } from "@/lib/admin-discussoes";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  let jsonBody: unknown = null;
  let jsonParseError = false;
  try {
    jsonBody = await request.json();
  } catch {
    jsonParseError = true;
  }

  const result = await handleAdminCreateDiscussao({
    auth: authorizeAdmin(request.headers.get("authorization")),
    jsonBody,
    jsonParseError,
    insertDiscussao: async (row) => {
      const supabase = getSupabaseServer();
      return supabase
        .from("discussoes")
        .insert({
          titulo: row.titulo,
          descricao: row.descricao,
          personalidade_a_id: row.personalidade_a_id,
          personalidade_b_id: row.personalidade_b_id,
        })
        .select("id")
        .single();
    },
  });

  if (result.status === 401) {
    return unauthorizedAdminResponse(result.challenge);
  }

  return NextResponse.json(result.body, {
    status: result.status,
    headers: { "Cache-Control": "no-store" },
  });
}
