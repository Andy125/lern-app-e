// Bilder der Deutsch-Ansichten zum Anschauen: node tools/bilder-deutsch.mjs [Breite] [Höhe]
import { server, browser, STAND } from "./hilfe.mjs";
const breite = Number(process.argv[2] || 820), hoehe = Number(process.argv[3] || 1180);
const srv = await server(); const b = await browser();
const p = await (await b.newContext({ viewport: { width: breite, height: hoehe } })).newPage();
const fehler = []; p.on("pageerror", (e) => fehler.push(e.message));
const wiese = ["biene", "brief", "fliege", "zwiebel", "ziel", "wiese", "lieder", "riese", "spiegel", "tiere", "kriechen", "piepen", "liess", "frieden", "niemand"];
await p.addInitScript(([st, wiese]) => { window.__PS_TEST = { keinSW: true, seed: 3, heute: "2026-11-21" }; if (!sessionStorage.getItem("x")) { localStorage.setItem("puppenstube-v1", JSON.stringify(Object.assign({}, st, { de: { wiese, glitzer: wiese.slice(0, 5), regel: false } }))); sessionStorage.setItem("x", "1"); } }, [STAND, wiese]);
await p.goto(srv.url);
const schuss = async (n, ganz) => { await p.waitForTimeout(350); return p.screenshot({ path: `/tmp/de-${breite}-${n}.png`, fullPage: !!ganz }); };
await schuss("start", true);
await p.click("[data-act=deutsch]"); await schuss("liese", true);
await p.click("[data-act=de-training]");
for (let i = 0; i < 6; i++) { await schuss(`regel-${i}`); if (i < 5) await p.click("[data-act=de-regel-weiter]"); }
await p.click("[data-act=de-regel-antwort][data-arg=i]"); await schuss("regel-falsch");
await p.click("[data-act=de-regel-antwort][data-arg=ie]"); await schuss("regel-richtig");
await p.waitForTimeout(2700);
await p.evaluate(() => { const u = window.__PS.ui(); u.ansicht = "start"; });
await p.click("#version"); await p.click("[data-act=dialog-zu]");
await p.click("[data-act=deutsch]");
for (const th of ["bilder", "reime", "silben"]) { await p.click(`[data-act=de-karten][data-arg=${th}]`); await schuss("karten-" + th, true); await p.click("[data-act=deutsch]"); }
const AUFG = [["biene", "bild-wort", 0], ["zwiebel", "luecke", 0], ["lieder", "luecke", 1], ["k-seife", "luecke", 0], ["schiene", "hoeren-lang", 1], ["fliege", "reim", 0], ["hiess", "reim", 0], ["frieden", "silbe", 0], ["wiese", "gross", 1], ["biegen", "gross", 1], ["spiel", "buchstaben", 0], ["riesig", "buchstaben", 0], ["spazieren", "buchstaben", 1], ["schliessen", "buchstaben", 2], ["liess", "buchstaben", 2]];
for (const [wort, typ, stufe] of AUFG) { await p.evaluate(([wort, typ, stufe]) => window.__PS.zeigeDe({ wort, typ, stufe, seed: 7 }), [wort, typ, stufe]); await schuss(`a-${wort}-${typ}-${stufe}`); }
// eine Wahl-Aufgabe erst falsch, dann richtig
await p.evaluate(() => window.__PS.zeigeDe({ wort: "zwiebel", typ: "luecke", stufe: 0, seed: 7 }));
let t = await p.evaluate(() => window.__PS.aufgabe());
await p.click(`[data-act=waehle][data-arg="${t.optionen.indexOf("ei")}"]`); await schuss("luecke-tipp");
await p.click(`[data-act=waehle][data-arg="${t.optionen.indexOf("ie")}"]`); await schuss("luecke-fertig");
// Buchstaben legen: erst e statt i, dann richtig
await p.evaluate(() => window.__PS.zeigeDe({ wort: "spiegel", typ: "buchstaben", stufe: 1, seed: 9 }));
t = await p.evaluate(() => window.__PS.aufgabe());
const benutzt = new Set();
for (const [k, c] of t.einheiten.entries()) {
  if (k === 2) { await p.click(`[data-act=kachel][data-arg="${t.kacheln.indexOf("e")}"]`); await schuss("buchst-ei-fehler"); }
  const i = t.kacheln.findIndex((x, j) => x === c && !benutzt.has(j)); benutzt.add(i); await p.click(`[data-act=kachel][data-arg="${i}"]`);
  if (k === 4) await schuss("buchst-ie-paar");
}
await schuss("buchst-fertig");
await p.click("[data-act=pause-runde]"); await p.click(".kachel[data-act=stube]"); await p.click("[data-act=stube-reiter][data-arg=wiese]"); await schuss("wiese", true);
await p.click("[data-act=wiese-ding][data-arg=biene]"); await schuss("wiese-biene");
await p.click("[data-act=wiese-ding][data-arg=dieb]"); await schuss("wiese-keim");
console.log("Fehler:", fehler.length ? fehler : "keine");
await b.close(); srv.zu();
