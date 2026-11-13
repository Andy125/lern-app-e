// Prüft jede erzeugte Aufgabe unabhängig nach: jede Zeile muss mit den Lösungen eine wahre Rechnung sein,
// dazu die Regeln je Lernteil (mit oder ohne Übergang), die Erklärungen und der Spielstand.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const L = require("../public/logic.js");
const ERK = require("../public/erklaerungen.js");
import { readFileSync } from "fs";

let fehler = 0, geprueft = 0;
const melde = (text) => { fehler++; if (fehler <= 40) console.log("FEHLER:", text); };
const ok = (bed, text) => { geprueft++; if (!bed) melde(text); };
const h = (n) => Math.floor(n / 100), z = (n) => Math.floor(n / 10) % 10, e = (n) => n % 10;
const STRICH = /[\u2013\u2014]/; // lange Gedankenstriche sind verboten

// Ausdruck aus Zahlen mit − und + auswerten
function rechne(teile) {
  let wert = null, op = "+";
  for (const x of teile) {
    if (typeof x === "number") { wert = wert == null ? x : op === "+" ? wert + x : wert - x; }
    else if (x === "−" || x === "+") op = x === "−" ? "−" : "+";
    else return NaN;
  }
  return wert;
}
function wertVon(t, x) {
  if (typeof x === "number" || typeof x === "string") return x;
  if (x.f != null) return t.felder[x.f].loesung;
  if (x.z != null) return x.z;
  return null; // Wort
}
// Unabhängig: kreuzt a − t einen Zehner oder Hunderter? (t ist reine Stellenzahl)
const kreuzt = (a, t) => (t >= 100 ? false : t >= 10 ? z(a) < t / 10 : e(a) < t);
const reineStelle = (t) => t > 0 && (t < 10 || (t < 100 && t % 10 === 0) || (t < 1000 && t % 100 === 0));

function pruefeAufgabe(t, kontext) {
  const k = kontext;
  ok(t && t.skill, k + ": keine Aufgabe");
  if (!t) return;
  // Texte ohne lange Gedankenstriche
  const texte = [t.frage, t.text, t.tipp, t.erklaerung, t.merk].concat(t.felder.map((f) => f.tipp || ""));
  for (const s of texte) ok(!STRICH.test(s || ""), `${k}: Gedankenstrich in «${s}»`);
  if (t.art === "wahl") {
    ok(t.optionen.includes(t.loesung), `${k}: Lösung nicht in den Optionen`);
    ok(new Set(t.optionen).size === t.optionen.length, `${k}: doppelte Optionen`);
    if (t.layout === "vergleich") {
      const [a, b] = t.vergleich;
      ok(t.loesung === (a < b ? "<" : a > b ? ">" : "="), `${k}: Vergleich ${a} ${t.loesung} ${b} falsch`);
      ok(a >= 100 && a <= 999 && b >= 100 && b <= 999, `${k}: Vergleich außerhalb 100 bis 999`);
    }
    if (t.layout === "strahl") {
      ok(String(t.fig.ziel) === t.loesung, `${k}: Strahl-Lösung passt nicht zum Pfeil`);
      ok(t.optionen.length === 4, `${k}: Strahl hat nicht 4 Optionen`);
      for (const o of t.optionen.map(Number)) ok(o > 0 && o < 1000 && (o === t.fig.ziel || Math.abs(o - t.fig.ziel) >= 40), `${k}: Strahl-Option ${o} zu nah oder außerhalb`);
    }
    return;
  }
  // Felder: ganze Zahlen von 0 bis 1000
  for (const f of t.felder) ok(Number.isInteger(f.loesung) && f.loesung >= 0 && f.loesung <= 1000, `${k}: Lösung ${f.loesung} ungültig`);
  // Jedes Feld kommt genau einmal vor
  const benutzt = t.zeilen.flatMap((zl) => zl.teile.filter((x) => x && x.f != null).map((x) => x.f)).sort((a, b) => a - b);
  ok(JSON.stringify(benutzt) === JSON.stringify(t.felder.map((_, i) => i)), `${k}: Felder ${benutzt} passen nicht zu ${t.felder.length}`);
  // Mitgenommene Zahlen ({z, nach}) müssen genau das Ergebnis des Feldes sein, nach dem sie erscheinen
  for (const zl of t.zeilen) for (const x of zl.teile) if (x && x.z != null) ok(t.felder[x.nach] && (t.felder[x.nach].loesung === x.z || x === t.zeilen[0].teile[4]), `${k}: Übertrag ${x.z} passt nicht zu Feld ${x.nach}`);
  // Jede Zeile mit = ist eine wahre Rechnung
  const zahlen = [];
  for (const zl of t.zeilen) {
    const w = zl.teile.map((x) => wertVon(t, x)).filter((x) => x !== null);
    const i = w.indexOf("=");
    if (i <= 0) continue; // ohne Rechnung links (zum Beispiel «3 Hunderter, 6 Einer = …»)
    const links = rechne(w.slice(0, i)), rechts = rechne(w.slice(i + 1));
    if (!isNaN(links) && !isNaN(rechts)) { ok(links === rechts, `${k}: ${w.join(" ")} stimmt nicht (${links} ≠ ${rechts})`); zahlen.push(w); }
  }
  const kopf = t.zeilen[0].teile.map((x) => wertVon(t, x));
  const a = kopf[0], b = kopf[2], res = typeof kopf[4] === "number" ? kopf[4] : null;
  const ende = t.felder[t.felder.length - 1].loesung;
  // Rechengeschichte: die Zahlen im Text sind die Zahlen der Rechnung
  if (t.text) {
    const imText = (t.text.match(/\d+/g) || []).map(Number);
    ok(imText.includes(a) && imText.includes(b), `${k}: Geschichte nennt ${imText}, Rechnung ${a} − ${b}`);
    ok(!/undefined|null|NaN/.test(t.text), `${k}: kaputter Geschichtentext`);
  }
  switch (t.skill) {
    case "stellen": {
      if (t.layout === "stellen") { const n = t.zeilen[0].teile[0]; ok(t.felder[0].loesung === h(n) && t.felder[1].loesung === z(n) && t.felder[2].loesung === e(n), `${k}: Stellen von ${n}`); }
      else if (t.fig) ok(t.felder[0].loesung === t.fig.zahl, `${k}: Bild zeigt ${t.fig.zahl}`);
      else {
        const txt = t.zeilen[0].teile[0].w; let n = 0;
        for (const [, x, s] of txt.matchAll(/(\d+) (Hunderter|Zehner|Einer)/g)) n += Number(x) * { Hunderter: 100, Zehner: 10, Einer: 1 }[s];
        ok(t.felder[0].loesung === n, `${k}: «${txt}» ist ${n}, nicht ${t.felder[0].loesung}`);
      }
      break;
    }
    case "nachbar": {
      const n = t.nachbar.zahl;
      ok(n % 10 !== 0, `${k}: ${n} ist schon ein Zehner`);
      ok(t.felder[0].loesung === Math.floor(n / 10) * 10 && t.felder[1].loesung === Math.floor(n / 10) * 10 + 10, `${k}: Nachbarzehner von ${n}`);
      if (t.felder.length > 2) ok(t.felder[2].loesung === Math.floor(n / 100) * 100 && t.felder[3].loesung === Math.floor(n / 100) * 100 + 100, `${k}: Nachbarhunderter von ${n}`);
      break;
    }
    case "h-weg": case "z-weg": case "e-weg":
      for (const w of zahlen) { ok(reineStelle(w[2]) && !kreuzt(w[0], w[2]), `${k}: ${w[0]} − ${w[2]} soll ohne Übergang sein`); }
      for (const w of zahlen) ok({ "h-weg": w[2] >= 100, "z-weg": w[2] >= 10 && w[2] < 100, "e-weg": w[2] < 10 }[t.skill], `${k}: falsche Stelle ${w[2]}`);
      break;
    case "bis-zehner": {
      const n = t.zeilen[0].teile[0];
      ok(t.felder[0].loesung === e(n) && e(n) > 0 && t.felder[1].loesung === z(n) * 10 && z(n) > 0, `${k}: bis zum Zehner/Hunderter von ${n}`);
      break;
    }
    case "nachbar-aufg": {
      const subs = zahlen.map((w) => w[2]);
      ok(subs[1] - subs[0] === subs[2] - subs[1] && (subs[1] - subs[0] === 1 || subs[1] - subs[0] === 10), `${k}: keine Nachbaraufgaben ${subs}`);
      ok(zahlen.some((w) => kreuzt(w[0], w[2])), `${k}: keine Nachbaraufgabe mit Übergang`);
      break;
    }
    case "e-ueber":
      ok(b < 10 && e(a) < b && e(a) > 0 && z(a) > 0 && h(a - b) === h(a), `${k}: ${a} − ${b} soll über den Zehner gehen, nicht über den Hunderter`);
      ok(ende === a - b, `${k}: Ergebnis`);
      break;
    case "e-ueber-h":
      ok(b < 10 && z(a) === 0 && e(a) < b && h(a - b) === h(a) - 1, `${k}: ${a} − ${b} soll über den Hunderter gehen`);
      ok(ende === a - b, `${k}: Ergebnis`);
      break;
    case "z-ueber":
      ok(e(a) === 0 && b % 10 === 0 && b < 100 && z(a) < b / 10 && z(a) > 0, `${k}: ${a} − ${b} soll mit Zehnern über den Hunderter gehen`);
      ok(ende === a - b, `${k}: Ergebnis`);
      break;
    case "aehnlich-e": case "aehnlich-z": {
      ok(zahlen.length === 3 && zahlen.every((w) => w[2] === zahlen[0][2]), `${k}: nicht dieselbe Zahl weg`);
      ok(zahlen.every((w) => e(w[0]) === e(zahlen[1][0]) || w === zahlen[0]), `${k}: Einer wandern nicht mit`);
      ok(kreuzt(zahlen[0][0], zahlen[0][2]), `${k}: erste Aufgabe ohne Übergang`);
      ok(zahlen[2][0] - zahlen[2][2] - (zahlen[1][0] - zahlen[1][2]) === zahlen[2][0] - zahlen[1][0], `${k}: Muster stimmt nicht`);
      break;
    }
    case "raupe": {
      const werte = t.zeilen[0].teile.map((x) => wertVon(t, x));
      const d = werte[0] - werte[1];
      ok(d === 1 || d === 10, `${k}: Schritt ${d}`);
      for (let i = 1; i < werte.length; i++) ok(werte[i - 1] - werte[i] === d, `${k}: Raupe ${werte.join(",")}`);
      ok(werte.some((w, i) => i > 0 && h(w) !== h(werte[i - 1])) || werte.some((w, i) => i > 0 && z(w) !== z(werte[i - 1]) && d === 1), `${k}: Raupe ohne Übergang ${werte}`);
      break;
    }
    case "schritte-3": case "schritte-2": case "schritte-ue2": case "schritte-ue": case "kurz": {
      ok(res === null || res === a - b, `${k}: Ergebnis im Kopf`);
      ok(ende === a - b, `${k}: letztes Feld ${ende} statt ${a - b}`);
      const teile = [h(b) * 100, z(b) * 10, e(b)].filter((x) => x > 0);
      let x = a; const kreuzungen = teile.map((tl) => { const kr = kreuzt(x, tl); x -= tl; return kr; });
      const soll = { "schritte-3": 3, "schritte-2": 2, "schritte-ue2": 2, "schritte-ue": 3, kurz: 3 }[t.skill];
      ok(teile.length === soll, `${k}: ${b} hat ${teile.length} Teile statt ${soll}`);
      if (t.skill === "schritte-3" || t.skill === "schritte-2" || (t.skill === "kurz" && t.stufe === 0)) ok(!kreuzungen.some(Boolean), `${k}: ${a} − ${b} soll ohne Übergang sein`);
      if (t.skill === "schritte-ue" || t.skill === "schritte-ue2") ok(kreuzungen.some(Boolean), `${k}: ${a} − ${b} soll einen Übergang haben`);
      if (t.layout === "schritte") {
        const schrittZeilen = zahlen.slice(1);
        ok(schrittZeilen.length === teile.length, `${k}: ${schrittZeilen.length} Schritte statt ${teile.length}`);
        schrittZeilen.forEach((w, i) => ok(w[2] === teile[i], `${k}: Schritt ${i + 1} nimmt ${w[2]} statt ${teile[i]} weg`));
      } else {
        ok(t.felder[0].loesung === a - teile[0] && t.felder[1].loesung === a - teile[0] - teile[1], `${k}: Zwischenergebnisse der kurzen Schreibweise`);
      }
      break;
    }
  }
}

// 1) Viele Aufgaben je Lernteil und Stufe, mit und ohne Besuch
const besuche = [null].concat(L.FREUNDE.map((f) => f.id));
for (const skill of L.ALLE_SKILLS) for (const st of [0, 1, 2]) for (let s = 0; s < 400; s++) {
  const t = L.makeTask(skill, st, s * 7919 + 13, { freund: besuche[s % besuche.length] });
  pruefeAufgabe(t, `${skill}/${st}/${s}`);
  // gleiche Eingabe, gleiche Aufgabe
  if (s < 20) ok(JSON.stringify(L.makeTask(skill, st, s * 7919 + 13, { freund: besuche[s % besuche.length] })) === JSON.stringify(t), `${skill}/${st}/${s}: nicht reproduzierbar`);
}

// 2) Prüfen der Eingaben
const t0 = L.makeTask("e-ueber", 2, 5);
ok(L.checkFeld(t0, 0, String(t0.felder[0].loesung)).ok, "richtige Eingabe wird abgelehnt");
ok(L.checkFeld(t0, 0, " " + t0.felder[0].loesung + " ").ok, "Leerzeichen stören");
ok(!L.checkFeld(t0, 0, String(t0.felder[0].loesung + 1)).ok, "falsche Eingabe wird angenommen");
ok(L.checkFeld(t0, 0, "").leer, "leere Eingabe nicht erkannt");
ok(!L.checkFeld(t0, 0, "12a").ok, "Buchstaben werden angenommen");

// 3) Erklärungen: alle Rechnungen stimmen, keine Gedankenstriche
for (const id of Object.keys(ERK)) {
  ok(L.GEN[id], `Erklärung für unbekannten Lernteil ${id}`);
  for (const seite of ERK[id]) {
    ok(!STRICH.test(seite.text), `Erklärung ${id}: Gedankenstrich`);
    const quellen = [seite.text].concat(seite.bild && seite.bild.zeilen ? seite.bild.zeilen : []);
    for (const q of quellen) {
      for (const [, x, op, y, r] of q.matchAll(/(\d+) ([−+]) (\d+) = (\d+)/g)) ok((op === "−" ? Number(x) - Number(y) : Number(x) + Number(y)) === Number(r), `Erklärung ${id}: ${x} ${op} ${y} = ${r} ist falsch`);
      for (const [, x, op, y] of q.matchAll(/(\d+) ([<>]) (\d+)/g)) ok(op === "<" ? Number(x) < Number(y) : Number(x) > Number(y), `Erklärung ${id}: ${x} ${op} ${y} ist falsch`);
    }
    const b = seite.bild;
    if (b && b.typ === "sprung") ok(b.start - b.spruenge.reduce((s, v) => s + v, 0) >= 0, `Erklärung ${id}: Sprung unter 0`);
  }
}
for (const id of L.ALLE_SKILLS) ok(ERK[id] && ERK[id].length, `Lernteil ${id} hat keine Erklärung`);

// 4) Texte in Logik, Oberfläche und Freundebuch: keine langen Gedankenstriche
for (const datei of ["public/app.js", "public/logic.js", "public/erklaerungen.js", "public/puppe.js", "public/index.html"]) {
  const s = readFileSync(new URL("../" + datei, import.meta.url), "utf8");
  ok(!STRICH.test(s), `${datei} enthält einen langen Gedankenstrich`);
}

// 5) Spielstand: kaputte Stände werden gültig, nichts Lesbares geht verloren
for (const roh of [null, 5, "x", [], { fortschritt: 3 }, { puppe: "x", besitz: "y", tage: [] }, { offen: ["quatsch", "kurz"], fokus: "nix" }]) {
  const s = L.migrate(roh);
  ok(s.v === 1 && Array.isArray(s.besitz) && s.offen.includes("zahlen"), `migrate(${JSON.stringify(roh)}) ungültig`);
}
{
  const s = L.defaults();
  s.name = "Kind"; s.puppe = { name: "Rosa", haut: 2, haar: "rot", frisur: "dutt", kleid: "kleid", farbe: "mint" };
  s.muenzen = 50; L.record(s, "e-ueber", true, "2026-11-13"); L.record(s, "stellen", false, "2026-11-13");
  s.tage["2026-11-13"] = { sek: 100, aufgaben: 3, richtig: 2, etappen: 1, mission: false, haSek: 600, perlen: 4 };
  s.freunde.lotta = { ab: "2026-11-13", herzen: 2 }; s.sticker["🌸"] = 2;
  const zurueck = L.migrate(JSON.parse(JSON.stringify(s)));
  ok(JSON.stringify(zurueck) === JSON.stringify(s), "Spielstand übersteht Speichern und Laden nicht unverändert");
  ok(s.fehler.includes("stellen") && !s.fehler.includes("e-ueber"), "Übe-Korb falsch");
  // Kaufen
  const r1 = L.kaufe(s, "krone"); ok(r1.ok && s.traegt.includes("krone") && s.muenzen === 0, "Krone kaufen");
  const r2 = L.kaufe(s, "keks"); ok(!r2.ok && r2.grund === "muenzen", "ohne Edelsteine kaufen");
  s.muenzen = 100; ok(L.kaufe(s, "ballett").ok && s.puppe.kleid === "ballett", "Kleid kaufen und anziehen");
  ok(!L.kaufe(s, "ballett").ok, "Kleid doppelt kaufen");
}

// 6) Etappen, Freischalten, Besuch
{
  const s = L.defaults();
  ok(L.fokus(s) === "zahlen", "Start-Schwerpunkt");
  for (const art of ["warm", "neu", "mix", "kiste"]) {
    const sp = L.buildEtappe(s, { art, n: 5, seed: 9 });
    ok(art === "kiste" ? sp.length === 0 : sp.length === 5, `Etappe ${art} hat ${sp.length} Aufgaben`);
    for (const x of sp) ok(L.GEN[x.skill] && x.stufe >= 0 && x.stufe <= 2, `Etappe ${art}: ${JSON.stringify(x)}`);
  }
  // Zahlen sicher üben, dann öffnet sich das nächste Thema
  for (const id of L.themaById("zahlen").skills) for (let i = 0; i < 3; i++) L.record(s, id, true, "2026-11-13");
  for (const id of L.themaById("weg").skills) for (let i = 0; i < 3; i++) L.record(s, id, true, "2026-11-13");
  const neu = L.aktualisiereOffen(s);
  ok(neu.includes("zehner") && !neu.includes("hunderter"), `Freischalten: ${neu}`);
  ok(L.fokus(s) === "zehner", `Schwerpunkt nach dem Freischalten: ${L.fokus(s)}`);
  const sp = L.buildEtappe(s, { art: "neu", n: 5, seed: 3 });
  ok(sp.filter((x) => x.skill === "nachbar-aufg").length >= 3, "Neues lernen übt den aktuellen Lernteil");
  for (let i = 0; i < 50; i++) { const x = L.buildEtappe(s, { art: "mix", n: 5, seed: i }); for (const y of x) ok(s.offen.includes(L.themaVon(y.skill)), `Gemischt übt gesperrtes Thema ${y.skill}`); }
  // Besuch: erst alle Neuen, dann reihum
  const t = L.defaults(); const gesehen = [];
  for (let d = 0; d < 8; d++) { const tag = L.plusTage("2026-11-13", d); const id = L.besuchFuer(t, tag); ok(L.besuchFuer(t, tag) === id, "Besuch wechselt am selben Tag"); gesehen.push(id); L.freundDanke(t, id, tag); }
  ok(new Set(gesehen).size === 8, `Nicht alle Freunde kamen: ${gesehen}`);
  // Überraschung
  const r = L.R(1); let st = 0, sti = 0; const u = L.defaults();
  for (let i = 0; i < 400; i++) { const g = L.ueberraschung(u, r); if (g.typ === "sticker") sti++; else st += g.n; }
  ok(sti > 60 && sti < 200 && u.muenzen === st, `Überraschungen: ${sti} Sticker, ${st} Edelsteine`);
}

console.log(`${geprueft} Prüfungen, ${fehler} Fehler`);
process.exit(fehler ? 1 : 0);
