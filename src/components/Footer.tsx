export default function Footer() {
  return (
    <footer className="bg-dark text-white/60 text-center text-xs py-6 mt-auto">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-lg">&#9917;</span>
          <span className="font-semibold text-white/80">Quem Ganhou?</span>
        </div>
        <p>Vote no melhor argumento do dia</p>
        <p className="mt-1">
          &copy; {new Date().getFullYear()} Quem Ganhou? - Todos os direitos
          reservados.
        </p>
      </div>
    </footer>
  );
}
