/**
 * MOTOR DE CÁLCULO — funções puras, reutilizáveis e testáveis.
 * Fonte única das fórmulas de custo (não duplicar em componentes).
 */

export type SufixoRota = "D" | "R" | "A" | "B" | "C" | "E" | "S";
export const SUFIXOS_VALIDOS: SufixoRota[] = ["D", "R", "A", "B", "C", "E", "S"];

export type ClasseEquipamento = "solteiro" | "reboque" | "pesado";

export interface Equipamento {
  tipo: string;
  capacidade_litros: number;
  diaria: number;
  custo_por_km: number;
  com_reboque: boolean;
  conjunto_pesado: boolean;
}

/** 9.1 — Custo total de uma rota */
export function custoRota(km: number, equipamento: Pick<Equipamento, "diaria" | "custo_por_km">): number {
  return equipamento.diaria + km * equipamento.custo_por_km;
}

/** 9.2 — Custo por litro */
export function custoPorLitro(custoTotal: number, volume: number): number | null {
  if (!volume || volume <= 0) return null;
  return custoTotal / volume;
}

/** Densidade da rota (volume por km) */
export function densidade(volume: number, km: number): number | null {
  if (!km || km <= 0) return null;
  return volume / km;
}

/** Classifica um equipamento pelo nome do tipo (usado na importação da tabela de tarifas). */
export function classificarEquipamento(tipo: string): ClasseEquipamento {
  const t = tipo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/(carreta|bitrem|vanderleia|vanderl)/.test(t)) return "pesado";
  if (/(reboque|\+\s*rb|romeu)/.test(t)) return "reboque";
  return "solteiro";
}

export function classeDoEquipamento(equipamento: Equipamento): ClasseEquipamento {
  if (equipamento.conjunto_pesado) return "pesado";
  if (equipamento.com_reboque) return "reboque";
  return "solteiro";
}

/** Extrai o sufixo (tipo) da rota — última letra do código. Ex.: "2741D" -> "D" */
export function sufixoDaRota(codigo: string): string {
  const limpo = (codigo ?? "").trim().toUpperCase();
  const ultima = limpo.slice(-1);
  return /[A-Z]/.test(ultima) ? ultima : "";
}

/**
 * REGRA CRÍTICA (seção 8) — compatibilidade rota × equipamento.
 * Nunca oferecer equipamento incompatível com o sufixo da rota.
 */
export const COMPATIBILIDADE: Record<SufixoRota, { classes: ClasseEquipamento[]; descricao: string }> = {
  D: { classes: ["solteiro"], descricao: "Equipamento solteiro (Toco, Truck ou Bitruck, sem reboque)" },
  R: { classes: ["reboque"], descricao: "Equipamento + reboque acoplado" },
  A: { classes: ["solteiro"], descricao: "Rota de apoio — sempre equipamento solteiro" },
  B: { classes: ["solteiro"], descricao: "Rota de apoio — sempre equipamento solteiro" },
  C: { classes: ["solteiro"], descricao: "Rota de apoio — sempre equipamento solteiro" },
  E: { classes: ["solteiro"], descricao: "Rota externa (cooperativa parceira) — sempre equipamento solteiro" },
  S: { classes: ["pesado"], descricao: "Segundo percurso — somente Carreta, Bitrem ou Vanderleia" },
};

export function regraCompatibilidade(sufixo: string) {
  const s = (sufixo ?? "").toUpperCase() as SufixoRota;
  return COMPATIBILIDADE[s] ?? null;
}

export function equipamentoCompativel(sufixo: string, equipamento: Equipamento): boolean {
  const regra = regraCompatibilidade(sufixo);
  if (!regra) return false;
  return regra.classes.includes(classeDoEquipamento(equipamento));
}

export function equipamentosCompativeis(sufixo: string, equipamentos: Equipamento[]): Equipamento[] {
  return equipamentos.filter((e) => equipamentoCompativel(sufixo, e));
}

/** 10 — Simulação de crescimento de volume (mantendo o equipamento atual) */
export interface ResultadoRota {
  volume: number;
  km: number;
  custo: number;
  custoLitro: number | null;
  densidade: number | null;
}

export interface SimulacaoVolume {
  antes: ResultadoRota;
  depois: ResultadoRota;
  capacidadeExcedida: boolean;
  capacidadeEquipamento: number;
}

export function simularCrescimentoVolume(params: {
  volumeAtual: number;
  kmAtual: number;
  custoAtual?: number | null;
  aumentoVolume: number;
  aumentoKm: number;
  equipamentoAtual: Equipamento;
}): SimulacaoVolume {
  const { volumeAtual, kmAtual, aumentoVolume, aumentoKm, equipamentoAtual } = params;
  const custoAntes =
    params.custoAtual != null && params.custoAtual > 0 ? params.custoAtual : custoRota(kmAtual, equipamentoAtual);

  const novoVolume = volumeAtual + aumentoVolume;
  const novoKm = kmAtual + aumentoKm;
  const novoCusto = custoRota(novoKm, equipamentoAtual);

  return {
    antes: {
      volume: volumeAtual,
      km: kmAtual,
      custo: custoAntes,
      custoLitro: custoPorLitro(custoAntes, volumeAtual),
      densidade: densidade(volumeAtual, kmAtual),
    },
    depois: {
      volume: novoVolume,
      km: novoKm,
      custo: novoCusto,
      custoLitro: custoPorLitro(novoCusto, novoVolume),
      densidade: densidade(novoVolume, novoKm),
    },
    capacidadeExcedida: novoVolume > equipamentoAtual.capacidade_litros,
    capacidadeEquipamento: equipamentoAtual.capacidade_litros,
  };
}

/** 11 — Comparador de troca de equipamento (somente equipamentos compatíveis) */
export interface ComparacaoEquipamento {
  equipamento: Equipamento;
  custoTotal: number;
  custoLitro: number | null;
  deltaCustoLitro: number | null;
  atual: boolean;
  capacidadeExcedida: boolean;
}

export function compararEquipamentos(params: {
  sufixo: string;
  kmAtual: number;
  volumeAtual: number;
  equipamentos: Equipamento[];
  tipoEquipamentoAtual?: string | null;
  custoLitroAtual?: number | null;
}): ComparacaoEquipamento[] {
  const { sufixo, kmAtual, volumeAtual, equipamentos, tipoEquipamentoAtual } = params;
  const compativeis = equipamentosCompativeis(sufixo, equipamentos);

  const referencia = (() => {
    if (params.custoLitroAtual != null) return params.custoLitroAtual;
    const atual = compativeis.find((e) => e.tipo === tipoEquipamentoAtual);
    if (!atual) return null;
    return custoPorLitro(custoRota(kmAtual, atual), volumeAtual);
  })();

  return compativeis
    .map((equipamento) => {
      const total = custoRota(kmAtual, equipamento);
      const litro = custoPorLitro(total, volumeAtual);
      return {
        equipamento,
        custoTotal: total,
        custoLitro: litro,
        deltaCustoLitro: litro != null && referencia != null ? litro - referencia : null,
        atual: equipamento.tipo === tipoEquipamentoAtual,
        capacidadeExcedida: volumeAtual > equipamento.capacidade_litros,
      };
    })
    .sort((a, b) => (a.custoLitro ?? Infinity) - (b.custoLitro ?? Infinity));
}

/** 6.3 / 14.1 — Agregação regional */
export interface AgregadoRegional {
  volume: number;
  km: number;
  custo: number;
  densidade: number | null;
  custoLitro: number | null;
  rotas: number;
}

export function agregarRegiao(rotas: Array<{ volume: number; km: number; custo: number }>): AgregadoRegional {
  const volume = rotas.reduce((s, r) => s + (r.volume || 0), 0);
  const km = rotas.reduce((s, r) => s + (r.km || 0), 0);
  const custo = rotas.reduce((s, r) => s + (r.custo || 0), 0);
  return {
    volume,
    km,
    custo,
    densidade: densidade(volume, km),
    custoLitro: custoPorLitro(custo, volume),
    rotas: rotas.length,
  };
}
