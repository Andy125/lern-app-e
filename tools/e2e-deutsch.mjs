// Deutsch wie ein Kind: Liese, Erklärung zum langen i, ie-Training mit 3 Etappen, Wiese, Puppen-Diktat, Freundebuch.
import { server, browser, pruefer, loese, STAND, elternOeffnen } from "./hilfe.mjs";
const P = pruefer();
const srv = await server(); const b = await browser();
const p = await (await b.newContext({ viewport: { width: 820, height: 1180 } })).newPage();
const fehler = []; p.on("pageerror", (e) => fehler.push(e.message)); p.on("console", (m) => { if (m.type() === "error") fehler.push(m.text()); });
await p.addInitScript((st) => { window.__PS_TEST = { keinSW: true, seed: 33, pauseMs: 150, heute: "2026-11-21" }; if (!sessionStorage.getItem("x")) { localStorage.setItem("puppenstube-v1", JSON.stringify(st)); sessionStorage.setItem("x", "1"); } }, STAND);
await p.goto(srv.url);
const S = () => p.evaluate(() => window.__PS.stand());
const ansicht = () => p.evaluate(() => window.__PS.ui().ansicht);
const runde = () => p.evaluate(() => window.__PS.ui().runde);

P.ok((await p.textContent(".deutsch-karte h2")).includes("Deutsch"), "Deutsch-Karte auf der Startseite");
await p.click("[data-act=deutsch]");
P.ok((await ansicht()) === "deutsch" && (await p.textContent(".sprechblase")).includes("Liese"), "Liese begrüßt");
P.ok((await p.$$(".fr-thema")).length === 3 && !!(await p.$(".merk-karte svg.ie-paar")), "Drei Themen und der Merkspruch mit i und e");

// Beim ersten Mal erklärt Liese das lange i, mit der Frage aus dem Buch
await p.click("[data-act=de-training]");
P.ok((await ansicht()) === "de-regel", "Erst kommt die Erklärung");
for (let i = 0; i < 5; i++) await p.click("[data-act=de-regel-weiter]");
P.ok((await p.textContent(".sprechblase")).includes("meistens geschrieben"), "Frage von Seite 79");
await p.click("[data-act=de-regel-antwort][data-arg=i]");
P.ok((await p.textContent(".sprechblase")).includes("Fast") && !(await p.$("[data-act=de-regel-fertig]")), "Falsche Antwort: freundlicher Hinweis, noch nicht weiter");
await p.click("[data-act=de-regel-antwort][data-arg=ie]");
await p.click("[data-act=de-regel-fertig]");
P.ok((await S()).de.regel === true && (await ansicht()) === "etappe-start", "Nach der Erklärung startet das Training");
P.ok((await p.textContent(".sprechblase")).includes("genau hin"), "Liese startet die Etappe");

// ie-Training: drei Etappen, einmal mit Fehler
const m0 = (await S()).muenzen;
await p.click("[data-act=etappe-los]");
let aufgaben = 0, mitFehler = false, gegen = 0, geschenke = 0, pausen = 0;
const titel = [], arten = new Set();
for (let i = 0; i < 120; i++) {
  const a = await ansicht();
  if (a === "runde") {
    if ((await runde()).fertig) { await p.click("[data-act=weiter]"); continue; }
    const t0 = await p.evaluate(() => window.__PS.aufgabe());
    const falsch = !mitFehler && t0.typ === "luecke" && !t0.kontrast;
    const t = await loese(p, falsch);
    arten.add(t.typ); if (t.kontrast) gegen++;
    if (falsch) {
      mitFehler = true;
      const R = await runde();
      P.ok(R.fehler === 1 && R.fertig, "Fehler wird gezählt, dann geschafft");
    }
    const R = await runde();
    if (!t.kontrast && R.fehler === 0) P.ok((await S()).de.wiese.includes(t.wort), `Auf Anhieb richtig: ${t.wort} blüht`);
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
P.ok((await ansicht()) === "deutsch-ende", "Training endet bei Liese: " + (await ansicht()));
P.ok(aufgaben >= 24 && geschenke === 2 && pausen === 2, `${aufgaben} Aufgaben, ${geschenke} Geschenke, ${pausen} Pausen`);
P.ok(gegen === 6, `Gegenspieler mit kurzem i oder ei: ${gegen}`);
P.ok(arten.has("luecke") && (arten.has("reim") || arten.has("silbe") || arten.has("bild-wort")), "Verschiedene Aufgabenarten: " + [...arten].join(", "));
P.ok(titel.join("|").includes("Reimpaare") && titel.join("|").includes("Silben"), "Etappen Reime und Silben: " + titel.join(" | "));
let s = await S();
P.ok(s.de.runden === 1 && s.de.liese && s.de.liese.herzen === 1, "Liese im Freundebuch");
P.ok(s.de.wiese.length >= 12, "Wörter blühen auf der Wiese: " + s.de.wiese.length);
P.ok(s.muenzen > m0 + 25, `Edelsteine gesammelt: ${s.muenzen - m0}`);
P.ok(Object.keys(s.de.w).length >= 14 && Object.keys(s.de.w).every((id) => !id.startsWith("k-")), "Fortschritt je Wort, ohne Gegenspieler: " + Object.keys(s.de.w).length);
P.ok((await p.$$(".wiese-neu > span")).length === s.de.wiese.length, "Ende zeigt die neuen Wörter auf der Wiese");

// Die Wiese
await p.click("[data-act=stube-wiese]");
P.ok((await ansicht()) === "stube" && (await p.$$(".wiese-ding.blueht")).length === s.de.wiese.length && (await p.$$(".wiese-ding")).length === 54, "Wiese zeigt alle 54 Plätze, die gelernten blühen");
await p.click(`[data-act=wiese-ding][data-arg=${s.de.wiese[0]}]`);
const wort0 = await p.evaluate((id) => window.PS_DE.zeige(window.PS_DE.wortById(id)), s.de.wiese[0]);
P.ok((await p.textContent(".wiese-blase")).includes(wort0), "Antippen zeigt das Wort: " + wort0);
const zu = await p.evaluate(() => window.PS_DE.WOERTER.find((w) => !window.__PS.stand().de.wiese.includes(w.id)));
if (zu) { await p.click(`[data-act=wiese-ding][data-arg=${zu.id}]`); P.ok((await p.textContent(".wiese-blase")).includes("Übe bei Liese"), "Noch nicht gelernt: Hinweis auf Liese"); }

// Puppen-Diktat: erst ein Fehler mit e vor i (Stufe 1), dann das Diktat
await p.evaluate(() => window.__PS.zeigeDe({ wort: "spiegel", typ: "buchstaben", stufe: 1, seed: 4 }));
const ts = await p.evaluate(() => window.__PS.aufgabe());
for (const c of ["S", "p"]) await p.click(`[data-act=kachel][data-arg="${ts.kacheln.indexOf(c)}"]`);
await p.click(`[data-act=kachel][data-arg="${ts.kacheln.indexOf("e")}"]`);
P.ok((await p.textContent(".rueck")).includes("Erst kommt das i"), "Tipp: erst das i, dann das e");
await p.click("[data-act=pause-runde]");
await p.click("[data-act=deutsch]"); await p.click("[data-act=de-diktat]");
P.ok((await ansicht()) === "etappe-start" && (await p.textContent(".sprechblase")).includes("diktiert"), "Diktat startet ohne Erklärung, die Puppe diktiert");
await p.click("[data-act=etappe-los]");
const specs = (await runde()).specs;
P.ok(specs.length === 6 && specs.every((x) => x.typ === "buchstaben"), "Diktat: 6 Wörter zum Legen");
P.ok(!!(await p.$(".buchst.ie-kachel")), "Auf Stufe 0 gibt es die ie-Kachel");
for (let i = 0; i < 30 && (await ansicht()) === "runde"; i++) { if ((await runde()).fertig) { await p.click("[data-act=weiter]"); continue; } await loese(p, false); }
s = await S();
P.ok((await ansicht()) === "deutsch-ende" && s.de.glitzer.length >= 6 && s.de.liese.herzen === 2, `Diktat geschafft: ${s.de.glitzer.length} Wörter glitzern`);
P.ok((await p.textContent("main")).includes("Selbst geschrieben"), "Ende zeigt die selbst geschriebenen Wörter");

// Wortkarten
await p.click("[data-act=deutsch]");
for (const [th, n] of [["bilder", 12], ["reime", 18], ["silben", 14]]) {
  await p.click(`[data-act=de-karten][data-arg=${th}]`);
  P.ok((await p.$$(".wortkarte")).length === n, `${n} Wortkarten ${th}`);
  await p.click(".wortkarte >> nth=1");
  P.ok(!!(await p.$(".wortkarte.spielt")), `Angetippte Karte leuchtet (${th})`);
  await p.click("[data-act=deutsch]");
}
await p.click("[data-act=de-karten][data-arg=reime]"); await p.click("[data-act=de-alle]"); await p.waitForTimeout(300);
P.ok(!!(await p.$(".wortkarte.spielt")), "Alle anhören läuft");
await p.click("[data-act=deutsch]");
// Einzelnes Thema üben: 6 Wörter und 2 Gegenspieler
await p.click("[data-act=de-ueben][data-arg=silben]"); await p.click("[data-act=etappe-los]");
const sp2 = (await runde()).specs;
P.ok(sp2.length === 8 && sp2.filter((x) => x.wort.startsWith("k-")).length === 2 && sp2.filter((x) => !x.wort.startsWith("k-")).every((x) => x.thema === "silben"), "Silben üben: 8 Aufgaben mit 2 Gegenspielern");
await p.click("[data-act=pause-runde]");

// Freundebuch, Neuladen, Eltern
await p.click("[data-act=freundebuch]");
P.ok(!!(await p.$("[data-act=freund][data-arg=liese]")), "Liese im Freundebuch");
await p.click("[data-act=freund][data-arg=liese]");
P.ok((await p.textContent(".freund-blatt")).includes("Bienen"), "Lieses Seite");
await p.waitForTimeout(400);
await p.reload();
s = await S();
P.ok(s.de.runden === 2 && s.de.glitzer.length >= 6 && s.de.regel === true, "Nach dem Neuladen ist Deutsch noch da");
P.ok((await p.textContent(".deutsch-karte")).includes("blühen auf deiner Wiese"), "Startseite zeigt die Wiese");
await elternOeffnen(p);
P.ok((await p.textContent(".eltern")).includes("Deutsch: Wörter mit ie"), "Eltern-Übersicht zeigt Deutsch");

P.ok(fehler.length === 0, "Fehler im Browser: " + fehler.join(" | "));
await b.close(); srv.zu();
P.ende("Deutsch wie ein Kind");
