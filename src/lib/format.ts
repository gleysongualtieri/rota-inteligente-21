/**
 * Formatação numérica padrão brasileiro (pt-BR).
 * Milhar: "." | Decimal: ","
 */

export function formatarNumero(valor: number | null | undefined, decimais = 2): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  });
}

export function formatarLitros(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return `${formatarNumero(valor, 0)} L`;
}

export function formatarKm(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return `${formatarNumero(valor, 1)} km`;
}

export function formatarMoeda(valor: number | null | undefined, decimais = 2): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return `R$ ${formatarNumero(valor, decimais)}`;
}

/** Custo por litro usa 4 decimais: R$ 0,3845/L */
export function formatarCustoLitro(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return `R$ ${formatarNumero(valor, 4)}/L`;
}

export function formatarDensidade(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return `${formatarNumero(valor, 2)} L/km`;
}

/** Minutos -> "12h30" */
export function formatarJornada(minutos: number | null | undefined): string {
  if (minutos === null || minutos === undefined || Number.isNaN(minutos)) return "—";
  const sinal = minutos < 0 ? "-" : "";
  const abs = Math.abs(Math.round(minutos));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sinal}${h}h${String(m).padStart(2, "0")}`;
}

export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return "—";
  return `${dia}/${mes}/${ano}`;
}

/** Converte "1.234,56" (ou "1234.56", "1 234,56") em número. */
export function numeroBR(bruto: string | number | null | undefined): number | null {
  if (bruto === null || bruto === undefined) return null;
  if (typeof bruto === "number") return Number.isFinite(bruto) ? bruto : null;
  let texto = bruto.trim();
  if (!texto) return null;
  texto = texto.replace(/[^\d,.\-]/g, "");
  if (!texto || texto === "-") return null;
  const temVirgula = texto.includes(",");
  const temPonto = texto.includes(".");
  if (temVirgula && temPonto) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (temVirgula) {
    texto = texto.replace(",", ".");
  } else if (temPonto) {
    // "1.234" sem decimais = separador de milhar; "1.5" = decimal
    const partes = texto.split(".");
    const ultima = partes[partes.length - 1] ?? "";
    if (partes.length > 2 || ultima.length === 3) texto = texto.replace(/\./g, "");
  }
  const n = Number(texto);
  return Number.isFinite(n) ? n : null;
}
