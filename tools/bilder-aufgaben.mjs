// Bilder aller Aufgabenarten zum Anschauen: node tools/bilder-aufgaben.mjs [Breite] [Höhe] [lernteil,lernteil]
import { chromium } from "playwright";
import { server } from "./hilfe.mjs";
const srv = await server();
const b = await chromium.launch({ ...(process.env.CHROME ? { executablePath: process.env.CHROME } : {}) });
const breite = Number(process.argv[2] || 820), hoehe = Number(process.argv[3] || 1180);
const ctx = await b.newContext({ viewport: { width: breite, height: hoehe } });
const p = await ctx.newPage();
const fehler = [];
p.on("pageerror", (e) => fehler.push(e.message));
await p.addInitScript(() => { window.__PS_TEST = { keinSW: true, seed: 3 }; localStorage.setItem("puppenstube-v1", JSON.stringify({ name: "Lina", puppe: { name: "Rosa", haut: 1, haar: "blond", frisur: "pferdeschwanz", kleid: "kleid", farbe: "lila" }, erstellt: 1, muenzen: 40 })); });
await p.goto(srv.url);
const liste = process.argv[4] ? process.argv[4].split(",") : await p.evaluate(() => window.PS.ALLE_SKILLS);
for (const sk of liste) for (const st of [0, 1, 2]) {
  await p.evaluate(([sk, st]) => window.__PS.zeige(sk, st, 4242 + st), [sk, st]);
  await p.screenshot({ path: `/tmp/typ-${breite}-${sk}-${st}.png` });
}
console.log("Fehler:", fehler.length ? fehler : "keine");
await b.close(); srv.zu();
