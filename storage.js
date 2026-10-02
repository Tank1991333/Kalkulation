import { CATS } from "./data";
import { factorOf, lineTotal, priceOf, summaryLines, toNum } from "./calc";

const KEY = "stahlkalkulation:projects";
const ACTIVE = "stahlkalkulation:active-project";

export function loadProjects() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
export function loadActive() {
  try { return localStorage.getItem(ACTIVE); } catch { return null; }
}
// Gibt false zurück, wenn der Browser-Speicher voll oder gesperrt ist
export function persist(projects, activeId) {
  try {
    localStorage.setItem(KEY, JSON.stringify(projects));
    if (activeId) localStorage.setItem(ACTIVE, activeId); else localStorage.removeItem(ACTIVE);
    return true;
  } catch { return false; }
}

export function downloadFile(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Semikolon-getrennt, Dezimalkomma, UTF-8 mit BOM: öffnet direkt im deutschsprachigen Excel
export function toCsv(doc, t) {
  const { rows, settings: s } = doc;
  const dec = (v) => String(v).replace(".", ",");
  const q = (v) => `"${String(v).replaceAll('"', '""')}"`;
  const safe = (v) => (/^[=+\-@]/.test(v) ? `'${v}` : v);
  const a = [["Bereich", "Position", "Menge", "Einheit", "Einzelpreis", "Faktor", "Gesamt"]];
  for (const c of CATS)
    for (const r of rows[c.key] || [])
      a.push([c.title, safe(r.description), dec(toNum(r.quantity)), r.unit, dec(priceOf(r, s)), dec(factorOf(r, s)), dec(lineTotal(r, s))]);
  a.push([]);
  for (const c of CATS) a.push([c.title, "", "", "", "", "", dec(t.byCat[c.key])]);
  for (const [label, value] of summaryLines(t, s)) a.push([label, "", "", "", "", "", dec(value)]);
  return "\ufeff" + a.map((r) => r.map(q).join(";")).join("\r\n");
}
