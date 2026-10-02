import { CATS } from "./data";

export const eur = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });
export const fmtDate = (d) => (d ? d.split("-").reverse().join(".") : "");

// Akzeptiert Zahlen und Texte mit Dezimalkomma; alles Ungültige zählt als 0
export function toNum(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const x = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}
export const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;

// Positionen mit zugewiesenem Satz beziehen den Preis aus den Standardwerten
export const priceOf = (r, s) => (r.rateKey ? toNum(s[r.rateKey]) : toNum(r.unitPrice));
export const factorOf = (r, s) =>
  r.rateKey === "materialKgPrice"
    ? Math.round((1 + toNum(s.materialWaste) / 100) * 10000) / 10000
    : r.factor === "" ? 1 : toNum(r.factor);
export const lineTotal = (r, s) => round2(toNum(r.quantity) * priceOf(r, s) * factorOf(r, s));

export function calcTotals(rows, s) {
  const byCat = {};
  let direct = 0;
  for (const c of CATS) {
    byCat[c.key] = round2((rows[c.key] || []).reduce((a, r) => a + lineTotal(r, s), 0));
    direct += byCat[c.key];
  }
  direct = round2(direct);
  const over = round2((direct * toNum(s.overhead)) / 100);
  const risk = round2(((direct + over) * toNum(s.risk)) / 100);
  const cost = round2(direct + over + risk);
  const profit = round2((cost * toNum(s.profit)) / 100);
  const offer = round2(cost + profit);
  const vat = round2((offer * toNum(s.vat)) / 100);
  return { byCat, direct, over, risk, cost, profit, offer, vat, gross: round2(offer + vat) };
}

// [Bezeichnung, Betrag, hervorgehoben]
export const summaryLines = (t, s) => [
  ["Direkte Kosten", t.direct],
  [`Gemeinkosten (${toNum(s.overhead)} %)`, t.over],
  [`Risiko (${toNum(s.risk)} %)`, t.risk],
  ["Selbstkosten", t.cost, true],
  [`Gewinn (${toNum(s.profit)} %)`, t.profit],
  ["Angebot netto", t.offer, true],
  [`USt. (${toNum(s.vat)} %)`, t.vat],
  ["Angebot brutto", t.gross, true],
];
