// Puppenstube: Oberfläche. Logik in logic.js, Zeichnungen in puppe.js, Erklärungen in erklaerungen.js.
(function () {
  "use strict";
  const L = window.PS, P = window.PS_PUPPE, ERK = window.PS_ERKLAER || {}, FR = window.PS_FR, DE = window.PS_DE, VER = window.PS_VERSION || { n: 0, date: "" };
  const TEST = window.__PS_TEST || {}; // Testschalter, nur in den automatischen Tests gesetzt
  const KEY = "puppenstube-v1", BAK = KEY + "-bak", VOR = KEY + "-vor-laden";
  const app = document.getElementById("app");
  const M = L.M;

  // ================= Speicher: nie verlieren =================
  // Hauptschlüssel, zweite Kopie, IndexedDB-Spiegel und eine Sicherungsdatei zum Speichern und Laden.
  const readKey = (k) => {
    try { const t = localStorage.getItem(k); if (!t) return null; const o = JSON.parse(t); return o && typeof o === "object" && !Array.isArray(o) ? o : null; }
    catch (e) { try { localStorage.setItem(k + "-defekt", localStorage.getItem(k)); } catch (e2) { /* egal */ } return null; }
  };
  function idb(fn) {
    try {
      const q = indexedDB.open("puppenstube-save", 1);
      q.onupgradeneeded = () => q.result.createObjectStore("s");
      q.onsuccess = () => { try { fn(q.result); } catch (e) { /* ohne IndexedDB weiter */ } };
      q.onerror = () => fn(null);
    } catch (e) { fn(null); }
  }
  const idbSchreiben = (text) => idb((db) => { if (db) db.transaction("s", "readwrite").objectStore("s").put(text, "stand"); });
  const idbLesen = (cb) => idb((db) => { if (!db) return cb(null); const g = db.transaction("s").objectStore("s").get("stand"); g.onsuccess = () => cb(g.result || null); g.onerror = () => cb(null); });
  let quelle = "haupt";
  function laden() {
    let roh = readKey(KEY);
    if (!roh) { roh = readKey(BAK); quelle = roh ? "kopie" : "neu"; }
    return L.migrate(roh);
  }
  let S = laden();
  let idbTimer = null;
  function speichern() {
    if (TEST.einfrieren) return;
    try {
      const t = JSON.stringify(S);
      localStorage.setItem(KEY, t); localStorage.setItem(BAK, t);
      clearTimeout(idbTimer); idbTimer = setTimeout(() => idbSchreiben(t), 250);
    } catch (e) { /* voll oder privat */ }
    versionAnzeigen();
  }
  if (quelle === "kopie") speichern();
  if (quelle === "neu") idbLesen((t) => {
    if (!t || S.erstellt) return;
    try { const o = JSON.parse(t); if (o && o.erstellt) { S = L.migrate(o); speichern(); ui = startUi(); render(); toast("Dein Spielstand ist wieder da."); } } catch (e) { /* egal */ }
  });
  window.addEventListener("pagehide", () => { if (TEST.einfrieren) return; zeitBuchen(); try { const t = JSON.stringify(S); localStorage.setItem(KEY, t); localStorage.setItem(BAK, t); idbSchreiben(t); } catch (e) { /* egal */ } });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { zeitBuchen(); speichern(); } });

  function sicherungSpeichern() {
    const daten = JSON.stringify({ app: "puppenstube", version: VER.n, gespeichert: new Date().toISOString(), stand: S });
    const name = "puppenstube-sicherung-" + L.heuteISO() + ".json";
    const blob = new Blob([daten], { type: "application/json" });
    const fertig = () => { S.lastBackup = Date.now(); speichern(); toast("Sicherung gespeichert."); if (ui.ansicht === "eltern") render(); };
    try {
      const file = new File([blob], name, { type: "application/json" });
      if (!TEST.download && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: "Puppenstube-Sicherung" }).then(fertig, () => toast("Nicht gespeichert.")); return; }
    } catch (e) { /* dann als Download */ }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    fertig();
  }
  function sicherungLaden(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const o = JSON.parse(r.result);
        const st = o && o.app === "puppenstube" && o.stand && typeof o.stand === "object" ? o.stand : null;
        if (!st) throw new Error("keine Sicherung");
        try { localStorage.setItem(VOR, JSON.stringify(S)); } catch (e) { /* egal */ }
        S = L.migrate(st); speichern(); idbSchreiben(JSON.stringify(S));
        ui = startUi(); render(); toast("Sicherung geladen.");
      } catch (e) { toast("Diese Datei ist keine Puppenstube-Sicherung."); }
    };
    r.readAsText(file);
  }

  // ================= Hilfen =================
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const heute = () => TEST.heute || L.heuteISO();
  let zs = TEST.seed != null ? TEST.seed >>> 0 : 0;
  const zufall = () => (TEST.seed != null ? (zs = (Math.imul(zs, 1103515245) + 12345) >>> 0) : Math.floor(Math.random() * 4294967296) >>> 0);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const puppeName = () => (S.puppe && S.puppe.name) || "deine Puppe";
  const tag = () => { const d = heute(); return S.tage[d] || (S.tage[d] = { sek: 0, aufgaben: 0, richtig: 0, etappen: 0, mission: false, haSek: 0, perlen: 0 }); };
  const tagLesen = () => S.tage[heute()] || { sek: 0, aufgaben: 0, richtig: 0, etappen: 0, mission: false, haSek: 0, perlen: 0 };
  const winter = () => (S.fr ? S.fr.traegt : []);
  const puppe = (mood, extra) => P.puppeSvg(S.puppe, Object.assign({ mood, traegt: S.traegt, winter: winter() }, extra || {}));
  const freund = (id) => (id === "camille" ? FR.CAMILLE : id === "liese" ? DE.LIESE : L.freundById(id) || L.FREUNDE[0]);
  const freundStand = (id) => (id === "camille" ? S.fr && S.fr.camille : id === "liese" ? S.de && S.de.liese : S.freunde[id]);
  const freundKopf = (f, mood) => P.kopfSvg(f.look, { mood: mood || "froh" });
  const skillName = (id) => L.SKILL_NAMEN[id] || id;

  function toast(text) {
    const t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = text;
    document.body.appendChild(t); setTimeout(() => t.classList.add("weg"), 2400); setTimeout(() => t.remove(), 2900);
  }
  let ac = null;
  function ton(stufe, art) {
    if (!S.einst.toene) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = ac.currentTime;
      const noten = art === "glitzer" ? [0, 4, 7, 12] : [0];
      noten.forEach((n, i) => {
        const o = ac.createOscillator(), g = ac.createGain(), t = t0 + i * 0.09;
        o.type = "triangle"; o.frequency.value = 523.25 * Math.pow(2, (Math.min(stufe, 12) + n) / 12);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.15, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.4);
      });
    } catch (e) { /* ohne Ton */ }
  }
  // fertig wird nach dem Sprechen aufgerufen, tempo ist für das Diktat etwas langsamer
  function sprich(text, fertig, tempo) {
    try {
      if (!("speechSynthesis" in window) || !text) { if (fertig) fertig(); return; }
      speechSynthesis.cancel();
      const t = String(text).replace(/−/g, " minus ").replace(/</g, " ist kleiner als ").replace(/>/g, " ist größer als ").replace(/\?/g, "?").replace(/[{}]/g, "").replace(/[🐊💎🔊]/gu, "");
      const u = new SpeechSynthesisUtterance(t); u.lang = "de-DE"; u.rate = tempo || 0.92;
      const v = speechSynthesis.getVoices().find((x) => /^de/i.test(x.lang)); if (v) u.voice = v;
      if (fertig) { u.onend = fertig; u.onerror = fertig; }
      speechSynthesis.speak(u);
    } catch (e) { if (fertig) fertig(); }
  }
  // Französisch: Stimme fr-FR, etwas langsamer. fertig wird nach dem Sprechen aufgerufen.
  function sprichFr(text, fertig) {
    try {
      if (!("speechSynthesis" in window) || !text) { if (fertig) fertig(); return; }
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text)); u.lang = "fr-FR"; u.rate = 0.8;
      const vs = speechSynthesis.getVoices();
      const v = vs.find((x) => /^fr[-_]FR/i.test(x.lang)) || vs.find((x) => /^fr/i.test(x.lang)); if (v) u.voice = v;
      if (fertig) { u.onend = fertig; u.onerror = fertig; }
      speechSynthesis.speak(u);
    } catch (e) { if (fertig) fertig(); }
  }
  let alleTimer = null;
  // liste: [{ id, text }], ansicht: wo die Karten stehen, fr: französische Stimme
  function alleAnhoeren(liste, i, ansicht, fr) {
    clearTimeout(alleTimer);
    if (ui.ansicht !== ansicht || i >= liste.length) { if (ui.ansicht === ansicht) { ui.spielt = null; render(); } return; }
    ui.spielt = liste[i].id; render();
    let weiter = false;
    const naechste = () => { if (weiter) return; weiter = true; alleTimer = setTimeout(() => alleAnhoeren(liste, i + 1, ansicht, fr), 700); };
    (fr ? sprichFr : sprich)(liste[i].text, naechste);
    setTimeout(naechste, 3500); // falls das Gerät keine passende Stimme hat
  }
  function konfetti() {
    if (S.einst.ruhig) return;
    const box = document.createElement("div"); box.className = "konfetti"; box.setAttribute("aria-hidden", "true");
    const farben = ["#f58fb7", "#a983e0", "#f6c445", "#5cc7a9", "#5aa2e6", "#e8605a", "#ffffff"];
    for (let i = 0; i < 50; i++) { const s = document.createElement("i"); s.style.left = Math.random() * 100 + "%"; s.style.background = pick(farben); s.style.animationDelay = Math.random() * 0.35 + "s"; s.style.setProperty("--dreh", Math.floor(Math.random() * 720) + "deg"); if (i % 4 === 0) s.className = "herz"; box.appendChild(s); }
    document.body.appendChild(box); setTimeout(() => box.remove(), 2600);
  }
  function plusAnzeigen(text) {
    if (S.einst.ruhig) return;
    const z = document.querySelector(".muenzen"); if (!z) return;
    const r = z.getBoundingClientRect();
    const p = document.createElement("div"); p.className = "plus"; p.textContent = text; p.style.left = r.left + "px"; p.style.top = r.bottom + "px";
    document.body.appendChild(p); setTimeout(() => p.remove(), 1200);
  }
  let letzteAktion = 0;
  function zeitBuchen() { const t = Date.now(); if (letzteAktion) tag().sek += Math.min(90, (t - letzteAktion) / 1000); letzteAktion = ui && ui.ansicht === "runde" ? t : 0; }

  const LOB = ["Super!", "Genau!", "Richtig!", "Stark!", "Klasse!", "Volltreffer!", "Das sitzt!", "Prima!", "Toll gemacht!", "Wow!"];
  const LOB_SPAETER = ["Jetzt hast du es!", "Gut, dass du drangeblieben bist!", "Geschafft, prima!", "Siehst du, du kannst das!"];
  const FAST = ["Fast! Schau noch einmal.", "Noch nicht ganz. Du schaffst das!", "Knapp daneben. Probier es noch einmal.", "Fast! Lies den Tipp und versuch es noch mal."];
  const BEWEGUNG = [
    "Steh auf und streck dich ganz hoch, als wolltest du die Decke berühren.",
    "Hüpfe 10-mal auf der Stelle.",
    "Mach 5 Hampelmänner.",
    "Tanze 10 Sekunden lang wie eine Ballerina.",
    "Kreise deine Schultern 5-mal nach hinten und 5-mal nach vorn.",
    "Stell dich auf ein Bein und zähle bis 10. Dann das andere Bein.",
    "Mach 5 Froschsprünge durchs Zimmer.",
    "Schüttle deine Hände und Füße kräftig aus.",
    "Trink einen Schluck Wasser und atme dreimal tief ein und aus.",
    "Mach dich ganz klein wie eine Maus und dann ganz groß wie ein Riese. Dreimal!",
  ];
  const GRUSS = ["Schön, dass du da bist, {name}!", "Hallo {name}! Ich hab schon auf dich gewartet.", "{name}, heute schaffen wir das zusammen!", "Juhu, {name} ist da!"];
  const fuell = (s) => s.replace("{name}", esc(S.name || "du"));
  const tagIndex = () => L.tageBis("2026-01-01", heute());

  // ================= Zustand der Oberfläche =================
  let ui;
  const startUi = () => ({ ansicht: S.erstellt ? "start" : "willkommen", schritt: 1 });
  ui = startUi();
  const gehe = (ansicht, extra) => { zeitBuchen(); clearInterval(haTimer); clearTimeout(alleTimer); ui = Object.assign({ ansicht }, extra || {}); render(); window.scrollTo(0, 0); };

  // ================= Kopfzeile =================
  function kopf(titel, zurueck) {
    return `<header class="kopf"><h1 class="titel">${zurueck ? `<button class="zurueck" data-act="heim" aria-label="Zurück">‹</button>` : ""}${esc(titel || "Puppenstube")}</h1><div class="muenzen" aria-label="${S.muenzen} Edelsteine">💎 <b>${S.muenzen}</b></div></header>`;
  }

  // ================= Willkommen =================
  function farbKreise(act, werte, aktuell, farbe) {
    return `<div class="kreise">${werte.map((w) => `<button class="kreis${w === aktuell ? " aktiv" : ""}" style="background:${farbe(w)}" data-act="${act}" data-arg="${esc(w)}" aria-label="${esc(w)}"></button>`).join("")}</div>`;
  }
  function gestalter(e) {
    return `<div class="gestalter">
      <div class="gestalter-puppe">${P.puppeSvg(e, { mood: "jubel" })}</div>
      <div class="gestalter-wahl">
        <h3>Haut</h3>${farbKreise("g-haut", [0, 1, 2, 3, 4].map(String), String(e.haut), (w) => L.HAUT[w])}
        <h3>Haarfarbe</h3>${farbKreise("g-haar", Object.keys(L.HAAR), e.haar, (w) => L.HAAR[w])}
        <h3>Frisur</h3><div class="frisuren">${Object.keys(L.FRISUREN).map((f) => `<button class="frisur${f === e.frisur ? " aktiv" : ""}" data-act="g-frisur" data-arg="${f}">${P.kopfSvg(Object.assign({}, e, { frisur: f }))}<span>${L.FRISUREN[f]}</span></button>`).join("")}</div>
        <h3>Lieblingsfarbe</h3>${farbKreise("g-farbe", Object.keys(L.FARBEN), e.farbe, (w) => L.FARBEN[w])}
      </div></div>`;
  }
  function willkommen() {
    if (ui.schritt === 1) return `<main class="mitte willkommen">
      <div class="gross-puppe">${P.puppeSvg({ haut: 1, haar: "braun", frisur: "zoepfe", kleid: "kleid", farbe: "lila" }, { mood: "jubel", traegt: ["schleife"] })}</div>
      <h1>Hallo! Wie heißt du?</h1>
      <input id="name" class="eingabe" maxlength="20" autocomplete="off" autocapitalize="words" placeholder="Dein Vorname" value="${esc(S.name)}">
      <button class="btn haupt gross" data-act="w-name">Weiter</button></main>`;
    if (ui.schritt === 2) return `<main class="willkommen">
      <h1 class="mitte-text">Gestalte deine Puppe, ${esc(S.name)}!</h1>
      <p class="leise mitte-text">Sie wohnt in deiner Puppenstube. Mit den Edelsteinen vom Rechnen bekommt sie neue Kleider, Schmuck und Möbel.</p>
      ${gestalter(ui.entwurf)}
      <div class="mitte"><button class="btn haupt gross" data-act="w-puppe-ok">Fertig, so ist sie schön!</button></div></main>`;
    return `<main class="mitte willkommen">
      <div class="gross-puppe">${P.puppeSvg(ui.entwurf, { mood: "jubel" })}</div>
      <h1>Wie soll deine Puppe heißen?</h1>
      <input id="puppenname" class="eingabe" maxlength="20" autocomplete="off" autocapitalize="words" placeholder="Name der Puppe">
      <button class="btn haupt gross" data-act="w-fertig">Los geht's!</button></main>`;
  }

  // ================= Startseite =================
  function start() {
    const t = tagLesen();
    const fid = L.besuchFuer(S, heute());
    const f = freund(fid);
    const etappen = L.missionEtappen(S);
    const fertig = t.mission;
    const kiste = S.fehler.length;
    const punkte = etappen.map((e, i) => `<span class="etappe-punkt${fertig || i < t.etappen ? " fertig" : ""}" title="${esc(e.titel)}">${fertig || i < t.etappen ? "✓" : i + 1}</span>`).join("");
    const knopf = fertig ? "Bonus-Runde" : t.etappen > 0 ? `Weiter mit Etappe ${t.etappen + 1}` : `${esc(f.name)} helfen`;
    const tageWoche = Object.keys(S.tage).filter((d) => L.tageBis(d, heute()) < 7 && L.tageBis(d, heute()) >= 0 && (S.tage[d].aufgaben > 0 || S.tage[d].haSek > 0)).length;
    const fok = L.themaById(L.fokus(S));
    return `${kopf()}<main class="start">
      <section class="zimmer-box" data-act="stube" aria-label="Zur Puppenstube">
        ${P.zimmerSvg(S.puppe, { besitz: S.besitz, traegt: S.traegt, winter: winter(), stufe: L.stufe(S.punkte), mood: fertig ? "jubel" : "froh" })}
        <div class="sprechblase">${fertig ? `Mission geschafft! Ich bin so stolz auf dich, ${esc(S.name)}!` : fuell(GRUSS[tagIndex() % GRUSS.length])}</div>
      </section>
      <section class="besuch karte${fertig ? " erledigt" : ""}">
        <div class="besuch-kopf">${freundKopf(f, fertig ? "jubel" : "froh")}</div>
        <div class="besuch-text">
          <h2>${fertig ? `${esc(f.name)} sagt danke! 💕` : `${esc(f.name)} ist zu Besuch`}</h2>
          <p>${fertig ? `${esc(f.name)} hat in dein Freundebuch geschrieben.` : esc(f.bitte)}</p>
          <div class="etappen-punkte" aria-label="Etappen">${punkte}</div>
        </div>
        <button class="btn haupt gross" data-act="mission">${knopf}</button>
      </section>
      <section class="besuch karte franz-karte">
        <div class="besuch-kopf">${freundKopf(FR.CAMILLE)}</div>
        <div class="besuch-text"><h2>🇫🇷 Französisch mit Camille</h2><p>Winterkleider, Farben und Zahlen bis 20. ${FR.bereitschaft(S)} % sitzen schon.</p></div>
        <button class="btn haupt gross" data-act="franz">Bonjour!</button>
      </section>
      <section class="besuch karte deutsch-karte">
        <div class="besuch-kopf">${freundKopf(DE.LIESE)}</div>
        <div class="besuch-text"><h2>📝 Deutsch mit Liese</h2><p>Wörter mit <span class="ie">ie</span>. ${DE.bereitschaft(S)} % sitzen schon.${S.de.wiese.length ? ` 🌼 ${S.de.wiese.length} ${S.de.wiese.length === 1 ? "Wort blüht" : "Wörter blühen"} auf deiner Wiese.` : ""}</p></div>
        <button class="btn haupt gross" data-act="deutsch">Hallo Liese!</button>
      </section>
      <p class="fokus-zeile">Gerade dran: ${esc(fok.icon)} <b>${esc(fok.name)}</b></p>
      <section class="kacheln">
        <button class="kachel" data-act="lernpfad"><span>🗺️</span>Lernpfad</button>
        <button class="kachel" data-act="kiste" ${kiste ? "" : "disabled"}><span>🧺</span>Übe-Korb${kiste ? ` <b class="zahl-badge">${kiste}</b>` : ""}</button>
        <button class="kachel" data-act="sogehts"><span>💡</span>So geht's</button>
        <button class="kachel" data-act="ha"><span>📚</span>Hausaufgaben-Zeit</button>
        <button class="kachel" data-act="freundebuch"><span>📒</span>Freundebuch</button>
        <button class="kachel" data-act="stube"><span>🏠</span>Puppenstube</button>
      </section>
      <footer class="fuss">
        <span>${tageWoche ? `Diese Woche an ${tageWoche} ${tageWoche === 1 ? "Tag" : "Tagen"} geübt` : "Schön, dass du da bist!"}</span>
        <button id="eltern-knopf" class="eltern-knopf" aria-label="Für Eltern: gedrückt halten"><span class="fuell"></span>Für Eltern: gedrückt halten</button>
      </footer></main>`;
  }

  // ================= Runden =================
  function starteRunde(typ, etappen, titel) {
    const fid = L.besuchFuer(S, heute());
    ui = { ansicht: "etappe-start", runde: { typ, titel, etappen, nr: 0, freund: fid, mission: typ === "mission" && !tag().mission, winterNeu: [], wieseNeu: [], glitzerNeu: [] } };
    if (ui.runde.mission) ui.runde.nr = Math.min(tag().etappen, etappen.length - 1);
    speichern(); render();
  }
  function bereiteEtappe() {
    const R = ui.runde, e = R.etappen[R.nr];
    const n = e.n || S.einst.etappe;
    R.specs = e.fach === "fr" ? FR.buildEtappe(S, { n, seed: zufall(), thema: e.thema, typ: e.typ }) : e.fach === "de" ? DE.buildEtappe(S, { n, seed: zufall(), thema: e.thema, typ: e.typ }) : L.buildEtappe(S, { n, seed: zufall(), art: e.art, thema: e.thema, skill: e.skill, freund: R.freund });
    R.i = -1; R.ersteRichtig = 0; R.nochmal = 0; R.muenzenStart = S.muenzen; R.neuFrei = []; R.geschenk = null;
    if (!R.specs.length) { toast("Hier gibt es gerade nichts zu üben."); gehe("start"); return false; }
    return true;
  }
  function naechsteAufgabe() {
    const R = ui.runde; R.i++;
    if (R.i >= R.specs.length) return etappeFertig();
    const s = R.specs[R.i];
    R.task = s.fach === "fr" ? FR.makeTask(s) : s.fach === "de" ? DE.makeTask(s) : L.makeTask(s.skill, s.stufe, s.seed, { freund: s.freund });
    if (!R.task) return naechsteAufgabe();
    const t = R.task;
    const felder = t.felder || [];
    R.werte = felder.map(() => ""); R.fstat = felder.map(() => "offen"); R.fversuche = felder.map(() => 0);
    R.aktiv = 0; R.fehler = 0; R.tippOffen = false; R.meldung = null; R.hilfeBild = null; R.fertig = false; R.wackel = -1;
    R.wahl = null; R.falsch = []; R.versuche = 0;
    R.gelegt = []; R.benutzt = []; R.falschKachel = -1; R.zeigeWort = false; R.neuWinter = null; R.neuWiese = null; R.neuGlitzer = null; R.medaille = null; R.profiLohn = false;
    // Neuer Lernteil? Erst kurz erklären.
    if (!s.fach && !S.gesehen[s.skill] && ERK[s.skill]) { ui.ansicht = "erklaerung"; ui.erk = { skill: s.skill, seite: 0, ausRunde: true }; render(); return; }
    ui.ansicht = "runde"; letzteAktion = Date.now();
    render();
    if (t.fach === "fr") { if (t.typ === "hoeren" || t.typ === "fr-de") sprichFr(t.sprich); }
    else if (t.fach === "de") { if (t.sprich) sprich(t.sprich, null, t.art === "buchstaben" ? 0.8 : 0.88); }
    else if (S.einst.vorlesen) vorlesen();
  }
  const ersteOffene = () => ui.runde.fstat.indexOf("offen");

  function pruefeFeld(i) {
    const R = ui.runde, t = R.task;
    if (R.fertig || R.fstat[i] !== "offen") return;
    const r = L.checkFeld(t, i, R.werte[i]);
    if (r.leer) { toast("Tippe zuerst eine Zahl."); return; }
    zeitBuchen();
    R.wackel = -1;
    if (r.ok) {
      R.fstat[i] = "ok"; R.meldung = null; R.hilfeBild = null;
      ton(3 + R.fstat.filter((x) => x === "ok").length);
    } else {
      R.fversuche[i]++; R.fehler++;
      const f = t.felder[i];
      if (R.fversuche[i] === 1) {
        R.meldung = { art: "tipp", text: pick(FAST), tipp: f.tipp || t.tipp };
        R.hilfeBild = f.hilfe || t.hilfe; R.werte[i] = ""; R.wackel = i;
      } else {
        R.fstat[i] = "geholfen"; R.werte[i] = String(f.loesung);
        R.meldung = { art: "loesung", text: `Kein Problem. Hier gehört ${f.loesung} hin.`, tipp: f.tipp };
        R.hilfeBild = null;
      }
    }
    const naechste = ersteOffene();
    if (naechste < 0) return aufgabeFertig();
    if (R.fstat[i] !== "offen") R.aktiv = naechste;
    speichern(); render();
  }
  function pruefeWahl(wert) {
    const R = ui.runde, t = R.task;
    if (R.fertig || R.falsch.includes(wert)) return;
    zeitBuchen();
    R.wahl = wert;
    if (L.checkWahl(t, wert).ok) return aufgabeFertig();
    R.versuche++; R.fehler++; R.falsch.push(wert);
    if (R.versuche >= 2) { R.geholfen = true; R.meldung = { art: "loesung", text: "Das ist knifflig." }; return aufgabeFertig(); }
    R.meldung = { art: "tipp", text: pick(FAST), tipp: (t.tippFuer && t.tippFuer[wert]) || t.tipp };
    speichern(); render();
  }
  function aufgabeFertig() {
    const R = ui.runde, t = R.task;
    const geholfen = R.geholfen || R.fstat.includes("geholfen");
    const erster = R.fehler === 0 && !R.tippOffen;
    if (t.fach === "fr") {
      const rr = FR.record(S, t.wort, erster, heute());
      if (rr.neuWinter) { R.neuWinter = rr.neuWinter; R.winterNeu = (R.winterNeu || []).concat(rr.neuWinter); }
    } else if (t.fach === "de") {
      const rr = DE.record(S, t.wort, erster, heute(), t.typ);
      if (rr.neuWiese) { R.neuWiese = rr.neuWiese; R.wieseNeu = (R.wieseNeu || []).concat(rr.neuWiese); }
      if (rr.neuGlitzer) { R.neuGlitzer = rr.neuGlitzer; R.glitzerNeu = (R.glitzerNeu || []).concat(rr.neuGlitzer); }
    } else L.record(S, t.skill, erster, heute());
    const profi = R.fehler === 0 && L.istProfi(t);
    const m = (R.fehler === 0 ? L.LOHN.richtig : L.LOHN.spaeter) + (profi ? L.LOHN.profi : 0);
    R.profiLohn = profi;
    S.muenzen += m; S.punkte += R.fehler === 0 ? L.LOHN.punkteRichtig : L.LOHN.punkteSpaeter;
    const T = tag(); T.aufgaben++; if (R.fehler === 0) T.richtig++;
    if (erster) R.ersteRichtig++;
    R.fertig = true; R.geholfen = false;
    let kette = false;
    if (!geholfen) { T.perlen = (T.perlen || 0) + 1; if (T.perlen % 5 === 0) { S.muenzen += L.LOHN.kette; kette = true; } }
    R.lob = R.fehler === 0 ? pick(LOB) : pick(LOB_SPAETER);
    if (geholfen) R.lob = "Das üben wir gleich noch einmal.";
    R.gelernt = geholfen || R.fehler > 0;
    if (geholfen && R.nochmal < 2) { R.nochmal++; R.specs.push(t.fach ? { fach: t.fach, wort: t.wort, typ: t.typ, stufe: t.stufe, thema: t.fach === "de" ? t.thema : undefined, seed: zufall() } : { skill: t.skill, stufe: t.stufe, seed: zufall(), freund: R.freund }); }
    if (!t.fach) {
      const neu = L.aktualisiereOffen(S); if (neu.length) R.neuFrei = (R.neuFrei || []).concat(neu);
      const med = L.neueMedaillen(S, heute()); if (med.length) { S.muenzen += L.LOHN.medaille * med.length; R.medaille = med; }
    }
    speichern(); render(); if (m > 0) plusAnzeigen("+" + m);
    if (R.medaille) { konfetti(); ton(12, "glitzer"); }
    if (t.fach === "fr") sprichFr(t.sprichNachher || t.sprich);
    if (t.fach === "de") sprich(t.sprichNachher || t.sprich);
    if (R.neuGlitzer && !R.medaille) konfetti();
    if (kette) { ton(12, "glitzer"); konfetti(); toast(`Glitzerkette fertig! +${L.LOHN.kette} 💎`); }
    else if (!geholfen) ton(8, R.fehler === 0 ? "glitzer" : null);
  }
  function etappeFertig() {
    const R = ui.runde;
    S.muenzen += L.LOHN.etappe;
    if (R.mission) {
      const T = tag(); T.etappen = Math.max(T.etappen, R.nr + 1);
      if (R.nr + 1 >= R.etappen.length) { T.mission = true; S.muenzen += L.LOHN.mission; R.dank = L.freundDanke(S, R.freund, heute()); }
    }
    // Französisch-Runde fertig: Camille bedankt sich und schreibt ins Freundebuch
    const frFertig = R.etappen.every((e) => e.fach === "fr") && R.nr + 1 >= R.etappen.length;
    if (frFertig) {
      S.fr.runden++;
      if (S.fr.camille) S.fr.camille.herzen++; else { S.fr.camille = { ab: heute(), herzen: 1 }; R.camilleNeu = true; }
      if (R.etappen.length >= 3) S.muenzen += L.LOHN.mission;
    }
    // Deutsch-Runde fertig: Liese bedankt sich und schreibt ins Freundebuch
    const deFertig = R.etappen.every((e) => e.fach === "de") && R.nr + 1 >= R.etappen.length;
    if (deFertig) {
      S.de.runden++;
      if (S.de.liese) S.de.liese.herzen++; else { S.de.liese = { ab: heute(), herzen: 1 }; R.lieseNeu = true; }
      if (R.etappen.length >= 3) S.muenzen += L.LOHN.mission;
    }
    speichern();
    const missionFertig = R.mission && R.nr + 1 >= R.etappen.length;
    ui.ansicht = missionFertig ? "mission-ende" : frFertig ? "franz-ende" : deFertig ? "deutsch-ende" : "etappe-ende";
    letzteAktion = 0;
    render(); konfetti(); ton(12, "glitzer");
  }

  // ---------- Bilder ----------
  function bildHtml(b) {
    if (!b) return "";
    switch (b.typ) {
      case "bloecke": return `<figure class="fig">${P.bloeckeSvg(b.zahl, { weg: b.weg })}</figure>`;
      case "sprung": return `<figure class="fig">${P.sprungSvg(b.start, b.spruenge, b.labels)}</figure>`;
      case "strahl": return `<figure class="fig">${P.strahlSvg(b)}</figure>`;
      case "rechnung": return `<div class="rechen-bild${b.gross ? " gross" : ""}">${b.zeilen.map((z) => `<div>${esc(z)}</div>`).join("")}</div>`;
      case "kurz": {
        const teile = L.zerlege(b.b), zw = [b.a - teile[0], b.a - teile[0] - teile[1]], res = b.a - b.b;
        return `<div class="kurz-bild"><div class="kurz-kopf">${b.a} ${M} ${b.b} = <span class="kasten${b.zeige >= 3 ? " voll" : ""}">${b.zeige >= 3 ? res : ""}</span></div>
          <div class="kurz-boxen">${zw.map((z, i) => `<span class="kasten${b.zeige > i ? " voll" : ""}">${b.zeige > i ? z : ""}</span>`).join("")}</div></div>`;
      }
    }
    return "";
  }

  // ---------- Aufgabe anzeigen ----------
  function feldHtml(i) {
    const R = ui.runde;
    let cls = "feld";
    if (R.fstat[i] === "ok") cls += " ok";
    else if (R.fstat[i] === "geholfen") cls += " geholfen";
    else if (i === R.aktiv && !R.fertig) cls += " aktiv";
    if (i === R.wackel) cls += " wackel";
    const aus = R.fertig || R.fstat[i] !== "offen";
    return `<button class="${cls}" data-act="feld" data-arg="${i}" ${aus ? "disabled" : ""} aria-label="Feld ${i + 1}">${esc(R.werte[i])}</button>`;
  }
  function teilHtml(x) {
    const R = ui.runde;
    if (typeof x === "number") return `<span class="zahl">${x}</span>`;
    if (typeof x === "string") return `<span class="op">${esc(x)}</span>`;
    if (x.f != null) return feldHtml(x.f);
    if (x.z != null) return R.fstat[x.nach] !== "offen" ? `<span class="zahl neu">${x.z}</span>` : `<span class="zahl leer">…</span>`;
    if (x.w != null) return `<span class="wort">${esc(x.w)}</span>`;
    return "";
  }
  function zeilenHtml(t) {
    const R = ui.runde;
    switch (t.layout) {
      case "nachbar": {
        const z = t.zeilen[0].teile;
        const fs = z.filter((x) => typeof x === "object");
        const cap = t.nachbar.hunderter ? ["Nachbar&shy;hunderter", "Nachbar&shy;zehner", "", "Nachbar&shy;zehner", "Nachbar&shy;hunderter"] : ["Nachbar&shy;zehner", "", "Nachbar&shy;zehner"];
        const zellen = t.nachbar.hunderter ? [fs[0], fs[1], t.nachbar.zahl, fs[2], fs[3]] : [fs[0], t.nachbar.zahl, fs[1]];
        return `<div class="nachbar-reihe">${zellen.map((c, i) => `<div class="nachbar-zelle${typeof c === "number" ? " mitte" : ""}"><small>${cap[i]}</small>${typeof c === "number" ? `<span class="zahl gross">${c}</span>` : teilHtml(c)}</div>`).join(`<span class="op klein">&lt;</span>`)}</div>`;
      }
      case "raupe":
        return `<div class="raupe"><div class="raupe-kopf" aria-hidden="true"><i></i><i></i><b></b></div>${t.zeilen[0].teile.map((x) => `<div class="raupe-glied">${teilHtml(x)}</div>`).join("")}</div>`;
      case "kurz": {
        const k = t.kurz && t.kurz.schritte;
        return `<div class="zeilen kurz"><div class="zeile kopfzeile">${t.zeilen[0].teile.map(teilHtml).join("")}</div>
          <div class="kurz-boxen">${t.zeilen[1].teile.map((x, i) => `<div class="kurz-box">${k ? `<small>${M} ${k[i]}</small>` : "<small>&nbsp;</small>"}${teilHtml(x)}</div>`).join(`<span class="pfeil">➜</span>`)}${k ? `<div class="kurz-box"><small>${M} ${k[2]}</small><span class="pfeil-hoch">⤴</span></div>` : ""}</div></div>`;
      }
      case "schritte": {
        // Raster: Beschriftung | Zahl | − | Zahl | = | Ergebnis, damit alles untereinander steht
        const n = Math.max(...t.zeilen.map((z) => z.teile.length));
        return `<div class="raster schritte" style="grid-template-columns:auto repeat(${n}, auto)">${t.zeilen.map((z, i) => `<span class="label">${esc(z.label)}</span>${z.teile.map(teilHtml).join("")}${i === 0 ? `<span class="trenner"></span>` : ""}`).join("")}</div>`;
      }
      default: {
        const n = t.zeilen[0].teile.length;
        if (t.layout === "rechnung" && t.zeilen.every((z) => z.teile.length === n)) return `<div class="raster rechnung" style="grid-template-columns:repeat(${n}, auto)">${t.zeilen.map((z) => z.teile.map(teilHtml).join("")).join("")}</div>`;
        return `<div class="zeilen ${t.layout}">${t.zeilen.map((z) => `<div class="zeile"><span class="teile">${z.teile.map(teilHtml).join("")}</span></div>`).join("")}</div>`;
      }
    }
  }
  function wahlHtml(t) {
    const R = ui.runde;
    const loes = R.fertig;
    if (t.layout === "vergleich") {
      const [a, b] = t.vergleich;
      const zeichen = loes ? t.loesung : "?";
      const worte = { "<": "kleiner", ">": "größer", "=": "gleich" };
      return `<div class="vergleich"><span class="zahl gross">${a}</span><span class="vgl-platz${loes ? " voll" : ""}">${esc(zeichen)}</span><span class="zahl gross">${b}</span></div>
        <div class="optionen drei">${t.optionen.map((o, i) => {
          let cls = "option zeichen";
          if (R.falsch.includes(o)) cls += " falsch";
          if (loes && o === t.loesung) cls += " richtig";
          return `<button class="${cls}" data-act="waehle" data-arg="${i}" ${loes || R.falsch.includes(o) ? "disabled" : ""}><b>${esc(o)}</b><small>${worte[o]}</small></button>`;
        }).join("")}</div>`;
    }
    return `<div class="optionen">${t.optionen.map((o, i) => {
      let cls = "option";
      if (R.falsch.includes(o)) cls += " falsch";
      if (loes && o === t.loesung) cls += " richtig";
      return `<button class="${cls}" data-act="waehle" data-arg="${i}" ${loes || R.falsch.includes(o) ? "disabled" : ""}>${esc(o)}</button>`;
    }).join("")}</div>`;
  }
  const tastatur = () => `<div class="tasten" role="group" aria-label="Zahlen">${[7, 8, 9, 4, 5, 6, 1, 2, 3].map((d) => `<button class="taste" data-act="taste" data-arg="${d}">${d}</button>`).join("")}<button class="taste weg" data-act="taste" data-arg="weg" aria-label="Löschen">⌫</button><button class="taste" data-act="taste" data-arg="0">0</button><button class="taste ok" data-act="taste" data-arg="ok" aria-label="Prüfen">✓</button></div>`;

  function kette() {
    const n = (tagLesen().perlen || 0) % 5;
    return `<div class="kette" aria-label="Glitzerkette: ${n} von 5 Perlen">${[0, 1, 2, 3, 4].map((i) => `<i class="${i < n ? "an" : ""}"></i>`).join("")}</div>`;
  }
  function rundeKopf() {
    const R = ui.runde;
    const e = R.etappen[R.nr];
    const titel = R.etappen.length > 1 ? `Etappe ${R.nr + 1} von ${R.etappen.length} · ${e.titel}` : (R.titel || e.titel);
    const dots = R.specs.map((_, i) => `<i class="${i < R.i || (i === R.i && R.fertig) ? "fertig" : i === R.i ? "jetzt" : ""}"></i>`).join("");
    const mood = R.fertig && !R.gelernt ? "jubel" : R.meldung && R.meldung.art === "tipp" ? "denk" : "froh";
    return `<header class="kopf runde-kopf">
      <button class="zurueck" data-act="pause-runde" aria-label="Pause, zurück zur Startseite">✕</button>
      <div class="runde-info"><div class="runde-titel">${esc(titel)}</div><div class="fortschritt" aria-label="Aufgabe ${R.i + 1} von ${R.specs.length}">${dots}</div></div>
      ${kette()}
      <div class="mini-puppe ${R.fertig && !R.gelernt && !S.einst.ruhig ? "huepf" : ""}">${P.kopfSvg(S.puppe, { mood, traegt: S.traegt, winter: winter() })}</div>
      <div class="muenzen">💎 <b>${S.muenzen}</b></div></header>`;
  }
  function runde() {
    const R = ui.runde, t = R.task;
    let unten = "";
    if (R.fertig) {
      const erkl = t.fach === "de" && t.erklaerung ? `<p class="de-erkl"><button class="vorlesen klein" data-act="de-sag-loesung" aria-label="Anhören">🔊</button> ${deText(t.erklaerung)}</p>`
        : (R.gelernt || t.fach === "fr") && t.erklaerung ? `<p>${t.fach === "fr" ? `<button class="vorlesen klein" data-act="fr-sag-loesung" aria-label="Auf Französisch anhören">🔊</button> ` : ""}${esc(t.erklaerung)}</p>` : "";
      const merk = R.gelernt && t.merk ? `<p class="merk">🧠 ${esc(t.merk)}</p>` : "";
      const neuW = R.neuWinter ? `<p class="winter-hinweis">${P.kleidBild(R.neuWinter)}<span>❄️ Neu für ${esc(puppeName())}: <b>${esc(FR.zeige(FR.wortById(R.neuWinter)))}</b>! In der Puppenstube kann sie es anziehen.</span></p>` : "";
      const neuDe = R.neuGlitzer ? `<p class="wiese-hinweis glitzer"><span class="de-bild">${esc(DE.wortById(R.neuGlitzer).deko)}</span><span>✨ Selbst geschrieben! <b>${ieHtml(DE.zeige(DE.wortById(R.neuGlitzer)))}</b> glitzert jetzt auf deiner Wiese.</span></p>`
        : R.neuWiese ? `<p class="wiese-hinweis"><span class="de-bild">${esc(DE.wortById(R.neuWiese).deko)}</span><span>🌼 Neu auf deiner Wiese: <b>${ieHtml(DE.zeige(DE.wortById(R.neuWiese)))}</b></span></p>` : "";
      const profiZeile = R.profiLohn ? `<p class="profi-zeile">⭐ Profi-Aufgabe geschafft: 1 Edelstein extra!</p>` : "";
      const medZeile = R.medaille ? R.medaille.map((id) => { const th = L.themaById(id); return `<p class="medaille-zeile">🏅 Medaille für «${esc(th.name)}»! Das sitzt jetzt richtig gut. +${L.LOHN.medaille} 💎</p>`; }).join("") : "";
      unten = `<div class="rueck ${R.gelernt ? "loesung" : "gut"}" role="status"><b>${esc(R.lob)}</b>${profiZeile}${medZeile}${erkl}${merk}${neuW}${neuDe}<button class="btn haupt gross" data-act="weiter">Weiter ➜</button></div>`;
    } else if (R.meldung) {
      unten = `<div class="rueck ${R.meldung.art === "tipp" ? "tipp" : "loesung"}" role="status"><b>${esc(R.meldung.text)}</b>${R.meldung.tipp ? `<p>💡 ${esc(R.meldung.tipp)}</p>` : ""}${R.hilfeBild ? bildHtml(R.hilfeBild) : ""}</div>`;
    } else if (t.tipp || t.hilfe) {
      unten = R.tippOffen ? `<div class="rueck tipp"><p>💡 ${esc(t.tipp)}</p>${bildHtml(t.hilfe)}</div>` : `<button class="tipp-knopf" data-act="tipp-zeigen">💡 Ich brauche einen Tipp</button>`;
    }
    const istWahl = t.art !== "felder";
    const inhalt = `${L.istProfi(t) && !R.fertig ? `<span class="profi-abzeichen">⭐ Profi-Aufgabe: auf Anhieb richtig gibt 1 Edelstein extra</span>` : ""}<div class="frage-zeile"><h2 class="frage">${esc(t.frage)}</h2><button class="vorlesen" data-act="vorlesen" aria-label="Vorlesen">🔊</button></div>
      ${t.text ? `<p class="aufgaben-text">${esc(t.text)}</p>` : ""}
      ${t.fig ? bildHtml(t.fig) : ""}
      ${t.fach === "de" ? (t.art === "buchstaben" ? deBuchstabenHtml(t) : deWahlHtml(t)) : t.art === "buchstaben" ? buchstabenHtml(t) : t.fach === "fr" ? frWahlHtml(t) : istWahl ? wahlHtml(t) : zeilenHtml(t)}
      ${unten}`;
    return `${rundeKopf()}<main class="runde-flaeche${istWahl || R.fertig ? " ohne-tasten" : ""}"><section class="aufgabe art-${t.art} layout-${t.layout}">${inhalt}</section>${istWahl || R.fertig ? "" : `<section class="tastatur">${tastatur()}</section>`}</main>`;
  }

  function etappeStart() {
    const R = ui.runde, e = R.etappen[R.nr];
    const f = freund(R.freund);
    const titel = R.etappen.length > 1 ? `Etappe ${R.nr + 1} von ${R.etappen.length}` : (R.titel || "Los geht's");
    const besuch = R.mission && R.nr === 0 && !tagLesen().etappen;
    const istFr = e.fach === "fr", istDe = e.fach === "de";
    const th = e.thema && !e.fach ? L.themaById(e.thema) : null;
    const deSatz = e.typ === "buchstaben" ? `${esc(puppeName())} diktiert dir ${e.n} Wörter. Hör gut zu und lege jedes Wort mit den Buchstaben!` : `Los geht's, ${esc(S.name)}! Hör immer genau hin: Klingt das i lang? Dann schreibst du ie.`;
    return `${kopf("", true)}<main class="mitte">
      ${istDe ? `<div class="besuch-gross"><div class="gross-puppe klein">${e.typ === "buchstaben" ? puppe("froh", { buch: true }) : P.puppeSvg(DE.LIESE.look, { mood: "jubel" })}</div><div class="sprechblase links">${deSatz}</div></div>`
        : istFr ? `<div class="besuch-gross"><div class="gross-puppe klein">${P.puppeSvg(FR.CAMILLE.look, { mood: "jubel" })}</div><div class="sprechblase links">Allez, on y va! Los geht's, ${esc(S.name)}! Hör gut zu, ich sage dir jedes Wort vor.</div></div>`
        : besuch ? `<div class="besuch-gross"><div class="gross-puppe klein">${P.puppeSvg(f.look, { mood: "froh" })}</div><div class="sprechblase links">${esc(f.bitte)}</div></div>` : `<div class="gross-puppe">${puppe("jubel")}</div>`}
      <h1>${esc(titel)}</h1><p class="untertitel">${esc(e.titel)}${th && e.art !== "warm" ? ": " + esc(th.icon + " " + th.name) : ""}</p>
      <p class="leise">${e.n || S.einst.etappe} Aufgaben.${(R.mission || istFr || istDe) && R.nr < R.etappen.length - 1 ? " Danach ein Geschenk und eine kurze Bewegungspause." : ""}</p>
      <button class="btn haupt gross" data-act="etappe-los">Los geht's!</button></main>`;
  }
  function etappeEnde() {
    const R = ui.runde;
    const sterne = R.ersteRichtig >= R.specs.length * 0.8 ? 3 : R.ersteRichtig >= R.specs.length * 0.5 ? 2 : 1;
    const g = R.geschenk;
    const weiter = R.nr + 1 < R.etappen.length;
    const frei = (R.neuFrei || []).map((id) => L.themaById(id));
    return `${kopf()}<main class="mitte">
      <h1>Etappe geschafft!</h1>
      <div class="sterne" aria-label="${sterne} Sterne">${"★".repeat(sterne)}<span>${"★".repeat(3 - sterne)}</span></div>
      ${frei.length ? `<p class="frei-banner">🎉 Neu auf deinem Lernpfad: ${frei.map((t) => esc(t.icon + " " + t.name)).join(", ")}</p>` : ""}
      ${g ? `<div class="geschenk offen">${g.typ === "sticker" ? `<span class="sticker-gross">${g.id}</span><p>${g.neu ? "Ein neuer Sticker für dein Album!" : "Noch ein Sticker für dein Album!"}</p>` : `<span class="sticker-gross">💎</span><p>${g.n} Edelsteine!</p>`}</div>`
        : `<button class="geschenk" data-act="geschenk" aria-label="Geschenk öffnen"><span class="paket">🎁</span><span>Tippe auf dein Geschenk!</span></button>`}
      ${g ? (weiter ? (S.einst.pause && (R.mission || R.typ === "franz" || R.typ === "deutsch") ? `<button class="btn haupt gross" data-act="bewegung">Weiter zur Bewegungspause</button>` : `<button class="btn haupt gross" data-act="naechste-etappe">Nächste Etappe</button>`) : `<button class="btn haupt gross" data-act="heim">Fertig!</button>`) : ""}
      ${g && weiter ? `<button class="btn leise-btn" data-act="heim">Für heute aufhören</button>` : ""}</main>`;
  }
  let pauseTimer = null;
  function bewegung() {
    const sek = TEST.pauseMs != null ? TEST.pauseMs / 1000 : S.einst.pauseSek;
    return `${kopf("Bewegungspause")}<main class="mitte pause">
      <div class="pause-uhr" style="--dauer:${sek}s"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/><circle class="lauf" cx="50" cy="50" r="44"/></svg><span id="pause-rest">${Math.ceil(sek)}</span></div>
      <h1>Kurz bewegen!</h1><p class="bewegung">${esc(ui.bewegung)}</p>
      <button id="pause-weiter" class="btn haupt gross" data-act="naechste-etappe" disabled>Fertig, weiter!</button></main>`;
  }
  function starteBewegung() {
    ui.ansicht = "bewegung"; ui.bewegung = pick(BEWEGUNG); render();
    const ms = TEST.pauseMs != null ? TEST.pauseMs : S.einst.pauseSek * 1000;
    const ende = Date.now() + ms;
    clearInterval(pauseTimer);
    pauseTimer = setInterval(() => {
      const rest = Math.max(0, ende - Date.now());
      const el = document.getElementById("pause-rest"); if (el) el.textContent = Math.ceil(rest / 1000);
      if (rest <= 0) { clearInterval(pauseTimer); const b = document.getElementById("pause-weiter"); if (b) b.disabled = false; ton(7); }
    }, 200);
  }
  function missionEnde() {
    const R = ui.runde, f = freund(R.freund), T = tagLesen();
    return `${kopf()}<main class="mitte">
      <div class="besuch-gross"><div class="gross-puppe klein huepf">${P.puppeSvg(f.look, { mood: "jubel" })}</div><div class="sprechblase links">Danke, ${esc(S.name)}! ${esc(f.danke)}</div></div>
      <h1>Tagesmission geschafft! 🎉</h1>
      <p class="schatz">🎁 Schatztruhe: +${L.LOHN.mission} Edelsteine</p>
      <p>${R.dank && R.dank.neu ? `${esc(f.name)} hat eine Seite in dein Freundebuch geschrieben!` : `${esc(f.name)} schenkt dir ein Freundschaftsherz. ♥ ${R.dank ? R.dank.herzen : ""}`}</p>
      <p class="leise">Heute hast du ${T.richtig} Aufgaben auf Anhieb richtig gelöst.</p>
      <button class="btn haupt gross" data-act="freund" data-arg="${esc(f.id)}">Freundebuch ansehen</button>
      <button class="btn" data-act="stube">Zur Puppenstube</button></main>`;
  }

  // ================= Französisch mit Camille =================
  const frBildVon = (w) => (w.thema === "kleidung" ? { typ: "kleid", id: w.id } : w.thema === "farben" ? { typ: "farbe", id: w.id } : { typ: "ziffer", zahl: w.zahl });
  function frBild(b, gross) {
    if (!b) return "";
    if (b.typ === "kleid") return `<span class="fr-bild${gross ? " gross" : ""}">${P.kleidBild(b.id)}</span>`;
    if (b.typ === "farbe") { const w = FR.wortById(b.id); return `<span class="farbklecks${gross ? " gross" : ""}${b.id === "blanc" ? " weiss" : ""}" style="background:${w.hex}"></span>`; }
    if (b.typ === "ziffer") return `<span class="ziffer${gross ? " gross" : ""}">${b.zahl}</span>`;
    return "";
  }
  const mischHtml = (aus, gibt, zeigen) => `<div class="fr-prompt mischen">${aus.map((id) => `<span class="misch-farbe">${frBild({ typ: "farbe", id })}<small>${esc(id)}</small></span>`).join("<b>+</b>")}<b>=</b><span class="misch-farbe">${zeigen ? frBild({ typ: "farbe", id: gibt }) + `<small>${esc(gibt)}</small>` : `<span class="farbklecks leer">?</span><small>&nbsp;</small>`}</span></div>`;
  function frPrompt(t) {
    const p = t.prompt, R = ui.runde;
    switch (p.typ) {
      case "hoeren": return `<div class="fr-prompt"><button class="hoer-knopf" data-act="fr-sag" aria-label="Noch einmal anhören">🔊</button>${R.tippOffen || R.fertig ? `<div class="fr-wort">${esc(FR.zeige(FR.wortById(t.wort)))}</div>` : `<p class="leise">Tippe auf den Lautsprecher, dann hörst du das Wort noch einmal.</p>`}</div>`;
      case "bild": return `<div class="fr-prompt">${frBild(p.bild, true)}</div>`;
      case "wort": return `<div class="fr-prompt">${p.bild ? frBild(p.bild, true) : ""}<div class="fr-wort">${esc(p.text)} <button class="vorlesen" data-act="fr-sag" aria-label="Anhören">🔊</button></div></div>`;
      case "deutsch": return `<div class="fr-prompt"><div class="fr-wort deutsch">${esc(p.text)}</div></div>`;
      case "artikel": return `<div class="fr-prompt">${frBild(p.bild, true)}<div class="fr-wort"><span class="vgl-platz${R.fertig ? " voll" : ""}">${R.fertig ? esc(t.loesung) : "?"}</span> ${esc(p.wort)}</div></div>`;
      case "mischen": return mischHtml(p.aus, t.wort, R.fertig);
      case "punkte": return `<div class="fr-prompt punkte">${Array.from({ length: Math.ceil(p.zahl / 5) }, (_, z) => `<div>${Array.from({ length: Math.min(5, p.zahl - z * 5) }, () => `<span>${p.ding}</span>`).join("")}</div>`).join("")}</div>`;
    }
    return "";
  }
  function frWahlHtml(t) {
    const R = ui.runde, loes = R.fertig;
    const opts = t.optionen.map((o, i) => {
      let cls = "option" + (t.anzeige === "bild" ? " bild-option" : "") + (t.typ === "artikel" ? " zeichen" : "");
      if (R.falsch.includes(o)) cls += " falsch";
      if (loes && o === t.loesung) cls += " richtig";
      return `<button class="${cls}" data-act="waehle" data-arg="${i}" ${loes || R.falsch.includes(o) ? "disabled" : ""} aria-label="${t.anzeige === "bild" ? "Bild " + (i + 1) : esc(o)}">${t.anzeige === "bild" ? frBild(t.bilder[o]) : t.typ === "artikel" ? `<b>${esc(o)}</b>` : esc(o)}</button>`;
    }).join("");
    return frPrompt(t) + `<div class="optionen${t.typ === "artikel" ? " drei" : ""}${t.anzeige === "bild" ? " bilder" : ""}">${opts}</div>`;
  }
  function buchstabenHtml(t) {
    const R = ui.runde, ziel = Array.from(t.ziel);
    const slots = ziel.map((c, i) => `<span class="slot${i < R.gelegt.length ? " voll" : i === R.gelegt.length && !R.fertig ? " jetzt" : ""}">${i < R.gelegt.length ? esc(R.gelegt[i]) : R.zeigeWort ? `<i>${esc(c)}</i>` : ""}</span>`).join("");
    return `<div class="fr-prompt">${frBild(t.prompt.bild, true)}<div class="fr-wort deutsch">${esc(t.prompt.deutsch)} <button class="vorlesen" data-act="fr-sag" aria-label="Auf Französisch anhören">🔊</button></div></div>
      <div class="wort-bau">${t.prompt.vorne ? `<span class="vorne">${esc(t.prompt.vorne)}</span>` : ""}<span class="slots">${slots}</span></div>
      ${R.fertig ? "" : `<div class="buchst-reihe">${t.kacheln.map((c, i) => `<button class="buchst${R.benutzt.includes(i) ? " weg" : ""}${R.falschKachel === i ? " wackel" : ""}" data-act="kachel" data-arg="${i}" ${R.benutzt.includes(i) ? "disabled" : ""}>${esc(c)}</button>`).join("")}</div>`}`;
  }
  function franzSeite() {
    const c = FR.CAMILLE;
    return `${kopf("Französisch", true)}<main class="franz">
      <div class="besuch-gross"><div class="gross-puppe klein">${P.puppeSvg(c.look, { mood: "jubel" })}</div><div class="sprechblase links">Bonjour, ${esc(S.name || "toi")}! Ich bin Camille. Wir üben zusammen Französisch. Schau dir zuerst die Wörter an und hör gut zu. Dann üben wir!</div></div>
      <section class="karte training"><div><h2>Vokabel-Training</h2><p class="leise">3 Etappen mit je 6 Aufgaben: Winterkleider, Farben, Zahlen. Dazwischen Geschenke und Bewegungspausen.</p></div><button class="btn haupt gross" data-act="fr-training">Los geht's!</button></section>
      ${FR.THEMEN.map((th) => { const b = FR.bereitschaft(S, th.id); return `<section class="karte fr-thema"><div class="fr-thema-kopf"><span class="station-nr">${th.icon}</span><div class="fr-thema-text"><b>${esc(th.name)}</b> <small class="leise">${esc(th.de)}</small><span class="balken"><i style="width:${b}%"></i></span><small class="leise">${b} % sitzen</small></div></div><div class="knopfzeile"><button class="btn" data-act="fr-karten" data-arg="${th.id}">👀 Wörter anschauen</button><button class="btn haupt" data-act="fr-ueben" data-arg="${th.id}">Üben</button></div></section>`; }).join("")}
      <p class="leise mitte-text">❄️ Jedes Kleidungsstück, das du auf Französisch weißt, darf ${esc(puppeName())} in der Puppenstube anziehen.</p></main>`;
  }
  function frKarten() {
    const th = FR.THEMEN.find((x) => x.id === ui.thema) || FR.THEMEN[0];
    const ws = FR.imThema(th.id);
    return `${kopf(th.name, true)}<main class="liste">
      <p class="leise">Tippe auf eine Karte, dann sagt Camille das Wort.</p>
      <div class="knopfzeile"><button class="btn" data-act="fr-alle">🔊 Alle anhören</button><button class="btn haupt" data-act="fr-ueben" data-arg="${th.id}">Jetzt üben</button><button class="btn leise-btn" data-act="franz">Zurück zu Camille</button></div>
      <div class="wortkarten">${ws.map((w) => `<button class="wortkarte${ui.spielt === w.id ? " spielt" : ""}" data-act="fr-karte" data-arg="${w.id}">${frBild(frBildVon(w), true)}<b>${esc(FR.zeige(w))}</b><small>${esc(w.de)}</small></button>`).join("")}</div>
      ${th.id === "kleidung" ? `<p class="merk">🧠 un und une heißen ein oder eine. des heißt mehrere: des gants, des bottes, des chaussettes.</p>` : ""}
      ${th.id === "farben" ? `<h2>Farben mischen</h2><div class="misch-liste">${FR.MISCHUNGEN.map((m) => mischHtml(m.aus, m.gibt, true)).join("")}</div>` : ""}
      ${th.id === "zahlen" ? `<p class="merk">🧠 Vorsicht, Zwillinge: deux und douze, trois und treize, quatre und quatorze, cinq und quinze, six und seize.</p>` : ""}</main>`;
  }
  function franzEnde() {
    const R = ui.runde, c = FR.CAMILLE;
    const neu = [...new Set(R.winterNeu || [])];
    return `${kopf()}<main class="mitte">
      <div class="besuch-gross"><div class="gross-puppe klein huepf">${P.puppeSvg(c.look, { mood: "jubel" })}</div><div class="sprechblase links">Merci, ${esc(S.name)}! ${esc(c.danke)}</div></div>
      <h1>Super geübt! 🎉</h1>
      ${R.etappen.length >= 3 ? `<p class="schatz">🎁 Schatztruhe: +${L.LOHN.mission} Edelsteine</p>` : ""}
      <p>${R.camilleNeu ? "Camille hat eine Seite in dein Freundebuch geschrieben!" : `Camille schenkt dir ein Freundschaftsherz. ♥ ${S.fr.camille ? S.fr.camille.herzen : ""}`}</p>
      ${neu.length ? `<p><b>Neu für ${esc(puppeName())}:</b></p><div class="winter-neu">${neu.map((id) => `<span>${P.kleidBild(id)}<small>${esc(FR.zeige(FR.wortById(id)))}</small></span>`).join("")}</div>` : ""}
      <button class="btn haupt gross" data-act="stube-winter">${esc(puppeName())} anziehen</button>
      <button class="btn" data-act="franz">Zurück zu Camille</button></main>`;
  }
  function winterLaden() {
    return `<div class="laden">${FR.imThema("kleidung").map((w) => {
      const hat = S.fr.winter.includes(w.id), an = S.fr.traegt.includes(w.id);
      return `<button class="laden-ding winter${hat ? " hat" : " teuer"}${an ? " an" : ""}" data-act="winter" data-arg="${w.id}">${P.kleidBild(w.id)}<span>${esc(FR.zeige(w))}</span><small>${hat ? (an ? "trägt sie · ausziehen" : "anziehen") : "🔒 bei Camille lernen"}</small></button>`;
    }).join("")}</div><p class="leise klein mitte-text">Tippe auf ein Kleidungsstück. Camille sagt dir, wie es auf Französisch heißt.</p>`;
  }

  // ================= Deutsch mit Liese =================
  const ieHtml = (s) => esc(s).replace(/ie/g, '<span class="ie">ie</span>');
  // {Wort} wird fett, das ie darin farbig. Der Rest bleibt normaler Text.
  const deText = (s) => String(s || "").split(/\{([^}]*)\}/).map((x, i) => (i % 2 ? `<b class="de-mark">${ieHtml(x)}</b>` : esc(x))).join("");
  const deBild = (b, gross) => (b ? `<span class="de-bild${gross ? " gross" : ""}" aria-hidden="true">${esc(b)}</span>` : "");
  const deSatz = (satz, wortHtml) => (satz ? `<p class="de-satz">${esc(satz[0])}${wortHtml}${esc(satz[1])}</p>` : "");
  // Satz mit dem Wort fett und farbigem ie (für Wiese und Wortkarten)
  const deSatzMark = (w) => { const s = DE.satzLuecke(w); return s ? `${esc(s[0])}<b>${ieHtml(w.wort)}</b>${esc(s[1])}` : esc(w.satz); };
  const deKartenText = (w, th) => (th === "reime" && w.reim ? `${DE.zeige(w)}, ${DE.zeige(DE.wortById(w.reim))}` : th === "silben" && w.silben ? `${w.silben.join(", ")}. ${w.wort}` : DE.zeige(w));
  function deLuecke(t) {
    const R = ui.runde;
    return `<span class="luecke${R.fertig ? " voll" : ""}">${R.fertig ? (t.loesung === "ie" ? '<span class="ie">ie</span>' : esc(t.loesung)) : "?"}</span>`;
  }
  function dePrompt(t) {
    const p = t.prompt, R = ui.runde;
    const hoer = `<button class="vorlesen" data-act="de-sag" aria-label="Anhören">🔊</button>`;
    switch (p.typ) {
      case "bild": return `<div class="fr-prompt">${deBild(p.bild, true)}</div>`;
      case "luecke": case "gross": {
        const wort = p.typ === "luecke" ? `${esc(p.a)}${deLuecke(t)}${esc(p.b)}` : `${deLuecke(t)}${ieHtml(p.rest)}`;
        if (p.bild) return `<div class="fr-prompt">${deBild(p.bild, true)}<div class="de-wort">${p.vor ? `<span class="vorne">${esc(p.vor)}</span>` : ""}<span>${wort}</span>${hoer}</div></div>`;
        return `<div class="fr-prompt">${deSatz(p.satz, `<span class="de-im-satz">${wort}</span>`)}${hoer}</div>`;
      }
      case "hoeren-lang": return `<div class="fr-prompt"><button class="hoer-knopf" data-act="de-sag" aria-label="Alle drei Wörter anhören">🔊</button><p class="leise">Tippe auf den Lautsprecher, dann hörst du alle drei Wörter.</p></div>`;
      case "wort": return `<div class="fr-prompt">${deBild(p.bild, true)}<div class="de-wort">${ieHtml(p.text)}${hoer}</div></div>`;
      case "silbe": return `<div class="fr-prompt"><div class="silben-bau"><span class="silbe-stein">${ieHtml(p.erste)}</span><b>+</b><span class="silbe-stein${R.fertig ? " voll" : " leer"}">${R.fertig ? esc(t.loesung) : "?"}</span>${R.fertig ? `<b>=</b><span class="de-wort">${ieHtml(DE.wortById(t.wort).wort)}</span>` : ""}</div></div>`;
    }
    return "";
  }
  function deWahlHtml(t) {
    const R = ui.runde, loes = R.fertig, bild = t.anzeige === "bild";
    const kurz = t.typ === "luecke" || t.typ === "silbe" || t.typ === "gross";
    const opts = t.optionen.map((o, i) => {
      let cls = "option" + (bild ? " bild-option" : kurz ? " zeichen" : " wort-option");
      if (R.falsch.includes(o)) cls += " falsch";
      if (loes && o === t.loesung) cls += " richtig";
      const inhalt = bild ? `${deBild(t.bilder[o])}${loes ? `<small>${esc(t.namen[o])}</small>` : ""}` : kurz ? `<b>${esc(o)}</b>` : ieHtml(o);
      return `<button class="${cls}" data-act="waehle" data-arg="${i}" ${loes || R.falsch.includes(o) ? "disabled" : ""} aria-label="${bild ? "Bild " + (i + 1) : esc(o)}">${inhalt}</button>`;
    }).join("");
    return dePrompt(t) + `<div class="optionen${t.optionen.length === 3 ? " drei" : ""}${bild ? " de-bilder" : kurz ? "" : " worte"}">${opts}</div>`;
  }
  function deBuchstabenHtml(t) {
    const R = ui.runde, ein = t.einheiten, p = t.prompt;
    // Liegen i und e nebeneinander, halten sie sich an der Hand (rosa mit Herz)
    const ieBaustein = ein.indexOf("ie"), iePos = ieBaustein >= 0 ? ieBaustein : t.ziel.indexOf("ie");
    const ePos = ieBaustein >= 0 ? ieBaustein : iePos + 1;
    const paar = R.gelegt.length > ePos;
    const slots = ein.map((c, i) => {
      let cls = "slot" + (c === "ie" ? " ie-slot" : "");
      if (i < R.gelegt.length) cls += " voll"; else if (i === R.gelegt.length && !R.fertig) cls += " jetzt";
      if (paar && i >= iePos && i <= ePos) cls += " ie-an" + (i === ePos ? " ie-herz" : "");
      return `<span class="${cls}">${i < R.gelegt.length ? esc(R.gelegt[i]) : R.zeigeWort ? `<i>${esc(c)}</i>` : ""}</span>`;
    }).join("");
    const hoer = `<button class="vorlesen" data-act="de-sag" aria-label="Anhören">🔊</button>`;
    const luecke = `<span class="satz-luecke">${R.fertig ? ieHtml(t.ziel) : "…"}</span>`;
    const oben = p.diktat ? `<div class="fr-prompt"><button class="hoer-knopf" data-act="de-sag" aria-label="Noch einmal anhören">🔊</button>${deSatz(p.satz, luecke)}</div>`
      : p.bild ? `<div class="fr-prompt">${deBild(p.bild, true)}${hoer}</div>` : `<div class="fr-prompt">${deSatz(p.satz, luecke)}${hoer}</div>`;
    const kacheln = R.fertig ? "" : `<div class="buchst-reihe">${t.kacheln.map((c, i) => `<button class="buchst${c === "ie" ? " ie-kachel" : ""}${R.benutzt.includes(i) ? " weg" : ""}${R.falschKachel === i ? " wackel" : ""}" data-act="kachel" data-arg="${i}" ${R.benutzt.includes(i) ? "disabled" : ""} aria-label="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
    return `${oben}<div class="wort-bau">${p.vorne ? `<span class="vorne">${esc(p.vorne)}</span>` : ""}<span class="slots">${slots}</span></div>${kacheln}`;
  }
  function deVorlesen() {
    const t = ui.runde.task;
    let s = t.frage;
    if (t.typ === "bild-wort" || t.typ === "reim") s += " " + t.optionen.join(". ") + ".";
    else if (t.typ !== "silbe" && t.sprich) s += " " + t.sprich;
    sprich(s);
  }
  // Erst die Regel, dann üben: beim ersten Mal erklärt Liese das lange i
  function deStart(name, arg, los) {
    if (!S.de.regel) { gehe("de-regel", { regel: { seite: 0, danach: [name, arg] } }); return; }
    los();
  }
  function deutschSeite() {
    const li = DE.LIESE, n = S.de.wiese.length, g = S.de.glitzer.length;
    return `${kopf("Deutsch", true)}<main class="franz deutsch">
      <div class="besuch-gross"><div class="gross-puppe klein">${P.puppeSvg(li.look, { mood: "jubel" })}</div><div class="sprechblase links">Hallo ${esc(S.name || "du")}! Ich bin Liese. In meinem Namen steckt ein langes i: L<span class="ie">ie</span>se. Wir lernen zusammen Wörter mit ie!</div></div>
      <section class="karte merk-karte"><div class="merk-paar">${P.iePaarSvg()}</div><div class="merk-text"><h2>Mein Merkspruch</h2><p class="merkspruch">${deText(DE.MERKSPRUCH)}</p><p class="leise klein">Meistens ist das so. Ein paar Ausnahmen gibt es auch, zum Beispiel Tiger und Kino.</p><button class="btn" data-act="de-regel">💡 So geht's</button></div></section>
      <section class="karte training deutsch-training"><div><h2>ie-Training</h2><p class="leise">3 Etappen mit je 8 Aufgaben: Bilder, Reime, Silben. Dazwischen Geschenke und Bewegungspausen.</p></div><button class="btn haupt gross" data-act="de-training">Los geht's!</button></section>
      <section class="karte training deutsch-training"><div><h2>✍️ Puppen-Diktat</h2><p class="leise">${esc(puppeName())} sagt dir 6 Wörter, du legst sie mit Buchstaben. Jedes Wort, das du selbst richtig schreibst, glitzert auf deiner Wiese.</p></div><button class="btn haupt gross" data-act="de-diktat">Diktat starten</button></section>
      ${DE.THEMEN.map((th) => { const b = DE.bereitschaft(S, th.id); return `<section class="karte fr-thema"><div class="fr-thema-kopf"><span class="station-nr">${th.icon}</span><div class="fr-thema-text"><b>${esc(th.name)}</b> <small class="leise">Buch ${esc(th.buch)}</small><span class="balken"><i style="width:${b}%"></i></span><small class="leise">${b} % sitzen</small></div></div><div class="knopfzeile"><button class="btn" data-act="de-karten" data-arg="${th.id}">👀 Wörter anschauen</button><button class="btn haupt" data-act="de-ueben" data-arg="${th.id}">Üben</button></div></section>`; }).join("")}
      <button class="karte wiese-knopf" data-act="stube-wiese"><span class="wiese-knopf-bild" aria-hidden="true">🌼🐝🌷</span><span><b>Deine Wiese</b><small>${n} von ${DE.WOERTER.length} Wörtern blühen${g ? `, ${g} glitzern` : ""}. Jedes Wort, das du auf Anhieb weißt, blüht dort.</small></span></button></main>`;
  }
  function deKarten() {
    const th = DE.THEMEN.find((x) => x.id === ui.thema) || DE.THEMEN[0];
    const an = (id) => (ui.spielt === id ? " spielt" : "");
    let karten;
    if (th.id === "reime") karten = `<div class="wortkarten paare">${DE.REIME.map(([a, b]) => { const x = DE.wortById(a), y = DE.wortById(b); return `<button class="wortkarte paar${an(a)}" data-act="de-karte" data-arg="${a}"><span class="de-bild">${esc(x.deko)} ${esc(y.deko)}</span><b>${ieHtml(DE.zeige(x))}</b><small>reimt sich auf</small><b>${ieHtml(DE.zeige(y))}</b></button>`; }).join("")}</div>`;
    else if (th.id === "silben") karten = `<div class="wortkarten">${DE.imThema("silben").map((w) => `<button class="wortkarte${an(w.id)}" data-act="de-karte" data-arg="${w.id}"><span class="de-bild">${esc(w.deko)}</span><b class="silbenboegen">${w.silben.map((x) => `<span>${ieHtml(x)}</span>`).join("")}</b></button>`).join("")}</div>`;
    else karten = `<div class="wortkarten">${DE.imThema("bilder").map((w) => `<button class="wortkarte${an(w.id)}" data-act="de-karte" data-arg="${w.id}">${deBild(w.bild, true)}<b>${ieHtml(DE.zeige(w))}</b>${w.art ? `<small>${esc(w.art)} ${esc(w.wort)}</small>` : ""}</button>`).join("")}</div>`;
    const merk = th.id === "reime" ? "Reimwörter klingen am Ende gleich. Und alle schreibt man mit {ie}." : th.id === "silben" ? "Klatsch die Silben mit: Bie-ne, Frie-den. Das {ie} steht immer in der ersten Silbe." : DE.MERKSPRUCH;
    return `${kopf(th.name, true)}<main class="liste">
      <p class="leise">Tippe auf eine Karte, dann hörst du das Wort. Schau genau: Wo steht das <span class="ie">ie</span>?</p>
      <div class="knopfzeile"><button class="btn" data-act="de-alle">🔊 Alle anhören</button><button class="btn haupt" data-act="de-ueben" data-arg="${th.id}">Jetzt üben</button><button class="btn leise-btn" data-act="deutsch">Zurück zu Liese</button></div>
      ${karten}
      <p class="merk">🧠 ${deText(merk)}</p></main>`;
  }
  function deRegelBild(b) {
    switch (b.typ) {
      case "dehnen": return `<div class="regel-bild">${deBild(b.bild, true)}<div class="dehn-wort">B<span class="gummi">iiii</span>ene</div><div class="de-wort">${ieHtml(b.wort)}</div></div>`;
      case "paar": return `<div class="regel-bild">${P.iePaarSvg("gross")}</div>`;
      case "kurz": { const i = b.wort.indexOf("i"); return `<div class="regel-bild">${deBild(b.bild, true)}<div class="de-wort">${esc(b.wort.slice(0, i))}<span class="kurz-i">i</span>${esc(b.wort.slice(i + 1))}</div></div>`; }
      case "reihe": return `<div class="regel-bild"><div class="de-wort reihe">L<span class="ie"><span class="nr">i<small>1</small></span><span class="nr">e<small>2</small></span></span>se</div><p class="leise">Erst das i, dann das e. Ganz anders als ei wie bei Eis.</p></div>`;
      case "liese": return `<div class="regel-bild zeile"><div class="gross-puppe klein">${P.puppeSvg(DE.LIESE.look, { mood: "jubel" })}</div>${P.iePaarSvg()}</div>`;
    }
    return "";
  }
  function deRegel() {
    const E = ui.regel, seiten = DE.REGEL, n = seiten.length, q = DE.REGEL_FRAGE;
    const punkte = `<div class="erk-punkte">${Array.from({ length: n + 1 }, (_, i) => `<i class="${i === E.seite ? "jetzt" : i < E.seite ? "fertig" : ""}"></i>`).join("")}</div>`;
    const kopfzeile = (text, sag, mood) => `<p class="erk-titel">💡 Das lange i</p>
      <div class="erk-kopf"><div class="mini-puppe gross">${P.kopfSvg(DE.LIESE.look, { mood })}</div><div class="sprechblase links">${text}<button class="vorlesen klein" data-act="sag" data-arg="${esc(sag)}" aria-label="Vorlesen">🔊</button></div></div>`;
    if (E.seite >= n) {
      const text = E.richtig ? "Genau! Ein langes i schreibt man meistens ie." : E.falsch ? "Fast! Hör noch einmal: Biene. Das lange i hat seine Freundin e dabei." : q.frage;
      return `${kopf("So geht's", true)}<main class="erklaerung">${kopfzeile(deText(text), text, E.richtig ? "jubel" : "froh")}
        <div class="erk-bild"><p class="leise">Wie im Buch auf Seite 79: Kreuze an!</p><div class="optionen regel-wahl">${q.optionen.map((o) => `<button class="option zeichen${E.richtig && o === q.loesung ? " richtig" : ""}${E.falsch === o ? " falsch" : ""}" data-act="de-regel-antwort" data-arg="${o}" ${E.richtig || E.falsch === o ? "disabled" : ""}><b>${esc(o)}</b></button>`).join("")}</div></div>
        ${punkte}
        <div class="knopfzeile mitte-zeile">${E.richtig ? `<button class="btn haupt gross" data-act="de-regel-fertig">${E.danach ? "Jetzt probiere ich es!" : "Verstanden!"}</button>` : `<button class="btn" data-act="de-regel-zurueck">‹ Zurück</button>`}</div></main>`;
    }
    const s = seiten[E.seite];
    return `${kopf("So geht's", true)}<main class="erklaerung">${kopfzeile(deText(s.text), s.sag || s.text, E.seite === n - 1 ? "jubel" : "froh")}
      <div class="erk-bild">${deRegelBild(s.bild)}</div>
      ${punkte}
      <div class="knopfzeile mitte-zeile">${E.seite > 0 ? `<button class="btn" data-act="de-regel-zurueck">‹ Zurück</button>` : ""}<button class="btn haupt gross" data-act="de-regel-weiter">Weiter ›</button></div></main>`;
  }
  function deutschEnde() {
    const R = ui.runde, li = DE.LIESE;
    const neu = [...new Set(R.wieseNeu || [])], gl = [...new Set(R.glitzerNeu || [])];
    return `${kopf()}<main class="mitte">
      <div class="besuch-gross"><div class="gross-puppe klein huepf">${P.puppeSvg(li.look, { mood: "jubel" })}</div><div class="sprechblase links">Danke, ${esc(S.name)}! ${esc(li.danke)}</div></div>
      <h1>Super geübt! 🎉</h1>
      ${R.etappen.length >= 3 ? `<p class="schatz">🎁 Schatztruhe: +${L.LOHN.mission} Edelsteine</p>` : ""}
      <p>${R.lieseNeu ? "Liese hat eine Seite in dein Freundebuch geschrieben!" : `Liese schenkt dir ein Freundschaftsherz. ♥ ${S.de.liese ? S.de.liese.herzen : ""}`}</p>
      ${neu.length ? `<p><b>Neu auf deiner Wiese:</b></p><div class="winter-neu wiese-neu">${neu.map((id) => { const w = DE.wortById(id); return `<span><i class="de-bild">${esc(w.deko)}</i><small>${ieHtml(DE.zeige(w))}${gl.includes(id) ? " ✨" : ""}</small></span>`; }).join("")}</div>` : ""}
      ${gl.length ? `<p>✨ Selbst geschrieben: ${gl.map((id) => `<b>${ieHtml(DE.zeige(DE.wortById(id)))}</b>`).join(", ")}</p>` : ""}
      <button class="btn haupt gross" data-act="stube-wiese">Zur Wiese</button>
      <button class="btn" data-act="deutsch">Zurück zu Liese</button></main>`;
  }
  // Die ie-Wiese: oben am Himmel fliegt, was fliegen kann, unten wächst der Rest. Links steht die Puppe.
  const WIESE_PLATZ = (() => {
    const pl = {}, himmel = DE.WOERTER.filter((w) => w.himmel), boden = DE.WOERTER.filter((w) => !w.himmel);
    himmel.forEach((w, i) => { pl[w.id] = { x: 8 + (i * 70) / Math.max(1, himmel.length - 1), y: 9 + (i % 2) * 12 }; });
    boden.forEach((w, i) => { const z = Math.floor(i / 8), sp = i % 8; pl[w.id] = { x: 29 + sp * 9 + (z % 2 ? 4 : 0), y: 42 + z * 9.4 }; });
    return pl;
  })();
  function wieseHtml() {
    const d = S.de, w = ui.wieseWort ? DE.wortById(ui.wieseWort) : null;
    const dinge = DE.WOERTER.map((x) => {
      const pl = WIESE_PLATZ[x.id], bl = d.wiese.includes(x.id), gl = d.glitzer.includes(x.id);
      return `<button class="wiese-ding${bl ? " blueht" : " keim"}${gl ? " glitzer" : ""}${ui.wieseWort === x.id ? " an" : ""}" style="left:${pl.x}%;top:${pl.y}%" data-act="wiese-ding" data-arg="${x.id}" aria-label="${bl ? esc(DE.zeige(x)) : "Hier wächst noch etwas"}">${bl ? esc(x.deko) : x.himmel ? "☁️" : "🌱"}</button>`;
    }).join("");
    const blase = !w ? "" : d.wiese.includes(w.id) ? `<div class="wiese-blase" role="status"><b>${ieHtml(DE.zeige(w))}${d.glitzer.includes(w.id) ? " ✨" : ""}</b><small>${deSatzMark(w)}</small></div>`
      : `<div class="wiese-blase" role="status"><b>${w.himmel ? "☁️ Was steckt hinter der Wolke?" : "🌱 Hier wächst noch etwas."}</b><small>Übe bei Liese, dann ${w.himmel ? "kommt hier ein Wort mit ie heraus" : "blüht hier ein Wort mit ie"}.</small></div>`;
    return `<div class="wiese" role="group" aria-label="Deine ie-Wiese"><div class="wiese-sonne" aria-hidden="true"></div><div class="wiese-huegel" aria-hidden="true"></div>
      <div class="wiese-puppe" aria-hidden="true">${puppe(d.wiese.length ? "jubel" : "froh")}</div>${dinge}${blase}</div>
      <p class="leise mitte-text">🌼 ${d.wiese.length} von ${DE.WOERTER.length} Wörtern blühen. ✨ ${d.glitzer.length} hast du selbst geschrieben. Tippe auf ein Bild, dann hörst du das Wort.</p>
      <div class="mitte"><button class="btn haupt" data-act="deutsch">Zu Liese: mehr Wörter lernen</button></div>`;
  }

  // ================= So geht's =================
  function erklaerung() {
    const E = ui.erk, seiten = ERK[E.skill] || [];
    const s = seiten[E.seite] || { text: "" };
    const letzte = E.seite >= seiten.length - 1;
    return `${kopf("So geht's", true)}<main class="erklaerung">
      <p class="erk-titel">💡 ${esc(skillName(E.skill))}</p>
      <div class="erk-kopf"><div class="mini-puppe gross">${P.kopfSvg(S.puppe, { mood: letzte ? "jubel" : "froh", traegt: S.traegt, winter: winter() })}</div><div class="sprechblase links">${esc(s.text)}<button class="vorlesen klein" data-act="sag" data-arg="${esc(s.text)}" aria-label="Vorlesen">🔊</button></div></div>
      <div class="erk-bild">${bildHtml(s.bild)}</div>
      <div class="erk-punkte">${seiten.map((_, i) => `<i class="${i === E.seite ? "jetzt" : i < E.seite ? "fertig" : ""}"></i>`).join("")}</div>
      <div class="knopfzeile mitte-zeile">
        ${E.seite > 0 ? `<button class="btn" data-act="erk-zurueck">‹ Zurück</button>` : ""}
        ${letzte ? `<button class="btn haupt gross" data-act="erk-fertig">${E.ausRunde ? "Jetzt probiere ich es!" : "Verstanden!"}</button>` : `<button class="btn haupt gross" data-act="erk-weiter">Weiter ›</button>`}
      </div></main>`;
  }
  function sogehts() {
    return `${kopf("So geht's", true)}<main class="liste">
      <p class="leise">Hier kannst du dir jeden Rechentrick noch einmal erklären lassen.</p>
      ${L.THEMEN.map((th) => `<h2>${esc(th.icon)} ${esc(th.name)}</h2><div class="skill-knoepfe">${th.skills.filter((id) => ERK[id]).map((id) => `<button class="btn" data-act="erk" data-arg="${id}">${esc(skillName(id))}</button>`).join("")}</div>`).join("")}</main>`;
  }

  // ================= Lernpfad =================
  function lernpfad() {
    const fok = L.fokus(S);
    return `${kopf("Lernpfad", true)}<main class="pfad">
      ${L.THEMEN.map((th, i) => {
        const offen = S.offen.includes(th.id);
        const b = L.bereitschaft(S, th.id);
        const sterne = th.skills.reduce((a, id) => a + L.teilStand(S, id).sterne, 0);
        const med = S.medaillen[th.id];
        return `<button class="station${offen ? "" : " zu"}${th.id === fok ? " hier" : ""}${med ? " medaille" : ""}" data-act="${offen ? "thema" : "zu"}" data-arg="${th.id}">
          <span class="station-nr">${offen ? esc(th.icon) : "🔒"}</span>
          <span class="station-text"><b>${esc(th.name)}${med ? " 🏅" : ""}</b>${th.id === S.schule ? `<small class="schule-marke">🏫 Gerade in der Schule</small>` : ""}${offen ? `<span class="balken"><i style="width:${b}%"></i></span><small>★ ${sterne} von ${th.skills.length * 3}${th.id === fok ? " · Hier bist du!" : ""}${med ? " · Medaille geholt!" : b < 100 ? " · Bei 100 % gibt es eine Medaille" : ""}</small>` : `<small>Wird frei, wenn das Thema davor gut sitzt.</small>`}</span>
        </button>${i < L.THEMEN.length - 1 ? `<div class="pfad-weg" aria-hidden="true"></div>` : ""}`;
      }).join("")}</main>`;
  }
  function themaSeite() {
    const th = L.themaById(ui.thema);
    return `${kopf(th.name, true)}<main class="liste">
      ${th.skills.map((id) => {
        const p = L.teilStand(S, id);
        return `<div class="skill-karte"><div><b>${esc(skillName(id))}</b><div class="mini-sterne">${"★".repeat(p.sterne)}<span>${"★".repeat(3 - p.sterne)}</span></div></div>
          <div class="knopfzeile">${ERK[id] ? `<button class="btn" data-act="erk" data-arg="${id}">💡 So geht's</button>` : ""}<button class="btn haupt" data-act="ueben-skill" data-arg="${id}">Üben</button></div></div>`;
      }).join("")}
      <button class="btn haupt gross" data-act="ueben-thema" data-arg="${th.id}">Ganzes Thema üben</button></main>`;
  }

  // ================= Freundebuch =================
  function freundebuch() {
    const zahl = Object.keys(S.freunde).length;
    const sticker = L.STICKER.filter((k) => S.sticker[k]).length;
    return `${kopf("Freundebuch", true)}<main class="liste">
      <p class="leise">${zahl ? `${zahl} von ${L.FREUNDE.length} Freundinnen und Freunden haben schon in dein Buch geschrieben.` : "Hilf bei der Tagesmission, dann schreiben deine Puppenfreunde hier hinein."}</p>
      <div class="freunde">${(S.fr && S.fr.camille ? [FR.CAMILLE] : []).concat(S.de && S.de.liese ? [DE.LIESE] : [], L.FREUNDE).map((f) => {
        const x = freundStand(f.id);
        return x ? `<button class="freund-karte" data-act="freund" data-arg="${f.id}">${freundKopf(f)}<b>${esc(f.name)}</b><small>♥ ${x.herzen}</small></button>`
          : `<div class="freund-karte leer"><span class="fragezeichen">?</span><b>???</b><small>kommt noch</small></div>`;
      }).join("")}</div>
      <h2>Stickeralbum <small class="leise">${sticker} von ${L.STICKER.length}</small></h2>
      <div class="album">${L.STICKER.map((k) => `<span class="sticker${S.sticker[k] ? "" : " leer"}">${S.sticker[k] ? k : ""}${S.sticker[k] > 1 ? `<b>${S.sticker[k]}</b>` : ""}</span>`).join("")}</div></main>`;
  }
  function freundSeite() {
    const f = freund(ui.freund), x = freundStand(f.id);
    if (!x) return freundebuch();
    return `${kopf("Freundebuch", true)}<main class="freund-seite">
      <div class="freund-bild">${P.puppeSvg(f.look, { mood: "jubel" })}</div>
      <div class="freund-blatt">
        <h1>${esc(f.name)}</h1>
        <p><span class="leise">Ich mag:</span> ${esc(f.mag)}</p>
        <p><span class="leise">Meine Lieblingsfarbe:</span> ${esc(f.farbe)}</p>
        <p><span class="leise">Wir sind Freunde seit:</span> ${x.ab ? new Date(x.ab + "T12:00:00").toLocaleDateString("de-DE") : "heute"}</p>
        <p class="herzen-zeile">${"♥".repeat(Math.min(10, x.herzen))}${x.herzen > 10 ? " +" + (x.herzen - 10) : ""}</p>
        <p class="notiz">Liebe ${esc(S.name || "Freundin")}, danke, dass du mir geholfen hast! Du bist drangeblieben, auch wenn es schwer war. Das finde ich toll. Dein${f.sie ? "e" : ""} ${esc(f.name)}</p>
      </div>
      <button class="btn" data-act="freundebuch">Zurück zum Freundebuch</button></main>`;
  }

  // ================= Puppenstube (Laden) =================
  function stube() {
    const reiter = ui.reiter || "leckeres";
    const st = L.stufe(S.punkte), naechste = L.STUFEN[st + 1];
    let laden = "";
    if (reiter === "winter") laden = winterLaden();
    else if (reiter === "wiese") laden = wieseHtml();
    else if (reiter === "frisur") {
      const e = S.puppe;
      laden = `<div class="frisier"><h3>Frisur</h3><div class="frisuren">${Object.keys(L.FRISUREN).map((f) => `<button class="frisur${f === e.frisur ? " aktiv" : ""}" data-act="s-frisur" data-arg="${f}">${P.kopfSvg(Object.assign({}, e, { frisur: f }))}<span>${L.FRISUREN[f]}</span></button>`).join("")}</div>
        <h3>Haarfarbe</h3>${farbKreise("s-haar", Object.keys(L.HAAR), e.haar, (w) => L.HAAR[w])}
        <h3>Lieblingsfarbe für Kleider</h3>${farbKreise("s-farbe", Object.keys(L.FARBEN), e.farbe, (w) => L.FARBEN[w])}
        <p class="leise klein">Frisieren kostet nichts. Probier alles aus!</p></div>`;
    } else {
      const liste = L.SHOP[reiter];
      laden = `<div class="laden">${liste.map((d) => {
        const kleid = reiter === "kleider", schmuck = reiter === "schmuck";
        const hat = S.besitz.includes(d.id) || (kleid && d.preis === 0);
        const an = (kleid && S.puppe.kleid === d.id) || (schmuck && S.traegt.includes(d.id));
        const unter = reiter === "leckeres" ? `${d.preis} 💎` : hat ? (kleid ? (an ? (d.id === "kleid" ? "trägt sie" : "trägt sie · ausziehen") : "anziehen") : schmuck ? (an ? "trägt sie · ablegen" : "anlegen") : "im Zimmer") : `${d.preis} 💎`;
        return `<button class="laden-ding${hat ? " hat" : ""}${an ? " an" : ""}${!hat && S.muenzen < d.preis ? " teuer" : ""}" data-act="kaufen" data-arg="${d.id}" ${reiter === "moebel" && hat ? "disabled" : ""}><span class="icon">${d.icon}</span><span>${esc(d.name)}</span><small>${unter}</small></button>`;
      }).join("")}</div>`;
    }
    return `${kopf(puppeName(), true)}<main class="stube-seite">
      <section class="zimmer-box gross${ui.mood ? " " + ui.mood : ""}" data-act="streicheln" aria-label="${esc(puppeName())} kitzeln">
        ${P.zimmerSvg(S.puppe, { besitz: S.besitz, traegt: S.traegt, winter: winter(), stufe: st, mood: ui.mood || "froh", essen: ui.essen })}
        ${ui.sagt ? `<div class="sprechblase">${esc(ui.sagt)}</div>` : ""}
        ${ui.mood === "jubel" ? `<div class="herzen" aria-hidden="true"><i>❤</i><i>❤</i><i>❤</i></div>` : ""}
      </section>
      <p class="leise mitte-text">${esc(L.STUFEN[st].name)}. ${naechste ? `Noch ${naechste.ab - S.punkte} Punkte, dann wird die Puppenstube noch schöner.` : "Schöner geht es nicht!"}</p>
      <nav class="reiter">${[["leckeres", "🍓 Teeparty"], ["kleider", "👗 Kleider"], ["winter", "❄️ Winter"], ["wiese", "🌼 Wiese"], ["schmuck", "🎀 Schmuck"], ["moebel", "🛋️ Möbel"], ["frisur", "✂️ Frisieren"]].map(([id, n]) => `<button class="${reiter === id ? "aktiv" : ""}" data-act="stube-reiter" data-arg="${id}">${n}</button>`).join("")}</nav>
      ${laden}</main>`;
  }
  let moodTimer = null;
  function puppeReagiert(mood, sagt, ms, essen) {
    ui.mood = mood; ui.sagt = sagt; ui.essen = essen || null; render();
    clearTimeout(moodTimer); moodTimer = setTimeout(() => { if (ui.ansicht === "stube") { ui.mood = null; ui.sagt = null; ui.essen = null; render(); } }, ms || 2200);
  }

  // ================= Hausaufgaben-Zeit =================
  // Die Puppe macht mit: kleine Startschritte, eine ruhige Uhr, Belohnung am Ende.
  let haTimer = null;
  const HA_HAKEN = ["Heft und Stift liegen bereit", "Ich weiß, womit ich anfange", "Etwas zu trinken steht da"];
  const HA_SAETZE = ["Ich bin bei dir. Wir machen das zusammen.", "Eine Aufgabe nach der anderen.", "Du machst das richtig gut!", "Wenn du feststeckst: Lies die Aufgabe noch einmal laut.", "Ich lese auch ganz konzentriert.", "Schritt für Schritt kommst du voran."];
  function hausaufgaben() {
    const h = ui.ha || (ui.ha = { schritt: "start", haken: [false, false, false], min: 10 });
    if (h.schritt === "start") {
      return `${kopf("Hausaufgaben-Zeit", true)}<main class="mitte ha">
        <div class="besuch-gross"><div class="gross-puppe klein">${puppe("froh", { buch: true })}</div><div class="sprechblase links">Ich mache meine Hausaufgaben mit dir zusammen! Zuerst machen wir uns startklar.</div></div>
        <div class="haken-liste">${HA_HAKEN.map((t, i) => `<button class="haken${h.haken[i] ? " an" : ""}" data-act="ha-haken" data-arg="${i}"><span>${h.haken[i] ? "☑" : "☐"}</span>${esc(t)}</button>`).join("")}</div>
        <h2>Wie lange?</h2>
        <div class="knopfzeile mitte-zeile">${[5, 10, 15].map((m) => `<button class="btn${h.min === m ? " haupt" : ""}" data-act="ha-min" data-arg="${m}">${m} Minuten</button>`).join("")}</div>
        <button class="btn haupt gross" data-act="ha-los">Los geht's!</button></main>`;
    }
    if (h.schritt === "laeuft") {
      return `${kopf("Hausaufgaben-Zeit")}<main class="mitte ha">
        <div class="besuch-gross"><div class="gross-puppe klein">${puppe(h.pause ? "froh" : "denk", { buch: !h.pause })}</div><div class="sprechblase links" id="ha-satz">${esc(h.pause ? "Kurze Pause. Sag Bescheid, wenn es weitergeht!" : h.satz || HA_SAETZE[0])}</div></div>
        <div class="pause-uhr ha-uhr"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44"/><circle id="ha-ring" class="ring" cx="50" cy="50" r="44" style="stroke-dashoffset:0"/></svg><span id="ha-rest">${zeitText(haRest())}</span></div>
        <div class="knopfzeile mitte-zeile"><button class="btn" data-act="ha-pause">${h.pause ? "Weiter machen" : "Kurze Pause"}</button><button class="btn haupt" data-act="ha-fertig">Ich bin fertig!</button></div></main>`;
    }
    return `${kopf("Hausaufgaben-Zeit")}<main class="mitte ha">
      <div class="gross-puppe huepf">${puppe("jubel")}</div>
      <h1>Geschafft! 🎉</h1>
      <p>${h.minuten >= 1 ? `Du hast ${h.minuten} ${h.minuten === 1 ? "Minute" : "Minuten"} an deinen Hausaufgaben gearbeitet.` : "Schon fertig? Prima!"}</p>
      ${h.lohn ? `<p class="schatz">+${h.lohn} Edelsteine für ${esc(puppeName())}</p>` : `<p class="leise">Ab 5 Minuten gibt es Edelsteine.</p>`}
      ${h.sticker ? `<p>Und ein Sticker für dein Album: <span class="sticker-klein">${h.sticker}</span></p>` : ""}
      <button class="btn haupt gross" data-act="ha-noch">Noch eine Runde</button>
      <button class="btn" data-act="heim">Zur Startseite</button></main>`;
  }
  const zeitText = (ms) => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  function haRest() { const h = ui.ha; const gelaufen = h.gesammelt + (h.pause ? 0 : Date.now() - h.seit); return Math.max(0, h.min * 60000 - gelaufen); }
  function haTick() {
    const h = ui.ha; if (!h || h.schritt !== "laeuft") { clearInterval(haTimer); return; }
    const rest = haRest(), ges = h.min * 60000;
    const el = document.getElementById("ha-rest"); if (el) el.textContent = zeitText(rest);
    const ring = document.getElementById("ha-ring"); if (ring) ring.style.strokeDashoffset = String(276.5 * (1 - rest / ges));
    if (!h.pause) {
      const gelaufen = ges - rest;
      const satz = rest < 60000 ? "Gleich hast du es geschafft!" : gelaufen > ges / 2 && gelaufen < ges / 2 + 20000 ? "Schon mehr als die Hälfte geschafft!" : HA_SAETZE[Math.floor(gelaufen / 90000) % HA_SAETZE.length];
      if (satz !== h.satz) { h.satz = satz; const s = document.getElementById("ha-satz"); if (s) s.textContent = satz; }
    }
    if (rest <= 0) haEnde();
  }
  function haEnde() {
    clearInterval(haTimer);
    const h = ui.ha;
    const ms = h.gesammelt + (h.pause ? 0 : Date.now() - h.seit);
    const minuten = Math.min(h.min, Math.round(ms / 60000));
    tag().haSek += Math.round(Math.min(ms, h.min * 60000) / 1000);
    const lohn = L.HA_LOHN(minuten);
    S.muenzen += lohn;
    let sticker = null;
    if (minuten >= 5 && Math.random() < 0.4) { const fehlend = L.STICKER.filter((k) => !S.sticker[k]); sticker = fehlend.length ? pick(fehlend) : pick(L.STICKER); S.sticker[sticker] = (S.sticker[sticker] || 0) + 1; }
    ui.ha = { schritt: "ende", minuten, lohn, sticker, haken: [false, false, false], min: h.min };
    speichern(); render(); if (lohn) { konfetti(); ton(12, "glitzer"); }
  }

  // ================= Eltern-Übersicht =================
  function eltern() {
    const reiter = ui.reiter || "fortschritt";
    let inhalt = "";
    if (reiter === "fortschritt") {
      const wack = L.wackelt(S).slice(0, 20);
      const tage = []; for (let i = 6; i >= 0; i--) { const d = L.plusTage(heute(), -i); const x = S.tage[d] || {}; tage.push([d, Math.round((x.sek || 0) / 60), Math.round((x.haSek || 0) / 60)]); }
      const maxMin = Math.max(15, ...tage.map((x) => x[1] + x[2]));
      const missionen = Object.values(S.tage).filter((x) => x.mission).length;
      inhalt = `<h2>Wie gut sitzt jedes Thema?</h2>
        ${L.THEMEN.map((th) => { const b = L.bereitschaft(S, th.id); const offen = S.offen.includes(th.id); return `<div class="ergebnis${offen ? "" : " zu"}"><span>${esc(th.icon)} ${esc(th.name)}</span><span class="balken"><i style="width:${b}%"></i></span><b>${offen ? b + " %" : "🔒"}</b></div>`; }).join("")}
        <p class="leise klein">100 % heißt: jeder Lernteil wurde mehrmals hintereinander auf Anhieb richtig gelöst. Ab 60 % öffnet sich das nächste Thema.</p>
        <h2>Was noch wackelt</h2>
        ${wack.length ? `<ul class="wackel-liste">${wack.map((id) => `<li>${esc(skillName(id))} <span class="leise">(${esc(L.themaById(L.themaVon(id)).name)})</span></li>`).join("")}</ul>` : `<p class="leise">Gerade nichts. Prima!</p>`}
        <h2>Zeit der letzten 7 Tage</h2>
        <div class="tage-balken">${tage.map(([d, m, h]) => `<div><span class="ha" style="height:${Math.round((100 * h) / maxMin)}%"></span><span style="height:${Math.round((100 * m) / maxMin)}%"></span><b>${m + h}</b><small>${["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][new Date(d + "T12:00:00").getDay()]}</small></div>`).join("")}</div>
        <p class="leise klein"><span class="legende-punkt"></span> Minuten Üben in der App (Rechnen, Französisch, Deutsch) · <span class="legende-punkt ha"></span> Minuten Hausaufgaben-Zeit. Tagesmissionen bisher: ${missionen}. Freundebuch: ${Object.keys(S.freunde).length} von ${L.FREUNDE.length}.</p>
        <h2>Französisch</h2>
        ${FR.THEMEN.map((th) => { const b = FR.bereitschaft(S, th.id); return `<div class="ergebnis"><span>${esc(th.icon)} ${esc(th.de)}</span><span class="balken"><i style="width:${b}%"></i></span><b>${b} %</b></div>`; }).join("")}
        <p class="leise klein">100 % heißt: jedes Wort wurde erkannt, gewusst und richtig mit Buchstaben gelegt. Noch unsicher: ${esc(FR.WOERTER.filter((w) => FR.stand(S, w.id).n > 0 && FR.stand(S, w.id).box <= 1).map(FR.zeige).join(", ") || "nichts")}.</p>
        <h2>Deutsch: Wörter mit ie</h2>
        ${DE.THEMEN.map((th) => { const b = DE.bereitschaft(S, th.id); return `<div class="ergebnis"><span>${esc(th.icon)} ${esc(th.name)}</span><span class="balken"><i style="width:${b}%"></i></span><b>${b} %</b></div>`; }).join("")}
        <p class="leise klein">100 % heißt: jedes Wort wurde erkannt, gewusst und selbst richtig geschrieben. Auf der Wiese blühen ${S.de.wiese.length} von ${DE.WOERTER.length} Wörtern, ${S.de.glitzer.length} davon selbst geschrieben. Noch unsicher: ${esc(DE.WOERTER.filter((w) => DE.stand(S, w.id).n > 0 && DE.stand(S, w.id).box <= 1).map(DE.zeige).join(", ") || "nichts")}.</p>`;
    } else if (reiter === "pfad") {
      const bis = L.THEMEN.findIndex((t) => t.id === S.schule);
      inhalt = `<h2>Lernpfad</h2>
        <label>In der Schule ist die Klasse gerade bei: <select class="eingabe klein" data-change="schule">${L.THEMEN.map((t) => `<option value="${t.id}" ${t.id === S.schule ? "selected" : ""}>${esc(t.icon + " " + t.name)}</option>`).join("")}</select></label>
        <p class="leise klein">Alles bis zum Schulstand ist offen und wird zum Aufwärmen wiederholt. Die Tagesmission übt vor allem das erste Thema ab dem Schulstand, das noch nicht sitzt. Die Themen danach öffnen sich, sobald das vorige zu 60 % sitzt. Sie können sie auch hier freischalten oder einen festen Schwerpunkt setzen.</p>
        <table class="plan"><tbody>
        <tr><td colspan="3"><label class="schalter"><input type="radio" name="fokus" value="" data-change="fokus" ${S.fokus ? "" : "checked"}> Schwerpunkt automatisch wählen (ab dem Schulstand)</label></td></tr>
        ${L.THEMEN.map((th, i) => `<tr><td><label class="schalter"><input type="radio" name="fokus" value="${th.id}" data-change="fokus" ${S.fokus === th.id ? "checked" : ""} ${S.offen.includes(th.id) ? "" : "disabled"}> ${esc(th.icon)} ${esc(th.name)}</label><small class="leise">${esc(th.buch)}</small></td>
          <td>${L.bereitschaft(S, th.id)} %</td>
          <td>${i <= bis ? "offen" : `<label class="schalter"><input type="checkbox" data-change="offen" value="${th.id}" ${S.offen.includes(th.id) ? "checked" : ""}> offen</label>`}</td></tr>`).join("")}
        </tbody></table>`;
    } else if (reiter === "einst") {
      const e = S.einst;
      const sel = (id, werte, akt, fmt) => `<select id="${id}" class="eingabe klein" data-change="einst">${werte.map((w) => `<option value="${w}" ${w === akt ? "selected" : ""}>${fmt ? fmt(w) : w}</option>`).join("")}</select>`;
      const schalter = (id, an, text) => `<label class="schalter"><input type="checkbox" id="${id}" data-change="einst" ${an ? "checked" : ""}> ${text}</label>`;
      inhalt = `<h2>Üben</h2>
        <label>Aufgaben pro Etappe ${sel("e-etappe", [3, 4, 5, 6, 8], e.etappe)}</label>
        <p class="leise klein">Bei 5 Aufgaben dauert eine Etappe etwa 4 Minuten, die Tagesmission mit Pausen rund 15 Minuten.</p>
        ${schalter("e-pause", e.pause, "Bewegungspause zwischen den Etappen")}
        <label>Dauer der Pause ${sel("e-pauseSek", [20, 30, 45, 60], e.pauseSek, (w) => w + " Sekunden")}</label>
        <h2>Darstellung</h2>
        ${schalter("e-toene", e.toene, "Töne")}
        ${schalter("e-ruhig", e.ruhig, "Ruhiger Modus (kein Konfetti, keine hüpfende Puppe)")}
        ${schalter("e-vorlesen", e.vorlesen, "Aufgaben automatisch vorlesen")}
        <h2>Namen</h2>
        <label>Name des Kindes <input id="e-name" class="eingabe klein" value="${esc(S.name)}" maxlength="20"></label>
        <label>Name der Puppe <input id="e-puppenname" class="eingabe klein" value="${esc(puppeName())}" maxlength="20"></label>
        <button class="btn" data-act="namen-speichern">Namen speichern</button>`;
    } else {
      const lb = S.lastBackup ? new Date(S.lastBackup).toLocaleString("de-DE") : "noch keine";
      inhalt = `<h2>Sicherung</h2>
        <p>Der Spielstand liegt auf diesem iPad und wird dort doppelt gespeichert (zwei Kopien im Browser und eine in der Datenbank des Browsers). Speichern Sie trotzdem ab und zu eine Sicherungsdatei, am besten in «Dateien» oder iCloud. Mit «Sicherung laden» kommt alles zurück, auch auf einem anderen Gerät.</p>
        <p class="leise">Letzte Sicherungsdatei: ${esc(lb)}</p>
        <div class="knopfzeile"><button class="btn haupt" data-act="sicherung">Sicherung speichern</button><label class="btn" for="sicherung-datei" role="button" tabindex="0">Sicherung laden</label><input type="file" id="sicherung-datei" accept=".json,application/json" hidden></div>
        <h2>Version</h2><p class="leise">Puppenstube Version ${VER.n} vom ${esc(VER.date)}</p>
        <h2>Zurücksetzen</h2>
        ${ui.reset ? `<p><b>Wirklich alles löschen?</b> Edelsteine, Puppe und Fortschritt sind dann weg. Vorher eine Sicherung speichern!</p><div class="knopfzeile"><button class="btn gefahr" data-act="reset-ja">Ja, alles löschen</button><button class="btn" data-act="reset-nein">Abbrechen</button></div>` : `<button class="btn" data-act="reset">Alles zurücksetzen …</button>`}`;
    }
    return `<header class="kopf"><h1 class="titel">Für Eltern</h1><button class="btn" data-act="heim">Zurück zur App</button></header>
      <main class="eltern">
      <nav class="reiter">${[["fortschritt", "Fortschritt"], ["pfad", "Lernpfad"], ["einst", "Einstellungen"], ["sicherung", "Sicherung"]].map(([id, n]) => `<button class="${reiter === id ? "aktiv" : ""}" data-act="eltern-reiter" data-arg="${id}">${n}</button>`).join("")}</nav>
      <section class="karte">${inhalt}</section></main>`;
  }

  // ================= Version oben =================
  function versionAnzeigen() {
    let el = document.getElementById("version");
    if (!el) { el = document.createElement("button"); el.id = "version"; el.type = "button"; document.body.insertBefore(el, app); el.onclick = () => { ui.sicherFrage = true; render(); }; }
    const alter = S.lastBackup ? (Date.now() - S.lastBackup) / 864e5 : null;
    el.textContent = `Version ${VER.n}` + (alter == null ? " · noch keine Sicherung" : alter > 7 ? ` · Sicherung vor ${Math.floor(alter)} Tagen` : " · gesichert ✓");
    el.className = alter == null || alter > 7 ? "alt" : "";
    el.setAttribute("aria-label", el.textContent + ". Antippen: Sicherung speichern");
  }

  // ================= Zeichnen =================
  function render() {
    if (ui.ansicht !== "bewegung") clearInterval(pauseTimer);
    if (!S.erstellt && ui.ansicht !== "willkommen") ui = startUi();
    let h = "";
    switch (ui.ansicht) {
      case "willkommen": h = willkommen(); break;
      case "start": h = start(); break;
      case "etappe-start": h = etappeStart(); break;
      case "runde": h = runde(); break;
      case "erklaerung": h = erklaerung(); break;
      case "etappe-ende": h = etappeEnde(); break;
      case "bewegung": h = bewegung(); break;
      case "mission-ende": h = missionEnde(); break;
      case "sogehts": h = sogehts(); break;
      case "lernpfad": h = lernpfad(); break;
      case "thema": h = themaSeite(); break;
      case "freundebuch": h = freundebuch(); break;
      case "freund": h = freundSeite(); break;
      case "stube": h = stube(); break;
      case "ha": h = hausaufgaben(); break;
      case "eltern": h = eltern(); break;
      case "franz": h = franzSeite(); break;
      case "fr-karten": h = frKarten(); break;
      case "franz-ende": h = franzEnde(); break;
      case "deutsch": h = deutschSeite(); break;
      case "de-karten": h = deKarten(); break;
      case "de-regel": h = deRegel(); break;
      case "deutsch-ende": h = deutschEnde(); break;
      default: h = start();
    }
    if (ui.sicherFrage) h += `<div class="dialog-hinter"><div class="dialog" role="dialog" aria-label="Sicherung"><h2>Spielstand sichern?</h2><p>Die Sicherungsdatei kannst du in «Dateien» ablegen. Damit geht nichts verloren.</p><div class="knopfzeile"><button class="btn haupt" data-act="sicherung">Sicherung speichern</button><button class="btn" data-act="dialog-zu">Abbrechen</button></div></div></div>`;
    document.body.classList.toggle("ruhig", !!S.einst.ruhig);
    app.innerHTML = h;
    versionAnzeigen();
    const sd = document.getElementById("sicherung-datei"); if (sd) sd.onchange = () => { if (sd.files && sd.files[0]) sicherungLaden(sd.files[0]); };
    elternKnopf();
  }
  function vorlesen() {
    const R = ui.runde; if (!R || !R.task) return;
    const t = R.task;
    let s = t.frage + (t.text ? ". " + t.text : "");
    if (t.layout === "vergleich") s += `. ${t.vergleich[0]} und ${t.vergleich[1]}`;
    else if (t.art === "wahl") s += ". " + t.optionen.join(". ");
    else if (!t.text && t.zeilen.length === 1 && t.layout === "rechnung") s += ". " + t.zeilen[0].teile.map((x) => (typeof x === "number" ? x : typeof x === "string" ? x : x.f != null ? "wie viel" : x.w || "")).join(" ");
    sprich(s);
  }

  // Langer Druck öffnet die Eltern-Übersicht (Kinder tippen nur kurz)
  function elternKnopf() {
    const b = document.getElementById("eltern-knopf"); if (!b) return;
    let tmr = null;
    const los = (e) => { e.preventDefault(); b.classList.add("drueckt"); tmr = setTimeout(() => { b.classList.remove("drueckt"); gehe("eltern", { reiter: "fortschritt" }); }, TEST.elternMs || 1500); };
    const halt = () => { clearTimeout(tmr); b.classList.remove("drueckt"); };
    b.addEventListener("pointerdown", los); b.addEventListener("pointerup", halt); b.addEventListener("pointerleave", halt); b.addEventListener("pointercancel", halt);
    b.addEventListener("click", () => { if (!document.querySelector(".eltern")) toast("Für Eltern: bitte länger gedrückt halten."); });
  }

  // ================= Aktionen =================
  function act(name, arg) {
    const R = ui.runde;
    switch (name) {
      // Willkommen
      case "w-name": { const v = (document.getElementById("name").value || "").trim(); if (!v) { toast("Schreib deinen Namen hinein."); return; } S.name = v.slice(0, 20); ui.schritt = 2; ui.entwurf = { haut: 1, haar: "braun", frisur: "zoepfe", kleid: "kleid", farbe: "rosa" }; render(); return; }
      case "g-haut": ui.entwurf.haut = Number(arg); render(); return;
      case "g-haar": ui.entwurf.haar = arg; render(); return;
      case "g-frisur": ui.entwurf.frisur = arg; render(); return;
      case "g-farbe": ui.entwurf.farbe = arg; render(); return;
      case "w-puppe-ok": ui.schritt = 3; render(); return;
      case "w-fertig": {
        const v = (document.getElementById("puppenname").value || "").trim();
        S.puppe = Object.assign({}, ui.entwurf, { name: (v || "Puppi").slice(0, 20) });
        S.erstellt = Date.now(); S.muenzen += 10; speichern();
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* egal */ }
        gehe("start"); toast("10 Edelsteine als Willkommensgeschenk!"); return;
      }
      case "heim": clearInterval(pauseTimer); gehe("start"); return;
      // Mission und Runden
      case "mission":
        if (tag().mission) return starteRunde("bonus", [{ titel: "Bonus-Runde", art: "mix" }], "Bonus-Runde");
        return starteRunde("mission", L.missionEtappen(S));
      case "etappe-los": if (bereiteEtappe()) naechsteAufgabe(); return;
      case "naechste-etappe": clearInterval(pauseTimer); R.nr++; ui = { ansicht: "etappe-start", runde: R }; render(); return;
      case "bewegung": starteBewegung(); return;
      case "pause-runde": zeitBuchen(); speichern(); gehe("start"); return;
      case "geschenk": {
        if (!R || R.geschenk) return;
        R.geschenk = L.ueberraschung(S, L.R(zufall()));
        speichern(); render(); konfetti(); ton(12, "glitzer");
        if (R.geschenk.typ === "steine") plusAnzeigen("+" + R.geschenk.n);
        return;
      }
      case "lernpfad": gehe("lernpfad"); return;
      case "thema": gehe("thema", { thema: arg }); return;
      case "zu": toast("Dieses Thema öffnet sich bald. Übe weiter, dann geht es auf!"); return;
      case "ueben-thema": { const th = L.themaById(arg); return starteRunde("ueben", [{ titel: th.name, art: "thema", thema: arg }], th.name); }
      case "ueben-skill": return starteRunde("ueben", [{ titel: skillName(arg), art: "skill", skill: arg }], skillName(arg));
      case "kiste": { const n = S.fehler.length; if (!n) return; return starteRunde("kiste", [{ titel: "Übe-Korb", art: "kiste", n: Math.min(8, n) }], "Übe-Korb"); }
      case "sogehts": gehe("sogehts"); return;
      case "erk": gehe("erklaerung", { erk: { skill: arg, seite: 0, ausRunde: false } }); return;
      case "erk-weiter": ui.erk.seite++; render(); return;
      case "erk-zurueck": ui.erk.seite = Math.max(0, ui.erk.seite - 1); render(); return;
      case "erk-fertig": {
        S.gesehen[ui.erk.skill] = heute(); speichern();
        if (ui.erk.ausRunde) { ui.ansicht = "runde"; letzteAktion = Date.now(); render(); if (S.einst.vorlesen) vorlesen(); }
        else gehe("sogehts");
        return;
      }
      case "sag": sprich(arg); return;
      case "vorlesen": if (R && R.task && R.task.fach === "fr") sprich(R.task.frage); else if (R && R.task && R.task.fach === "de") deVorlesen(); else vorlesen(); return;
      // Französisch
      case "franz": gehe("franz"); return;
      case "fr-training": return starteRunde("franz", FR.missionEtappen(), "Vokabel-Training");
      case "fr-ueben": { const th = FR.THEMEN.find((x) => x.id === arg) || FR.THEMEN[0]; return starteRunde("franz", [{ titel: th.name, fach: "fr", thema: th.id, n: 8 }], th.name); }
      case "fr-karten": gehe("fr-karten", { thema: arg }); return;
      case "fr-karte": { const w = FR.wortById(arg); if (!w) return; clearTimeout(alleTimer); ui.spielt = arg; render(); sprichFr(FR.sprechText(w)); return; }
      case "fr-alle": alleAnhoeren(FR.imThema(ui.thema).map((w) => ({ id: w.id, text: FR.sprechText(w) })), 0, "fr-karten", true); return;
      case "fr-sag": if (R && R.task) sprichFr(R.task.sprich || R.task.sprichNachher); return;
      case "fr-sag-loesung": if (R && R.task) sprichFr(R.task.sprichNachher || R.task.sprich); return;
      case "stube-winter": gehe("stube", { reiter: "winter" }); return;
      // Deutsch
      case "deutsch": gehe("deutsch"); return;
      case "de-training": return deStart(name, arg, () => starteRunde("deutsch", DE.missionEtappen(), "ie-Training"));
      case "de-ueben": { const th = DE.THEMEN.find((x) => x.id === arg) || DE.THEMEN[0]; return deStart(name, th.id, () => starteRunde("deutsch", [{ titel: th.name, fach: "de", thema: th.id, n: 8 }], th.name)); }
      case "de-diktat": return deStart(name, arg, () => starteRunde("deutsch", [{ titel: "Puppen-Diktat", fach: "de", typ: "buchstaben", n: 6 }], "Puppen-Diktat"));
      case "de-karten": gehe("de-karten", { thema: arg }); return;
      case "de-karte": { const w = DE.wortById(arg); if (!w) return; clearTimeout(alleTimer); ui.spielt = arg; render(); sprich(deKartenText(w, ui.thema)); return; }
      case "de-alle": { const th = ui.thema || "bilder"; const ws = th === "reime" ? DE.REIME.map(([a]) => DE.wortById(a)) : DE.imThema(th); alleAnhoeren(ws.map((w) => ({ id: w.id, text: deKartenText(w, th) })), 0, "de-karten", false); return; }
      case "de-sag": if (R && R.task) sprich(R.task.sprich || R.task.sprichNachher, null, R.task.art === "buchstaben" ? 0.8 : 0.88); return;
      case "de-sag-loesung": if (R && R.task) sprich(R.task.sprichNachher || R.task.sprich); return;
      case "de-regel": gehe("de-regel", { regel: { seite: 0 } }); return;
      case "de-regel-weiter": ui.regel.seite = Math.min(DE.REGEL.length, ui.regel.seite + 1); ui.regel.falsch = null; render(); return;
      case "de-regel-zurueck": ui.regel.seite = Math.max(0, ui.regel.seite - 1); ui.regel.falsch = null; render(); return;
      case "de-regel-antwort": {
        if (arg === DE.REGEL_FRAGE.loesung) { ui.regel.richtig = true; ui.regel.falsch = null; render(); konfetti(); ton(12, "glitzer"); sprich("Genau! Ein langes i schreibt man meistens i e."); }
        else { ui.regel.falsch = arg; render(); sprich("Hör noch einmal: Biene."); }
        return;
      }
      case "de-regel-fertig": { const d = ui.regel.danach; S.de.regel = true; speichern(); if (d) act(d[0], d[1]); else gehe("deutsch"); return; }
      case "stube-wiese": gehe("stube", { reiter: "wiese" }); return;
      case "wiese-ding": { const w = DE.wortById(arg); if (!w) return; ui.wieseWort = arg; render(); if (S.de.wiese.includes(arg)) sprich(DE.zeige(w)); return; }
      case "winter": {
        const w = FR.wortById(arg); if (!w) return;
        sprichFr(FR.sprechText(w));
        if (!S.fr.winter.includes(arg)) { puppeReagiert(null, `${FR.zeige(w)} heißt ${w.de}. Übe es bei Camille, dann darf ich es anziehen!`, 2800); return; }
        const i = S.fr.traegt.indexOf(arg);
        if (i >= 0) S.fr.traegt.splice(i, 1);
        else { if (arg === "anorak") S.fr.traegt = S.fr.traegt.filter((x) => x !== "manteau"); if (arg === "manteau") S.fr.traegt = S.fr.traegt.filter((x) => x !== "anorak"); S.fr.traegt.push(arg); }
        speichern(); puppeReagiert("jubel", i >= 0 ? "Wieder ausgezogen!" : `${FR.zeige(w)}! Schön warm!`, 1800); return;
      }
      case "kachel": {
        if (!R || R.fertig || !R.task || R.task.art !== "buchstaben") return;
        const i = Number(arg), c = R.task.kacheln[i];
        if (R.benutzt.includes(i)) return;
        zeitBuchen();
        const de = R.task.fach === "de", teile = R.task.einheiten || Array.from(R.task.ziel);
        if (de ? DE.naechsterOk(R.task, R.gelegt, c) : FR.naechsterOk(R.task, R.gelegt, c)) {
          R.gelegt.push(c); R.benutzt.push(i); R.falschKachel = -1; R.meldung = null;
          // i und e sind zusammen: kleines Glitzern
          const ePos = teile.indexOf("ie") >= 0 ? teile.indexOf("ie") : R.task.ziel.indexOf("ie") + 1;
          if (de && R.gelegt.length - 1 === ePos) ton(9, "glitzer"); else ton(3 + R.gelegt.length);
          if (R.gelegt.length === teile.length) return aufgabeFertig();
        } else {
          R.fehler++; R.falschKachel = i;
          const tipp = de ? DE.kachelTipp(R.task, R.gelegt, c) : R.task.tipp;
          if (R.fehler >= 3) { R.zeigeWort = true; R.geholfen = true; R.meldung = { art: "loesung", text: "Ich zeige dir das Wort ganz leise. Leg es jetzt nach.", tipp }; }
          else R.meldung = { art: "tipp", text: pick(FAST), tipp };
        }
        render(); return;
      }
      case "tipp-zeigen": if (R) { R.tippOffen = true; render(); } return;
      case "weiter": naechsteAufgabe(); return;
      // Antworten
      case "feld": if (R && !R.fertig && R.fstat[Number(arg)] === "offen") { R.aktiv = Number(arg); R.wackel = -1; render(); } return;
      case "taste": {
        if (!R || ui.ansicht !== "runde") return;
        if (R.fertig) { if (arg === "ok") naechsteAufgabe(); return; }
        if (R.task.art !== "felder") return;
        const i = R.aktiv;
        if (arg === "ok") return pruefeFeld(i);
        if (arg === "weg") R.werte[i] = R.werte[i].slice(0, -1);
        else if (R.werte[i].length < 4) R.werte[i] = (R.werte[i] === "0" ? "" : R.werte[i]) + arg;
        R.wackel = -1;
        render(); return;
      }
      case "waehle": if (R && R.task.art === "wahl") pruefeWahl(R.task.optionen[Number(arg)]); return;
      // Freundebuch
      case "freundebuch": gehe("freundebuch"); return;
      case "freund": gehe("freund", { freund: arg }); return;
      // Puppenstube
      case "stube": gehe("stube", { reiter: "leckeres" }); return;
      case "stube-reiter": ui.reiter = arg; render(); return;
      case "streicheln": if (ui.ansicht === "start") { gehe("stube", { reiter: "leckeres" }); return; } puppeReagiert("jubel", pick(["Das kitzelt!", "Hihi!", "Ich hab dich lieb!", "Noch mal!"]), 1600); return;
      case "s-frisur": S.puppe.frisur = arg; speichern(); puppeReagiert("jubel", pick(["Wie schön!", "Die Frisur gefällt mir!", "Toll siehst du aus, sagt der Spiegel."]), 1600); return;
      case "s-haar": S.puppe.haar = arg; speichern(); render(); return;
      case "s-farbe": S.puppe.farbe = arg; speichern(); render(); return;
      case "kaufen": {
        const d = L.shopDing(arg); if (!d) return;
        if (L.SHOP.kleider.includes(d) && (S.besitz.includes(d.id) || d.preis === 0)) {
          if (S.puppe.kleid === d.id && d.id !== "kleid") { S.puppe.kleid = "kleid"; speichern(); puppeReagiert("jubel", "Ausgezogen! Jetzt trage ich wieder mein Kleid.", 1800); return; }
          if (S.puppe.kleid === d.id) { puppeReagiert(null, "Das ist mein Lieblingskleid!", 1600); return; }
          S.puppe.kleid = d.id; speichern(); puppeReagiert("jubel", "Das ziehe ich gern an!", 1600); return;
        }
        if (L.SHOP.schmuck.includes(d) && S.besitz.includes(d.id)) {
          const i = S.traegt.indexOf(d.id); if (i >= 0) S.traegt.splice(i, 1); else S.traegt.push(d.id);
          speichern(); render(); return;
        }
        const r = L.kaufe(S, arg);
        if (!r.ok) { if (r.grund === "muenzen") puppeReagiert(null, `Dafür fehlen noch ${r.fehlt} Edelsteine. Die bekommst du beim Rechnen!`, 2600); return; }
        speichern();
        if (r.essen) puppeReagiert("mampf", pick(["Mmh, lecker!", "Mjam! Danke!", "Das schmeckt!", "Lecker, wie bei einer echten Teeparty!"]), 2200, d.icon);
        else { puppeReagiert("jubel", L.SHOP.moebel.includes(d) ? "Wie schön meine Puppenstube wird!" : "Steht mir das?", 2000); konfetti(); }
        return;
      }
      // Hausaufgaben
      case "ha": gehe("ha", { ha: { schritt: "start", haken: [false, false, false], min: 10 } }); return;
      case "ha-haken": ui.ha.haken[Number(arg)] = !ui.ha.haken[Number(arg)]; if (ui.ha.haken[Number(arg)]) ton(5); render(); return;
      case "ha-min": ui.ha.min = Number(arg); render(); return;
      case "ha-los": {
        const min = TEST.haMin != null ? TEST.haMin : ui.ha.min;
        ui.ha = { schritt: "laeuft", min, seit: Date.now(), gesammelt: 0, pause: false, satz: "" };
        render(); clearInterval(haTimer); haTimer = setInterval(haTick, 500); return;
      }
      case "ha-pause": {
        const h = ui.ha;
        if (h.pause) { h.pause = false; h.seit = Date.now(); } else { h.gesammelt += Date.now() - h.seit; h.pause = true; }
        render(); return;
      }
      case "ha-fertig": haEnde(); return;
      case "ha-noch": ui.ha = { schritt: "start", haken: [true, true, true], min: ui.ha.min || 10 }; render(); return;
      // Eltern
      case "eltern-reiter": ui.reiter = arg; ui.reset = false; render(); return;
      case "namen-speichern": {
        const n = document.getElementById("e-name").value.trim(), pn = document.getElementById("e-puppenname").value.trim();
        if (n) S.name = n.slice(0, 20);
        if (pn) S.puppe.name = pn.slice(0, 20);
        speichern(); render(); toast("Gespeichert."); return;
      }
      case "sicherung": ui.sicherFrage = false; sicherungSpeichern(); render(); return;
      case "dialog-zu": ui.sicherFrage = false; render(); return;
      case "reset": ui.reset = true; render(); return;
      case "reset-nein": ui.reset = false; render(); return;
      case "reset-ja": {
        try { localStorage.setItem(VOR, JSON.stringify(S)); } catch (e) { /* egal */ }
        S = L.defaults(); speichern(); idbSchreiben(JSON.stringify(S)); ui = startUi(); render(); return;
      }
    }
  }
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || el.disabled) return;
    if (el.id === "eltern-knopf") return;
    e.preventDefault();
    act(el.getAttribute("data-act"), el.getAttribute("data-arg"));
  });
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "SELECT")) {
      if (e.key !== "Enter") return;
      if (t.id === "name") { e.preventDefault(); act("w-name"); }
      if (t.id === "puppenname") { e.preventDefault(); act("w-fertig"); }
      return;
    }
    if (ui.ansicht !== "runde") return;
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); act("taste", e.key); }
    else if (e.key === "Backspace") { e.preventDefault(); act("taste", "weg"); }
    else if (e.key === "Enter") { e.preventDefault(); act("taste", "ok"); }
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    const art = t && t.getAttribute("data-change");
    if (!art) return;
    if (art === "einst") {
      const e2 = S.einst;
      if (t.id === "e-etappe") e2.etappe = Number(t.value);
      if (t.id === "e-pauseSek") e2.pauseSek = Number(t.value);
      if (t.id === "e-pause") e2.pause = t.checked;
      if (t.id === "e-toene") e2.toene = t.checked;
      if (t.id === "e-ruhig") e2.ruhig = t.checked;
      if (t.id === "e-vorlesen") e2.vorlesen = t.checked;
    }
    if (art === "fokus") S.fokus = t.value || null;
    if (art === "schule") { S.schule = t.value; if (S.fokus && L.THEMEN.findIndex((x) => x.id === S.fokus) < L.THEMEN.findIndex((x) => x.id === S.schule)) S.fokus = null; }
    if (art === "offen") {
      if (t.checked && !S.offen.includes(t.value)) S.offen.push(t.value);
      if (!t.checked) { S.offen = S.offen.filter((x) => x !== t.value); if (S.fokus === t.value) S.fokus = null; }
    }
    S = L.migrate(S); speichern(); render();
  });

  // ================= Offline =================
  try { if ("serviceWorker" in navigator && location.protocol !== "file:" && !TEST.keinSW) navigator.serviceWorker.register("sw.js").catch(() => { /* ohne Offline weiter */ }); } catch (e) { /* abgeschotteter Rahmen: ohne Offline weiter */ }

  // Für die Tests: lesender Zugriff
  window.__PS = {
    stand: () => S, ui: () => ui, aufgabe: () => (ui.runde ? ui.runde.task : null), version: VER, speichern,
    // nur für Bild-Tests: eine bestimmte Aufgabe anzeigen
    zeigeFr: (spec) => { starteRunde("franz", [{ titel: "Test", fach: "fr", thema: FR.wortById(spec.wort).thema, n: 1 }], "Test"); bereiteEtappe(); ui.runde.specs = [Object.assign({ fach: "fr", stufe: 0, seed: 1 }, spec)]; naechsteAufgabe(); },
    zeigeDe: (spec) => { starteRunde("deutsch", [{ titel: "Test", fach: "de", n: 1 }], "Test"); bereiteEtappe(); ui.runde.specs = [Object.assign({ fach: "de", stufe: 0, seed: 1 }, spec)]; naechsteAufgabe(); },
    zeige: (skill, stufe, seed) => { starteRunde("ueben", [{ titel: skillName(skill), art: "skill", skill }], skillName(skill)); S.gesehen[skill] = heute(); bereiteEtappe(); ui.runde.specs = [{ skill, stufe, seed, freund: ui.runde.freund }]; naechsteAufgabe(); },
  };
  render();
})();
