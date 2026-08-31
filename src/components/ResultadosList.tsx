"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { Discussao, Personalidade } from "@/types";

interface DiscussaoComPersonalidades extends Discussao {
  personalidade_a: Personalidade;
  personalidade_b: Personalidade;
}

export default function ResultadosList() {
  const [discussoes, setDiscussoes] = useState<DiscussaoComPersonalidades[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscar() {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase
        .from("discussoes")
        .select(
          "*, personalidade_a:personalidades!personalidade_a_id(*), personalidade_b:personalidades!personalidade_b_id(*)"
        )
        .eq("ativa", false)
        .order("criado_em", { ascending: false });

      setDiscussoes((data as DiscussaoComPersonalidades[]) || []);
      setCarregando(false);
    }

    buscar();
  }, []);

  if (carregando) {
    return (
      <div className="bg-white rounded-xl shadow border border-gray-light p-6 text-center">
        <p className="text-gray animate-pulse">Carregando resultados...</p>
      </div>
    );
  }

  if (discussoes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow border border-gray-light p-6 text-center">
        <p className="text-gray">Nenhum resultado disponivel ainda.</p>
        <p className="text-sm text-gray mt-2">
          Os resultados aparecerao aqui quando as votacoes forem encerradas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {discussoes.map((d) => {
        const total = d.votos_a + d.votos_b;
        const pctA = total > 0 ? Math.round((d.votos_a / total) * 100) : 50;
        const pctB = total > 0 ? Math.round((d.votos_b / total) * 100) : 50;
        const vencedor =
          d.votos_a > d.votos_b
            ? "a"
            : d.votos_b > d.votos_a
              ? "b"
              : "empate";

        return (
          <div
            key={d.id}
            className="bg-white rounded-xl shadow border border-gray-light overflow-hidden"
          >
            <div className="bg-field-dark text-white px-4 py-2 text-sm flex justify-between items-center">
              <span className="font-medium">{d.titulo}</span>
              <span className="text-white/60 text-xs">
                {new Date(d.criado_em).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between text-sm mb-3">
                <div className="flex-1">
                  <span
                    className={`font-bold ${
                      vencedor === "a" ? "text-field" : "text-dark"
                    }`}
                  >
                    {vencedor === "a" && "🏆 "}
                    {d.personalidade_a.apelido || d.personalidade_a.nome}
                  </span>
                  <span className="text-gray ml-2">
                    {d.votos_a} ({pctA}%)
                  </span>
                </div>
                <span className="px-3 text-xs font-bold text-gray">VS</span>
                <div className="flex-1 text-right">
                  <span className="text-gray mr-2">
                    ({pctB}%) {d.votos_b}
                  </span>
                  <span
                    className={`font-bold ${
                      vencedor === "b" ? "text-field" : "text-dark"
                    }`}
                  >
                    {d.personalidade_b.apelido || d.personalidade_b.nome}
                    {vencedor === "b" && " 🏆"}
                  </span>
                </div>
              </div>

              {/* Result bar */}
              <div className="w-full h-2 bg-gray-light rounded-full overflow-hidden flex">
                <div
                  className="bg-field transition-all"
                  style={{ width: `${pctA}%` }}
                />
                <div
                  className="bg-accent transition-all"
                  style={{ width: `${pctB}%` }}
                />
              </div>
              <p className="text-xs text-gray mt-2 text-center">
                {total} {total === 1 ? "voto" : "votos"} no total
                {vencedor === "empate" && " - Empate!"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
