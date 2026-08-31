"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { getFingerprint } from "@/lib/fingerprint";
import Countdown from "./Countdown";
import type { Discussao, Personalidade } from "@/types";

interface DiscussaoComPersonalidades extends Discussao {
  personalidade_a: Personalidade;
  personalidade_b: Personalidade;
}

export default function VotingCard() {
  const [discussao, setDiscussao] = useState<DiscussaoComPersonalidades | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [votou, setVotou] = useState<string | null>(null);
  const [votando, setVotando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [encerrada, setEncerrada] = useState(false);

  // Fetch active discussion
  useEffect(() => {
    async function buscar() {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from("discussoes")
        .select(
          "*, personalidade_a:personalidades!personalidade_a_id(*), personalidade_b:personalidades!personalidade_b_id(*)"
        )
        .eq("ativa", true)
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar discussao:", error);
      }

      if (data) {
        setDiscussao(data as DiscussaoComPersonalidades);

        // Check if user already voted
        const fp = getFingerprint();
        const { data: votoExistente } = await supabase
          .from("votos")
          .select("personalidade_id")
          .eq("discussao_id", data.id)
          .eq("fingerprint", fp)
          .maybeSingle();

        if (votoExistente) {
          setVotou(votoExistente.personalidade_id);
        }
      }

      setCarregando(false);
    }

    buscar();
  }, []);

  // Real-time subscription for vote count updates
  useEffect(() => {
    if (!discussao) return;

    const supabase = getSupabaseBrowser();
    const channel = supabase
      .channel(`discussao-${discussao.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "discussoes",
          filter: `id=eq.${discussao.id}`,
        },
        (payload) => {
          setDiscussao((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              votos_a: payload.new.votos_a,
              votos_b: payload.new.votos_b,
              ativa: payload.new.ativa,
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [discussao?.id]);

  const votar = useCallback(
    async (personalidade_id: string) => {
      if (!discussao || votou || votando || encerrada) return;

      setVotando(true);
      setErro(null);

      const fp = getFingerprint();

      const res = await fetch("/api/votar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discussao_id: discussao.id,
          personalidade_id,
          fingerprint: fp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.erro || "Erro ao votar");
        setVotando(false);
        return;
      }

      setVotou(personalidade_id);
      setDiscussao((prev) => {
        if (!prev) return prev;
        return { ...prev, votos_a: data.votos_a, votos_b: data.votos_b };
      });
      setVotando(false);
    },
    [discussao, votou, votando, encerrada]
  );

  if (carregando) {
    return (
      <section className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-light">
        <div className="bg-field field-lines text-white text-center py-4 px-4">
          <p className="text-sm font-medium uppercase tracking-wider text-white/80">
            Carregando...
          </p>
        </div>
        <div className="p-12 text-center text-gray">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-gray-light rounded-full" />
            <div className="h-4 w-40 bg-gray-light rounded" />
          </div>
        </div>
      </section>
    );
  }

  if (!discussao) {
    return (
      <section className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-light">
        <div className="bg-field field-lines text-white text-center py-4 px-4">
          <p className="text-sm font-medium uppercase tracking-wider text-white/80">
            Sem discussao
          </p>
        </div>
        <div className="p-12 text-center text-gray">
          <p className="text-lg">Nenhuma discussao ativa no momento.</p>
          <p className="text-sm mt-2">Volte mais tarde para votar!</p>
        </div>
      </section>
    );
  }

  const totalVotos = discussao.votos_a + discussao.votos_b;
  const pctA = totalVotos > 0 ? Math.round((discussao.votos_a / totalVotos) * 100) : 0;
  const pctB = totalVotos > 0 ? Math.round((discussao.votos_b / totalVotos) * 100) : 0;
  const mostrarResultados = !!votou || encerrada;

  return (
    <section className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-light">
      {/* Match header */}
      <div className="bg-field field-lines text-white text-center py-4 px-4">
        <p className="text-sm font-medium uppercase tracking-wider text-white/80">
          {encerrada || !discussao.ativa ? "Encerrada" : "Ao vivo"}
        </p>
        <h3 className="text-lg font-bold mt-1">{discussao.titulo}</h3>
        {discussao.descricao && (
          <p className="text-sm text-white/70 mt-1">{discussao.descricao}</p>
        )}
      </div>

      {/* Versus layout */}
      <div className="p-6">
        <div className="flex items-stretch justify-between gap-4">
          {/* Personality A */}
          <div className="flex-1 text-center flex flex-col">
            <div className="w-20 h-20 mx-auto rounded-full bg-gray-light flex items-center justify-center text-3xl mb-3">
              {discussao.personalidade_a.foto_url ? (
                <img
                  src={discussao.personalidade_a.foto_url}
                  alt={discussao.personalidade_a.nome}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <>&#129333;</>
              )}
            </div>
            <p className="font-bold text-lg">
              {discussao.personalidade_a.apelido || discussao.personalidade_a.nome}
            </p>
            <div className="mt-auto pt-4">
              {!mostrarResultados ? (
                <button
                  onClick={() => votar(discussao.personalidade_a.id)}
                  disabled={votando}
                  className="w-full bg-field hover:bg-field-light disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-colors text-lg active:scale-95 transform cursor-pointer disabled:cursor-not-allowed"
                >
                  {votando ? "Votando..." : "Votar"}
                </button>
              ) : (
                <div
                  className={`rounded-xl py-3 px-4 ${
                    votou === discussao.personalidade_a.id
                      ? "bg-field text-white"
                      : "bg-gray-light text-dark"
                  }`}
                >
                  <p className="text-2xl font-bold">{pctA}%</p>
                  <p className="text-xs mt-1">
                    {discussao.votos_a} {discussao.votos_a === 1 ? "voto" : "votos"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* VS divider */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
              <span className="text-dark font-black text-sm">VS</span>
            </div>
          </div>

          {/* Personality B */}
          <div className="flex-1 text-center flex flex-col">
            <div className="w-20 h-20 mx-auto rounded-full bg-gray-light flex items-center justify-center text-3xl mb-3">
              {discussao.personalidade_b.foto_url ? (
                <img
                  src={discussao.personalidade_b.foto_url}
                  alt={discussao.personalidade_b.nome}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <>&#129333;</>
              )}
            </div>
            <p className="font-bold text-lg">
              {discussao.personalidade_b.apelido || discussao.personalidade_b.nome}
            </p>
            <div className="mt-auto pt-4">
              {!mostrarResultados ? (
                <button
                  onClick={() => votar(discussao.personalidade_b.id)}
                  disabled={votando}
                  className="w-full bg-field hover:bg-field-light disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition-colors text-lg active:scale-95 transform cursor-pointer disabled:cursor-not-allowed"
                >
                  {votando ? "Votando..." : "Votar"}
                </button>
              ) : (
                <div
                  className={`rounded-xl py-3 px-4 ${
                    votou === discussao.personalidade_b.id
                      ? "bg-field text-white"
                      : "bg-gray-light text-dark"
                  }`}
                >
                  <p className="text-2xl font-bold">{pctB}%</p>
                  <p className="text-xs mt-1">
                    {discussao.votos_b} {discussao.votos_b === 1 ? "voto" : "votos"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Percentage bar (after voting) */}
        {mostrarResultados && totalVotos > 0 && (
          <div className="mt-4 w-full h-3 bg-gray-light rounded-full overflow-hidden flex">
            <div
              className="bg-field transition-all duration-500"
              style={{ width: `${pctA}%` }}
            />
            <div
              className="bg-accent transition-all duration-500"
              style={{ width: `${pctB}%` }}
            />
          </div>
        )}

        {/* Vote confirmation */}
        {votou && (
          <p className="mt-3 text-center text-sm text-field font-medium">
            &#9989; Voto registrado com sucesso!
          </p>
        )}

        {/* Error message */}
        {erro && (
          <p className="mt-3 text-center text-sm text-card-red font-medium">
            {erro}
          </p>
        )}

        {/* Timer / Total */}
        <div className="mt-4 text-center space-y-1">
          <p className="text-sm text-gray">
            Total de votos:{" "}
            <span className="font-bold text-dark">{totalVotos}</span>
          </p>
          {discussao.ativa && (
            <p className="text-sm text-gray">
              Votação encerra em:{" "}
              <Countdown
                encerraEm={discussao.encerra_em}
                onEncerrado={() => setEncerrada(true)}
              />
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
