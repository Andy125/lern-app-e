// Bilder der Französisch-Ansichten zum Anschauen: node tools/bilder-franz.mjs [Breite] [Höhe]
import { server, browser, STAND } from "./hilfe.mjs";
const breite = Number(process.argv[2] || 820), hoehe = Number(process.argv[3] || 1180);
const srv = await server(); const b = await browser();
const p = await (await b.newContext({ viewport: { width: breite, height: hoehe } })).newPage();
const fehler = []; p.on("pageerror", (e) => fehler.push(e.message));
await p.addInitScript((st) => { window.__PS_TEST = { keinSW: true, seed: 3, heute: "2026-11-19" }; if (!sessionStorage.getItem("x")) { localStorage.setItem("puppenstube-v1", JSON.stringify(Object.assign({}, st, { fr: { winter: ["bonnet", "echarpe", "gants", "anorak", "bottes"], traegt: ["bonnet", "echarpe", "gants"] } }))); sessionStorage.setItem("x", "1"); } }, STAND);
await p.goto(srv.url);
const schuss = (n) => p.screenshot({ path: `/tmp/fr-${breite}-${n}.png` });
await schuss("start");
await p.click("[data-act=franz]"); await schuss("camille");
await p.click("[data-act=fr-karten][data-arg=kleidung]"); await schuss("karten-kleidung");
await p.click("[data-act=franz]"); await p.click("[data-act=fr-karten][data-arg=farben]"); await schuss("karten-farben");
await p.click("[data-act=franz]"); await p.click("[data-act=fr-karten][data-arg=zahlen]"); await schuss("karten-zahlen");
const AUFG = [["anorak", "hoeren"], ["chaussettes", "bild-wort"], ["echarpe", "fr-de"], ["pantalon", "de-fr"], ["gants", "artikel"], ["brun", "mischen"], ["z17", "zaehlen"], ["manteau", "buchstaben"], ["z12", "hoeren"], ["vert", "buchstaben"]];
for (const [wort, typ] of AUFG) { await p.evaluate(([wort, typ]) => window.__PS.zeigeFr({ wort, typ, stufe: 0, seed: 7 }), [wort, typ]); await schuss(`a-${wort}-${typ}`); }
// eine Buchstaben-Aufgabe mit einem Fehler lösen
await p.evaluate(() => window.__PS.zeigeFr({ wort: "manteau", typ: "buchstaben", stufe: 2, seed: 9 }));
const t = await p.evaluate(() => window.__PS.aufgabe());
const falsch = t.kacheln.findIndex((c) => c !== "m");
await p.click(`[data-act=kachel][data-arg="${falsch}"]`); await schuss("buchst-fehler");
const benutzt = new Set();
for (const c of Array.from(t.ziel)) { const i = t.kacheln.findIndex((k, j) => k === c && !benutzt.has(j)); benutzt.add(i); await p.click(`[data-act=kachel][data-arg="${i}"]`); }
await schuss("buchst-fertig");
await p.click("[data-act=pause-runde]"); await p.click(".kachel[data-act=stube]"); await p.click("[data-act=stube-reiter][data-arg=winter]"); await schuss("stube-winter");
console.log("Fehler:", fehler.length ? fehler : "keine");
await b.close(); srv.zu();
