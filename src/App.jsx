import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calculator, Download, Plus, Save, Trash2, RotateCcw, Settings2, FileText, ChevronDown, ChevronUp, ImageUp, Printer, Search, X } from "lucide-react";
import "./index.css";

const eur = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });
const num = new Intl.NumberFormat("de-AT", { maximumFractionDigits: 2 });
const STORAGE_KEY = "stahlkalkulation";
const AUTOSAVE_DELAY = 700;
const DEFAULTS = { materialKgPrice:1.65, materialWaste:8, engineeringRate:78, workshopRate:64, weldingRate:69, machineRate:82, assemblyRate:72, craneRate:145, travelRate:0.75, overhead:10, risk:5, profit:12 };
const emptyProject = { projectNo:"2026-001", projectName:"Stahlkonstruktion", customer:"", location:"", date:new Date().toISOString().slice(0,10) };
const defaultCompany = { name:"Grabner Gruppe", address:"", contact:"", email:"", phone:"" };
const seedRows = {
  material:[
    {id:1,description:"Profile / Träger / Bleche",quantity:1000,unit:"kg",unitPrice:1.65,factor:1.08},
    {id:2,description:"Schrauben und Verbindungsmittel",quantity:1,unit:"pauschal",unitPrice:250,factor:1},
    {id:3,description:"Oberflächenbehandlung",quantity:80,unit:"m²",unitPrice:18,factor:1},
  ],
  engineering:[
    {id:4,description:"Technische Bearbeitung / Planung",quantity:12,unit:"Std.",unitPrice:78,factor:1},
    {id:5,description:"Werkstattzeichnungen",quantity:8,unit:"Std.",unitPrice:78,factor:1},
    {id:6,description:"Statik / externe Leistung",quantity:1,unit:"pauschal",unitPrice:750,factor:1},
  ],
  production:[
    {id:7,description:"Zuschnitt und Vorbereitung",quantity:18,unit:"Std.",unitPrice:64,factor:1},
    {id:8,description:"Schweißen",quantity:22,unit:"Std.",unitPrice:69,factor:1},
    {id:9,description:"Maschinenzeit",quantity:6,unit:"Std.",unitPrice:82,factor:1},
    {id:10,description:"Endkontrolle und Verladung",quantity:5,unit:"Std.",unitPrice:64,factor:1},
  ],
  assembly:[
    {id:11,description:"Montagepersonal",quantity:32,unit:"Std.",unitPrice:72,factor:1},
    {id:12,description:"Kran / Hebegerät",quantity:8,unit:"Std.",unitPrice:145,factor:1},
    {id:13,description:"Fahrtkosten",quantity:160,unit:"km",unitPrice:0.75,factor:1},
    {id:14,description:"Unterkunft / Diäten",quantity:1,unit:"pauschal",unitPrice:480,factor:1},
  ],
};
const categories = [
  {key:"material",title:"Rohmaterial",accent:"#53657a"},
  {key:"engineering",title:"Technik",accent:"#2871b2"},
  {key:"production",title:"Fertigung",accent:"#df861f"},
  {key:"assembly",title:"Montage",accent:"#278267"},
];
const safeNumber = (value, fallback=0) => { const parsed=Number(value); return Number.isFinite(parsed)?parsed:fallback; };
const rowTotal = row => safeNumber(row?.quantity)*safeNumber(row?.unitPrice)*safeNumber(row?.factor,1);

function Field({label,value,onChange,type="text",step,suffix}) {
  return <label className="field-wrap"><span>{label}</span><div><input type={type} step={step} value={value ?? ""} onChange={e=>onChange(e.target.value)}/>{suffix&&<b>{suffix}</b>}</div></label>;
}

export default function App(){
  const [project,setProject]=useState(emptyProject);
  const [settings,setSettings]=useState(DEFAULTS);
  const [rows,setRows]=useState(seedRows);
  const [company,setCompany]=useState(defaultCompany);
  const [logo,setLogo]=useState("");
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [companyOpen,setCompanyOpen]=useState(true);
  const [notice,setNotice]=useState("");
  const [positionSearch,setPositionSearch]=useState("");
  const [activeCategory,setActiveCategory]=useState("material");
  const [saveStatus,setSaveStatus]=useState("Wird geladen ...");
  const [loadError,setLoadError]=useState("");
  const hydratedRef=useRef(false), noticeTimerRef=useRef(null);

  const snapshot=()=>({version:2,savedAt:new Date().toISOString(),project,settings,rows,company,logo});
  const flash=text=>{ if(noticeTimerRef.current) clearTimeout(noticeTimerRef.current); setNotice(text); noticeTimerRef.current=setTimeout(()=>setNotice(""),3000); };
  const persist=(show=false)=>{ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot())); setSaveStatus(`Gespeichert um ${new Date().toLocaleTimeString("de-AT")}`); if(show) flash("Kalkulation wurde gespeichert."); return true; }catch(e){ console.error(e); setSaveStatus("Speichern fehlgeschlagen"); if(show) flash("Speichern fehlgeschlagen."); return false; } };

  useEffect(()=>{ try{ const raw=localStorage.getItem(STORAGE_KEY); if(!raw){setSaveStatus("Noch nicht gespeichert");return;} const data=JSON.parse(raw); if(data.project)setProject({...emptyProject,...data.project}); if(data.settings)setSettings({...DEFAULTS,...data.settings}); if(data.rows)setRows(Object.fromEntries(categories.map(c=>[c.key,Array.isArray(data.rows[c.key])?data.rows[c.key]:seedRows[c.key]]))); if(data.company)setCompany({...defaultCompany,...data.company}); if(typeof data.logo==="string")setLogo(data.logo); setSaveStatus("Gespeicherte Kalkulation geladen"); }catch(e){console.error(e);setLoadError("Gespeicherte Daten konnten nicht geladen werden.");setSaveStatus("Ladefehler");}finally{hydratedRef.current=true;}},[]);
  useEffect(()=>{ if(!hydratedRef.current)return; setSaveStatus("Änderungen werden gespeichert ..."); const t=setTimeout(()=>persist(false),AUTOSAVE_DELAY); return()=>clearTimeout(t); },[project,settings,rows,company,logo]);

  const totals=useMemo(()=>Object.fromEntries(categories.map(c=>[c.key,(rows[c.key]||[]).reduce((s,r)=>s+rowTotal(r),0)])),[rows]);
  const normalizedSearch=positionSearch.trim().toLocaleLowerCase("de-AT");
  const filteredRows=useMemo(()=>Object.fromEntries(categories.map(c=>[c.key,(rows[c.key]||[]).filter(r=>!normalizedSearch||[r.description,r.unit,r.quantity,r.unitPrice].some(v=>String(v??"").toLocaleLowerCase("de-AT").includes(normalizedSearch)))])),[rows,normalizedSearch]);
  const direct=Object.values(totals).reduce((s,v)=>s+safeNumber(v),0);
  const overheadValue=direct*safeNumber(settings.overhead)/100;
  const riskValue=(direct+overheadValue)*safeNumber(settings.risk)/100;
  const cost=direct+overheadValue+riskValue;
  const profitValue=cost*safeNumber(settings.profit)/100;
  const offer=cost+profitValue;

  const updateRow=(cat,id,key,value)=>setRows(old=>({...old,[cat]:(old[cat]||[]).map(r=>r.id===id?{...r,[key]:["quantity","unitPrice","factor"].includes(key)?Number(value):value,isNew:key==="description"&&value!=="Neue Position"?false:r.isNew}:r)}));
  const addRow=cat=>setRows(old=>({...old,[cat]:[...(old[cat]||[]),{id:`${cat}-${Date.now()}-${Math.random()}`,description:"Neue Position",quantity:1,unit:"pauschal",unitPrice:0,factor:1,isNew:true}]}));
  const removeRow=(cat,id)=>{ const r=(rows[cat]||[]).find(x=>x.id===id); if(!confirm(`Position „${r?.description||"diese Position"}“ wirklich löschen?`))return; setRows(old=>({...old,[cat]:(old[cat]||[]).filter(x=>x.id!==id)})); flash("Position wurde gelöscht."); };
  const updateSetting=(key,value)=>{ const v=Number(value); setSettings(s=>({...s,[key]:v})); const map={materialKgPrice:["material","Profile / Träger / Bleche"],engineeringRate:["engineering","Technische Bearbeitung / Planung"],workshopRate:["production","Zuschnitt und Vorbereitung"],weldingRate:["production","Schweißen"],machineRate:["production","Maschinenzeit"],assemblyRate:["assembly","Montagepersonal"],craneRate:["assembly","Kran / Hebegerät"],travelRate:["assembly","Fahrtkosten"]}; if(map[key]){const[cat,name]=map[key];setRows(old=>({...old,[cat]:old[cat].map(r=>r.description===name?{...r,unitPrice:v}:r)}));} if(key==="materialWaste")setRows(old=>({...old,material:old.material.map(r=>r.description==="Profile / Träger / Bleche"?{...r,factor:1+v/100}:r)})); };
  const reset=()=>{ if(!confirm("Wirklich alles zurücksetzen?"))return; setProject({...emptyProject,date:new Date().toISOString().slice(0,10)});setSettings({...DEFAULTS});setRows(Object.fromEntries(categories.map(c=>[c.key,seedRows[c.key].map(r=>({...r}))])));setCompany({...defaultCompany});setLogo("");setPositionSearch("");setActiveCategory("material");localStorage.removeItem(STORAGE_KEY);flash("Standardwerte wurden wiederhergestellt."); };
  const handleLogo=e=>{const f=e.target.files?.[0];if(!f)return;if(!f.type.startsWith("image/"))return flash("Bitte eine Bilddatei auswählen.");if(f.size>2000000)return flash("Das Logo darf maximal 2 MB groß sein.");const reader=new FileReader();reader.onload=()=>setLogo(String(reader.result));reader.readAsDataURL(f);};
  const exportCsv=()=>{const lines=[["Kalkulation Stahlkonstruktion"],["Projekt",project.projectName],["Projektnummer",project.projectNo],["Kunde",project.customer],["Montageort",project.location],["Datum",project.date],[],["Bereich","Position","Menge","Einheit","Einzelpreis EUR","Faktor","Gesamt EUR"]];categories.forEach(c=>(rows[c.key]||[]).forEach(r=>lines.push([c.title,r.description,r.quantity,r.unit,r.unitPrice,r.factor,rowTotal(r)])));lines.push([],["Direkte Kosten",direct],["Gemeinkosten",overheadValue],["Risiko",riskValue],["Selbstkosten",cost],["Gewinn",profitValue],["Angebotssumme netto",offer]);const csv=lines.map(line=>line.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(";")).join(String.fromCharCode(10));const url=URL.createObjectURL(new Blob([String.fromCharCode(65279)+csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=`${project.projectNo||"Kalkulation"}_Stahlbau.csv`;a.click();URL.revokeObjectURL(url);};

  return <div className="app">
    <div className="screen-only">
      <header className="topbar"><div className="container header-inner"><div className="brand"><Calculator/><div><h1>Stahlbau-Kalkulation</h1><p>Vor- und Angebotskalkulation</p><small>{saveStatus}</small></div></div><div className="actions"><button onClick={()=>persist(true)}><Save/> Speichern</button><button className="primary" onClick={()=>print()}><Printer/> Druckansicht</button></div></div></header>
      <main className="container main">
        {notice&&<div className="toast">{notice}</div>}{loadError&&<div className="error">{loadError}</div>}
        <section className="card"><button className="section-toggle" onClick={()=>setCompanyOpen(!companyOpen)}><span><ImageUp/> Firmenkopf und Logo</span>{companyOpen?<ChevronUp/>:<ChevronDown/>}</button>{companyOpen&&<div className="panel company-grid"><div><div className="logo-box">{logo?<img src={logo} alt="Firmenlogo"/>:"Kein Logo ausgewählt"}</div><label className="upload"><ImageUp/> Logo auswählen<input hidden type="file" accept="image/*" onChange={handleLogo}/></label></div><div className="form-grid"><Field label="Firmenname" value={company.name} onChange={v=>setCompany({...company,name:v})}/><Field label="Adresse" value={company.address} onChange={v=>setCompany({...company,address:v})}/><Field label="Ansprechpartner" value={company.contact} onChange={v=>setCompany({...company,contact:v})}/><Field label="E-Mail" value={company.email} onChange={v=>setCompany({...company,email:v})}/><Field label="Telefon" value={company.phone} onChange={v=>setCompany({...company,phone:v})}/></div></div>}</section>
        <section className="card panel"><h2><FileText/> Projektdaten</h2><div className="form-grid projects"><Field label="Projektnummer" value={project.projectNo} onChange={v=>setProject({...project,projectNo:v})}/><Field label="Projekt" value={project.projectName} onChange={v=>setProject({...project,projectName:v})}/><Field label="Kunde" value={project.customer} onChange={v=>setProject({...project,customer:v})}/><Field label="Montageort" value={project.location} onChange={v=>setProject({...project,location:v})}/><Field label="Datum" type="date" value={project.date} onChange={v=>setProject({...project,date:v})}/></div></section>
        <section className="card"><button className="section-toggle" onClick={()=>setSettingsOpen(!settingsOpen)}><span><Settings2/> Standardwerte</span>{settingsOpen?<ChevronUp/>:<ChevronDown/>}</button>{settingsOpen&&<div className="panel form-grid">{[["materialKgPrice","Stahlpreis je kg","€"],["materialWaste","Materialverschnitt","%"],["engineeringRate","Technik Stundensatz","€"],["workshopRate","Werkstatt Stundensatz","€"],["weldingRate","Schweißen Stundensatz","€"],["machineRate","Maschinen Stundensatz","€"],["assemblyRate","Montage Stundensatz","€"],["craneRate","Kran Stundensatz","€"],["travelRate","Fahrtkosten je km","€"],["overhead","Gemeinkosten","%"],["risk","Risiko / Wagnis","%"],["profit","Gewinnaufschlag","%"]].map(([k,l,s])=><Field key={k} label={l} type="number" step="0.01" value={settings[k]} onChange={v=>updateSetting(k,v)} suffix={s}/>)}</div>}</section>
        <section className="calc-layout"><aside className="card nav"><h3>Kalkulationsbereiche</h3>{categories.map(c=><button key={c.key} style={{borderLeftColor:c.accent,background:activeCategory===c.key?c.accent:"white",color:activeCategory===c.key?"white":"#172033"}} onClick={()=>{setActiveCategory(c.key);setPositionSearch("")}}><b>{c.title}</b><small>{(rows[c.key]||[]).length} Positionen</small><strong>{eur.format(totals[c.key]||0)}</strong></button>)}<div className="direct">Gesamtkosten direkt<strong>{eur.format(direct)}</strong></div></aside>
          {categories.filter(c=>c.key===activeCategory).map(c=><div key={c.key} className="card table-card"><div className="table-head" style={{borderLeftColor:c.accent}}><div><h2>{c.title}</h2><small>{(rows[c.key]||[]).length} Positionen · {eur.format(totals[c.key]||0)}</small></div><div className="search"><Search/><input value={positionSearch} onChange={e=>setPositionSearch(e.target.value)} placeholder="Position suchen ..."/>{positionSearch&&<button onClick={()=>setPositionSearch("")}><X/></button>}</div></div><div className="table-scroll"><table><thead><tr><th>Position</th><th>Menge</th><th>Einheit</th><th>Einzelpreis</th><th>Faktor</th><th>Gesamt</th><th></th></tr></thead><tbody>{filteredRows[c.key].map(r=><tr key={r.id} className={r.isNew?"new":""}><td><input value={r.description??""} onChange={e=>updateRow(c.key,r.id,"description",e.target.value)}/></td><td><input type="number" value={r.quantity??0} onChange={e=>updateRow(c.key,r.id,"quantity",e.target.value)}/></td><td><input value={r.unit??""} onChange={e=>updateRow(c.key,r.id,"unit",e.target.value)}/></td><td><input type="number" value={r.unitPrice??0} onChange={e=>updateRow(c.key,r.id,"unitPrice",e.target.value)}/></td><td><input type="number" value={r.factor??1} onChange={e=>updateRow(c.key,r.id,"factor",e.target.value)}/></td><td className="money">{eur.format(rowTotal(r))}</td><td><button className="delete" onClick={()=>removeRow(c.key,r.id)}><Trash2/></button></td></tr>)}</tbody></table></div><div className="table-foot"><button onClick={()=>addRow(c.key)}><Plus/> Position hinzufügen</button></div></div>)}</section>
        <section className="output"><div className="output-actions"><h2>Ausgabe</h2><button onClick={()=>persist(true)}><Save/> Speichern</button><button onClick={exportCsv}><Download/> CSV</button><button onClick={()=>print()}><Printer/> Drucken / PDF</button><button onClick={reset}><RotateCcw/> Zurücksetzen</button></div><div className="card summary"><h2>Zusammenfassung</h2>{categories.map(c=><div key={c.key}><span>{c.title}</span><b>{eur.format(totals[c.key])}</b></div>)}<hr/><div><span>Gemeinkosten</span><b>{eur.format(overheadValue)}</b></div><div><span>Risiko</span><b>{eur.format(riskValue)}</b></div><div><strong>Selbstkosten</strong><b>{eur.format(cost)}</b></div><div><span>Gewinn</span><b>{eur.format(profitValue)}</b></div><div className="offer"><strong>Angebot netto</strong><strong>{eur.format(offer)}</strong></div></div></section>
      </main>
    </div>
    <div className="print-only print-sheet"><header><div>{logo&&<img src={logo} alt="Firmenlogo"/>}<h1>{company.name||"Firma"}</h1><p>{[company.address,company.contact,[company.phone,company.email].filter(Boolean).join(" | ")].filter(Boolean).join(String.fromCharCode(10))}</p></div><div><h1>KALKULATION</h1><p>Nr. {project.projectNo||"–"}</p><p>{project.date?new Date(`${project.date}T00:00:00`).toLocaleDateString("de-AT"):"Kein Datum"}</p></div></header><table className="project"><tbody><tr><th>Projekt</th><td>{project.projectName}</td><th>Kunde</th><td>{project.customer}</td></tr><tr><th>Montageort</th><td>{project.location}</td><th>Ansprechpartner</th><td>{company.contact}</td></tr></tbody></table>{categories.map(c=><section key={c.key}><h2>{c.title}</h2><table><thead><tr><th>Position</th><th>Menge</th><th>Einheit</th><th>Einzelpreis</th><th>Faktor</th><th>Gesamt</th></tr></thead><tbody>{(rows[c.key]||[]).map(r=><tr key={r.id}><td>{r.description}</td><td>{num.format(safeNumber(r.quantity))}</td><td>{r.unit}</td><td>{eur.format(safeNumber(r.unitPrice))}</td><td>{num.format(safeNumber(r.factor,1))}</td><td>{eur.format(rowTotal(r))}</td></tr>)}<tr className="subtotal"><td colSpan="5">Summe {c.title}</td><td>{eur.format(totals[c.key])}</td></tr></tbody></table></section>)}<div className="print-summary"><table><tbody><tr><th>Direkte Kosten</th><td>{eur.format(direct)}</td></tr><tr><td>Gemeinkosten ({settings.overhead} %)</td><td>{eur.format(overheadValue)}</td></tr><tr><td>Risiko ({settings.risk} %)</td><td>{eur.format(riskValue)}</td></tr><tr><th>Selbstkosten</th><td>{eur.format(cost)}</td></tr><tr><td>Gewinn ({settings.profit} %)</td><td>{eur.format(profitValue)}</td></tr><tr className="offer"><th>Angebotssumme netto</th><td>{eur.format(offer)}</td></tr></tbody></table></div></div>
  </div>;
}
