// iPad hochkant und quer, kleines iPad und Handy: nichts ragt seitlich heraus, Felder und Tastatur sind ganz sichtbar.
import { server, browser, pruefer, STAND } from "./hilfe.mjs";
const P = pruefer();
const srv = await server(); const b = await browser();
const GERAETE = [["ipad-hoch", 820, 1180], ["ipad-quer", 1180, 820], ["ipad-klein", 768, 1024], ["handy", 390, 844]];
const AUFGABEN = [["schritte-ue", 1], ["kurz", 0], ["nachbar", 1], ["raupe", 0], ["vergleich", 0], ["stellen", 0], ["e-ueber", 2]];
const schuss = process.argv.includes("--bilder");
for (const [name, w, h] of GERAETE) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true });
  const p = await ctx.newPage();
  const fehler = []; p.on("pageerror", (e) => fehler.push(e.message));
  await p.addInitScript((st) => { window.__PS_TEST = { keinSW: true, seed: 2, heute: "2026-11-13" }; if (!sessionStorage.getItem("x")) { localStorage.setItem("puppenstube-v1", JSON.stringify(Object.assign({}, st, { besitz: ["bett", "teppich", "bild", "pflanze", "teetisch", "kuscheltier"], punkte: 1200 }))); sessionStorage.setItem("x", "1"); } }, STAND);
  await p.goto(srv.url);
  const breit = async (wo) => {
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    P.ok(r.sw <= r.cw + 1, `${name} ${wo}: ragt seitlich heraus (${r.sw} > ${r.cw})`);
    if (schuss) await p.screenshot({ path: `/tmp/ps/g-${name}-${wo}.png` });
  };
  await breit("start");
  for (const [sk, st] of AUFGABEN) {
    await p.evaluate(([sk, st]) => window.__PS.zeige(sk, st, 99), [sk, st]);
    await breit(`aufgabe-${sk}`);
    for (const el of await p.$$(".feld, .option, .taste")) {
      const bb = await el.boundingBox();
      P.ok(bb && bb.x >= 0 && bb.x + bb.width <= w + 1 && bb.width >= 44 && bb.height >= 44, `${name} ${sk}: Tippfläche zu klein oder abgeschnitten ${JSON.stringify(bb)}`);
    }
  }
  for (const [act, wo] of [["stube", "stube"], ["freundebuch", "freundebuch"], ["lernpfad", "lernpfad"], ["ha", "hausaufgaben"]]) {
    await p.evaluate(() => { const u = window.__PS.ui(); u.ansicht = "start"; u.runde = null; });
    await p.click("#version"); await p.click("[data-act=dialog-zu]");
    await p.click(`.kachel[data-act=${act}]`);
    await breit(wo);
  }
  P.ok(fehler.length === 0, `${name}: Fehler im Browser ${fehler.join(" | ")}`);
  await ctx.close();
}
await b.close(); srv.zu();
P.ende("Geräte");
