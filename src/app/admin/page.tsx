"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { Personalidade, Discussao } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

interface DiscussaoComPersonalidades extends Discussao {
  personalidade_a: Personalidade;
  personalidade_b: Personalidade;
}

export default function Admin() {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  function getSupabase() {
    if (!supabaseRef.current) {
      supabaseRef.current = getSupabaseBrowser();
    }
    return supabaseRef.current;
  }

  // State
  const [personalidades, setPersonalidades] = useState<Personalidade[]>([]);
  const [discussoesAtivas, setDiscussoesAtivas] = useState<DiscussaoComPersonalidades[]>([]);

  // New personality form
  const [nome, setNome] = useState("");
  const [apelido, setApelido] = useState("");
  const [salvandoPersonalidade, setSalvandoPersonalidade] = useState(false);

  // New discussion form
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [personalidadeAId, setPersonalidadeAId] = useState("");
  const [personalidadeBId, setPersonalidadeBId] = useState("");
  const [salvandoDiscussao, setSalvandoDiscussao] = useState(false);

  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(
    null
  );

  const mostrarMensagem = useCallback((tipo: "sucesso" | "erro", texto: string) => {
    setMensagem({ tipo, texto });
    setTimeout(() => setMensagem(null), 4000);
  }, []);

  // Fetch data
  const carregarDados = useCallback(async () => {
    const sb = getSupabase();
    const [{ data: pers }, { data: disc }] = await Promise.all([
      sb
        .from("personalidades")
        .select("*")
        .order("nome"),
      sb
        .from("discussoes")
        .select(
          "*, personalidade_a:personalidades!personalidade_a_id(*), personalidade_b:personalidades!personalidade_b_id(*)"
        )
        .eq("ativa", true)
        .order("criado_em", { ascending: false }),
    ]);

    setPersonalidades(pers || []);
    setDiscussoesAtivas((disc as DiscussaoComPersonalidades[]) || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Add personality
  async function adicionarPersonalidade(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;

    setSalvandoPersonalidade(true);
    const { error } = await getSupabase().from("personalidades").insert({
      nome: nome.trim(),
      apelido: apelido.trim() || null,
    });

    if (error) {
      mostrarMensagem("erro", "Erro ao adicionar comentarista");
    } else {
      mostrarMensagem("sucesso", "Comentarista adicionado!");
      setNome("");
      setApelido("");
      carregarDados();
    }
    setSalvandoPersonalidade(false);
  }

  // Create discussion
  async function criarDiscussao(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !personalidadeAId || !personalidadeBId) return;

    if (personalidadeAId === personalidadeBId) {
      mostrarMensagem("erro", "Selecione dois comentaristas diferentes");
      return;
    }

    setSalvandoDiscussao(true);
    const { error } = await getSupabase().from("discussoes").insert({
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      personalidade_a_id: personalidadeAId,
      personalidade_b_id: personalidadeBId,
    });

    if (error) {
      mostrarMensagem("erro", "Erro ao criar discussao");
    } else {
      mostrarMensagem("sucesso", "Discussao criada!");
      setTitulo("");
      setDescricao("");
      setPersonalidadeAId("");
      setPersonalidadeBId("");
      carregarDados();
    }
    setSalvandoDiscussao(false);
  }

  // Close discussion
  async function encerrarDiscussao(discussao: DiscussaoComPersonalidades) {
    const sb = getSupabase();
    const { error } = await sb
      .from("discussoes")
      .update({ ativa: false })
      .eq("id", discussao.id);

    if (error) {
      mostrarMensagem("erro", "Erro ao encerrar discussao");
      return;
    }

    // Update win/loss/draw records
    const vencedorId =
      discussao.votos_a > discussao.votos_b
        ? discussao.personalidade_a_id
        : discussao.votos_b > discussao.votos_a
          ? discussao.personalidade_b_id
          : null;

    if (vencedorId) {
      const perdedorId =
        vencedorId === discussao.personalidade_a_id
          ? discussao.personalidade_b_id
          : discussao.personalidade_a_id;

      const vencedor = personalidades.find((p) => p.id === vencedorId);
      const perdedor = personalidades.find((p) => p.id === perdedorId);

      if (vencedor && perdedor) {
        await Promise.all([
          sb
            .from("personalidades")
            .update({ vitorias: vencedor.vitorias + 1 })
            .eq("id", vencedorId),
          sb
            .from("personalidades")
            .update({ derrotas: perdedor.derrotas + 1 })
            .eq("id", perdedorId),
        ]);
      }
    } else {
      // Draw
      const persA = personalidades.find((p) => p.id === discussao.personalidade_a_id);
      const persB = personalidades.find((p) => p.id === discussao.personalidade_b_id);

      if (persA && persB) {
        await Promise.all([
          sb
            .from("personalidades")
            .update({ empates: persA.empates + 1 })
            .eq("id", persA.id),
          sb
            .from("personalidades")
            .update({ empates: persB.empates + 1 })
            .eq("id", persB.id),
        ]);
      }
    }

    mostrarMensagem("sucesso", "Discussao encerrada!");
    carregarDados();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-field mb-2">
        Painel Administrativo
      </h2>
      <p className="text-gray mb-8">
        Gerencie as discussoes e personalidades do programa.
      </p>

      {/* Status message */}
      {mensagem && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
            mensagem.tipo === "sucesso"
              ? "bg-field/10 text-field"
              : "bg-card-red/10 text-card-red"
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* New discussion card */}
        <div className="bg-white rounded-xl shadow border border-gray-light p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span>&#128226;</span> Nova Discussao
          </h3>
          <form className="space-y-4" onSubmit={criarDiscussao}>
            <div>
              <label className="block text-sm font-medium mb-1">
                Titulo da Discussao
              </label>
              <input
                type="text"
                placeholder="Ex: Quem joga melhor?"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="w-full border border-gray-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Descricao (opcional)
              </label>
              <input
                type="text"
                placeholder="Contexto da discussao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full border border-gray-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Comentarista A
              </label>
              <select
                value={personalidadeAId}
                onChange={(e) => setPersonalidadeAId(e.target.value)}
                required
                className="w-full border border-gray-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-field"
              >
                <option value="">Selecione...</option>
                {personalidades.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.apelido || p.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Comentarista B
              </label>
              <select
                value={personalidadeBId}
                onChange={(e) => setPersonalidadeBId(e.target.value)}
                required
                className="w-full border border-gray-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-field"
              >
                <option value="">Selecione...</option>
                {personalidades.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.apelido || p.nome}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={salvandoDiscussao}
              className="w-full bg-field hover:bg-field-light disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {salvandoDiscussao ? "Criando..." : "Criar Discussao"}
            </button>
          </form>
        </div>

        {/* Add personality card */}
        <div className="bg-white rounded-xl shadow border border-gray-light p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span>&#128100;</span> Novo Comentarista
          </h3>
          <form className="space-y-4" onSubmit={adicionarPersonalidade}>
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input
                type="text"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full border border-gray-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Apelido (opcional)
              </label>
              <input
                type="text"
                placeholder="Como e conhecido"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                className="w-full border border-gray-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-field"
              />
            </div>
            <button
              type="submit"
              disabled={salvandoPersonalidade}
              className="w-full bg-accent hover:bg-accent-dark disabled:opacity-50 text-dark font-bold py-3 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {salvandoPersonalidade ? "Salvando..." : "Adicionar Comentarista"}
            </button>
          </form>

          {/* Existing personalities */}
          {personalidades.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-light">
              <p className="text-xs font-medium text-gray mb-2 uppercase">
                Cadastrados ({personalidades.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {personalidades.map((p) => (
                  <span
                    key={p.id}
                    className="bg-chalk text-sm px-3 py-1 rounded-full border border-gray-light"
                  >
                    {p.apelido || p.nome}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active discussions */}
      <section className="mt-10">
        <h3 className="text-xl font-bold text-field mb-4">
          Discussoes Ativas
        </h3>
        {discussoesAtivas.length === 0 ? (
          <div className="bg-white rounded-xl shadow border border-gray-light p-6 text-center">
            <p className="text-gray">Nenhuma discussao ativa no momento.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {discussoesAtivas.map((d) => {
              const total = d.votos_a + d.votos_b;

              return (
                <div
                  key={d.id}
                  className="bg-white rounded-xl shadow border border-gray-light overflow-hidden"
                >
                  <div className="bg-field text-white px-4 py-2 text-sm flex justify-between items-center">
                    <span className="font-medium">{d.titulo}</span>
                    <span className="text-white/60 text-xs">
                      {new Date(d.criado_em).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="text-sm">
                      <p>
                        <span className="font-medium">
                          {d.personalidade_a.apelido || d.personalidade_a.nome}
                        </span>{" "}
                        <span className="text-gray">({d.votos_a})</span>
                        {" vs "}
                        <span className="font-medium">
                          {d.personalidade_b.apelido || d.personalidade_b.nome}
                        </span>{" "}
                        <span className="text-gray">({d.votos_b})</span>
                      </p>
                      <p className="text-xs text-gray mt-1">
                        {total} {total === 1 ? "voto" : "votos"} no total
                      </p>
                    </div>
                    <button
                      onClick={() => encerrarDiscussao(d)}
                      className="bg-card-red hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Encerrar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
