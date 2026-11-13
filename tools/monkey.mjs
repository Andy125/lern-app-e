// Zufälliges Durchklicken: egal was ein Kind antippt, es darf nichts kaputtgehen.
import { server, browser, pruefer, STAND } from "./hilfe.mjs";
const P = pruefer();
const n = Number(process.argv[2] || 300), seed = Number(process.argv[3] || 1);
let x = seed; const zufall = () => ((x = (Math.imul(x, 1103515245) + 12345) >>> 0) / 4294967296);
const srv = await server(); const b = await browser();
const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
const fehler = []; p.on("pageerror", (e) => fehler.push(e.message));
await p.addInitScript((st) => { window.__PS_TEST = { keinSW: true, seed: 3, pauseMs: 50, elternMs: 50, download: true, haMin: 0.01 }; if (!sessionStorage.getItem("x")) { localStorage.setItem("puppenstube-v1", JSON.stringify(Object.assign({}, st, { muenzen: 300 }))); sessionStorage.setItem("x", "1"); } }, STAND);
await p.goto(srv.url);
for (let i = 0; i < n; i++) {
  const ziele = await p.$$("[data-act]:not([disabled]):not([data-act=reset-ja]):not([data-act=sicherung])");
  if (!ziele.length) { await p.waitForTimeout(100); continue; }
  const el = ziele[Math.floor(zufall() * ziele.length)];
  try { await el.click({ timeout: 1000 }); } catch (e) { /* Element verschwunden */ }
  if (i % 50 === 0) { const s = await p.evaluate(() => window.__PS.stand()); P.ok(s.muenzen >= 0 && s.name === "Lina", "Stand kaputt nach Klick " + i); }
}
P.ok(fehler.length === 0, "Fehler im Browser: " + fehler.join(" | "));
await b.close(); srv.zu();
P.ende(`Zufälliges Durchklicken (${n})`);
