import { CATS } from "../data";
import { eur, factorOf, fmtDate, lineTotal, priceOf, summaryLines, toNum } from "../calc";

// Wird nur beim Drucken angezeigt (siehe index.css)
export default function PrintSheet({ doc, totals }) {
  const { project: p, company: c, logo, rows, settings: s } = doc;
  const contact = [c.contact, c.email, c.phone].filter(Boolean).join(" · ");
  return (
    <section className="print-sheet" aria-hidden="true">
      <div className="ps-head">
        <div>
          <strong>{c.name}</strong>
          {c.address && <div>{c.address}</div>}
          {contact && <div>{contact}</div>}
        </div>
        {logo && <img src={logo} alt="" />}
      </div>
      <h1>Angebotskalkulation</h1>
      <table className="ps-meta">
        <tbody>
          <tr><th>Projekt-Nr.</th><td>{p.projectNo}</td><th>Datum</th><td>{fmtDate(p.date)}</td></tr>
          <tr><th>Projekt</th><td>{p.projectName}</td><th>Kunde</th><td>{p.customer}</td></tr>
          <tr><th>Montageort</th><td colSpan={3}>{p.location}</td></tr>
        </tbody>
      </table>
      {CATS.map((cat) => (
        <div key={cat.key} className="ps-block">
          <h2>{cat.title}</h2>
          <table>
            <thead><tr><th>Position</th><th>Menge</th><th>Einheit</th><th>Einzelpreis</th><th>Faktor</th><th>Gesamt</th></tr></thead>
            <tbody>
              {(rows[cat.key] || []).map((r) => (
                <tr key={r.id}>
                  <td>{r.description}</td><td>{toNum(r.quantity)}</td><td>{r.unit}</td>
                  <td>{eur.format(priceOf(r, s))}</td><td>{factorOf(r, s)}</td><td>{eur.format(lineTotal(r, s))}</td>
                </tr>
              ))}
              <tr className="sum"><td colSpan={5}>Summe {cat.title}</td><td>{eur.format(totals.byCat[cat.key])}</td></tr>
            </tbody>
          </table>
        </div>
      ))}
      <div className="ps-block">
        <h2>Zusammenfassung</h2>
        <table className="ps-summary">
          <tbody>
            {summaryLines(totals, s).map(([label, value, strong]) => (
              <tr key={label} className={strong ? "sum" : ""}><td>{label}</td><td>{eur.format(value)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
