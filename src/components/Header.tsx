"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="bg-field text-white shadow-lg">
      {/* Top accent bar */}
      <div className="h-1 bg-accent" />

      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo / Title */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="apito">
              &#9917;
            </span>
            <div>
              <h1 className="text-xl font-bold leading-tight tracking-tight">
                Quem Ganhou?
              </h1>
              <p className="text-xs text-white/70">
                Vote no melhor argumento
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className="hover:text-accent transition-colors"
            >
              Início
            </Link>
            <Link
              href="/resultado"
              className="hover:text-accent transition-colors"
            >
              Resultados
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="sm:hidden p-2 rounded-md hover:bg-field-light transition-colors"
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label="Abrir menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuAberto ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {menuAberto && (
          <nav className="sm:hidden mt-3 pt-3 border-t border-white/20 flex flex-col gap-3 text-sm font-medium">
            <Link
              href="/"
              className="hover:text-accent transition-colors py-1"
              onClick={() => setMenuAberto(false)}
            >
              Início
            </Link>
            <Link
              href="/resultado"
              className="hover:text-accent transition-colors py-1"
              onClick={() => setMenuAberto(false)}
            >
              Resultados
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
