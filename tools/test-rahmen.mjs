// Startet die App in einem abgeschotteten Rahmen (wie die Vorschau in Claude): ohne Speicher, ohne Service Worker.
import { server, browser, pruefer } from "./hilfe.mjs";
const P = pruefer();
const srv = await server(); const b = await browser();
const p = await (await b.newContext({ viewport: { width: 900, height: 1200 } })).newPage();
const fehler = []; p.on("pageerror", (e) => fehler.push(e.message));
await p.setContent(`<iframe id="f" sandbox="allow-scripts" src="${srv.url}index.html" style="width:860px;height:1150px;border:0"></iframe>`);
await p.waitForTimeout(1500);
const f = p.frame({ url: /index\.html/ });
P.ok(!!f, "Rahmen geladen");
const h1 = f ? await f.textContent("h1").catch(() => "") : "";
P.ok(h1.includes("Wie heißt du"), "App startet auch ohne Speicher und Service Worker: " + h1);
if (f) {
  await f.fill("#name", "Test"); await f.click("[data-act=w-name]"); await f.click("[data-act=w-puppe-ok]"); await f.fill("#puppenname", "Rosa"); await f.click("[data-act=w-fertig]");
  P.ok((await f.textContent(".besuch h2")).includes("zu Besuch"), "Startseite im Rahmen");
  await f.click("[data-act=mission]"); await f.click("[data-act=etappe-los]");
  P.ok(await f.$(".erk-bild"), "Erklärung im Rahmen");
}
P.ok(fehler.length === 0, "Fehler: " + fehler.join(" | "));
await b.close(); srv.zu();
P.ende("Abgeschotteter Rahmen");
