// Prüft den Französisch-Teil: Wortliste wie auf den Arbeitsblättern, jede Aufgabe lösbar und eindeutig,
// Buchstaben-Aufgaben vollständig, Fortschritt, Winterkleider und Spielstand.
import { createRequire } from "module";
import { readFileSync } from "fs";
const require = createRequire(import.meta.url);
const L = require("../public/logic.js");
const FR = require("../public/franz.js");

let fehler = 0, geprueft = 0;
const ok = (bed, text) => { geprueft++; if (!bed) { fehler++; if (fehler <= 40) console.log("FEHLER:", text); } };
const STRICH = /[–—]/;

// 1) Wortliste unabhängig gegen die Arbeitsblätter prüfen (so steht es auf den Blättern)
const BLATT = {
  kleidung: ["une écharpe", "un manteau", "un pull", "des chaussettes", "un bonnet", "des bottes", "un pantalon", "des gants", "un anorak"],
  farben: ["jaune", "rouge", "orange", "noir", "blanc", "gris", "bleu", "vert", "violet", "brun / marron"],
  zahlen: ["un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf", "vingt"],
};
const DEUTSCH = { gelb: "jaune", rot: "rouge", orange: "orange", schwarz: "noir", "weiß": "blanc", grau: "gris", blau: "bleu", "grün": "vert", lila: "violet", braun: "brun / marron" };
for (const th of Object.keys(BLATT)) {
  const hier = FR.imThema(th).map(FR.zeige);
  ok(JSON.stringify(hier.slice().sort()) === JSON.stringify(BLATT[th].slice().sort()), `Wortliste ${th}: ${hier.join(", ")}`);
}
for (const [de, fr] of Object.entries(DEUTSCH)) ok(FR.WOERTER.some((w) => w.de === de && FR.zeige(w) === fr), `Farbe ${de} = ${fr} fehlt`);
FR.imThema("zahlen").forEach((w) => ok(BLATT.zahlen[w.zahl - 1] === w.wort, `Zahl ${w.zahl} heißt ${BLATT.zahlen[w.zahl - 1]}, nicht ${w.wort}`));
// Mischungen wie auf dem Blatt
const MISCH = { orange: ["jaune", "rouge"], gris: ["noir", "blanc"], vert: ["jaune", "bleu"], violet: ["bleu", "rouge"], brun: ["jaune", "rouge", "bleu", "noir"] };
for (const m of FR.MISCHUNGEN) ok(JSON.stringify(MISCH[m.gibt]) === JSON.stringify(m.aus), `Mischung für ${m.gibt}`);
ok(FR.MISCHUNGEN.length === Object.keys(MISCH).length, "Anzahl Mischungen");
// Texte ohne lange Gedankenstriche, jedes Wort mit deutschem Wort
for (const w of FR.WOERTER) { ok(w.de && !STRICH.test(w.de + (w.tipp || "")), `Wort ${w.id}: deutsch oder Tipp`); }
ok(!STRICH.test(readFileSync(new URL("../public/franz.js", import.meta.url), "utf8")), "franz.js enthält einen langen Gedankenstrich");

// 2) Jede Aufgabe: lösbar, eindeutig, passend
for (const w of FR.WOERTER) for (const typ of FR.ARTEN) for (const stufe of [0, 1, 2]) for (let seed = 0; seed < 40; seed++) {
  const t = FR.makeTask({ fach: "fr", wort: w.id, typ, stufe, seed: seed * 7919 + 3 });
  const k = `${w.id}/${typ}/${stufe}/${seed}`;
  ok(t && t.wort === w.id && t.fach === "fr", `${k}: keine Aufgabe`);
  for (const s of [t.frage, t.tipp, t.erklaerung, t.merk]) ok(!STRICH.test(s || ""), `${k}: Gedankenstrich`);
  ok(JSON.stringify(FR.makeTask({ fach: "fr", wort: w.id, typ, stufe, seed: seed * 7919 + 3 })) === JSON.stringify(t), `${k}: nicht reproduzierbar`);
  if (t.art === "buchstaben") {
    ok(t.ziel === w.wort, `${k}: Ziel ${t.ziel}`);
    const rest = t.kacheln.slice();
    for (const c of Array.from(t.ziel)) { const i = rest.indexOf(c); ok(i >= 0, `${k}: Buchstabe ${c} fehlt in ${t.kacheln.join("")}`); if (i >= 0) rest.splice(i, 1); }
    ok(rest.length === (stufe >= 2 ? 2 : 0), `${k}: ${rest.length} Extra-Buchstaben`);
    for (const c of rest) ok(!t.ziel.includes(c), `${k}: Extra-Buchstabe ${c} steckt im Wort`);
    ok(t.prompt.vorne === (w.art || ""), `${k}: Begleiter`);
    // Durchspielen: jeder richtige nächste Buchstabe wird angenommen, ein falscher nicht
    const gelegt = [];
    for (const c of Array.from(t.ziel)) { ok(FR.naechsterOk(t, gelegt, c), `${k}: ${c} abgelehnt`); gelegt.push(c); }
    ok(gelegt.join("") === t.ziel, `${k}: Wort nicht gelegt`);
    continue;
  }
  ok(t.art === "wahl" && t.optionen.includes(t.loesung), `${k}: Lösung nicht in den Optionen`);
  ok(new Set(t.optionen).size === t.optionen.length, `${k}: doppelte Optionen ${t.optionen}`);
  ok(FR.checkWahl(t, t.loesung).ok && t.optionen.filter((o) => FR.checkWahl(t, o).ok).length === 1, `${k}: nicht eindeutig`);
  switch (t.typ) {
    case "hoeren":
      ok(t.loesung === w.id && t.sprich === FR.sprechText(w) && t.optionen.length === 4, `${k}: Hören`);
      for (const o of t.optionen) ok(FR.wortById(o) && FR.wortById(o).thema === w.thema && t.bilder[o], `${k}: Bild für ${o}`);
      break;
    case "bild-wort": case "de-fr": case "mischen": case "zaehlen":
      ok(t.loesung === FR.zeige(w) && t.optionen.length === 4, `${k}: Lösung ${t.loesung}`);
      for (const o of t.optionen) ok(FR.imThema(w.thema).some((x) => FR.zeige(x) === o), `${k}: Option ${o} aus anderem Thema`);
      if (t.typ === "de-fr") ok(t.prompt.text === w.de, `${k}: deutsches Wort`);
      if (t.typ === "mischen") ok(JSON.stringify(t.prompt.aus) === JSON.stringify(MISCH[w.id]), `${k}: Mischung`);
      if (t.typ === "zaehlen") ok(t.prompt.zahl === w.zahl, `${k}: ${t.prompt.zahl} Dinge statt ${w.zahl}`);
      break;
    case "fr-de":
      ok(t.loesung === w.de && t.prompt.text === FR.zeige(w) && t.optionen.length === 4, `${k}: Französisch nach Deutsch`);
      break;
    case "artikel":
      ok(w.art && t.loesung === w.art && JSON.stringify(t.optionen) === '["un","une","des"]', `${k}: Begleiter`);
      break;
  }
  // Aufgabenart passt zum Wort (Artikel nur bei Kleidern, Zählen nur bei Zahlen, Mischen nur bei Mischfarben)
  if (typ === "artikel") ok(t.typ === (w.art ? "artikel" : "de-fr"), `${k}: Artikel bei ${w.id}`);
  if (typ === "zaehlen") ok(t.typ === (w.zahl ? "zaehlen" : "bild-wort"), `${k}: Zählen bei ${w.id}`);
  if (typ === "mischen") ok(t.typ === (MISCH[w.id] ? "mischen" : "bild-wort"), `${k}: Mischen bei ${w.id}`);
}
// Verwechsel-Zahlen tauchen auf: bei douze ist deux oft eine Option
let zwilling = 0;
for (let seed = 0; seed < 50; seed++) if (FR.makeTask({ wort: "z12", typ: "de-fr", seed }).optionen.includes("deux")) zwilling++;
ok(zwilling >= 45, `douze und deux kommen zu selten zusammen (${zwilling} von 50)`);

// 3) Fortschritt, Winterkleider, Etappen, Spielstand
{
  const s = L.defaults();
  ok(s.fr && Array.isArray(s.fr.winter), "Spielstand hat Französisch-Teil");
  ok(FR.bereitschaft(s) === 0, "Start: nichts sitzt");
  const sp = FR.buildEtappe(s, { thema: "kleidung", n: 6, seed: 4 });
  ok(sp.length === 6 && new Set(sp.map((x) => x.wort)).size === 6, "Etappe: 6 verschiedene Wörter");
  for (const x of sp) ok(x.fach === "fr" && FR.wortById(x.wort).thema === "kleidung" && FR.ARTEN.includes(x.typ), `Etappe: ${JSON.stringify(x)}`);
  ok(FR.buildEtappe(s, { thema: "zahlen", n: 8, seed: 2 }).every((x) => FR.wortById(x.wort).thema === "zahlen"), "Etappe Zahlen");
  // richtig gelöst: Box steigt, Kleidungsstück wird frei
  const r1 = FR.record(s, "bonnet", true, "2026-11-19");
  ok(r1.neuWinter === "bonnet" && s.fr.winter.includes("bonnet") && s.fr.w.bonnet.box === 1, "Mütze wird frei");
  ok(FR.record(s, "bonnet", true, "2026-11-19").neuWinter === null, "Mütze nur einmal neu");
  FR.record(s, "bonnet", false, "2026-11-19");
  ok(s.fr.w.bonnet.box === 1, "Fehler senkt die Box");
  ok(FR.record(s, "rouge", true, "2026-11-19").neuWinter === null && !s.fr.winter.includes("rouge"), "Farben sind keine Kleider");
  // schwache Wörter zuerst
  for (const w of FR.imThema("farben")) if (w.id !== "gris") { for (let i = 0; i < 3; i++) FR.record(s, w.id, true, "2026-11-19"); }
  ok(FR.buildEtappe(s, { thema: "farben", n: 1, seed: 1 })[0].wort === "gris", "Das schwächste Wort kommt zuerst");
  ok(FR.bereitschaft(s, "farben") === 90, `Bereitschaft Farben: ${FR.bereitschaft(s, "farben")}`);
  // Typen nach Box: am Anfang erkennen, später Buchstaben legen
  const r = L.R(5); const typen0 = new Set(), typen3 = new Set();
  for (let i = 0; i < 200; i++) { typen0.add(FR.typFuer(FR.wortById("anorak"), 0, r)); typen3.add(FR.typFuer(FR.wortById("anorak"), 3, r)); }
  ok(!typen0.has("buchstaben") && typen3.has("buchstaben"), "Buchstaben erst, wenn das Wort sitzt");
  // Spielstand übersteht Speichern und Laden, kaputte Teile werden repariert
  s.fr.traegt = ["bonnet"]; s.fr.camille = { ab: "2026-11-19", herzen: 2 }; s.fr.runden = 3;
  const zurueck = L.migrate(JSON.parse(JSON.stringify(s)));
  ok(JSON.stringify(zurueck.fr) === JSON.stringify(s.fr), "Französisch-Stand übersteht Speichern und Laden");
  const kaputt = L.migrate({ fr: { w: { quatsch: { box: 9 }, rouge: { box: 99, n: "x" } }, winter: ["rouge", "gants", 5], traegt: ["bonnet", "gants"], camille: "ja" } });
  ok(!kaputt.fr.w.quatsch && kaputt.fr.w.rouge.box === 5 && JSON.stringify(kaputt.fr.winter) === '["gants"]' && JSON.stringify(kaputt.fr.traegt) === '["gants"]' && kaputt.fr.camille === null, "Kaputter Französisch-Stand wird repariert: " + JSON.stringify(kaputt.fr));
  ok(JSON.stringify(L.migrate({ name: "Alt" }).fr) === JSON.stringify(FR.defaultsFr()), "Alter Stand ohne Französisch bekommt leeren Französisch-Teil");
  ok(FR.missionEtappen().length === 3 && FR.missionEtappen().every((e) => e.fach === "fr"), "Vokabel-Training hat 3 Etappen");
}
console.log(`Französisch: ${geprueft} Prüfungen, ${fehler} Fehler`);
process.exit(fehler ? 1 : 0);
