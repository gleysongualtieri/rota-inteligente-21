/**
 * Extrações e regras derivadas dos dados importados (seções 5, 6 e 7 do PRD).
 */

/** 5.3 — Decodificação do veículo: [unidade 4][transportadora 3][cap. milhares][sigla + nº] */
export const SIGLAS_EQUIPAMENTO: Record<string, string> = {
  TC: "Toco",
  TO: "Toco",
  TK: "Truck",
  TR: "Truck",
  BK: "Bitruck",
  BR: "Bitruck",
  BT: "Bitrem",
  CR: "Carreta",
  CA: "Carreta",
  VD: "Vanderleia",
  VL: "Vanderleia",
  RB: "Reboque",
  TCR: "Toco + Reboque",
  TRR: "Truck + Reboque",
  BKR: "Bitruck + Reboque",
};

export interface VeiculoDecodificado {
  bruto: string;
  unidade: string | null;
  transportadora: string | null;
  capacidadeNominal: number | null;
  siglaTipo: string | null;
  equipamento: string | null;
}

export function decodificarVeiculo(bruto: string | null | undefined): VeiculoDecodificado {
  const texto = (bruto ?? "").trim().toUpperCase();
  const vazio: VeiculoDecodificado = {
    bruto: texto,
    unidade: null,
    transportadora: null,
    capacidadeNominal: null,
    siglaTipo: null,
    equipamento: null,
  };
  if (!texto) return vazio;

  const m = texto.match(/^(\d{4})([A-Z]{2,4})(\d{1,3})([A-Z]{2,3})(\d*)$/);
  if (!m) return vazio;

  const [, unidade, transportadora, capacidade, sigla] = m;
  return {
    bruto: texto,
    unidade: unidade ?? null,
    transportadora: transportadora ?? null,
    capacidadeNominal: capacidade ? Number(capacidade) * 1000 : null,
    siglaTipo: sigla ?? null,
    equipamento: sigla ? (SIGLAS_EQUIPAMENTO[sigla] ?? sigla) : null,
  };
}

/** 5.2 — Código do produtor: Cooperativa (3) + Linha (3) + Matrícula (3). A Linha é a região. */
export interface CodigoProdutor {
  bruto: string;
  cooperativa: string | null;
  linha: string | null;
  matricula: string | null;
}

export function decodificarCodigoProdutor(bruto: string | null | undefined): CodigoProdutor {
  const digitos = (bruto ?? "").replace(/\D/g, "");
  if (digitos.length !== 9) {
    return { bruto: (bruto ?? "").trim(), cooperativa: null, linha: null, matricula: null };
  }
  return {
    bruto: digitos,
    cooperativa: digitos.slice(0, 3),
    linha: digitos.slice(3, 6),
    matricula: digitos.slice(6, 9),
  };
}

/** 7 — Ciclo par/ímpar inferido pelo dia do mês da execução da rota. */
export function cicloDaData(data: Date | string | null | undefined): "Par" | "Ímpar" | null {
  if (!data) return null;
  const dia = typeof data === "string" ? Number(data.slice(8, 10)) : data.getDate();
  if (!dia || Number.isNaN(dia)) return null;
  return dia % 2 === 0 ? "Par" : "Ímpar";
}

/** Converte "dd/mm/aaaa hh:mm[:ss]" (ou variações do Axiodis) para Date. */
export function parseDataHora(bruto: string | null | undefined): Date | null {
  const texto = (bruto ?? "").trim();
  if (!texto) return null;

  const m = texto.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (m) {
    const dia = Number(m[1]);
    const mes = Number(m[2]);
    let ano = Number(m[3]);
    if (ano < 100) ano += 2000;
    const hora = Number(m[4] ?? 0);
    const min = Number(m[5] ?? 0);
    const seg = Number(m[6] ?? 0);
    const d = new Date(Date.UTC(ano, mes - 1, dia, hora, min, seg));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const iso = new Date(texto);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

/** Extrai apenas "HH:MM" de um campo de hora ("05:30", "05:30:00", "17/08/2026 05:30"). */
export function parseHora(bruto: string | null | undefined): { horas: number; minutos: number } | null {
  const texto = (bruto ?? "").trim();
  if (!texto) return null;
  const m = texto.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const horas = Number(m[1]);
  const minutos = Number(m[2]);
  if (Number.isNaN(horas) || Number.isNaN(minutos)) return null;
  return { horas, minutos };
}

/** Combina a data de execução da rota com uma hora "HH:MM". */
export function combinarDataHora(
  data: Date,
  hora: { horas: number; minutos: number },
  diasAdicionais = 0,
): Date {
  return new Date(
    Date.UTC(
      data.getUTCFullYear(),
      data.getUTCMonth(),
      data.getUTCDate() + diasAdicionais,
      hora.horas,
      hora.minutos,
      0,
    ),
  );
}

export function dataISO(data: Date | null | undefined): string | null {
  if (!data) return null;
  return data.toISOString().slice(0, 10);
}

/**
 * 6 — Jornada da rota = horário do evento "Balanza" − Hr Início Rota.
 * Não inclui tempo de descarga nem regresso.
 * 6.1 — Havendo "Troca de M", a jornada é calculada por trecho/motorista.
 */
export interface TrechoJornada {
  motorista: number;
  inicio: string;
  fim: string;
  minutos: number;
}

export interface JornadaCalculada {
  minutos: number | null;
  inicio: Date | null;
  balanza: Date | null;
  trechos: TrechoJornada[];
  observacao: string | null;
}

export function calcularJornada(params: {
  inicioRota: Date | null;
  balanza: Date | null;
  trocasMotorista?: Array<Date | null>;
}): JornadaCalculada {
  const { inicioRota, balanza } = params;
  const trocas = (params.trocasMotorista ?? []).filter((d): d is Date => !!d).sort((a, b) => +a - +b);

  if (!inicioRota || !balanza) {
    return {
      minutos: null,
      inicio: inicioRota,
      balanza,
      trechos: [],
      observacao: !balanza
        ? "Sem evento Balanza na rota — jornada não pode ser calculada."
        : "Sem horário de início da rota — jornada não pode ser calculada.",
    };
  }

  let fim = balanza;
  if (+fim < +inicioRota) fim = new Date(+fim + 24 * 60 * 60 * 1000); // rota virou o dia

  const marcos = [inicioRota, ...trocas.filter((t) => +t > +inicioRota && +t < +fim), fim];
  const trechos: TrechoJornada[] = [];
  for (let i = 0; i < marcos.length - 1; i++) {
    const a = marcos[i]!;
    const b = marcos[i + 1]!;
    trechos.push({
      motorista: i + 1,
      inicio: a.toISOString(),
      fim: b.toISOString(),
      minutos: Math.round((+b - +a) / 60000),
    });
  }

  const maiorTrecho = trechos.reduce((max, t) => Math.max(max, t.minutos), 0);

  return {
    minutos: maiorTrecho,
    inicio: inicioRota,
    balanza: fim,
    trechos,
    observacao:
      trechos.length > 1
        ? `Rota com troca de motorista: jornada calculada por trecho (maior trecho considerado).`
        : null,
  };
}
