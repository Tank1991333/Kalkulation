export const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

export const CATS = [
  { key: "material", title: "Rohmaterial", accent: "#53657a" },
  { key: "engineering", title: "Technik", accent: "#2871b2" },
  { key: "production", title: "Fertigung", accent: "#c9710f" },
  { key: "assembly", title: "Montage", accent: "#278267" },
];

// Sätze, die einer Position zugewiesen werden können
export const RATES = {
  materialKgPrice: "Material €/kg",
  engineeringRate: "Technik €/Std.",
  workshopRate: "Werkstatt €/Std.",
  weldingRate: "Schweißen €/Std.",
  machineRate: "Maschine €/Std.",
  assemblyRate: "Montage €/Std.",
  craneRate: "Kran €/Std.",
  travelRate: "Fahrt €/km",
};

export const DEFAULT_SETTINGS = {
  materialKgPrice: 1.65, materialWaste: 8, engineeringRate: 78, workshopRate: 64,
  weldingRate: 69, machineRate: 82, assemblyRate: 72, craneRate: 145, travelRate: 0.75,
  overhead: 10, risk: 5, profit: 12, vat: 20,
};

export const SETTING_FIELDS = [
  ...Object.entries(RATES).map(([key, label]) => ({ key, label, suffix: "€" })),
  { key: "materialWaste", label: "Verschnitt Material", suffix: "%" },
  { key: "overhead", label: "Gemeinkosten", suffix: "%" },
  { key: "risk", label: "Wagnis / Risiko", suffix: "%" },
  { key: "profit", label: "Gewinn", suffix: "%" },
  { key: "vat", label: "Umsatzsteuer", suffix: "%" },
];

export const COMPANY_FIELDS = [
  ["name", "Firma"], ["address", "Adresse"], ["contact", "Ansprechpartner"],
  ["email", "E-Mail"], ["phone", "Telefon"],
];
const DEFAULT_COMPANY = { name: "Grabner Gruppe", address: "", contact: "", email: "", phone: "" };

const row = (description, quantity, unit, unitPrice = 0, rateKey = "") =>
  ({ id: uid(), description, quantity, unit, unitPrice, factor: 1, rateKey });

export const seedRows = () => ({
  material: [
    row("Profile / Träger / Bleche", 1000, "kg", 0, "materialKgPrice"),
    row("Schrauben und Verbindungsmittel", 1, "pauschal", 250),
    row("Oberflächenbehandlung", 80, "m²", 18),
  ],
  engineering: [
    row("Technische Bearbeitung / Planung", 12, "Std.", 0, "engineeringRate"),
    row("Werkstattzeichnungen", 8, "Std.", 0, "engineeringRate"),
    row("Statik / externe Leistung", 1, "pauschal", 750),
  ],
  production: [
    row("Zuschnitt und Vorbereitung", 18, "Std.", 0, "workshopRate"),
    row("Schweißen", 22, "Std.", 0, "weldingRate"),
    row("Maschinenzeit", 6, "Std.", 0, "machineRate"),
    row("Endkontrolle und Verladung", 5, "Std.", 0, "workshopRate"),
  ],
  assembly: [
    row("Montagepersonal", 32, "Std.", 0, "assemblyRate"),
    row("Kran / Hebegerät", 8, "Std.", 0, "craneRate"),
    row("Fahrtkosten", 160, "km", 0, "travelRate"),
    row("Unterkunft / Diäten", 1, "pauschal", 480),
  ],
});

export const newRow = () => row("Neue Position", 1, "pauschal");

export function nextProjectNo(projects) {
  const y = new Date().getFullYear();
  const re = new RegExp(`^${y}-(\\d+)$`);
  const max = Math.max(0, ...Object.keys(projects).map((k) => Number(k.match(re)?.[1] || 0)));
  return `${y}-${String(max + 1).padStart(3, "0")}`;
}

const EMPTY_PROJECT = { projectNo: "", projectName: "", customer: "", location: "", date: "" };

// Neues Projekt; Firmenkopf und Logo werden vom bisherigen Projekt übernommen
export function makeDoc(projects = {}, base) {
  return {
    project: {
      ...EMPTY_PROJECT, projectNo: nextProjectNo(projects), projectName: "Neues Stahlbauprojekt",
      date: new Date().toISOString().slice(0, 10),
    },
    settings: { ...DEFAULT_SETTINGS },
    rows: seedRows(),
    company: base ? { ...base.company } : { ...DEFAULT_COMPANY },
    logo: base?.logo || "",
  };
}

// Ergänzt gespeicherte Projekte (auch ältere Versionen) um fehlende Felder
export function hydrate(s) {
  const rows = seedRows();
  return {
    project: { ...EMPTY_PROJECT, ...s.project },
    settings: { ...DEFAULT_SETTINGS, ...s.settings },
    rows: Object.fromEntries(CATS.map((c) => [c.key, Array.isArray(s.rows?.[c.key]) ? s.rows[c.key] : rows[c.key]])),
    company: { ...DEFAULT_COMPANY, ...s.company },
    logo: s.logo || "",
  };
}
