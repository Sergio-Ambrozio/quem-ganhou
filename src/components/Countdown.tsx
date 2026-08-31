"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  encerraEm: string;
  onEncerrado?: () => void;
}

function calcularTempo(encerraEm: string) {
  const diff = new Date(encerraEm).getTime() - Date.now();
  if (diff <= 0) return null;

  const horas = Math.floor(diff / (1000 * 60 * 60));
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const segundos = Math.floor((diff % (1000 * 60)) / 1000);

  return { horas, minutos, segundos };
}

export default function Countdown({ encerraEm, onEncerrado }: CountdownProps) {
  const [tempo, setTempo] = useState(calcularTempo(encerraEm));

  useEffect(() => {
    const interval = setInterval(() => {
      const t = calcularTempo(encerraEm);
      setTempo(t);
      if (!t) {
        clearInterval(interval);
        onEncerrado?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [encerraEm, onEncerrado]);

  if (!tempo) {
    return (
      <span className="font-bold text-card-red">Votação encerrada</span>
    );
  }

  return (
    <span className="font-bold text-field">
      {String(tempo.horas).padStart(2, "0")}h{" "}
      {String(tempo.minutos).padStart(2, "0")}min{" "}
      {String(tempo.segundos).padStart(2, "0")}s
    </span>
  );
}
