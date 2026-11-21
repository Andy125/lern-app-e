// Prüft den Deutsch-Teil: Wortlisten wie im Sprachbuch (Seite 79 und 80), jede Aufgabe lösbar und eindeutig,
// Buchstaben-Aufgaben vollständig, Gegenspieler, Fortschritt, Wiese und Spielstand.
import { createRequire } from "module";
import { readFileSync } from "fs";
const require = createRequire(import.meta.url);
const L = require("../public/logic.js");
const DE = require("../public/deutsch.js");

let fehler = 0, geprueft = 0;
const ok = (bed, text) => { geprueft++; if (!bed) { fehler++; if (fehler <= 40) console.log("FEHLER:", text); } };
const STRICH = /[\u2013\u2014]/;
const sortiert = (a) => JSON.stringify(a.slice().sort());

// 1) Wortlisten unabhängig gegen das Buch prüfen (so steht es auf den Seiten)
const BUCH = {
  bilder: ["Biene", "Brief", "Dieb", "Knie", "Fieber", "Schiene", "vier", "Ziel", "Stiel", "Tiere", "Spiel", "Zwiebel"],
  reime79: ["Fliege", "Ziel", "biegen", "Stiel", "Brief", "schließen", "fließen", "verlieren", "Wiese", "kriechen", "wieder", "Liege", "tief", "Lieder", "riechen", "wiegen", "spazieren", "Riese"],
  reime80: ["kariert", "vier", "ziehen", "Knie", "Niete", "er hieß", "wie", "er ließ", "Miete", "Sieb", "rasiert", "Ziegel", "Dieb", "verbieten", "Spiegel", "fliehen", "mieten", "Tier"],
};
// Seite 80, Nr. 1: je zwei Anfänge und zwei Enden
const KAESTEN = [[["Bie", "Tie"], ["fe", "ne"]], [["Die", "Frie"], ["ner", "den"]], [["pie", "spie"], ["geln", "pen"]], [["schie", "sie"], ["gen", "ßen"]], [["gie", "bie"], ["ßen", "ten"]], [["nie", "rie"], ["sig", "mand"]], [["wie", "schie"], ["ben", "gen"]]];
const SILBENWOERTER = ["Biene", "Tiefe", "Diener", "Frieden", "piepen", "spiegeln", "schießen", "siegen", "gießen", "bieten", "niemand", "riesig", "wiegen", "schieben"];
const REIMPAARE = [["Fliege", "Liege"], ["Ziel", "Stiel"], ["biegen", "wiegen"], ["Brief", "tief"], ["schließen", "fließen"], ["verlieren", "spazieren"], ["Wiese", "Riese"], ["kriechen", "riechen"], ["wieder", "Lieder"],
  ["kariert", "rasiert"], ["vier", "Tier"], ["ziehen", "fliehen"], ["Knie", "wie"], ["Niete", "Miete"], ["er hieß", "er ließ"], ["Sieb", "Dieb"], ["Ziegel", "Spiegel"], ["verbieten", "mieten"]];
const zeigeAlle = (th) => DE.imThema(th).map(DE.zeige);
ok(sortiert(zeigeAlle("bilder")) === sortiert(BUCH.bilder), "Bildwörter: " + zeigeAlle("bilder").join(", "));
ok(sortiert(zeigeAlle("reime")) === sortiert([...new Set(BUCH.reime79.concat(BUCH.reime80))]), "Reimwörter: " + zeigeAlle("reime").join(", "));
ok(sortiert(zeigeAlle("silben")) === sortiert(SILBENWOERTER), "Silbenwörter: " + zeigeAlle("silben").join(", "));
ok(DE.WOERTER.length === new Set(BUCH.bilder.concat(BUCH.reime79, BUCH.reime80, SILBENWOERTER)).size, `Anzahl Wörter ${DE.WOERTER.length}`);
// Jedes Reimwort hat genau seinen Partner von derselben Buchseite
for (const [a, b] of REIMPAARE) {
  const wa = DE.WOERTER.find((w) => DE.zeige(w) === a), wb = DE.WOERTER.find((w) => DE.zeige(w) === b);
  ok(wa && wb && wa.reim === wb.id && wb.reim === wa.id, `Reimpaar ${a} und ${b}`);
  const seite = BUCH.reime79.includes(a) && BUCH.reime79.includes(b) ? 79 : BUCH.reime80.includes(a) && BUCH.reime80.includes(b) ? 80 : 0;
  ok(seite && wa && wa.seite === seite, `Reimpaar ${a} und ${b} von Seite ${seite}`);
}
ok(DE.REIME.length === REIMPAARE.length && DE.imThema("reime").every((w) => w.reim), "Jedes Reimwort hat einen Partner");
// Silben: in jedem Kasten ergeben genau zwei Verbindungen ein Wort, und das sind die Wörter der App
for (const [[a, b], [x, y]] of KAESTEN) {
  const woerter = [a + x, a + y, b + x, b + y].filter((v) => SILBENWOERTER.includes(v));
  ok(woerter.length === 2 && ((woerter.includes(a + x) && woerter.includes(b + y)) || (woerter.includes(a + y) && woerter.includes(b + x))), `Kasten ${a}/${b}: ${woerter}`);
  const k = DE.KAESTEN.find(([p, q]) => [p, q].map((id) => DE.wortById(id).wort).every((v) => woerter.includes(v)));
  ok(k, `Kasten ${a}/${b} fehlt in der App`);
  for (const v of woerter) { const w = DE.WOERTER.find((z) => z.wort === v); ok(w && w.silben && w.silben.join("") === v && [a, b].includes(w.silben[0]) && [x, y].includes(w.silben[1]), `Silben von ${v}`); }
}
// Jedes Wort: genau ein ie, Satz mit dem Wort (nicht am Satzanfang), Nomen mit Begleiter
for (const w of DE.WOERTER) {
  ok(w.wort.split("ie").length === 2, `${w.wort}: nicht genau ein ie`);
  const s = DE.satzLuecke(w);
  ok(s && s[0] + w.wort + s[1] === w.satz && s[0].length > 0, `${w.wort}: Satz «${w.satz}»`);
  ok(/[.!?]$/.test(w.satz), `${w.wort}: Satzende`);
  ok(DE.istNomen(w) === !!w.art && (!w.art || ["der", "die", "das"].includes(w.art)), `${w.wort}: Begleiter ${w.art}`);
  ok(!(w.verb && w.art), `${w.wort}: Nomen und Verb`);
  ok(w.deko && !STRICH.test(w.satz + (w.tipp || "")), `${w.wort}: Bild oder Gedankenstrich`);
  ok(!BUCH.bilder.includes(w.wort) || w.bild, `${w.wort}: Bildwort ohne Bild`);
}
for (const k of DE.KONTRAST) {
  ok(!k.wort.includes("ie"), `Gegenspieler ${k.wort} hat ie`);
  ok(k.laut === "ei" ? k.wort.includes("ei") : k.wort.includes("i") && !k.wort.includes("ei"), `Gegenspieler ${k.wort}: ${k.laut}`);
  ok(k.bild && !DE.WOERTER.some((w) => w.bild === k.bild), `Gegenspieler ${k.wort}: Bild doppelt`);
}
for (const s of [DE.MERKSPRUCH].concat(DE.REGEL.map((x) => x.text + (x.sag || "")), DE.REGEL_FRAGE.frage)) ok(!STRICH.test(s), "Gedankenstrich in " + s);
ok(DE.REGEL_FRAGE.loesung === "ie" && DE.REGEL_FRAGE.optionen.includes("i"), "Frage von Seite 79, Nr. 3");
ok(!STRICH.test(readFileSync(new URL("../public/deutsch.js", import.meta.url), "utf8")), "deutsch.js enthält einen langen Gedankenstrich");

// 2) Jede Aufgabe: lösbar, eindeutig, passend
const alleWoerter = DE.WOERTER.map((w) => w.wort);
const endeErst = (w) => w.wort.slice(w.wort.indexOf("ie") + 2).charAt(0);
for (const w of DE.WOERTER) for (const typ of DE.ARTEN) for (const stufe of [0, 1, 2]) for (let seed = 0; seed < 30; seed++) {
  const spec = { fach: "de", wort: w.id, typ, stufe, seed: seed * 7919 + 5 };
  const t = DE.makeTask(spec);
  const k = `${w.id}/${typ}/${stufe}/${seed}`;
  ok(t && t.wort === w.id && t.fach === "de" && t.frage, `${k}: keine Aufgabe`);
  if (!t) continue;
  for (const s of [t.frage, t.tipp, t.erklaerung, t.merk].concat(Object.values(t.tippFuer || {}))) ok(!STRICH.test(s || ""), `${k}: Gedankenstrich`);
  ok(JSON.stringify(DE.makeTask(spec)) === JSON.stringify(t), `${k}: nicht reproduzierbar`);
  ok(!L.istProfi(t), `${k}: zählt als Profi-Aufgabe beim Rechnen`);
  // Aufgabenart passt zum Wort
  const erwartet = typ === "hoeren-lang" && !w.eindeutig ? (w.bild ? "bild-wort" : "luecke") : typ === "bild-wort" && !w.bild ? "luecke" : typ === "reim" && !w.reim ? "luecke" : typ === "silbe" && w.kasten == null ? "luecke" : typ;
  ok(t.typ === erwartet, `${k}: Art ${t.typ} statt ${erwartet}`);
  if (t.art === "buchstaben") {
    ok(t.einheiten.join("") === w.wort && t.ziel === w.wort, `${k}: Bausteine ${t.einheiten}`);
    ok(stufe === 0 ? t.einheiten.filter((x) => x === "ie").length === 1 : !t.einheiten.includes("ie"), `${k}: ie-Baustein auf Stufe ${stufe}`);
    const rest = t.kacheln.slice();
    for (const c of t.einheiten) { const i = rest.indexOf(c); ok(i >= 0, `${k}: Baustein ${c} fehlt`); if (i >= 0) rest.splice(i, 1); }
    ok(rest.length === (stufe >= 2 ? 2 : 0), `${k}: ${rest.length} Extra-Buchstaben`);
    for (const c of rest) ok(!t.einheiten.includes(c), `${k}: Extra-Buchstabe ${c} steckt im Wort`);
    ok(t.prompt.diktat === (stufe >= 2) && (stufe < 2 || !t.prompt.bild) && t.prompt.vorne === (w.vor || ""), `${k}: Diktat und Bild`);
    ok(stufe < 2 || t.sprich.includes(w.satz), `${k}: Diktat liest den Satz vor`);
    const gelegt = [];
    for (const c of t.einheiten) { ok(DE.naechsterOk(t, gelegt, c), `${k}: ${c} abgelehnt`); gelegt.push(c); }
    // Wer beim langen i das e zuerst nimmt, bekommt den passenden Tipp
    if (stufe >= 1) { const i = w.wort.indexOf("ie"); ok(!DE.naechsterOk(t, t.einheiten.slice(0, i), "e") && DE.kachelTipp(t, t.einheiten.slice(0, i), "e").includes("Erst kommt das i"), `${k}: Tipp i vor e`); }
    continue;
  }
  ok(t.art === "wahl" && t.optionen.includes(t.loesung), `${k}: Lösung nicht in den Optionen`);
  ok(new Set(t.optionen).size === t.optionen.length, `${k}: doppelte Optionen ${t.optionen}`);
  ok(t.optionen.filter((o) => DE.checkWahl(t, o).ok).length === 1, `${k}: nicht eindeutig`);
  switch (t.typ) {
    case "bild-wort":
      ok(t.loesung === DE.zeige(w) && t.prompt.bild === w.bild && t.optionen.length === 3, `${k}: Bild und Wort`);
      for (const o of t.optionen) ok(DE.WOERTER.some((x) => x.bild && DE.zeige(x) === o), `${k}: Option ${o}`);
      break;
    case "luecke":
      ok(t.loesung === "ie" && t.prompt.a + "ie" + t.prompt.b === w.wort && sortiert(t.optionen) === sortiert(["i", "ie", "ei"]), `${k}: Lücke ${t.prompt.a}_${t.prompt.b}`);
      ok(t.prompt.bild ? t.prompt.bild === w.bild : t.prompt.satz && t.prompt.satz.join(w.wort) === w.satz, `${k}: Bild oder Satz`);
      ok(t.tippFuer && t.tippFuer.i && t.tippFuer.ei, `${k}: Tipps für i und ei`);
      break;
    case "hoeren-lang": {
      ok(t.loesung === w.id && t.optionen.length === 3, `${k}: Hören`);
      const gegen = t.optionen.filter((o) => o !== w.id);
      ok(gegen.every((o) => DE.kontrastById(o)) && new Set(t.optionen.map((o) => t.bilder[o])).size === 3, `${k}: Gegenspieler ${gegen}`);
      ok(t.optionen.every((o) => t.namen[o]) && t.sprich.split(". ").length === 3, `${k}: Namen und Vorlesen`);
      break;
    }
    case "reim": {
      const p = DE.wortById(w.reim);
      ok(t.loesung === DE.zeige(p) && t.optionen.length === 3, `${k}: Reim ${t.loesung}`);
      for (const o of t.optionen) {
        const x = DE.WOERTER.find((z) => DE.zeige(z) === o);
        ok(x && x.themen.includes("reime") && x.id !== w.id, `${k}: Option ${o}`);
        if (x && x.id !== p.id) ok(endeErst(x) !== endeErst(w), `${k}: ${o} klingt fast wie ${w.wort}`);
      }
      break;
    }
    case "silbe":
      ok(t.prompt.erste + t.loesung === w.wort && t.optionen.length === 2, `${k}: Silben`);
      for (const o of t.optionen) if (o !== t.loesung) ok(!alleWoerter.includes(t.prompt.erste + o), `${k}: ${t.prompt.erste}${o} ist auch ein Wort`);
      break;
    case "gross": {
      const c = w.wort.charAt(0);
      ok(t.loesung === c && JSON.stringify(t.optionen) === JSON.stringify([c.toUpperCase(), c.toLowerCase()]) && t.prompt.rest === w.wort.slice(1), `${k}: Groß oder klein`);
      ok(t.tippFuer && Object.keys(t.tippFuer).length === 1 && !t.tippFuer[c], `${k}: Tipp für die falsche Wahl`);
      break;
    }
  }
}
// Gegenspieler sind immer Lückenaufgaben mit i oder ei
for (const g of DE.KONTRAST) for (const typ of DE.ARTEN) for (let seed = 0; seed < 5; seed++) {
  const t = DE.makeTask({ fach: "de", wort: g.id, typ, stufe: 1, seed });
  ok(t.typ === "luecke" && t.loesung === g.laut && t.prompt.a + g.laut + t.prompt.b === g.wort && t.prompt.bild === g.bild && t.kontrast, `Gegenspieler ${g.wort}/${typ}`);
  ok(t.optionen.filter((o) => DE.checkWahl(t, o).ok).length === 1 && t.tippFuer.ie && !t.tippFuer[g.laut], `Gegenspieler ${g.wort}: Tipps`);
}
// Das lange i ist in den Hör-Aufgaben nie ein Gegenspieler und jedes eindeutige Bild kommt vor
ok(DE.WOERTER.filter((w) => w.eindeutig).length >= 8, "Genug eindeutige Bilder für «Wo hörst du ein langes i?»");

// 3) Etappen, Fortschritt, Wiese, Spielstand
{
  const s = L.defaults();
  ok(s.de && Array.isArray(s.de.wiese) && s.de.regel === false, "Spielstand hat Deutsch-Teil");
  ok(DE.bereitschaft(s) === 0, "Start: nichts sitzt");
  for (const th of DE.THEMEN) for (let seed = 1; seed < 40; seed++) {
    const sp = DE.buildEtappe(s, { thema: th.id, n: 8, seed });
    const gegen = sp.filter((x) => DE.kontrastById(x.wort)), echt = sp.filter((x) => DE.wortById(x.wort));
    ok(sp.length === 8 && gegen.length === 2 && echt.length === 6, `Etappe ${th.id}: ${sp.length} Aufgaben, ${gegen.length} Gegenspieler`);
    ok(sortiert(gegen.map((x) => DE.kontrastById(x.wort).laut)) === sortiert(["ei", "i"]), `Etappe ${th.id}: ein kurzes i und ein ei`);
    ok(!DE.kontrastById(sp[0].wort), `Etappe ${th.id}: beginnt mit einem Gegenspieler`);
    ok(new Set(echt.map((x) => x.wort)).size === 6 && echt.every((x) => DE.wortById(x.wort).themen.includes(th.id) && DE.ARTEN.includes(x.typ)), `Etappe ${th.id}: Wörter ${echt.map((x) => x.wort)}`);
    ok(echt.every((x) => x.typ !== "buchstaben"), `Etappe ${th.id}: am Anfang noch kein Buchstabenlegen`);
  }
  const diktat = DE.buildEtappe(s, { typ: "buchstaben", n: 6, seed: 3 });
  ok(diktat.length === 6 && diktat.every((x) => x.typ === "buchstaben" && DE.wortById(x.wort) && x.stufe === 0), "Diktat: 6 Wörter zum Legen, Stufe 0 am Anfang");
  // richtig auf Anhieb: Box steigt, Wort blüht auf der Wiese
  const r1 = DE.record(s, "biene", true, "2026-11-21", "luecke");
  ok(r1.neuWiese === "biene" && !r1.neuGlitzer && s.de.w.biene.box === 1, "Biene blüht");
  ok(DE.record(s, "biene", true, "2026-11-21", "luecke").neuWiese === null, "Biene blüht nur einmal neu");
  const r2 = DE.record(s, "biene", true, "2026-11-21", "buchstaben");
  ok(r2.neuGlitzer === "biene" && s.de.glitzer.includes("biene"), "Selbst geschrieben: Biene glitzert");
  DE.record(s, "biene", false, "2026-11-21", "buchstaben");
  ok(s.de.w.biene.box === 2, "Fehler senkt die Box");
  ok(DE.record(s, "zwiebel", false, "2026-11-21", "luecke").neuWiese === null && !s.de.wiese.includes("zwiebel"), "Mit Fehler blüht noch nichts");
  ok(DE.record(s, "k-fisch", true, "2026-11-21", "luecke").p === null && !s.de.w["k-fisch"] && !s.de.wiese.includes("k-fisch"), "Gegenspieler zählen nicht");
  // schwache Wörter zuerst, und die erste Aufgabe ist die leichteste
  for (const w of DE.imThema("bilder")) if (w.id !== "stiel") for (let i = 0; i < 3; i++) DE.record(s, w.id, true, "2026-11-21", "luecke");
  ok(DE.buildEtappe(s, { thema: "bilder", n: 1, seed: 1 })[0].wort === "stiel", "Das schwächste Wort kommt zuerst");
  ok(DE.buildEtappe(s, { thema: "bilder", n: 8, seed: 9 })[0].wort === "stiel", "Das schwächste Wort steht vorne");
  ok(DE.bereitschaft(s, "bilder") === Math.round((100 * 11) / 12), `Bereitschaft Bilder: ${DE.bereitschaft(s, "bilder")}`);
  // Arten nach Box: erst erkennen, später selbst schreiben
  const r = L.R(5); const t0 = new Set(), t3 = new Set();
  for (let i = 0; i < 300; i++) for (const th of ["bilder", "reime", "silben"]) { t0.add(DE.typFuer(DE.wortById("ziel"), 0, r, th)); t3.add(DE.typFuer(DE.wortById("ziel"), 3, r, th)); }
  ok(!t0.has("buchstaben") && t3.has("buchstaben"), "Buchstaben erst, wenn das Wort sitzt");
  // Spielstand übersteht Speichern und Laden, kaputte Teile werden repariert
  s.de.liese = { ab: "2026-11-21", herzen: 2 }; s.de.runden = 3; s.de.regel = true;
  const zurueck = L.migrate(JSON.parse(JSON.stringify(s)));
  ok(JSON.stringify(zurueck.de) === JSON.stringify(s.de), "Deutsch-Stand übersteht Speichern und Laden");
  const kaputt = L.migrate({ de: { w: { quatsch: { box: 9 }, biene: { box: 99, n: "x" } }, wiese: ["biene", "k-fisch", 5, "biene"], glitzer: ["biene", "zwiebel"], liese: "ja", regel: "ja" } });
  ok(!kaputt.de.w.quatsch && kaputt.de.w.biene.box === 5 && kaputt.de.w.biene.n === 0 && JSON.stringify(kaputt.de.wiese) === '["biene"]' && JSON.stringify(kaputt.de.glitzer) === '["biene"]' && kaputt.de.liese === null && kaputt.de.regel === false, "Kaputter Deutsch-Stand wird repariert: " + JSON.stringify(kaputt.de));
  ok(JSON.stringify(L.migrate({ name: "Alt" }).de) === JSON.stringify(DE.defaultsDe()), "Alter Stand ohne Deutsch bekommt leeren Deutsch-Teil");
  ok(DE.missionEtappen().length === 3 && DE.missionEtappen().every((e) => e.fach === "de" && e.n === 8), "ie-Training hat 3 Etappen");
}
console.log(`Deutsch: ${geprueft} Prüfungen, ${fehler} Fehler`);
process.exit(fehler ? 1 : 0);
