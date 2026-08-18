/**
 * Leitura de CSV do Axiodis: separador ";" e encoding Latin-1 / ISO-8859-1.
 */

export interface LinhaCsv {
  [coluna: string]: string;
}

export interface ArquivoCsv {
  colunas: string[];
  linhas: LinhaCsv[];
  separador: string;
  encoding: string;
  totalLinhasBrutas: number;
}

export function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function decodificar(buffer: ArrayBuffer, encoding: string): string {
  const decoder = new TextDecoder(encoding, { fatal: false });
  return decoder.decode(buffer);
}

/** Detecta o separador realmente usado no cabeçalho (para avisar em caso de divergência). */
export function detectarSeparador(cabecalho: string): string {
  const candidatos = [";", ",", "\t", "|"];
  let melhor = ";";
  let maior = -1;
  for (const c of candidatos) {
    const n = cabecalho.split(c).length;
    if (n > maior) {
      maior = n;
      melhor = c;
    }
  }
  return melhor;
}

function dividirLinha(linha: string, separador: string): string[] {
  const campos: string[] = [];
  let atual = "";
  let dentroDeAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (ch === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
    } else if (ch === separador && !dentroDeAspas) {
      campos.push(atual);
      atual = "";
    } else {
      atual += ch;
    }
  }
  campos.push(atual);
  return campos.map((c) => c.trim());
}

export async function lerCsv(
  arquivo: File,
  opcoes: { separador?: string; encoding?: string } = {},
): Promise<ArquivoCsv> {
  const encoding = opcoes.encoding ?? "iso-8859-1";
  const buffer = await arquivo.arrayBuffer();
  let texto = decodificar(buffer, encoding);
  if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1);

  const linhasBrutas = texto.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  if (linhasBrutas.length === 0) {
    return { colunas: [], linhas: [], separador: ";", encoding, totalLinhasBrutas: 0 };
  }

  const cabecalho = linhasBrutas[0]!;
  const separador = opcoes.separador ?? detectarSeparador(cabecalho);
  const colunas = dividirLinha(cabecalho, separador);

  const linhas: LinhaCsv[] = [];
  for (let i = 1; i < linhasBrutas.length; i++) {
    const campos = dividirLinha(linhasBrutas[i]!, separador);
    const registro: LinhaCsv = {};
    colunas.forEach((coluna, idx) => {
      registro[coluna] = campos[idx] ?? "";
    });
    // ignora linhas totalmente vazias
    if (Object.values(registro).some((v) => v !== "")) linhas.push(registro);
  }

  return { colunas, linhas, separador, encoding, totalLinhasBrutas: linhasBrutas.length - 1 };
}

/** Localiza uma coluna do arquivo a partir de nomes/aliases esperados. */
export function localizarColuna(colunas: string[], aliases: string[]): string | null {
  const normalizadas = colunas.map((c) => ({ original: c, norm: normalizarNome(c) }));
  for (const alias of aliases) {
    const alvo = normalizarNome(alias);
    const exata = normalizadas.find((c) => c.norm === alvo);
    if (exata) return exata.original;
  }
  for (const alias of aliases) {
    const alvo = normalizarNome(alias);
    const parcial = normalizadas.find((c) => c.norm.includes(alvo) || alvo.includes(c.norm));
    if (parcial && parcial.norm.length > 2) return parcial.original;
  }
  return null;
}
