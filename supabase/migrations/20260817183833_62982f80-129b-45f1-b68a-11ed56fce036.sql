CREATE TABLE public.equipamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  tipo text NOT NULL,
  capacidade_litros numeric NOT NULL,
  diaria numeric NOT NULL,
  custo_por_km numeric NOT NULL,
  com_reboque boolean NOT NULL DEFAULT false,
  conjunto_pesado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tipo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipamentos TO authenticated;
GRANT ALL ON public.equipamentos TO service_role;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipamentos_owner" ON public.equipamentos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.importacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  tipo_arquivo text NOT NULL,
  nome_arquivo text NOT NULL,
  unidade text,
  linhas integer NOT NULL DEFAULT 0,
  avisos jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.importacoes TO authenticated;
GRANT ALL ON public.importacoes TO service_role;
ALTER TABLE public.importacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "importacoes_owner" ON public.importacoes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.rotas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  codigo text NOT NULL,
  sufixo text NOT NULL,
  unidade text,
  regiao text,
  veiculo text,
  veiculo_unidade text,
  veiculo_transportadora text,
  veiculo_capacidade_nominal numeric,
  veiculo_tipo_sigla text,
  veiculo_equipamento text,
  volume_total numeric NOT NULL DEFAULT 0,
  km_total numeric NOT NULL DEFAULT 0,
  custo_total numeric,
  custo_por_litro numeric,
  data_execucao date,
  ciclo text,
  hr_inicio_rota timestamptz,
  hr_balanza timestamptz,
  jornada_minutos integer,
  jornada_trechos jsonb NOT NULL DEFAULT '[]'::jsonb,
  local_descarga text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, codigo, data_execucao)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rotas TO authenticated;
GRANT ALL ON public.rotas TO service_role;
ALTER TABLE public.rotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rotas_owner" ON public.rotas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX rotas_user_idx ON public.rotas (user_id, regiao, ciclo, sufixo);

CREATE TABLE public.produtores_rota (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  rota_id uuid NOT NULL REFERENCES public.rotas ON DELETE CASCADE,
  codigo text NOT NULL,
  cooperativa text,
  linha text,
  matricula text,
  nome text,
  volume_coleta numeric NOT NULL DEFAULT 0,
  posicao integer,
  dt_coleta timestamptz,
  tempo_coleta text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtores_rota TO authenticated;
GRANT ALL ON public.produtores_rota TO service_role;
ALTER TABLE public.produtores_rota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produtores_rota_owner" ON public.produtores_rota FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX produtores_rota_rota_idx ON public.produtores_rota (rota_id);

CREATE TABLE public.etapas_rota (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  rota_id uuid NOT NULL REFERENCES public.rotas ON DELETE CASCADE,
  veiculo text,
  ordem integer,
  atividade text,
  matricula text,
  descricao text,
  volume numeric,
  km_etapa numeric,
  dt_hora timestamptz,
  latitude numeric,
  longitude numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.etapas_rota TO authenticated;
GRANT ALL ON public.etapas_rota TO service_role;
ALTER TABLE public.etapas_rota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "etapas_rota_owner" ON public.etapas_rota FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX etapas_rota_rota_idx ON public.etapas_rota (rota_id, ordem);

CREATE TABLE public.simulacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  rota_id uuid NOT NULL REFERENCES public.rotas ON DELETE CASCADE,
  tipo text NOT NULL,
  aumento_volume numeric NOT NULL DEFAULT 0,
  aumento_km numeric NOT NULL DEFAULT 0,
  equipamento_destino text,
  volume_antes numeric NOT NULL DEFAULT 0,
  km_antes numeric NOT NULL DEFAULT 0,
  custo_antes numeric NOT NULL DEFAULT 0,
  custo_litro_antes numeric,
  volume_depois numeric NOT NULL DEFAULT 0,
  km_depois numeric NOT NULL DEFAULT 0,
  custo_depois numeric NOT NULL DEFAULT 0,
  custo_litro_depois numeric,
  aplicada boolean NOT NULL DEFAULT false,
  aplicada_em timestamptz,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulacoes TO authenticated;
GRANT ALL ON public.simulacoes TO service_role;
ALTER TABLE public.simulacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "simulacoes_owner" ON public.simulacoes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX simulacoes_rota_idx ON public.simulacoes (rota_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER equipamentos_updated_at BEFORE UPDATE ON public.equipamentos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER rotas_updated_at BEFORE UPDATE ON public.rotas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER simulacoes_updated_at BEFORE UPDATE ON public.simulacoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();