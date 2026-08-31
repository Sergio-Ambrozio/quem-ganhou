import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServer();

  let body: { discussao_id: string; personalidade_id: string; fingerprint: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo da requisicao invalido" }, { status: 400 });
  }

  const { discussao_id, personalidade_id, fingerprint } = body;

  if (!discussao_id || !personalidade_id || !fingerprint) {
    return NextResponse.json(
      { erro: "Campos obrigatorios: discussao_id, personalidade_id, fingerprint" },
      { status: 400 }
    );
  }

  // Check if discussion exists and is still active
  const { data: discussao, error: errDiscussao } = await supabase
    .from("discussoes")
    .select("*")
    .eq("id", discussao_id)
    .single();

  if (errDiscussao || !discussao) {
    return NextResponse.json({ erro: "Discussão não encontrada" }, { status: 404 });
  }

  if (!discussao.ativa) {
    return NextResponse.json({ erro: "Votação encerrada" }, { status: 400 });
  }

  if (new Date(discussao.encerra_em) < new Date()) {
    return NextResponse.json({ erro: "Votação encerrada" }, { status: 400 });
  }

  // Verify the personality is part of this discussion
  if (
    personalidade_id !== discussao.personalidade_a_id &&
    personalidade_id !== discussao.personalidade_b_id
  ) {
    return NextResponse.json(
      { erro: "Personalidade nao participa desta discussao" },
      { status: 400 }
    );
  }

  // Insert vote (unique constraint will prevent duplicates)
  const { error: errVoto } = await supabase.from("votos").insert({
    discussao_id,
    personalidade_id,
    fingerprint,
  });

  if (errVoto) {
    if (errVoto.code === "23505") {
      return NextResponse.json({ erro: "Voce ja votou nesta discussao" }, { status: 409 });
    }
    return NextResponse.json({ erro: "Erro ao registrar voto" }, { status: 500 });
  }

  // Increment vote count on the discussion
  const campo =
    personalidade_id === discussao.personalidade_a_id ? "votos_a" : "votos_b";

  const novoValor = (discussao[campo] as number) + 1;

  await supabase
    .from("discussoes")
    .update({ [campo]: novoValor })
    .eq("id", discussao_id);

  return NextResponse.json({
    sucesso: true,
    votos_a: campo === "votos_a" ? novoValor : discussao.votos_a,
    votos_b: campo === "votos_b" ? novoValor : discussao.votos_b,
  });
}
