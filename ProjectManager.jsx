import { useEffect } from "react";
import { Copy, Download, FolderPlus, Trash2, Upload, X } from "lucide-react";

export default function ProjectManager({ projects, currentId, onOpen, onNew, onDuplicate, onDelete, onImport, onExport, onClose }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const ids = Object.keys(projects).sort().reverse();
  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Projektverwaltung">
        <div className="dialog-head">
          <h2>Projekte</h2>
          <button className="icon-btn" aria-label="Schließen" onClick={onClose}><X /></button>
        </div>
        <div className="dialog-tools">
          <button className="btn primary" onClick={onNew}><FolderPlus /> Neues Projekt</button>
          <button className="btn" onClick={onExport} disabled={!ids.length}><Download /> Backup exportieren</button>
          <label className="btn"><Upload /> Backup importieren
            <input type="file" accept="application/json,.json" hidden onChange={onImport} />
          </label>
        </div>
        {!ids.length && <p className="empty">Noch kein Projekt gespeichert. Mit „Speichern“ legst du das aktuelle Projekt hier ab.</p>}
        <ul className="project-list">
          {ids.map((id) => {
            const s = projects[id];
            return (
              <li key={id} className={id === currentId ? "current" : ""}>
                <button className="project-open" onClick={() => onOpen(id)}>
                  <strong>{id} – {s.project?.projectName || "Ohne Titel"}</strong>
                  <small>{s.project?.customer || "Kein Kunde"}{s.savedAt ? `, gespeichert am ${new Date(s.savedAt).toLocaleDateString("de-AT")}` : ""}</small>
                </button>
                <button className="icon-btn" aria-label={`Projekt ${id} duplizieren`} onClick={() => onDuplicate(id)}><Copy /></button>
                <button className="icon-btn danger" aria-label={`Projekt ${id} löschen`} onClick={() => onDelete(id)}><Trash2 /></button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
