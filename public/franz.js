// Französisch in der Puppenstube: Winterkleider, Farben, Zahlen 1 bis 20.
// Reine Logik ohne Oberfläche. Läuft im Browser und in Node (tools/test-franz.mjs).
// Jede Aufgabe entsteht aus (Wort, Aufgabenart, Startwert) und ist damit reproduzierbar.
(function (root) {
  "use strict";
  const L = root.PS || (typeof require === "function" ? require("./logic.js") : null);

  const THEMEN = [
    { id: "kleidung", name: "Les vêtements d'hiver", de: "Winterkleider", icon: "❄️" },
    { id: "farben", name: "Les couleurs", de: "Farben", icon: "🎨" },
    { id: "zahlen", name: "Les nombres", de: "Zahlen 1 bis 20", icon: "🔢" },
  ];
  const K = (id, art, wort, de, tipp) => ({ id, thema: "kleidung", art, wort, de, tipp });
  const C = (id, wort, de, hex, tipp) => ({ id, thema: "farben", wort, de, hex, tipp });
  const ZAHLWORT = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf", "vingt"];
  const ZAHL_DE = ["", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn", "zwanzig"];
  const ZAHL_TIPP = {
    2: "Am Ende steht ein x, das man nicht hört.", 3: "Das s am Ende hört man nicht.", 4: "Am Anfang steht qu.", 5: "Am Ende steht ein q.",
    7: "Das p in der Mitte hört man nicht.", 8: "Das h am Anfang hört man nicht.", 10: "Am Ende steht ein x.", 14: "Am Anfang steht qu.", 15: "Am Anfang steht qu.",
    17: "dix und sept mit einem Strich dazwischen.", 18: "dix und huit mit einem Strich dazwischen.", 19: "dix und neuf mit einem Strich dazwischen.", 20: "Am Ende stehen g und t. Die hört man nicht.",
  };
  const WOERTER = [
    K("echarpe", "une", "écharpe", "der Schal", "Auf dem e am Anfang sitzt ein Strich: é."),
    K("manteau", "un", "manteau", "der Mantel", "Am Ende stehen drei Buchstaben: e, a, u."),
    K("pull", "un", "pull", "der Pullover", "Am Ende stehen zwei l."),
    K("chaussettes", "des", "chaussettes", "die Socken", "Zweimal s und zweimal t: chau-ss-e-tt-es."),
    K("bonnet", "un", "bonnet", "die Mütze", "In der Mitte stehen zwei n: bon-net."),
    K("bottes", "des", "bottes", "die Stiefel", "In der Mitte stehen zwei t: bot-tes."),
    K("pantalon", "un", "pantalon", "die Hose", "Drei Silben: pan-ta-lon."),
    K("gants", "des", "gants", "die Handschuhe", "Am Ende steht ein s, das man nicht hört."),
    K("anorak", "un", "anorak", "der Anorak", "Am Ende steht ein k."),
    C("jaune", "jaune", "gelb", "#f6d21f", "j-a-u-n-e. Das e am Ende hört man kaum."),
    C("rouge", "rouge", "rot", "#e0283b", "r-o-u-g-e."),
    C("orange", "orange", "orange", "#f39a2b", "Wie auf Deutsch: o-r-a-n-g-e."),
    C("noir", "noir", "schwarz", "#2b2626", "n-o-i-r."),
    C("blanc", "blanc", "weiß", "#ffffff", "Am Ende steht ein c, das man nicht hört."),
    C("gris", "gris", "grau", "#9b9b9b", "Das s am Ende hört man nicht."),
    C("bleu", "bleu", "blau", "#2f6fd6", "Am Ende stehen e und u."),
    C("vert", "vert", "grün", "#3fa34d", "Das t am Ende hört man nicht."),
    C("violet", "violet", "lila", "#8e44ad", "Das t am Ende hört man nicht."),
    Object.assign(C("brun", "brun", "braun", "#8a5a2b", "b-r-u-n. Man darf auch marron sagen."), { auch: "marron" }),
  ].concat(ZAHLWORT.slice(1).map((w, i) => ({ id: "z" + (i + 1), thema: "zahlen", wort: w, de: ZAHL_DE[i + 1], zahl: i + 1, tipp: ZAHL_TIPP[i + 1] || "" })));
  const wortById = (id) => WOERTER.find((w) => w.id === id) || null;
  const imThema = (th) => WOERTER.filter((w) => w.thema === th);
  // So steht das Wort auf dem Blatt: mit Artikel bei den Kleidern, «brun / marron» bei braun
  const zeige = (w) => (w.art ? w.art + " " + w.wort : w.auch ? w.wort + " / " + w.auch : w.wort);
  const sprechText = (w) => (w.art ? w.art + " " + w.wort : w.auch ? w.wort + ", " + w.auch : w.wort);
  // Farben mischen wie auf dem Blatt
  const MISCHUNGEN = [
    { aus: ["jaune", "rouge"], gibt: "orange" },
    { aus: ["noir", "blanc"], gibt: "gris" },
    { aus: ["jaune", "bleu"], gibt: "vert" },
    { aus: ["bleu", "rouge"], gibt: "violet" },
    { aus: ["jaune", "rouge", "bleu", "noir"], gibt: "brun" },
  ];
  // Zahlen, die man leicht verwechselt: deux und douze, trois und treize …
  const VERWECHSEL = { 1: 11, 11: 1, 2: 12, 12: 2, 3: 13, 13: 3, 4: 14, 14: 4, 5: 15, 15: 5, 6: 16, 16: 6, 7: 17, 17: 7, 8: 18, 18: 8, 9: 19, 19: 9, 10: 20, 20: 10 };
  const CAMILLE = { id: "camille", name: "Camille", sie: true, mag: "Croissants und Lieder auf Französisch", farbe: "Bleu, blanc, rouge", danke: "Merci! Du lernst so schnell Französisch!", look: { haut: 1, haar: "dunkel", frisur: "bob", kleid: "kleid", farbe: "blau" } };

  // ---------- Aufgaben ----------
  const ARTEN = ["hoeren", "bild-wort", "fr-de", "de-fr", "artikel", "mischen", "zaehlen", "buchstaben"];
  function andere(r, w, n, wert) {
    // n andere Wörter desselben Themas, verschieden im angezeigten Wert
    const pool = r.shuffle(imThema(w.thema).filter((x) => x.id !== w.id));
    const out = [], gesehen = new Set([wert(w)]);
    if (w.zahl && VERWECHSEL[w.zahl]) pool.unshift(wortById("z" + VERWECHSEL[w.zahl]));
    for (const x of pool) { if (out.length >= n) break; const v = wert(x); if (!gesehen.has(v)) { gesehen.add(v); out.push(x); } }
    return out;
  }
  function makeTask(spec) {
    const w = wortById(spec.wort);
    if (!w) return null;
    let typ = spec.typ;
    if (typ === "artikel" && !w.art) typ = "de-fr";
    if (typ === "zaehlen" && !w.zahl) typ = "bild-wort";
    if (typ === "mischen" && !MISCHUNGEN.some((m) => m.gibt === w.id)) typ = "bild-wort";
    const r = L.R(L.hash("fr|" + w.id + "|" + typ) ^ (spec.seed >>> 0));
    const t = { fach: "fr", wort: w.id, thema: w.thema, typ, stufe: spec.stufe || 0, seed: spec.seed >>> 0, id: `fr|${w.id}|${typ}|${spec.seed >>> 0}`, art: "wahl", layout: "fr", frage: "", prompt: null, optionen: [], anzeige: "text", loesung: "", sprich: "", tipp: w.tipp || "", erklaerung: "", merk: "" };
    const bild = (x) => (x.thema === "kleidung" ? { typ: "kleid", id: x.id } : x.thema === "farben" ? { typ: "farbe", id: x.id } : { typ: "ziffer", zahl: x.zahl });
    t.bilder = {};
    const loesungsSatz = `${zeige(w)} heißt ${w.de}.`;
    switch (typ) {
      case "hoeren": {
        const opts = r.shuffle([w].concat(andere(r, w, 3, (x) => x.id)));
        t.frage = "Hör zu! Was ist das?"; t.sprich = sprechText(w); t.anzeige = "bild";
        t.optionen = opts.map((x) => x.id); t.loesung = w.id;
        opts.forEach((x) => (t.bilder[x.id] = bild(x)));
        t.prompt = { typ: "hoeren" };
        t.erklaerung = loesungsSatz; t.tipp = "Tippe auf 🔊 und hör noch einmal genau hin.";
        break;
      }
      case "bild-wort": {
        const opts = r.shuffle([w].concat(andere(r, w, 3, zeige)));
        t.frage = w.thema === "zahlen" ? "Wie heißt die Zahl auf Französisch?" : w.thema === "farben" ? "Wie heißt die Farbe auf Französisch?" : "Wie heißt das auf Französisch?";
        t.prompt = { typ: "bild", bild: bild(w) }; t.optionen = opts.map(zeige); t.loesung = zeige(w);
        t.erklaerung = loesungsSatz; t.sprichNachher = sprechText(w);
        break;
      }
      case "fr-de": {
        const opts = r.shuffle([w].concat(andere(r, w, 3, (x) => x.de)));
        t.frage = "Was heißt das auf Deutsch?"; t.sprich = sprechText(w);
        t.prompt = { typ: "wort", text: zeige(w), bild: spec.stufe === 0 ? bild(w) : null };
        t.optionen = opts.map((x) => x.de); t.loesung = w.de; t.erklaerung = loesungsSatz;
        break;
      }
      case "de-fr": {
        const opts = r.shuffle([w].concat(andere(r, w, 3, zeige)));
        t.frage = "Was heißt das auf Französisch?"; t.prompt = { typ: "deutsch", text: w.de };
        t.optionen = opts.map(zeige); t.loesung = zeige(w); t.erklaerung = loesungsSatz; t.sprichNachher = sprechText(w);
        break;
      }
      case "artikel": {
        t.frage = "Welcher kleine Begleiter passt?"; t.prompt = { typ: "artikel", wort: w.wort, bild: bild(w) };
        t.optionen = ["un", "une", "des"]; t.loesung = w.art;
        t.tipp = w.art === "des" ? "Es sind zwei davon. Bei mehreren sagt man des." : w.art === "une" ? "Dieses Wort ist ein une-Wort." : "Dieses Wort ist ein un-Wort.";
        t.merk = "un und une heißen ein oder eine, des heißt mehrere.";
        t.erklaerung = `Es heißt ${zeige(w)}.`; t.sprichNachher = sprechText(w);
        break;
      }
      case "mischen": {
        const m = MISCHUNGEN.find((x) => x.gibt === w.id);
        const opts = r.shuffle([w].concat(andere(r, w, 3, zeige)));
        t.frage = "Welche Farbe kommt heraus?"; t.prompt = { typ: "mischen", aus: m.aus };
        t.optionen = opts.map(zeige); t.loesung = zeige(w);
        t.erklaerung = `${m.aus.join(" + ")} = ${w.wort}`; t.sprichNachher = m.aus.join(" et ") + " … " + w.wort;
        t.tipp = "Stell dir vor, du malst die Farben mit dem Pinsel übereinander.";
        break;
      }
      case "zaehlen": {
        const opts = r.shuffle([w].concat(andere(r, w, 3, zeige)));
        t.frage = "Wie viele sind es? Sag es auf Französisch."; t.prompt = { typ: "punkte", zahl: w.zahl, ding: r.pick(["🎀", "⭐", "🌸", "🧦", "❄️"]) };
        t.optionen = opts.map(zeige); t.loesung = zeige(w); t.erklaerung = `${w.zahl} heißt ${w.wort}.`; t.sprichNachher = w.wort;
        t.tipp = "Zähle in Fünferreihen: 5, 10, 15, 20.";
        break;
      }
      case "buchstaben": {
        const ziel = w.wort;
        const buchst = Array.from(ziel);
        let extra = [];
        if (spec.stufe >= 2) { const pool = Array.from("aeiounrstlc").filter((c) => !buchst.includes(c)); extra = r.shuffle(pool).slice(0, 2); }
        let kacheln = r.shuffle(buchst.concat(extra));
        for (let i = 0; i < 5 && kacheln.join("") === ziel; i++) kacheln = r.shuffle(kacheln);
        t.art = "buchstaben"; t.frage = "Lege das Wort mit den Buchstaben.";
        t.prompt = { typ: "bild", bild: bild(w), deutsch: w.de, vorne: w.art || "" };
        t.ziel = ziel; t.kacheln = kacheln; t.loesung = ziel; t.sprich = sprechText(w);
        t.erklaerung = `${zeige(w)} schreibt man ${Array.from(ziel).join(" ")}.`;
        break;
      }
    }
    return t;
  }
  const checkWahl = (t, wert) => ({ ok: String(wert) === String(t.loesung) });
  // Buchstaben-Aufgabe: ist der nächste Buchstabe richtig?
  const naechsterOk = (t, gelegt, buchstabe) => Array.from(t.ziel)[gelegt.length] === buchstabe;

  // ---------- Fortschritt ----------
  function defaultsFr() { return { w: {}, winter: [], traegt: [], camille: null, runden: 0 }; }
  function migrateFr(raw) {
    const f = defaultsFr();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return f;
    const zahl = (x, d, min, max) => { x = Number(x); if (!isFinite(x)) return d; return Math.min(max, Math.max(min, Math.floor(x))); };
    if (raw.w && typeof raw.w === "object") for (const id of Object.keys(raw.w)) {
      const p = raw.w[id]; if (!wortById(id) || !p || typeof p !== "object") continue;
      f.w[id] = { box: zahl(p.box, 0, 0, 5), n: zahl(p.n, 0, 0, 1e6), ok: zahl(p.ok, 0, 0, 1e6), last: L.gueltigesDatum(p.last) ? p.last : null };
    }
    const kleid = (x) => typeof x === "string" && wortById(x) && wortById(x).thema === "kleidung";
    if (Array.isArray(raw.winter)) f.winter = [...new Set(raw.winter.filter(kleid))];
    if (Array.isArray(raw.traegt)) f.traegt = [...new Set(raw.traegt.filter((x) => kleid(x) && f.winter.includes(x)))];
    if (raw.camille && typeof raw.camille === "object") f.camille = { ab: L.gueltigesDatum(raw.camille.ab) ? raw.camille.ab : null, herzen: zahl(raw.camille.herzen, 1, 1, 1e6) };
    f.runden = zahl(raw.runden, 0, 0, 1e6);
    return f;
  }
  // logic.js kennt Französisch nicht: Spielstand hier um den Teil «fr» erweitern
  if (L && !L.__frDrin) {
    const altD = L.defaults, altM = L.migrate;
    L.defaults = () => Object.assign(altD(), { fr: defaultsFr() });
    L.migrate = (raw) => Object.assign(altM(raw), { fr: migrateFr(raw && typeof raw === "object" ? raw.fr : null) });
    L.__frDrin = true;
  }
  const stand = (s, id) => (s.fr && s.fr.w[id]) || { box: 0, n: 0, ok: 0, last: null };
  function record(s, id, ersterVersuch, heute) {
    if (!s.fr) s.fr = defaultsFr();
    const p = s.fr.w[id] || (s.fr.w[id] = { box: 0, n: 0, ok: 0, last: null });
    p.n++; p.last = heute || p.last;
    if (ersterVersuch) { p.ok++; p.box = Math.min(5, p.box + 1); } else p.box = Math.max(0, p.box - 1);
    let neuWinter = null;
    const w = wortById(id);
    if (w && w.thema === "kleidung" && !s.fr.winter.includes(id)) { s.fr.winter.push(id); neuWinter = id; }
    return { p, neuWinter };
  }
  // Wie gut sitzt ein Thema? Box 3 heißt: erkannt, gewusst und richtig geschrieben
  function bereitschaft(s, th) {
    const ws = th ? imThema(th) : WOERTER;
    return Math.round((100 * ws.reduce((a, w) => a + Math.min(3, stand(s, w.id).box) / 3, 0)) / ws.length);
  }
  function typFuer(w, box, r) {
    if (box <= 0) return r.pick(["fr-de", "hoeren"]);
    if (box === 1) return r.pick(["hoeren", "bild-wort", "de-fr"]);
    if (box === 2) return r.pick(w.thema === "kleidung" ? ["de-fr", "artikel", "buchstaben"] : w.thema === "farben" ? ["de-fr", "mischen", "buchstaben"] : ["zaehlen", "de-fr", "buchstaben"]);
    return r.pick(["buchstaben", "buchstaben", w.thema === "kleidung" ? "artikel" : "de-fr"]);
  }
  // Etappe: die schwächsten Wörter zuerst, jedes Wort höchstens einmal (außer das Thema ist zu klein)
  function buildEtappe(s, opt) {
    const r = L.R((opt.seed >>> 0) || 1);
    const n = opt.n || 6;
    const ws = opt.thema ? imThema(opt.thema) : WOERTER.slice();
    const sortiert = r.shuffle(ws).sort((a, b) => stand(s, a.id).box - stand(s, b.id).box || (stand(s, a.id).last || "").localeCompare(stand(s, b.id).last || ""));
    const wahl = [];
    for (let i = 0; wahl.length < n; i++) wahl.push(sortiert[i % sortiert.length]);
    const reihe = r.shuffle(wahl);
    for (let i = 1; i < reihe.length; i++) if (reihe[i].id === reihe[i - 1].id) { const j = reihe.findIndex((x, k) => k > i && x.id !== reihe[i - 1].id); if (j > 0) [reihe[i], reihe[j]] = [reihe[j], reihe[i]]; }
    return reihe.map((w) => { const box = stand(s, w.id).box; return { fach: "fr", wort: w.id, typ: opt.typ || typFuer(w, box, r), stufe: box >= 4 ? 2 : box >= 2 ? 1 : 0, seed: r.seed() }; });
  }
  // Vokabel-Training: drei Etappen wie auf den Blättern
  const missionEtappen = () => THEMEN.map((th) => ({ titel: th.name, art: "fr", fach: "fr", thema: th.id, n: 6 }));

  const FR = { THEMEN, WOERTER, MISCHUNGEN, CAMILLE, ARTEN, wortById, imThema, zeige, sprechText, makeTask, checkWahl, naechsterOk, defaultsFr, migrateFr, stand, record, bereitschaft, typFuer, buildEtappe, missionEtappen };
  root.PS_FR = FR;
  if (typeof module !== "undefined" && module.exports) module.exports = FR;
})(typeof window !== "undefined" ? window : globalThis);
