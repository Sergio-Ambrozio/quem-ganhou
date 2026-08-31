"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { Personalidade } from "@/types";

interface LeaderboardProps {
  limite?: number;
}

export default function Leaderboard({ limite }: LeaderboardProps) {
  const [personalidades, setPersonalidades] = useState<Personalidade[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscar() {
      const supabase = getSupabaseBrowser();
      let query = supabase
        .from("personalidades")
        .select("*")
        .order("vitorias", { ascending: false });

      if (limite) {
        query = query.limit(limite);
      }

      const { data } = await query;
      setPersonalidades(data || []);
      setCarregando(false);
    }

    buscar();
  }, [limite]);

  if (carregando) {
    return (
      <div className="bg-white rounded-xl shadow border border-gray-light p-6 text-center">
        <p className="text-gray animate-pulse">Carregando classificacao...</p>
      </div>
    );
  }

  if (personalidades.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow border border-gray-light p-6 text-center">
        <p className="text-gray">Nenhum dado disponivel ainda</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow border border-gray-light overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-field text-white text-left">
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Comentarista</th>
              <th className="py-3 px-4 text-center">V</th>
              <th className="py-3 px-4 text-center">D</th>
              <th className="py-3 px-4 text-center">E</th>
              <th className="py-3 px-4 text-center">%</th>
            </tr>
          </thead>
          <tbody>
            {personalidades.map((p, i) => {
              const total = p.vitorias + p.derrotas + p.empates;
              const aproveitamento =
                total > 0 ? Math.round((p.vitorias / total) * 100) : 0;

              return (
                <tr key={p.id} className="border-b border-gray-light last:border-0">
                  <td className="py-3 px-4 font-bold text-accent">{i + 1}</td>
                  <td className="py-3 px-4 font-medium">
                    {p.apelido || p.nome}
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-field">
                    {p.vitorias}
                  </td>
                  <td className="py-3 px-4 text-center text-card-red">
                    {p.derrotas}
                  </td>
                  <td className="py-3 px-4 text-center text-gray">
                    {p.empates}
                  </td>
                  <td className="py-3 px-4 text-center font-bold">
                    {aproveitamento}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
