import ResultadosList from "@/components/ResultadosList";
import Leaderboard from "@/components/Leaderboard";

export default function Resultados() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-field mb-2">Resultados</h2>
      <p className="text-gray mb-8">
        Historico de todas as discussoes e seus resultados.
      </p>

      {/* Completed discussions */}
      <ResultadosList />

      {/* Full leaderboard */}
      <section className="mt-10">
        <h3 className="text-xl font-bold text-field mb-4 flex items-center gap-2">
          <span>&#127942;</span> Classificacao Geral
        </h3>
        <Leaderboard />
      </section>
    </div>
  );
}
