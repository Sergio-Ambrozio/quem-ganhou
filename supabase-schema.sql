-- Quem Ganhou? - Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- Table: personalidades (radio show personalities)
CREATE TABLE personalidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  apelido TEXT,
  foto_url TEXT,
  vitorias INTEGER DEFAULT 0,
  derrotas INTEGER DEFAULT 0,
  empates INTEGER DEFAULT 0,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: discussoes (daily arguments/debates)
CREATE TABLE discussoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  personalidade_a_id UUID REFERENCES personalidades(id) NOT NULL,
  personalidade_b_id UUID REFERENCES personalidades(id) NOT NULL,
  votos_a INTEGER DEFAULT 0,
  votos_b INTEGER DEFAULT 0,
  ativa BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  encerra_em TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '20 hours')
);

-- Table: votos (individual votes)
CREATE TABLE votos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussao_id UUID REFERENCES discussoes(id) NOT NULL,
  personalidade_id UUID REFERENCES personalidades(id) NOT NULL,
  fingerprint TEXT NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique constraint: one vote per fingerprint per discussion
CREATE UNIQUE INDEX votos_unique_per_discussao
  ON votos(discussao_id, fingerprint);

-- Enable Row Level Security
ALTER TABLE personalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos ENABLE ROW LEVEL SECURITY;

-- RLS Policies: anyone can read
CREATE POLICY "Personalidades are viewable by everyone"
  ON personalidades FOR SELECT USING (true);

CREATE POLICY "Discussoes are viewable by everyone"
  ON discussoes FOR SELECT USING (true);

CREATE POLICY "Votos are insertable by everyone"
  ON votos FOR INSERT WITH CHECK (true);

-- Enable realtime for discussoes table
ALTER PUBLICATION supabase_realtime ADD TABLE discussoes;
