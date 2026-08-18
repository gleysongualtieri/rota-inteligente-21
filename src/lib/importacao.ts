/**
 * Importação e validação dos 3 arquivos CSV (seções 3, 4 e 5 do PRD).
 * Nada é importado silenciosamente: toda divergência é reportada ao usuário.
 */

import { localizarColuna, normalizarNome, type ArquivoCsv } from "./csv";
import {
  calcularJornada,
  cicloDaData,
  combinarDataHora,
  dataISO,
  decodificarCodigoProdutor,
  decodificarVeiculo,
  parseDataHora,
  parseHora,
  type TrechoJornada,
} from "./extracoes";
import { numeroBR } from "./format";
import { classificarEquipamento, sufixoDaRota, SUFIXOS_VALIDOS } from "./motor-calculo";

export type TipoArquivo = "tarifas" | "produtores_rotas" | "route_now";

export interface Problema {
  gravidade: "erro" | "aviso";
  titulo: string;
  esperado?: string;
  encontrado?: string;
  acao?: string;
}

export interface CampoSpec {
  chave: string;
  rotulo: string;
  aliases: string[];
  obrigatorio: boolean;
}

export const SPECS: Record<TipoArquivo, { nome: string; campos: CampoSpec[] }> = {
  tarifas: {
    nome: "Arquivo A — Tabela de Tarifas de Equipamento",
    campos: [
      { chave: "tipo", rotulo: "Tipo de equipamento", aliases: ["Tipo de equipamento", "Equipamento", "Tipo"], obrigatorio: true },
      { chave: "capacidade", rotulo: "Capacidade máxima (litros)", aliases: ["Capacidade máxima (litros)", "Capacidade maxima", "Capacidade"], obrigatorio: true },
      { chave: "diaria", rotulo: "Diária (R$)", aliases: ["Diária (R$)", "Diaria", "Diária"], obrigatorio: true },
      { chave: "custoKm", rotulo: "Custo por km (R$/km)", aliases: ["Custo por km (R$/km)", "Custo por km", "Custo km", "R$/km"], obrigatorio: true },
    ],
  },
  produtores_rotas: {
    nome: "Arquivo B — Produtores_Rotas",
    campos: [
      { chave: "codigo", rotulo: "Código", aliases: ["Código", "Codigo"], obrigatorio: true },
      { chave: "nome", rotulo: "Nome", aliases: ["Nome"], obrigatorio: true },
      { chave: "rota", rotulo: "Rota", aliases: ["Rota"], obrigatorio: true },
      { chave: "volumeColeta", rotulo: "Volume/coleta", aliases: ["Volume/coleta", "Volume coleta"], obrigatorio: true },
      { chave: "posicao", rotulo: "Posição", aliases: ["Posição", "Posicao"], obrigatorio: false },
      { chave: "veiculo", rotulo: "Veículo", aliases: ["Veículo", "Veiculo"], obrigatorio: true },
      { chave: "dtColeta", rotulo: "Dt/Hr Coleta", aliases: ["Dt/Hr Coleta", "Dt/Hr coleta", "Data Coleta"], obrigatorio: true },
      { chave: "tempoColeta", rotulo: "Tempo Coleta", aliases: ["Tempo Coleta"], obrigatorio: false },
      { chave: "distanciaTotal", rotulo: "Distância Total", aliases: ["Distância Total", "Distancia Total"], obrigatorio: true },
      { chave: "volumeTotal", rotulo: "Volume Total", aliases: ["Volume Total"], obrigatorio: true },
      { chave: "hrInicioRota", rotulo: "Hr Início Rota", aliases: ["Hr Início Rota", "Hr Inicio Rota"], obrigatorio: true },
      { chave: "hrTerminoDescarga", rotulo: "Hr Termino Descarga", aliases: ["Hr Termino Descarga", "Hr Término Descarga"], obrigatorio: false },
      { chave: "tempoDescarga", rotulo: "Tempo de Descarga", aliases: ["Tempo de Descarga"], obrigatorio: false },
      { chave: "custoTotalRota", rotulo: "Custo Total Rota", aliases: ["Custo Total Rota"], obrigatorio: true },
      { chave: "custoLitro", rotulo: "Custo (R$/L)", aliases: ["Custo (R$/L)", "Custo R$/L"], obrigatorio: false },
      { chave: "localDescarga", rotulo: "Local Descarga", aliases: ["Local Descarga"], obrigatorio: false },
    ],
  },
  route_now: {
    nome: "Arquivo C — Route_now",
    campos: [
      { chave: "veiculo", rotulo: "Veículo", aliases: ["Veículo", "Veiculo"], obrigatorio: true },
      { chave: "ordem", rotulo: "Ordem", aliases: ["Ordem"], obrigatorio: true },
      { chave: "rota", rotulo: "Rota", aliases: ["Rota"], obrigatorio: true },
      { chave: "atividade", rotulo: "Atividade", aliases: ["Atividade"], obrigatorio: true },
      { chave: "matricula", rotulo: "Matrícula", aliases: ["Matrícula", "Matricula"], obrigatorio: false },
      { chave: "descricao", rotulo: "Descrição", aliases: ["Descrição", "Descricao"], obrigatorio: false },
      { chave: "volume", rotulo: "Volume", aliases: ["Volume"], obrigatorio: false },
      { chave: "kmEtapa", rotulo: "Km etapa", aliases: ["Km etapa", "Km Etapa"], obrigatorio: false },
      { chave: "dtColeta", rotulo: "Dt/Hr coleta", aliases: ["Dt/Hr coleta", "Dt/Hr Coleta"], obrigatorio: true },
      { chave: "latitude", rotulo: "Latitude", aliases: ["Latitude"], obrigatorio: false },
      { chave: "longitude", rotulo: "Longitude", aliases: ["Longitude"], obrigatorio: false },
    ],
  },
};

export const ATIVIDADES_CONHECIDAS = [
  "Coleta",
  "Descarrega",
  "Saída",
  "Regresso",
  "Balanza",
  "Pausa",
  "Transvaso",
  "Desengate",
  "Engate",
  "Troca de M",
  "Espera",
  "Descanso",
];

export interface MapaColunas {
  [chave: string]: string;
}

export interface ValidacaoEstrutura {
  ok: boolean;
  problemas: Problema[];
  mapa: MapaColunas;
}

/** 4.1 — Validação de estrutura: separador, encoding, colunas esperadas. */
export function validarEstrutura(arquivo: ArquivoCsv, tipo: TipoArquivo): ValidacaoEstrutura {
  const spec = SPECS[tipo];
  const problemas: Problema[] = [];
  const mapa: MapaColunas = {};

  if (arquivo.separador !== ";") {
    problemas.push({
      gravidade: "erro",
      titulo: "Separador de colunas diferente do esperado",
      esperado: 'ponto e vírgula ( ; )',
      encontrado: arquivo.separador === "\t" ? "tabulação" : arquivo.separador,
      acao: "Reexportar o arquivo do Axiodis usando ';' como separador.",
    });
  }

  if (arquivo.colunas.length === 0) {
    problemas.push({
      gravidade: "erro",
      titulo: "Arquivo sem cabeçalho legível",
      acao: "Verificar se o arquivo é um CSV com cabeçalho na primeira linha.",
    });
    return { ok: false, problemas, mapa };
  }

  if (/[�]/.test(arquivo.colunas.join(""))) {
    problemas.push({
      gravidade: "aviso",
      titulo: "Possível divergência de encoding no cabeçalho",
      esperado: "Latin-1 / ISO-8859-1",
      encontrado: "caracteres não reconhecidos no cabeçalho",
      acao: "Reexportar o arquivo em Latin-1 (ISO-8859-1).",
    });
  }

  for (const campo of spec.campos) {
    const encontrada = localizarColuna(arquivo.colunas, campo.aliases);
    if (encontrada) {
      mapa[campo.chave] = encontrada;
      if (normalizarNome(encontrada) !== normalizarNome(campo.rotulo)) {
        problemas.push({
          gravidade: "aviso",
          titulo: `Nome de coluna diferente do padrão: "${campo.rotulo}"`,
          esperado: campo.rotulo,
          encontrado: encontrada,
          acao: "Coluna aceita por semelhança. Confirmar se o conteúdo é o esperado.",
        });
      }
    } else if (campo.obrigatorio) {
      problemas.push({
        gravidade: "erro",
        titulo: `Coluna obrigatória não encontrada: "${campo.rotulo}"`,
        esperado: campo.rotulo,
        encontrado: "—",
        acao: "Incluir a coluna na exportação ou corrigir o nome do cabeçalho.",
      });
    } else {
      problemas.push({
        gravidade: "aviso",
        titulo: `Coluna opcional ausente: "${campo.rotulo}"`,
        esperado: campo.rotulo,
        encontrado: "—",
        acao: "A importação segue sem esta informação.",
      });
    }
  }

  const esperadas = spec.campos.length;
  if (arquivo.colunas.length !== esperadas) {
    problemas.push({
      gravidade: "aviso",
      titulo: "Quantidade de colunas diferente do esperado",
      esperado: `${esperadas} colunas`,
      encontrado: `${arquivo.colunas.length} colunas`,
      acao: "Colunas extras são ignoradas. Confirmar se a exportação está correta.",
    });
  }

  if (arquivo.linhas.length === 0) {
    problemas.push({
      gravidade: "erro",
      titulo: "Arquivo sem linhas de dados",
      acao: "Reexportar o arquivo com os registros.",
    });
  }

  return { ok: !problemas.some((p) => p.gravidade === "erro"), problemas, mapa };
}

/* ------------------------------ Arquivo A ------------------------------ */

export interface EquipamentoPreparado {
  tipo: string;
  capacidade_litros: number;
  diaria: number;
  custo_por_km: number;
  com_reboque: boolean;
  conjunto_pesado: boolean;
}

export function prepararTarifas(arquivo: ArquivoCsv, mapa: MapaColunas) {
  const problemas: Problema[] = [];
  const equipamentos: EquipamentoPreparado[] = [];

  arquivo.linhas.forEach((linha, idx) => {
    const tipo = (linha[mapa["tipo"]!] ?? "").trim();
    const capacidade = numeroBR(linha[mapa["capacidade"]!]);
    const diaria = numeroBR(linha[mapa["diaria"]!]);
    const custoKm = numeroBR(linha[mapa["custoKm"]!]);

    if (!tipo) return;
    if (capacidade == null || diaria == null || custoKm == null) {
      problemas.push({
        gravidade: "erro",
        titulo: `Linha ${idx + 2}: tarifa incompleta para "${tipo}"`,
        esperado: "capacidade, diária e custo por km numéricos",
        encontrado: `capacidade=${linha[mapa["capacidade"]!] ?? ""} | diária=${linha[mapa["diaria"]!] ?? ""} | custo/km=${linha[mapa["custoKm"]!] ?? ""}`,
        acao: "Corrigir os valores no arquivo. O sistema não estima tarifas.",
      });
      return;
    }

    const classe = classificarEquipamento(tipo);
    equipamentos.push({
      tipo,
      capacidade_litros: capacidade,
      diaria,
      custo_por_km: custoKm,
      com_reboque: classe === "reboque",
      conjunto_pesado: classe === "pesado",
    });
  });

  return { equipamentos, problemas };
}

/* ------------------------------ Arquivo B ------------------------------ */

export interface ProdutorPreparado {
  codigo: string;
  cooperativa: string | null;
  linha: string | null;
  matricula: string | null;
  nome: string;
  volume_coleta: number;
  posicao: number | null;
  dt_coleta: string | null;
  tempo_coleta: string | null;
}

export interface RotaPreparada {
  codigo: string;
  sufixo: string;
  unidade: string | null;
  regiao: string | null;
  veiculo: string | null;
  veiculo_unidade: string | null;
  veiculo_transportadora: string | null;
  veiculo_capacidade_nominal: number | null;
  veiculo_tipo_sigla: string | null;
  veiculo_equipamento: string | null;
  volume_total: number;
  km_total: number;
  custo_total: number | null;
  custo_por_litro: number | null;
  data_execucao: string | null;
  ciclo: string | null;
  hr_inicio_rota: string | null;
  local_descarga: string | null;
  produtores: ProdutorPreparado[];
  volumeSomado: number;
}

export function prepararRotas(arquivo: ArquivoCsv, mapa: MapaColunas) {
  const problemas: Problema[] = [];
  const porChave = new Map<string, RotaPreparada>();

  arquivo.linhas.forEach((linha, idx) => {
    const codigoRota = (linha[mapa["rota"]!] ?? "").trim().toUpperCase();
    if (!codigoRota) return;

    const dt = parseDataHora(linha[mapa["dtColeta"]!]);
    const data = dataISO(dt);
    const chave = `${codigoRota}|${data ?? "sem-data"}`;

    const sufixo = sufixoDaRota(codigoRota);
    if (!sufixo || !SUFIXOS_VALIDOS.includes(sufixo as never)) {
      problemas.push({
        gravidade: "aviso",
        titulo: `Rota ${codigoRota}: sufixo não reconhecido`,
        esperado: `uma das letras ${SUFIXOS_VALIDOS.join(", ")}`,
        encontrado: sufixo || "—",
        acao: "Sem sufixo válido não é possível aplicar a regra de compatibilidade de equipamento.",
      });
    }

    let rota = porChave.get(chave);
    if (!rota) {
      const veiculoBruto = (linha[mapa["veiculo"]!] ?? "").trim();
      const veiculo = decodificarVeiculo(veiculoBruto);
      if (veiculoBruto && !veiculo.equipamento) {
        problemas.push({
          gravidade: "aviso",
          titulo: `Rota ${codigoRota}: código de veículo não decodificado`,
          esperado: "[unidade 4 dígitos][transportadora 3 letras][capacidade][sigla+nº] — ex.: 0081VIA18BT10",
          encontrado: veiculoBruto,
          acao: "Verificar o código do veículo na exportação.",
        });
      }

      const inicio = parseHora(linha[mapa["hrInicioRota"]!]);
      rota = {
        codigo: codigoRota,
        sufixo,
        unidade: veiculo.unidade,
        regiao: null,
        veiculo: veiculoBruto || null,
        veiculo_unidade: veiculo.unidade,
        veiculo_transportadora: veiculo.transportadora,
        veiculo_capacidade_nominal: veiculo.capacidadeNominal,
        veiculo_tipo_sigla: veiculo.siglaTipo,
        veiculo_equipamento: veiculo.equipamento,
        volume_total: numeroBR(linha[mapa["volumeTotal"]!]) ?? 0,
        km_total: numeroBR(linha[mapa["distanciaTotal"]!]) ?? 0,
        custo_total: numeroBR(linha[mapa["custoTotalRota"]!]),
        custo_por_litro: mapa["custoLitro"] ? numeroBR(linha[mapa["custoLitro"]!]) : null,
        data_execucao: data,
        ciclo: cicloDaData(data),
        hr_inicio_rota: dt && inicio ? combinarDataHora(dt, inicio).toISOString() : null,
        local_descarga: mapa["localDescarga"] ? (linha[mapa["localDescarga"]!] ?? "").trim() || null : null,
        produtores: [],
        volumeSomado: 0,
      };
      porChave.set(chave, rota);
    }

    const codigoProdutor = decodificarCodigoProdutor(linha[mapa["codigo"]!]);
    if (!codigoProdutor.linha) {
      problemas.push({
        gravidade: "aviso",
        titulo: `Linha ${idx + 2}: código de produtor fora do padrão (rota ${codigoRota})`,
        esperado: "9 dígitos — Cooperativa (3) + Linha (3) + Matrícula (3)",
        encontrado: (linha[mapa["codigo"]!] ?? "").trim() || "—",
        acao: "Sem a Linha não é possível determinar a região do produtor.",
      });
    }

    const volumeColeta = numeroBR(linha[mapa["volumeColeta"]!]) ?? 0;
    rota.volumeSomado += volumeColeta;
    rota.produtores.push({
      codigo: codigoProdutor.bruto,
      cooperativa: codigoProdutor.cooperativa,
      linha: codigoProdutor.linha,
      matricula: codigoProdutor.matricula,
      nome: (linha[mapa["nome"]!] ?? "").trim(),
      volume_coleta: volumeColeta,
      posicao: mapa["posicao"] ? (numeroBR(linha[mapa["posicao"]!]) ?? null) : null,
      dt_coleta: dt ? dt.toISOString() : null,
      tempo_coleta: mapa["tempoColeta"] ? (linha[mapa["tempoColeta"]!] ?? "").trim() || null : null,
    });
  });

  const rotas = [...porChave.values()];

  // Região da rota = Linha predominante entre seus produtores
  for (const rota of rotas) {
    const contagem = new Map<string, number>();
    for (const p of rota.produtores) {
      if (!p.linha) continue;
      contagem.set(p.linha, (contagem.get(p.linha) ?? 0) + 1);
    }
    const predominante = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0];
    rota.regiao = predominante ? predominante[0] : null;

    // 4.2 — validação de volume
    if (rota.volume_total > 0) {
      const diferenca = Math.abs(rota.volumeSomado - rota.volume_total);
      const desvio = diferenca / rota.volume_total;
      if (desvio > 0.01) {
        problemas.push({
          gravidade: "aviso",
          titulo: `Rota ${rota.codigo}: soma dos volumes dos produtores divergente do Volume Total`,
          esperado: `${rota.volume_total.toLocaleString("pt-BR")} L (Volume Total do arquivo)`,
          encontrado: `${rota.volumeSomado.toLocaleString("pt-BR")} L (soma de Volume/coleta)`,
          acao: "Conferir a exportação da rota antes de usar o resultado na decisão.",
        });
      }
    } else {
      problemas.push({
        gravidade: "aviso",
        titulo: `Rota ${rota.codigo}: Volume Total ausente ou zero`,
        esperado: "Volume Total > 0",
        encontrado: "0",
        acao: `Volume da soma dos produtores: ${rota.volumeSomado.toLocaleString("pt-BR")} L.`,
      });
    }
  }

  return { rotas, problemas };
}

/** 4.3 — Validação de tarifas: rota com equipamento sem tarifa cadastrada. */
export function validarTarifasDasRotas(
  rotas: Array<{ codigo: string; veiculo_equipamento: string | null; veiculo: string | null }>,
  tiposCadastrados: string[],
): Problema[] {
  const problemas: Problema[] = [];
  const normalizados = tiposCadastrados.map((t) => ({ original: t, norm: normalizarNome(t) }));

  const semTarifa = new Map<string, string[]>();
  for (const rota of rotas) {
    const equipamento = rota.veiculo_equipamento;
    if (!equipamento) continue;
    const norm = normalizarNome(equipamento);
    const achou = normalizados.some((t) => t.norm === norm || t.norm.includes(norm) || norm.includes(t.norm));
    if (!achou) {
      const lista = semTarifa.get(equipamento) ?? [];
      lista.push(rota.codigo);
      semTarifa.set(equipamento, lista);
    }
  }

  for (const [equipamento, codigos] of semTarifa) {
    problemas.push({
      gravidade: "aviso",
      titulo: `Equipamento sem tarifa cadastrada: "${equipamento}"`,
      esperado: "tarifa presente no Arquivo A (Tabela de Tarifas)",
      encontrado: `${codigos.length} rota(s): ${codigos.slice(0, 8).join(", ")}${codigos.length > 8 ? "…" : ""}`,
      acao: "Cadastrar a tarifa no Arquivo A. O sistema não estima tarifas.",
    });
  }

  return problemas;
}

/* ------------------------------ Arquivo C ------------------------------ */

export interface EtapaPreparada {
  veiculo: string | null;
  ordem: number | null;
  atividade: string;
  matricula: string | null;
  descricao: string | null;
  volume: number | null;
  km_etapa: number | null;
  dt_hora: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface RotaEtapas {
  codigo: string;
  data_execucao: string | null;
  etapas: EtapaPreparada[];
  balanza: string | null;
  trocasMotorista: string[];
  jornada_minutos: number | null;
  jornada_trechos: TrechoJornada[];
}

export function prepararEtapas(arquivo: ArquivoCsv, mapa: MapaColunas) {
  const problemas: Problema[] = [];
  const porChave = new Map<string, RotaEtapas>();

  arquivo.linhas.forEach((linha, idx) => {
    const codigoRota = (linha[mapa["rota"]!] ?? "").trim().toUpperCase();
    if (!codigoRota) return;

    const dt = parseDataHora(linha[mapa["dtColeta"]!]);
    const data = dataISO(dt);
    const chave = `${codigoRota}|${data ?? "sem-data"}`;

    const atividade = (linha[mapa["atividade"]!] ?? "").trim();
    if (atividade && !ATIVIDADES_CONHECIDAS.some((a) => normalizarNome(a) === normalizarNome(atividade))) {
      problemas.push({
        gravidade: "aviso",
        titulo: `Linha ${idx + 2}: atividade não prevista ("${atividade}") na rota ${codigoRota}`,
        esperado: ATIVIDADES_CONHECIDAS.join(", "),
        encontrado: atividade,
        acao: "A etapa é importada, mas não participa das regras de jornada.",
      });
    }

    let registro = porChave.get(chave);
    if (!registro) {
      registro = {
        codigo: codigoRota,
        data_execucao: data,
        etapas: [],
        balanza: null,
        trocasMotorista: [],
        jornada_minutos: null,
        jornada_trechos: [],
      };
      porChave.set(chave, registro);
    }

    registro.etapas.push({
      veiculo: (linha[mapa["veiculo"]!] ?? "").trim() || null,
      ordem: numeroBR(linha[mapa["ordem"]!]) ?? null,
      atividade,
      matricula: mapa["matricula"] ? (linha[mapa["matricula"]!] ?? "").trim() || null : null,
      descricao: mapa["descricao"] ? (linha[mapa["descricao"]!] ?? "").trim() || null : null,
      volume: mapa["volume"] ? numeroBR(linha[mapa["volume"]!]) : null,
      km_etapa: mapa["kmEtapa"] ? numeroBR(linha[mapa["kmEtapa"]!]) : null,
      dt_hora: dt ? dt.toISOString() : null,
      latitude: mapa["latitude"] ? numeroBR(linha[mapa["latitude"]!]) : null,
      longitude: mapa["longitude"] ? numeroBR(linha[mapa["longitude"]!]) : null,
    });

    const norm = normalizarNome(atividade);
    if (norm === normalizarNome("Balanza") && dt) {
      if (!registro.balanza || +dt < +new Date(registro.balanza)) registro.balanza = dt.toISOString();
    }
    if (norm.startsWith(normalizarNome("Troca de M")) && dt) {
      registro.trocasMotorista.push(dt.toISOString());
    }
  });

  const rotas = [...porChave.values()];
  for (const rota of rotas) {
    rota.etapas.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    if (!rota.balanza) {
      problemas.push({
        gravidade: "aviso",
        titulo: `Rota ${rota.codigo}: sem evento "Balanza"`,
        esperado: "evento Balanza (chegada/pesagem na base)",
        encontrado: "—",
        acao: "A jornada desta rota não pode ser calculada.",
      });
    }
  }

  return { rotas, problemas };
}

/** Consolida a jornada usando o início da rota (Arquivo B) e o Balanza (Arquivo C). */
export function consolidarJornada(
  inicioRotaISO: string | null,
  registro: Pick<RotaEtapas, "balanza" | "trocasMotorista">,
) {
  const resultado = calcularJornada({
    inicioRota: inicioRotaISO ? new Date(inicioRotaISO) : null,
    balanza: registro.balanza ? new Date(registro.balanza) : null,
    trocasMotorista: registro.trocasMotorista.map((t) => new Date(t)),
  });
  return resultado;
}
