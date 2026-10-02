import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calculator, ChevronDown, ChevronUp, Download, FileText, FolderOpen, FolderPlus, ImageUp,
  Plus, Printer, RotateCcw, Save, Search, Settings2, Trash2,
} from "lucide-react";
import {
  CATS, COMPANY_FIELDS, DEFAULT_SETTINGS, RATES, SETTING_FIELDS, hydrate, makeDoc, newRow, nextProjectNo, seedRows,
} from "./data";
import { calcTotals, eur, factorOf, lineTotal, priceOf, summaryLines } from "./calc";
import { downloadFile, loadActive, loadProjects, persist, toCsv } from "./storage";
import ProjectManager from "./components/ProjectManager";
import PrintSheet from "./components/PrintSheet";

function Field({ label, value, onChange, type = "text", suffix }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="suffix-wrap">
        <input
          type={type === "date" ? "date" : "text"}
          inputMode={type === "num" ? "decimal" : undefined}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <b>{suffix}</b>}
      </div>
    </label>
  );
}

export default function App() {
  const [boot] = useState(() => {
    const p = loadProjects(), a = loadActive(), ok = a && p[a];
    return { p, d: ok ? hydrate(p[a]) : makeDoc(p), id: ok ? a : null };
  });
  const [projects, setProjects] = useState(boot.p);
  const [doc, setDoc] = useState(boot.d);
  const [savedId, setSavedId] = useState(boot.id);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(boot.d));
  const [activeCat, setActiveCat] = useState("material");
  const [search, setSearch] = useState("");
  const [companyOpen, setCompanyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [manager, setManager] = useState(false);
  const [notice, setNotice] = useState(null);
  const timer = useRef();

  const { project, settings, rows, company, logo } = doc;
  const dirty = JSON.stringify(doc) !== savedJson;
  const status = dirty ? "Ungespeicherte Änderungen" : savedId ? "Gespeichert" : "Neues Projekt";
  const totals = useMemo(() => calcTotals(rows, settings), [rows, settings]);
  const cat = CATS.find((c) => c.key === activeCat);
  const q = search.trim().toLowerCase();
  const visible = rows[activeCat].filter((r) => r.description.toLowerCase().includes(q));

  const flash = (text, error = false) => {
    clearTimeout(timer.current);
    setNotice({ text, error });
    timer.current = setTimeout(() => setNotice(null), 2800);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!dirty) return;
    const h = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = (key, v) => setDoc((d) => ({ ...d, [key]: typeof v === "function" ? v(d[key]) : v }));
  const setIn = (key, field, v) => set(key, (o) => ({ ...o, [field]: v }));
  const upd = (id, patch) =>
    set("rows", (r) => ({ ...r, [activeCat]: r[activeCat].map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const setRate = (r, key) =>
    upd(r.id, key ? { rateKey: key } : { rateKey: "", unitPrice: priceOf(r, settings), factor: factorOf(r, settings) });
  const addRow = () => {
    setSearch("");
    set("rows", (r) => ({ ...r, [activeCat]: [...r[activeCat], newRow()] }));
  };
  const delRow = (id) => set("rows", (r) => ({ ...r, [activeCat]: r[activeCat].filter((x) => x.id !== id) }));

  const confirmLeave = () => !dirty || window.confirm("Ungespeicherte Änderungen gehen verloren. Fortfahren?");

  const save = () => {
    const id = project.projectNo.trim();
    if (!id) return flash("Projektnummer fehlt", true);
    if (id !== savedId && projects[id] && !window.confirm(`Projekt ${id} existiert bereits. Überschreiben?`)) return;
    const next = { ...projects };
    if (savedId && savedId !== id) delete next[savedId]; // geänderte Nummer = Umbenennen
    const d = { ...doc, project: { ...project, projectNo: id } };
    next[id] = { version: 3, savedAt: new Date().toISOString(), ...d };
    if (!persist(next, id)) return flash("Speichern fehlgeschlagen: Browser-Speicher voll oder gesperrt", true);
    setProjects(next); setDoc(d); setSavedId(id); setSavedJson(JSON.stringify(d));
    flash("Projekt gespeichert");
  };
  const open = (id) => {
    if (!confirmLeave()) return;
    const d = hydrate(projects[id]);
    setDoc(d); setSavedId(id); setSavedJson(JSON.stringify(d)); persist(projects, id); setManager(false);
  };
  const create = () => {
    if (!confirmLeave()) return;
    const d = makeDoc(projects, doc);
    setDoc(d); setSavedId(null); setSavedJson(JSON.stringify(d)); setManager(false);
  };
  const duplicate = (id) => {
    const no = nextProjectNo(projects), s = projects[id];
    const next = {
      ...projects,
      [no]: { ...s, savedAt: new Date().toISOString(), project: { ...s.project, projectNo: no, projectName: `${s.project.projectName} (Kopie)` } },
    };
    if (persist(next, savedId)) { setProjects(next); flash(`Kopie ${no} angelegt`); } else flash("Speichern fehlgeschlagen", true);
  };
  const remove = (id) => {
    if (!window.confirm(`Projekt ${id} endgültig löschen?`)) return;
    const next = { ...projects };
    delete next[id];
    if (!persist(next, id === savedId ? null : savedId)) return flash("Löschen fehlgeschlagen", true);
    setProjects(next);
    if (id === savedId) { setSavedId(null); setSavedJson(""); }
  };
  const exportBackup = () =>
    downloadFile("stahlbau-backup.json", JSON.stringify({ app: "stahlbau-kalkulation", projects }, null, 2), "application/json");
  const importBackup = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      const incoming = j.projects || (j.project?.projectNo ? { [j.project.projectNo]: j } : null);
      if (!incoming) throw new Error("Format");
      const next = { ...projects, ...incoming };
      if (!persist(next, savedId)) throw new Error("Speicher");
      setProjects(next);
      flash(`${Object.keys(incoming).length} Projekt(e) importiert`);
    } catch { flash("Import fehlgeschlagen: keine gültige Backup-Datei", true); }
  };

  const exportCsv = () => downloadFile(`${project.projectNo || "Projekt"}_Stahlbau.csv`, toCsv(doc, totals), "text/csv;charset=utf-8");
  const reset = () => {
    if (window.confirm("Positionen und Standardwerte dieses Projekts auf die Vorlage zurücksetzen?"))
      setDoc((d) => ({ ...d, rows: seedRows(), settings: { ...DEFAULT_SETTINGS } }));
  };
  // Logo auf max. 320 px verkleinern, damit der Browser-Speicher nicht überläuft
  const onLogo = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const img = new Image(), url = URL.createObjectURL(f);
    img.onload = () => {
      const k = Math.min(1, 320 / (img.width || 320)), c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      set("logo", c.toDataURL("image/png"));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); flash("Bild konnte nicht gelesen werden", true); };
    img.src = url;
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark"><Calculator /></span>
            <div>
              <h1>Stahlbau-Kalkulation</h1>
              <p>{project.projectNo} – {project.projectName || "Ohne Titel"}</p>
            </div>
          </div>
          <span className={`status ${dirty ? "dirty" : "ok"}`} role="status">{status}</span>
        </div>
        <nav className="actions" aria-label="Aktionen">
          <div className="actions-inner">
            <button className="btn ghost" onClick={() => setManager(true)}><FolderOpen /> Projekte</button>
            <button className="btn primary" onClick={save}><Save /> Speichern</button>
            <button className="btn ghost" onClick={exportCsv}><Download /> CSV</button>
            <button className="btn accent" onClick={() => window.print()}><Printer /> Drucken</button>
            <button className="btn ghost" onClick={reset} aria-label="Zurücksetzen" title="Auf Vorlage zurücksetzen"><RotateCcw /></button>
          </div>
        </nav>
      </header>

      <main className="container">
        {notice && <div className={`notice ${notice.error ? "error" : ""}`} role="status">{notice.text}</div>}

        <section className="card">
          <button className="toggle" onClick={() => setCompanyOpen(!companyOpen)} aria-expanded={companyOpen}>
            <span><ImageUp /> Firmenkopf und Logo</span>{companyOpen ? <ChevronUp /> : <ChevronDown />}
          </button>
          {companyOpen && (
            <div className="grid company">
              <label className="upload">
                {logo ? <img src={logo} alt="Firmenlogo" /> : <span>Logo auswählen</span>}
                <input type="file" accept="image/*" onChange={onLogo} />
              </label>
              {COMPANY_FIELDS.map(([k, label]) => (
                <Field key={k} label={label} value={company[k]} onChange={(v) => setIn("company", k, v)} />
              ))}
              {logo && <button className="btn" onClick={() => set("logo", "")}>Logo entfernen</button>}
            </div>
          )}
        </section>

        <section className="card pad">
          <div className="section-title"><span><FileText /> Projektdaten</span>
            <button className="btn" onClick={create}><FolderPlus /> Neues Projekt</button>
          </div>
          <div className="grid five">
            <Field label="Projektnummer" value={project.projectNo} onChange={(v) => setIn("project", "projectNo", v)} />
            <Field label="Projekt" value={project.projectName} onChange={(v) => setIn("project", "projectName", v)} />
            <Field label="Kunde" value={project.customer} onChange={(v) => setIn("project", "customer", v)} />
            <Field label="Montageort" value={project.location} onChange={(v) => setIn("project", "location", v)} />
            <Field label="Datum" type="date" value={project.date} onChange={(v) => setIn("project", "date", v)} />
          </div>
        </section>

        <section className="card">
          <button className="toggle" onClick={() => setSettingsOpen(!settingsOpen)} aria-expanded={settingsOpen}>
            <span><Settings2 /> Standardwerte</span>{settingsOpen ? <ChevronUp /> : <ChevronDown />}
          </button>
          {settingsOpen && (
            <>
              <p className="hint">Sätze gelten für alle Positionen, denen in der Tabelle dieser Satz zugewiesen ist. Dezimalkomma ist erlaubt.</p>
              <div className="grid settings">
                {SETTING_FIELDS.map((f) => (
                  <Field key={f.key} type="num" label={f.label} suffix={f.suffix} value={settings[f.key]} onChange={(v) => setIn("settings", f.key, v)} />
                ))}
              </div>
            </>
          )}
        </section>

        <div className="work">
          <aside className="card cats">
            <h3>Kalkulationsbereiche</h3>
            {CATS.map((c) => (
              <button key={c.key} className={`cat ${activeCat === c.key ? "on" : ""}`}
                style={{ "--accent": c.accent }} onClick={() => { setActiveCat(c.key); setSearch(""); }}>
                <b>{c.title}</b><small>{rows[c.key].length} Positionen</small><strong>{eur.format(totals.byCat[c.key])}</strong>
              </button>
            ))}
            <div className="direct">Direkte Kosten<strong>{eur.format(totals.direct)}</strong></div>
          </aside>

          <section className="card table-card">
            <div className="table-head" style={{ "--accent": cat.accent }}>
              <h2>{cat.title}</h2>
              <label className="search"><Search />
                <input type="search" placeholder="Position suchen" aria-label="Position suchen" value={search} onChange={(e) => setSearch(e.target.value)} />
              </label>
            </div>
            <div className="scroll">
              <table className="positions">
                <thead>
                  <tr><th>Position</th><th>Menge</th><th>Einheit</th><th>Satz</th><th>Einzelpreis</th><th>Faktor</th><th>Gesamt</th><th /></tr>
                </thead>
                <tbody>
                  {visible.map((r) => {
                    const linked = !!r.rateKey, mat = r.rateKey === "materialKgPrice";
                    return (
                      <tr key={r.id}>
                        <td><input aria-label="Position" value={r.description} onChange={(e) => upd(r.id, { description: e.target.value })} /></td>
                        <td><input aria-label="Menge" inputMode="decimal" value={r.quantity} onChange={(e) => upd(r.id, { quantity: e.target.value })} /></td>
                        <td><input aria-label="Einheit" value={r.unit} onChange={(e) => upd(r.id, { unit: e.target.value })} /></td>
                        <td>
                          <select aria-label="Satz" value={r.rateKey || ""} onChange={(e) => setRate(r, e.target.value)}>
                            <option value="">Manuell</option>
                            {Object.entries(RATES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                          </select>
                        </td>
                        <td><input aria-label="Einzelpreis" inputMode="decimal" disabled={linked} value={linked ? priceOf(r, settings) : r.unitPrice} onChange={(e) => upd(r.id, { unitPrice: e.target.value })} /></td>
                        <td><input aria-label="Faktor" inputMode="decimal" disabled={mat} value={mat ? factorOf(r, settings) : r.factor} onChange={(e) => upd(r.id, { factor: e.target.value })} /></td>
                        <td className="num"><strong>{eur.format(lineTotal(r, settings))}</strong></td>
                        <td><button className="icon-btn danger" aria-label="Position löschen" onClick={() => delRow(r.id)}><Trash2 /></button></td>
                      </tr>
                    );
                  })}
                  {!visible.length && (
                    <tr><td colSpan={8} className="empty">{q ? "Keine Position gefunden." : "Noch keine Position. Füge unten die erste hinzu."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <button className="btn add" onClick={addRow}><Plus /> Position hinzufügen</button>
          </section>
        </div>

        <section className="card summary">
          <h2>Zusammenfassung</h2>
          {CATS.map((c) => <p key={c.key}><span>{c.title}</span><b>{eur.format(totals.byCat[c.key])}</b></p>)}
          <hr />
          {summaryLines(totals, settings).map(([label, value, strong]) => (
            <p key={label} className={strong ? "strong" : ""}><span>{label}</span><b>{eur.format(value)}</b></p>
          ))}
        </section>
      </main>

      {manager && (
        <ProjectManager projects={projects} currentId={savedId} onOpen={open} onNew={create} onDuplicate={duplicate}
          onDelete={remove} onImport={importBackup} onExport={exportBackup} onClose={() => setManager(false)} />
      )}
      <PrintSheet doc={doc} totals={totals} />
    </div>
  );
}
