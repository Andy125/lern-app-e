// Nach dem ersten Besuch läuft die App ohne Internet.
import { server, browser, pruefer } from "./hilfe.mjs";
const P = pruefer();
const srv = await server(); const b = await browser();
const ctx = await b.newContext(); const p = await ctx.newPage();
await p.goto(srv.url);
await p.evaluate(async () => { await navigator.serviceWorker.ready; });
await p.waitForTimeout(500);
await ctx.setOffline(true);
await p.reload();
P.ok((await p.textContent("h1")).includes("Wie heißt du"), "Offline: App startet");
P.ok(await p.evaluate(() => !!window.PS && !!window.PS_PUPPE && !!window.PS_ERKLAER), "Offline: alle Skripte geladen");
await b.close(); srv.zu();
P.ende("Offline");
