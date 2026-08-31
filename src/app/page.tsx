import VotingCard from "@/components/VotingCard";
import Leaderboard from "@/components/Leaderboard";

export default function Inicio() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero section */}
      <section className="text-center mb-10">
        <h2 className="text-3xl font-bold text-field mb-2">
          Discussão do Dia
        </h2>
        <p className="text-gray">Vote em quem teve o melhor argumento!</p>
      </section>

      {/* Live voting card */}
      <VotingCard />

      {/* Leaderboard preview */}
      <section className="mt-10">
        <h3 className="text-xl font-bold text-field mb-4 flex items-center gap-2">
          <span>&#127942;</span> Placar Geral
        </h3>
        <Leaderboard limite={5} />
      </section>
    </div>
  );
}
