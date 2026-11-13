// Ablauf wie ein Kind: Willkommen, Puppe gestalten, Tagesmission mit Erklärungen, Geschenk, Pause, Freundebuch,
// Puppenstube, Lernpfad, Hausaufgaben-Zeit, Eltern-Übersicht und Sicherung.
import { server, browser, pruefer, loese } from "./hilfe.mjs";
const P = pruefer();
const srv = await server(); const b = await browser();
const ctx = await b.newContext({ viewport: { width: 820, height: 1180 }, acceptDownloads: true });
const p = await ctx.newPage();
const fehler = [];
p.on("pageerror", (e) => fehler.push(e.message));
p.on("console", (m) => { if (m.type() === "error") fehler.push(m.text()); });
await p.addInitScript(() => { window.__PS_TEST = { pauseMs: 200, keinSW: true, elternMs: 150, seed: 11, heute: "2026-11-13", download: true, haMin: 0.02 }; });
await p.goto(srv.url);
const S = () => p.evaluate(() => window.__PS.stand());
const ansicht = () => p.evaluate(() => window.__PS.ui().ansicht);

// Willkommen
await p.click("[data-act=w-name]");
P.ok((await ansicht()) === "willkommen", "ohne Namen weiter");
await p.fill("#name", "Lina"); await p.click("[data-act=w-name]");
await p.click("[data-act=g-frisur][data-arg=dutt]"); await p.click("[data-act=g-haar][data-arg=rot]"); await p.click("[data-act=g-haut][data-arg='3']");
await p.click("[data-act=w-puppe-ok]");
await p.fill("#puppenname", "Rosa"); await p.click("[data-act=w-fertig]");
let s = await S();
P.ok(s.name === "Lina" && s.puppe.name === "Rosa" && s.puppe.frisur === "dutt" && s.puppe.haar === "rot" && s.puppe.haut === 3 && s.muenzen === 10, "Willkommen speichert Puppe: " + JSON.stringify(s.puppe));
P.ok((await p.textContent(".besuch h2")).includes("Lotta"), "Lotta kommt zuerst zu Besuch");

// Tagesmission: alles durchspielen, einmal mit Fehler
await p.click("[data-act=mission]");
P.ok((await p.textContent("main")).includes("Lotta backt"), "Etappe 1 zeigt Lottas Bitte");
await p.click("[data-act=etappe-los]");
P.ok((await ansicht()) === "erklaerung", "Neuer Lernteil beginnt mit Erklärung");
let erklaerungen = 0, aufgaben = 0, mitFehler = false, geschenke = 0, pausen = 0;
for (let i = 0; i < 120; i++) {
  const a = await ansicht();
  if (a === "erklaerung") { erklaerungen++; while (await p.$("[data-act=erk-weiter]")) await p.click("[data-act=erk-weiter]"); await p.click("[data-act=erk-fertig]"); continue; }
  if (a === "runde") {
    if (await p.evaluate(() => window.__PS.ui().runde.fertig)) { await p.click("[data-act=weiter]"); continue; }
    const falsch = !mitFehler && aufgaben === 2;
    const t = await loese(p, falsch);
    if (falsch) {
      mitFehler = true;
      const R = await p.evaluate(() => { const r = window.__PS.ui().runde; return { fehler: r.fehler, fertig: r.fertig }; });
      P.ok(R.fehler === 1 && R.fertig, "Fehler wird gezählt, Aufgabe trotzdem geschafft");
      P.ok(!!(await p.$(".rueck.loesung")), "Nach einem Fehler kommt die Erklärung");
      P.ok((await S()).fehler.includes(t.skill), "Fehler landet im Übe-Korb");
    }
    aufgaben++; continue;
  }
  if (a === "etappe-ende") {
    const vor = (await S()).muenzen;
    await p.click("[data-act=geschenk]"); geschenke++;
    const g = await p.evaluate(() => window.__PS.ui().runde.geschenk);
    const nach = await S();
    P.ok(g && (g.typ === "sticker" ? nach.sticker[g.id] >= 1 : nach.muenzen === vor + g.n), "Geschenk wird gutgeschrieben: " + JSON.stringify(g));
    if (await p.$("[data-act=bewegung]")) {
      await p.click("[data-act=bewegung]"); pausen++;
      P.ok(await p.$eval("#pause-weiter", (x) => x.disabled), "Pause erst nach Ablauf beenden");
      await p.waitForTimeout(450);
      P.ok(!(await p.$eval("#pause-weiter", (x) => x.disabled)), "Pause lässt sich beenden");
      await p.click("#pause-weiter");
    }
    continue;
  }
  if (a === "etappe-start") { await p.click("[data-act=etappe-los]"); continue; }
  break;
}
P.ok((await ansicht()) === "mission-ende", "Mission endet mit Dank: " + (await ansicht()));
s = await S();
const T = s.tage["2026-11-13"];
P.ok(T.mission && T.etappen === 3, "Tag zählt Mission und 3 Etappen");
P.ok(aufgaben >= 15 && erklaerungen >= 2 && geschenke === 2 && pausen === 2, `Ablauf: ${aufgaben} Aufgaben, ${erklaerungen} Erklärungen, ${geschenke} Geschenke, ${pausen} Pausen`);
P.ok(s.freunde.lotta && s.freunde.lotta.herzen === 1, "Lotta steht im Freundebuch");
P.ok(s.muenzen > 60, "Edelsteine gesammelt: " + s.muenzen);
P.ok(Object.keys(s.gesehen).length >= 2, "Erklärungen als gesehen gemerkt");
P.ok(T.perlen >= 10, "Glitzerkette wächst: " + T.perlen);
await p.click("[data-act=freund]");
P.ok((await p.textContent(".freund-blatt")).includes("Kekse backen"), "Freundebuch-Seite von Lotta");
await p.click("[data-act=heim]");
P.ok((await p.textContent(".besuch h2")).includes("danke"), "Startseite zeigt geschaffte Mission");
P.ok((await p.textContent("[data-act=mission]")).includes("Bonus"), "Danach gibt es eine Bonus-Runde");

// Übe-Korb
// Der Fehler von vorhin ist nach zweimal richtig schon wieder raus. Für den Test einen hineinlegen.
if (!(await S()).fehler.length) { await p.evaluate(() => window.__PS.stand().fehler.push("e-ueber")); await p.click("[data-act=lernpfad]"); await p.click("[data-act=heim]"); }
P.ok(!(await p.$eval("[data-act=kiste]", (x) => x.disabled)), "Übe-Korb ist antippbar");
await p.click("[data-act=kiste]"); await p.click("[data-act=etappe-los]");
P.ok(["runde", "erklaerung"].includes(await ansicht()), "Übe-Korb startet eine Runde");
await p.click((await ansicht()) === "runde" ? "[data-act=pause-runde]" : "[data-act=heim]");

// Puppenstube: Essen, Kleid, Schmuck, Möbel, Frisieren
await p.click(".kachel[data-act=stube]");
let m0 = (await S()).muenzen;
await p.click("[data-act=kaufen][data-arg=keks]");
P.ok((await S()).muenzen === m0 - 3 && (await S()).gegessen === 1, "Keks kaufen");
await p.click("[data-act=stube-reiter][data-arg=moebel]");
await p.click("[data-act=kaufen][data-arg=pflanze]");
P.ok((await S()).besitz.includes("pflanze"), "Pflanze steht im Zimmer");
P.ok(await p.$eval("[data-act=kaufen][data-arg=pflanze]", (x) => x.disabled), "Möbel nur einmal kaufen");
await p.click("[data-act=stube-reiter][data-arg=kleider]");
await p.click("[data-act=kaufen][data-arg=latzhose]");
P.ok((await S()).puppe.kleid === "latzhose", "Latzhose anziehen");
await p.click("[data-act=kaufen][data-arg=kleid]");
P.ok((await S()).puppe.kleid === "kleid", "Zurück ins Kleid, kostenlos");
await p.click("[data-act=stube-reiter][data-arg=frisur]");
await p.click("[data-act=s-frisur][data-arg=locken]");
P.ok((await S()).puppe.frisur === "locken", "Frisieren");
await p.evaluate(() => { window.__PS.stand().muenzen = 2; });
await p.click("[data-act=stube-reiter][data-arg=schmuck]");
await p.click("[data-act=kaufen][data-arg=krone]");
P.ok(!(await S()).besitz.includes("krone") && (await p.textContent(".sprechblase")).includes("fehlen noch"), "Zu teuer: freundlicher Hinweis");
await p.click("[data-act=heim]");

// Lernpfad und So geht's
await p.click("[data-act=lernpfad]");
P.ok((await p.$$(".station.zu")).length >= 4, "Gesperrte Themen auf dem Lernpfad");
await p.click(".station[data-arg=zahlen]");
await p.click("[data-act=erk][data-arg=nachbar]");
P.ok((await p.textContent(".sprechblase")).includes("Nachbarzehner"), "So geht's aus dem Thema");
await p.click("[data-act=heim]");
await p.click("[data-act=sogehts]");
P.ok((await p.$$("[data-act=erk]")).length === 20, "So geht's listet alle 20 Lernteile");
await p.click("[data-act=erk][data-arg=schritte-ue]");
P.ok((await p.$$(".erk-bild svg")).length === 1, "Erklärung mit Rechenstrich");
await p.click("[data-act=heim]");

// Hausaufgaben-Zeit (im Test 0,02 Minuten)
await p.click("[data-act=ha]");
for (const i of [0, 1, 2]) await p.click(`[data-act=ha-haken][data-arg="${i}"]`);
P.ok((await p.$$(".haken.an")).length === 3, "Startklar-Haken");
await p.click("[data-act=ha-los]");
await p.waitForTimeout(1800);
P.ok((await p.evaluate(() => window.__PS.ui().ha.schritt)) === "ende", "Hausaufgaben-Uhr läuft ab");
P.ok((await S()).tage["2026-11-13"].haSek >= 1, "Hausaufgaben-Zeit wird gezählt");
await p.click("[data-act=heim]");

// Eltern-Übersicht über langen Druck
await p.click("#eltern-knopf");
P.ok((await ansicht()) === "start", "Kurzes Tippen öffnet die Eltern-Übersicht nicht");
const k = await p.$("#eltern-knopf"); const bb = await k.boundingBox();
await p.mouse.move(bb.x + 10, bb.y + 10); await p.mouse.down(); await p.waitForTimeout(300); await p.mouse.up();
P.ok((await ansicht()) === "eltern", "Langer Druck öffnet die Eltern-Übersicht");
await p.click("[data-act=eltern-reiter][data-arg=pfad]");
await p.check("input[data-change=offen][value=schritte]");
P.ok((await S()).offen.includes("schritte"), "Eltern schalten ein Thema frei");
await p.check("input[data-change=fokus][value=schritte]");
P.ok((await S()).fokus === "schritte", "Eltern setzen den Schwerpunkt");
await p.click("[data-act=eltern-reiter][data-arg=einst]");
await p.selectOption("#e-etappe", "3");
P.ok((await S()).einst.etappe === 3, "Aufgaben pro Etappe einstellen");
await p.click("[data-act=eltern-reiter][data-arg=sicherung]");
const [dl] = await Promise.all([p.waitForEvent("download"), p.click("[data-act=sicherung]")]);
const pfad = await dl.path();
const inhalt = JSON.parse(await (await import("fs/promises")).readFile(pfad, "utf8"));
P.ok(inhalt.app === "puppenstube" && inhalt.stand.name === "Lina", "Sicherungsdatei enthält den Stand");
await p.click("[data-act=heim]");
P.ok((await p.textContent(".fokus-zeile")).includes("In Schritten rechnen"), "Startseite zeigt neuen Schwerpunkt");
// Bonus-Runde übt den Schwerpunkt mit 3 Aufgaben
await p.click("[data-act=mission]"); await p.click("[data-act=etappe-los]");
const specs = await p.evaluate(() => window.__PS.ui().runde.specs.map((x) => x.skill));
P.ok(specs.length === 3, "Bonus-Runde mit 3 Aufgaben");

P.ok(fehler.length === 0, "Fehler im Browser: " + fehler.join(" | "));
await b.close(); srv.zu();
P.ende("Ablauf wie ein Kind");
