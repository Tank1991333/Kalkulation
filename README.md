# Stahlbau-Kalkulation V2

React/Vite-Anwendung für Vor- und Angebotskalkulationen im Stahlbau. Alle Daten bleiben im Browser (localStorage), es gibt kein Backend.

## Start

```bash
npm install
npm run dev
```

Produktions-Build: `npm run build` (Ergebnis im Ordner `dist`).

## Funktionen

- Vier Kalkulationsbereiche: Rohmaterial, Technik, Fertigung, Montage
- Standardwerte (Stundensätze, Materialpreis, Verschnitt) wirken direkt auf alle Positionen, denen ein Satz zugewiesen ist; Positionen können auch manuell bepreist werden
- Zuschläge: Gemeinkosten auf direkte Kosten, Risiko auf Kosten inkl. Gemeinkosten, Gewinn auf Selbstkosten, danach USt.
- Projektverwaltung: speichern, öffnen, duplizieren, löschen, Backup als JSON exportieren/importieren
- Suche in den Positionen eines Bereichs
- CSV-Export (Semikolon, Dezimalkomma, direkt in Excel öffnbar)
- Druckansicht (A4) mit Firmenkopf, Logo, Projektdaten, allen Bereichen und Zusammenfassung; über „Drucken“ auch als PDF speicherbar
- Warnung bei ungespeicherten Änderungen

## Auf GitHub veröffentlichen

1. Neues Repository auf GitHub anlegen und diesen Ordnerinhalt hochladen (oder per `git push`).
2. Unter *Settings → Pages* als Quelle **GitHub Actions** wählen.
3. Der Workflow `.github/workflows/deploy.yml` baut und veröffentlicht die App bei jedem Push auf `main`.

## Struktur

```
src/
  App.jsx                    Oberfläche und Zustand
  calc.js                    Rechenlogik und Formatierung
  data.js                    Standardwerte, Beispielpositionen, Projektvorlage
  storage.js                 localStorage, CSV, Download
  components/ProjectManager.jsx
  components/PrintSheet.jsx
  index.css
```

Version: 2.1.0
