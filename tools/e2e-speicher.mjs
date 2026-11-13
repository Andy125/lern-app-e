// Spielstand nie verlieren: Neuladen, kaputter Hauptspeicher, gelöschter Browser-Speicher, Sicherungsdatei.
import { server, browser, pruefer, loese, STAND } from "./hilfe.mjs";
import { writeFile } from "fs/promises";
const P = pruefer();
const srv = await server(); const b = await browser();
const ctx = await b.newContext({ viewport: { width: 820, height: 1180 } });
const p = await ctx.newPage();
const fehler = []; p.on("pageerror", (e) => fehler.push(e.message));
await p.addInitScript((st) => {
  window.__PS_TEST = { keinSW: true, seed: 5, heute: "2026-11-13" };
  if (!sessionStorage.getItem("gesetzt")) { localStorage.setItem("puppenstube-v1", JSON.stringify(st)); sessionStorage.setItem("gesetzt", "1"); }
}, STAND);
await p.goto(srv.url);
// Vor Eingriffen von außen: App friert das Speichern ein, sonst schreibt sie beim Neuladen ihren Stand zurück
const einfrieren = () => p.evaluate(() => { window.__PS_TEST.einfrieren = true; });
const S = () => p.evaluate(() => window.__PS.stand());
P.ok((await S()).name === "Lina", "Stand aus dem Speicher geladen");
// eine Aufgabe lösen, dann neu laden
await p.evaluate(() => window.__PS.zeige("e-ueber", 2, 77));
await loese(p, false);
const m = (await S()).muenzen;
P.ok(m > 40, "Edelsteine verdient");
await p.waitForTimeout(400); // IndexedDB-Spiegel schreibt verzögert
await p.reload();
P.ok((await S()).muenzen === m, "Nach dem Neuladen ist alles da");
// Hauptspeicher kaputt: zweite Kopie springt ein
await einfrieren();
await p.evaluate(() => localStorage.setItem("puppenstube-v1", "{kaputt"));
await p.reload();
P.ok((await S()).muenzen === m, "Kaputter Hauptspeicher: zweite Kopie hilft");
P.ok(await p.evaluate(() => localStorage.getItem("puppenstube-v1-defekt") === "{kaputt"), "Kaputter Stand wird zur Untersuchung aufbewahrt");
// Beide Kopien weg: IndexedDB bringt den Stand zurück
await p.waitForTimeout(400);
await einfrieren();
await p.evaluate(() => { localStorage.removeItem("puppenstube-v1"); localStorage.removeItem("puppenstube-v1-bak"); });
await p.reload();
await p.waitForTimeout(600);
P.ok((await S()).muenzen === m && (await S()).name === "Lina", "Browser-Speicher gelöscht: Stand kommt aus IndexedDB zurück");
P.ok((await p.evaluate(() => window.__PS.ui().ansicht)) === "start", "Und die App zeigt die Startseite");
// Sicherungsdatei laden
const datei = "/tmp/puppenstube-test-sicherung.json";
await writeFile(datei, JSON.stringify({ app: "puppenstube", version: 1, stand: Object.assign({}, STAND, { name: "Mia", muenzen: 123 }) }));
// Eltern-Übersicht über langen Druck, dann Reiter Sicherung
async function zurSicherung() {
  const k = await p.$("#eltern-knopf"); const bb = await k.boundingBox();
  await p.mouse.move(bb.x + 10, bb.y + 10); await p.mouse.down(); await p.waitForTimeout(1700); await p.mouse.up();
  await p.click("[data-act=eltern-reiter][data-arg=sicherung]");
}
await zurSicherung();
await p.setInputFiles("#sicherung-datei", datei);
await p.waitForTimeout(300);
P.ok((await S()).name === "Mia" && (await S()).muenzen === 123, "Sicherungsdatei geladen");
P.ok(await p.evaluate(() => JSON.parse(localStorage.getItem("puppenstube-v1-vor-laden")).name === "Lina"), "Stand vor dem Laden bleibt aufbewahrt");
// Fremde Datei wird abgelehnt
await writeFile(datei, JSON.stringify({ app: "lernnest", stand: {} }));
await zurSicherung();
await p.setInputFiles("#sicherung-datei", datei);
await p.waitForTimeout(300);
P.ok((await S()).name === "Mia", "Fremde Sicherung ändert nichts");
P.ok(fehler.length === 0, "Fehler im Browser: " + fehler.join(" | "));
await b.close(); srv.zu();
P.ende("Spielstand nie verlieren");
