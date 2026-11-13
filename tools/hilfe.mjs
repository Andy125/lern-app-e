// Gemeinsame Helfer für die Browser-Tests: kleiner Server für public/ und Chrome starten.
import http from "http";
import { readFile } from "fs/promises";
import { extname, join, normalize } from "path";
import { chromium } from "playwright";
const TYPEN = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".webmanifest": "application/manifest+json", ".json": "application/json" };
export async function server() {
  const wurzel = new URL("../public/", import.meta.url).pathname;
  const s = http.createServer(async (req, res) => {
    let pfad = decodeURIComponent(req.url.split("?")[0]);
    if (pfad.endsWith("/")) pfad += "index.html";
    const datei = normalize(join(wurzel, pfad));
    if (!datei.startsWith(wurzel)) { res.writeHead(403); return res.end(); }
    try { const inhalt = await readFile(datei); res.writeHead(200, { "Content-Type": TYPEN[extname(datei)] || "application/octet-stream" }); res.end(inhalt); }
    catch { res.writeHead(404); res.end("nicht gefunden"); }
  });
  await new Promise((r) => s.listen(0, "127.0.0.1", r));
  return { url: `http://127.0.0.1:${s.address().port}/`, zu: () => s.close() };
}
export const browser = () => chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
export const STAND = { name: "Lina", puppe: { name: "Rosa", haut: 1, haar: "blond", frisur: "pferdeschwanz", kleid: "kleid", farbe: "lila" }, erstellt: 1, muenzen: 40 };
export function pruefer() {
  let n = 0, f = 0;
  return { ok: (bed, text) => { n++; if (!bed) { f++; console.log("FEHLER:", text); } }, ende: (name) => { console.log(`${name}: ${n} Prüfungen, ${f} Fehler`); process.exit(f ? 1 : 0); } };
}
// Löst die aktuelle Aufgabe über die Tastatur auf dem Bildschirm (falsch = erstes Feld zuerst falsch)
export async function loese(p, falsch) {
  const t = await p.evaluate(() => window.__PS.aufgabe());
  if (t.art === "wahl") {
    if (falsch) { const i = t.optionen.findIndex((o) => o !== t.loesung); await p.click(`[data-act=waehle][data-arg="${i}"]`); }
    await p.click(`[data-act=waehle][data-arg="${t.optionen.indexOf(t.loesung)}"]`);
    return t;
  }
  for (let k = 0; k < t.felder.length; k++) {
    if ((await p.evaluate((k) => window.__PS.ui().runde.fstat[k], k)) !== "offen") continue;
    await p.click(`.feld[data-arg="${k}"]`);
    if (falsch && k === 0) { for (const d of String(t.felder[k].loesung + 1)) await p.click(`[data-act=taste][data-arg="${d}"]`); await p.click("[data-act=taste][data-arg=ok]"); }
    for (const d of String(t.felder[k].loesung)) await p.click(`[data-act=taste][data-arg="${d}"]`);
    await p.click("[data-act=taste][data-arg=ok]");
  }
  return t;
}
