// Französisch wie ein Kind: Camille, Wortkarten, Vokabel-Training mit 3 Etappen, Winterkleider anziehen, Freundebuch.
import { server, browser, pruefer, loese, STAND } from "./hilfe.mjs";
const P = pruefer();
const srv = await server(); const b = await browser();
const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
const fehler = []; p.on("pageerror", (e) => fehler.push(e.message)); p.on("console", (m) => { if (m.type() === "error") fehler.push(m.text()); });
await p.addInitScript((st) => { window.__PS_TEST = { keinSW: true, seed: 21, pauseMs: 150, heute: "2026-11-19" }; if (!sessionStorage.getItem("x")) { localStorage.setItem("puppenstube-v1", JSON.stringify(st)); sessionStorage.setItem("x", "1"); } }, STAND);
await p.goto(srv.url);
const S = () => p.evaluate(() => window.__PS.stand());
const ansicht = () => p.evaluate(() => window.__PS.ui().ansicht);

P.ok((await p.textContent(".franz-karte h2")).includes("Französisch"), "Französisch-Karte auf der Startseite");
await p.click("[data-act=franz]");
P.ok((await ansicht()) === "franz" && (await p.textContent(".sprechblase")).includes("Camille"), "Camille begrüßt");
P.ok((await p.$$(".fr-thema")).length === 3, "Drei Themen bei Camille");
await p.click("[data-act=fr-karten][data-arg=kleidung]");
P.ok((await p.$$(".wortkarte")).length === 9, "9 Wortkarten Winterkleider");
await p.click(".wortkarte[data-arg=bonnet]");
P.ok((await p.$eval(".wortkarte[data-arg=bonnet]", (x) => x.classList.contains("spielt"))), "Angetippte Karte leuchtet");
await p.click("[data-act=fr-alle]");
await p.waitForTimeout(300);
P.ok(!!(await p.$(".wortkarte.spielt")), "Alle anhören läuft");
await p.click("[data-act=franz]");
await p.click("[data-act=fr-karten][data-arg=farben]");
P.ok((await p.$$(".wortkarte")).length === 10 && (await p.$$(".misch-liste .mischen")).length === 5, "10 Farben und 5 Mischungen");
await p.click("[data-act=franz]");
await p.click("[data-act=fr-karten][data-arg=zahlen]");
P.ok((await p.$$(".wortkarte")).length === 20, "20 Zahlen");
await p.click("[data-act=franz]");

// Vokabel-Training: drei Etappen, einmal mit Fehler
const m0 = (await S()).muenzen;
await p.click("[data-act=fr-training]");
P.ok((await p.textContent(".sprechblase")).includes("on y va"), "Camille startet die Etappe");
await p.click("[data-act=etappe-los]");
let aufgaben = 0, mitFehler = false, buchstaben = 0, geschenke = 0, pausen = 0;
const titel = [];
for (let i = 0; i < 80; i++) {
  const a = await ansicht();
  if (a === "runde") {
    if (await p.evaluate(() => window.__PS.ui().runde.fertig)) { await p.click("[data-act=weiter]"); continue; }
    const falsch = !mitFehler && aufgaben === 1;
    const t = await loese(p, falsch);
    if (t.art === "buchstaben") buchstaben++;
    if (falsch) { mitFehler = true; P.ok((await p.evaluate(() => window.__PS.ui().runde.fehler)) === 1, "Fehler wird gezählt"); }
    aufgaben++; continue;
  }
  if (a === "etappe-start") { titel.push(await p.textContent(".untertitel")); await p.click("[data-act=etappe-los]"); continue; }
  if (a === "etappe-ende") {
    await p.click("[data-act=geschenk]"); geschenke++;
    if (await p.$("[data-act=bewegung]")) { await p.click("[data-act=bewegung]"); pausen++; await p.waitForTimeout(400); await p.click("#pause-weiter"); }
    continue;
  }
  break;
}
P.ok((await ansicht()) === "franz-ende", "Training endet bei Camille: " + (await ansicht()));
P.ok(aufgaben >= 18 && geschenke === 2 && pausen === 2, `${aufgaben} Aufgaben, ${geschenke} Geschenke, ${pausen} Pausen`);
P.ok(titel.join("|").includes("couleurs") && titel.join("|").includes("nombres"), "Etappen Farben und Zahlen: " + titel.join(" | "));
let s = await S();
P.ok(s.fr.runden === 1 && s.fr.camille && s.fr.camille.herzen === 1, "Camille im Freundebuch");
P.ok(s.fr.winter.length >= 1, "Mindestens ein Kleidungsstück frei: " + s.fr.winter.join(","));
P.ok(s.muenzen > m0 + 20, `Edelsteine gesammelt: ${s.muenzen - m0}`);
P.ok(Object.keys(s.fr.w).length >= 15, "Fortschritt je Wort gespeichert: " + Object.keys(s.fr.w).length);
P.ok((await p.$$(".winter-neu span")).length === s.fr.winter.length, "Ende zeigt die neuen Winterkleider");

// Winterkleider anziehen
await p.click("[data-act=stube-winter]");
const frei = s.fr.winter[0];
await p.click(`[data-act=winter][data-arg=${frei}]`);
P.ok((await S()).fr.traegt.includes(frei), "Puppe zieht " + frei + " an");
const zu = ["bonnet", "echarpe", "gants", "bottes", "chaussettes", "pull", "pantalon", "manteau", "anorak"].find((x) => !s.fr.winter.includes(x));
if (zu) { await p.click(`[data-act=winter][data-arg=${zu}]`); P.ok(!(await S()).fr.traegt.includes(zu) && (await p.textContent(".sprechblase")).includes("Camille"), "Gesperrtes Kleidungsstück: Hinweis auf Camille"); }
await p.evaluate(() => { const st = window.__PS.stand(); st.fr.winter.push("anorak", "manteau"); });
await p.click("[data-act=winter][data-arg=anorak]"); await p.click("[data-act=winter][data-arg=manteau]");
s = await S();
P.ok(s.fr.traegt.includes("manteau") && !s.fr.traegt.includes("anorak"), "Mantel und Anorak nicht gleichzeitig");
await p.click("[data-act=winter][data-arg=manteau]");
P.ok(!(await S()).fr.traegt.includes("manteau"), "Wieder ausziehen");

// Freundebuch zeigt Camille
await p.click("[data-act=heim]"); await p.click("[data-act=freundebuch]");
P.ok(!!(await p.$("[data-act=freund][data-arg=camille]")), "Camille im Freundebuch");
await p.click("[data-act=freund][data-arg=camille]");
P.ok((await p.textContent(".freund-blatt")).includes("Croissants"), "Camilles Seite");

// Eltern sehen den Französisch-Fortschritt, Neuladen behält alles
await p.waitForTimeout(400);
await p.reload();
s = await S();
P.ok(s.fr.runden === 1 && s.fr.winter.length >= 1, "Nach dem Neuladen ist Französisch noch da");
const k = await p.$("#eltern-knopf"); await k.scrollIntoViewIfNeeded(); const bb = await k.boundingBox();
await p.mouse.move(bb.x + 10, bb.y + 10); await p.mouse.down(); await p.waitForTimeout(1700); await p.mouse.up();
P.ok((await p.textContent(".eltern")).includes("Französisch"), "Eltern-Übersicht zeigt Französisch");
// Einzelnes Thema üben: 8 Aufgaben
await p.click("[data-act=heim]"); await p.click("[data-act=franz]"); await p.click("[data-act=fr-ueben][data-arg=zahlen]"); await p.click("[data-act=etappe-los]");
const specs = await p.evaluate(() => window.__PS.ui().runde.specs);
P.ok(specs.length === 8 && specs.every((x) => x.fach === "fr" && x.wort.startsWith("z")), "Zahlen üben: 8 Aufgaben mit Zahlen");

P.ok(fehler.length === 0, "Fehler im Browser: " + fehler.join(" | "));
await b.close(); srv.zu();
P.ende("Französisch wie ein Kind");
