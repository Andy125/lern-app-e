// Puppenstube: reine Logik ohne Oberfläche. Läuft im Browser und in Node (tools/test-logic.mjs).
// Jede Aufgabe entsteht aus (Lernteil, Stufe, Startwert, Besuch) und ist damit reproduzierbar.
// Stufe 0 = geführt (Zwischenschritte vorgegeben), 1 = selbst zerlegen, 2 = frei (manchmal als Geschichte).
(function (root) {
  "use strict";

  // ---------- Zufall mit Startwert ----------
  function mulberry(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function R(seed) {
    const f = mulberry(seed);
    const r = {
      f,
      int: (a, b) => a + Math.floor(f() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(f() * arr.length)],
      shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
      seed: () => Math.floor(f() * 4294967296) >>> 0,
    };
    return r;
  }
  function hash(str) { let h = 2166136261; str = String(str); for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function ziehe(r, a, b, ok) {
    for (let i = 0; i < 300; i++) { const x = r.int(a, b); if (!ok || ok(x)) return x; }
    for (let x = a; x <= b; x++) if (!ok || ok(x)) return x;
    return a;
  }

  // ---------- Zahlen ----------
  const M = "−"; // Minuszeichen
  const H = (n) => Math.floor(n / 100), Z = (n) => Math.floor(n / 10) % 10, E = (n) => n % 10;
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  // Teile einer Zahl in der Reihenfolge Hunderter, Zehner, Einer (ohne Nullen)
  const zerlege = (b) => [H(b) * 100, Z(b) * 10, E(b)].filter((x) => x > 0);
  function parseZahl(s) {
    const t = String(s == null ? "" : s).trim().replace(/[\s.']/g, "");
    if (!/^\d{1,5}$/.test(t)) return NaN;
    return Number(t);
  }

  // ---------- Bausteine für Aufgaben ----------
  // Eine Zeile besteht aus Teilen: Zahl, Zeichen ("−", "+", "=", "<", ">"), {f: Feldnummer},
  // {z: Wert, nach: Feldnummer} (erscheint, sobald das Feld gelöst ist) und {w: "Wort"}.
  const F = (i) => ({ f: i });
  const Zg = (wert, nach) => ({ z: wert, nach });
  const W = (text) => ({ w: text });
  const zeile = (teile, label) => ({ teile, label: label || "" });
  function aufgabe(o) {
    return Object.assign({ art: "felder", layout: "rechnung", frage: "Rechne.", text: "", zeilen: [], felder: [], tipp: "", hilfe: null, erklaerung: "", merk: "" }, o);
  }
  const sprung = (start, spruenge, labels) => ({ typ: "sprung", start, spruenge, labels: labels || "start" });

  // Tipp für einen einzelnen Schritt x − t (t ist reine Hunderter-, Zehner- oder Einerzahl)
  function tippSchritt(x, t) {
    if (t >= 100) return `Nimm nur die Hunderter weg: ${H(x)} ${M} ${t / 100} = ${H(x) - t / 100}. Zehner und Einer bleiben, wie sie sind.`;
    if (t >= 10) {
      const zz = Z(x), tz = t / 10, e = E(x);
      if (zz >= tz) return `Nimm nur die Zehner weg: ${zz} ${M} ${tz} = ${zz - tz}. Die anderen Ziffern bleiben.`;
      if (e === 0) return `Erst ${zz * 10} weg bis ${x - zz * 10}, dann noch ${t - zz * 10} weg.`;
      return `Denk dir die ${e} Einer kurz weg: ${x - e} ${M} ${t} = ${x - e - t}. Dann kommen die ${e} Einer wieder dazu.`;
    }
    const e = E(x);
    if (e >= t) return `Nimm nur die Einer weg: ${e} ${M} ${t} = ${e - t}.`;
    if (e === 0) return `Zähle von ${x} aus ${t} zurück: ${x - 1}, ${x - 2} …`;
    return `Erst ${e} weg bis ${x - e}, dann noch ${t - e} weg.`;
  }
  const kreuztSchritt = (x, t) => (t >= 100 ? false : t >= 10 ? Z(x) < t / 10 : E(x) < t);
  // Hilfebild für einen Schritt mit Übergang: der Sprung über den runden Nachbarn
  function hilfeSchritt(x, t) {
    if (!kreuztSchritt(x, t)) return null;
    if (t < 10) { const e = E(x); return e ? sprung(x, [e, t - e], "ohneZiel") : null; }
    const zz = Z(x) * 10, e = E(x);
    return e === 0 && zz ? sprung(x, [zz, t - zz], "ohneZiel") : null;
  }

  // ---------- Besuch: die Puppenfreundinnen und -freunde ----------
  const FREUNDE = [
    { id: "lotta", name: "Lotta", sie: true, mag: "Kekse backen", farbe: "Mintgrün", bitte: "Lotta backt Kekse für das Puppenfest. Beim Rechnen braucht sie deine Hilfe!", danke: "Jetzt stimmen alle Zahlen. Die Kekse werden super!", look: { haut: 1, haar: "rot", frisur: "zoepfe", kleid: "kleid", farbe: "mint" } },
    { id: "ben", name: "Ben", sie: false, mag: "Fußball und dicke Bücher", farbe: "Blau", bitte: "Ben zählt seine Bücher und kommt durcheinander. Hilfst du ihm?", danke: "Du hast so gut aufgepasst. Danke!", look: { haut: 3, haar: "braun", frisur: "kurz", kleid: "sport", farbe: "blau" } },
    { id: "mila", name: "Mila", sie: true, mag: "Tanzen und Musik", farbe: "Rosa", bitte: "Mila übt für ihre Tanzvorführung und muss Plätze im Saal ausrechnen. Rechnest du mit?", danke: "Juhu! Jetzt hat jeder einen Platz. Du bist toll!", look: { haut: 4, haar: "schwarz", frisur: "dutt", kleid: "ballett", farbe: "rosa" } },
    { id: "yuna", name: "Yuna", sie: true, mag: "Malen und Glitzer", farbe: "Gelb", bitte: "Yuna sortiert ihre Glitzerperlen. Ohne dich schafft sie das nicht!", danke: "Danke! Mit deiner Hilfe ging es ganz leicht.", look: { haut: 0, haar: "schwarz", frisur: "lang", kleid: "kleid", farbe: "gelb" } },
    { id: "emil", name: "Emil", sie: false, mag: "Basteln mit Knöpfen", farbe: "Grün", bitte: "Emil baut eine Puppen-Eisenbahn und muss viel rechnen. Hilfst du ihm?", danke: "Die Bahn fährt! Danke, dass du so drangeblieben bist.", look: { haut: 1, haar: "blond", frisur: "kurz", kleid: "latzhose", farbe: "gruen" } },
    { id: "frida", name: "Frida", sie: true, mag: "Blumen und Schmetterlinge", farbe: "Lila", bitte: "Frida pflanzt einen Blumengarten für ihre Oma. Rechnest du mit ihr?", danke: "Oma wird sich riesig freuen. Danke für deine Hilfe!", look: { haut: 2, haar: "blond", frisur: "pferdeschwanz", kleid: "kleid", farbe: "lila" } },
    { id: "noah", name: "Noah", sie: false, mag: "Sterne anschauen", farbe: "Orange", bitte: "Noah zählt Sterne am Himmel und verrechnet sich. Kannst du ihm helfen?", danke: "Jetzt stimmt alles. Du bist ein echter Rechen-Stern!", look: { haut: 4, haar: "dunkel", frisur: "locken", kleid: "schlafanzug", farbe: "orange" } },
    { id: "ida", name: "Ida", sie: true, mag: "Perlen und Ketten", farbe: "Rot", bitte: "Ida fädelt Ketten für ihre Freundinnen. Sie braucht jemanden, der gut rechnen kann!", danke: "Danke! Jetzt bekommt jede Freundin eine Kette.", look: { haut: 2, haar: "braun", frisur: "bob", kleid: "kleid", farbe: "rot" } },
  ];
  const freundById = (id) => FREUNDE.find((x) => x.id === id) || null;

  // Rechengeschichten: a − b, mit dem Namen des heutigen Besuchs
  const GESCHICHTEN = [
    (n, a, b, p) => [`${n} hat ${a} Bügelperlen. Für ein Bild braucht ${p.er} ${b} Stück. Wie viele Bügelperlen bleiben übrig?`, "Perlen"],
    (n, a, b) => [`Ein Puzzle hat ${a} Teile. ${n} hat schon ${b} Teile gelegt. Wie viele Teile fehlen noch?`, "Teile"],
    (n, a, b, p) => [`${n} liest ein Buch mit ${a} Seiten. ${b} Seiten hat ${p.er} schon gelesen. Wie viele Seiten sind es noch?`, "Seiten"],
    (n, a, b) => [`In der Bastelkiste liegen ${a} Knöpfe. ${n} näht ${b} Knöpfe an Puppenkleider. Wie viele Knöpfe sind noch in der Kiste?`, "Knöpfe"],
    (n, a, b, p) => [`${n} hat ${a} Sticker. ${p.Er} verschenkt ${b} Sticker an ${p.ihre} Freunde. Wie viele Sticker hat ${n} noch?`, "Sticker"],
    (n, a, b) => [`Beim Puppenfest gibt es ${a} Luftballons. ${n} hat schon ${b} Luftballons verteilt. Wie viele sind noch da?`, "Ballons"],
    (n, a, b, p) => [`${n} geht zu ${p.ihrer} Oma. Der Weg ist ${a} Schritte lang. ${b} Schritte ist ${p.er} schon gegangen. Wie viele Schritte fehlen noch?`, "Schritte"],
    (n, a, b) => [`Im Perlenladen liegen ${a} Glitzerperlen. ${n} kauft ${b} Stück für eine Kette. Wie viele liegen noch im Laden?`, "Perlen"],
  ];
  function geschichte(r, freundId, a, b) {
    const fr = freundById(freundId) || r.pick(FREUNDE);
    const p = fr.sie ? { er: "sie", Er: "Sie", ihre: "ihre", ihrer: "ihrer" } : { er: "er", Er: "Er", ihre: "seine", ihrer: "seiner" };
    const [text, ding] = r.pick(GESCHICHTEN)(fr.name, a, b, p);
    return { text, ding };
  }

  // ---------- Bausteine: Päckchen, zwei Schritte, drei Schritte ----------
  function paeckchen(paare, o) {
    o = o || {};
    return aufgabe({
      layout: "rechnung", frage: o.frage || "Rechne. Siehst du das Muster?",
      zeilen: paare.map(([a, b], i) => zeile([a, M, b, "=", F(i)])),
      felder: paare.map(([a, b], i) => ({ loesung: a - b, tipp: (o.tipps && o.tipps[i]) || tippSchritt(a, b), hilfe: (o.hilfen && o.hilfen[i]) || null })),
      tipp: o.tipp || "", erklaerung: o.erklaerung || "", merk: o.merk || "",
    });
  }
  // a − b über einen runden Nachbarn: erst t1 weg (bis zum Zehner oder Hunderter), dann den Rest
  function zweiSchritt(r, st, a, b, t1, label1, ctx) {
    const t2 = b - t1, m = a - t1, res = a - b;
    const label2 = "dann den Rest";
    const hilfe = sprung(a, [t1, t2], "ohneZiel");
    const tippGanz = `Erst ${t1} weg bis ${m}, dann noch ${t2} weg.`;
    const erklaerung = `${a} ${M} ${t1} = ${m}, dann ${m} ${M} ${t2} = ${res}.`;
    if (st === 0) {
      return aufgabe({
        layout: "schritte", frage: "Rechne in zwei Schritten.",
        zeilen: [zeile([a, M, b, "=", Zg(res, 1)]), zeile([a, M, t1, "=", F(0)], label1), zeile([Zg(m, 0), M, t2, "=", F(1)], label2)],
        felder: [{ loesung: m, tipp: ctx.tipp1 }, { loesung: res, tipp: `Von ${m} aus noch ${t2} zurück.` }],
        hilfe, tipp: tippGanz, merk: ctx.merk, erklaerung,
      });
    }
    if (st === 1) {
      return aufgabe({
        layout: "schritte", frage: "Zerlege und rechne in zwei Schritten.",
        zeilen: [zeile([a, M, b, "=", Zg(res, 3)]), zeile([a, M, F(0), "=", F(1)], label1), zeile([Zg(m, 1), M, F(2), "=", F(3)], label2)],
        felder: [{ loesung: t1, tipp: ctx.tippTeil }, { loesung: m, tipp: ctx.tipp1 }, { loesung: t2, tipp: `${b} sind ${t1} und noch wie viele? Rechne ${b} ${M} ${t1}.` }, { loesung: res, tipp: `Von ${m} aus noch ${t2} zurück.` }],
        hilfe, tipp: tippGanz, merk: ctx.merk, erklaerung,
      });
    }
    const g = ctx.freund !== undefined && r.f() < (ctx.geschichte || 0) ? geschichte(r, ctx.freund, a, b) : null;
    return aufgabe({
      frage: g ? "Rechengeschichte" : "Rechne.", text: g ? g.text : "",
      zeilen: [zeile([a, M, b, "=", F(0)].concat(g ? [W(g.ding)] : []))],
      felder: [{ loesung: res, tipp: tippGanz }],
      hilfe, tipp: tippGanz, merk: ctx.merk, erklaerung,
    });
  }
  // a − b in Schritten: Hunderter weg, Zehner weg, Einer weg (Teile ohne Nullen)
  function schrittAufgabe(r, st, a, b, ctx) {
    const teile = zerlege(b);
    const zw = []; let x = a; teile.forEach((t) => { x -= t; zw.push(x); });
    const res = a - b;
    const labels = teile.length === 3 ? ["erst", "dann", "danach"] : ["erst", "dann"];
    const namen = teile.map((t) => (t >= 100 ? "Hunderter" : t >= 10 ? "Zehner" : "Einer"));
    const vor = (k) => (k === 0 ? a : zw[k - 1]);
    const g = st >= 2 && ctx.freund !== undefined && r.f() < (ctx.geschichte || 0) ? geschichte(r, ctx.freund, a, b) : null;
    const zeilen = [], felder = [];
    const n = teile.length;
    if (st === 0) {
      zeilen.push(zeile([a, M, b, "=", Zg(res, n - 1)]));
      teile.forEach((t, k) => {
        zeilen.push(zeile([k === 0 ? a : Zg(zw[k - 1], k - 1), M, t, "=", F(k)], labels[k]));
        felder.push({ loesung: zw[k], tipp: tippSchritt(vor(k), t), hilfe: hilfeSchritt(vor(k), t) });
      });
    } else {
      zeilen.push(zeile([a, M, b, "=", Zg(res, 2 * n - 1)]));
      teile.forEach((t, k) => {
        zeilen.push(zeile([k === 0 ? a : Zg(zw[k - 1], 2 * k - 1), M, F(2 * k), "=", F(2 * k + 1)], labels[k]));
        felder.push({ loesung: t, tipp: `Nimm von ${b} jetzt die ${namen[k]}. Schreib sie als ganze Zahl, zum Beispiel ${t >= 100 ? "300" : t >= 10 ? "40" : "5"}.` });
        felder.push({ loesung: zw[k], tipp: tippSchritt(vor(k), t), hilfe: hilfeSchritt(vor(k), t) });
      });
    }
    return aufgabe({
      layout: "schritte", frage: g ? "Rechengeschichte: rechne in Schritten." : st === 0 ? "Rechne in Schritten." : "Zerlege und rechne in Schritten.",
      text: g ? g.text : "", zeilen, felder,
      hilfe: sprung(a, teile, "start"),
      tipp: `Zerlege ${b} in ${teile.join(", ")}. Nimm erst die ${namen[0]} weg, dann ${namen.slice(1).join(", dann ")}.`,
      erklaerung: `${a} ${M} ${teile.join(` ${M} `)} = ${res}`,
      merk: "Hunderter weg, Zehner weg, Einer weg.",
    });
  }

  // ---------- Generatoren je Lernteil ----------
  const GEN = {
    // ===== Zahlen bis 1000 =====
    stellen(r, st) {
      let h = r.int(1, 9), z = r.int(0, 9), e = r.int(0, 9);
      if (st >= 1 && r.f() < 0.35) { if (r.f() < 0.5) z = 0; else e = 0; }
      const n = 100 * h + 10 * z + e;
      const erkl = `${h} Hunderter, ${z} Zehner und ${e} Einer sind ${n}.`;
      if (st === 0) return aufgabe({ frage: "Welche Zahl ist das?", fig: { typ: "bloecke", zahl: n }, zeilen: [zeile([F(0)])], felder: [{ loesung: n, tipp: "Zähle zuerst die Platten (Hunderter), dann die Stangen (Zehner), dann die Würfel (Einer)." }], erklaerung: erkl, tipp: "Eine Platte ist 100, eine Stange ist 10, ein Würfel ist 1." });
      if (st === 1) return aufgabe({ layout: "stellen", frage: "Wie viele Hunderter, Zehner und Einer?", zeilen: [zeile([n, W("hat"), F(0), W("Hunderter,"), F(1), W("Zehner und"), F(2), W("Einer.")])], felder: [{ loesung: h, tipp: "Die erste Ziffer zeigt die Hunderter." }, { loesung: z, tipp: "Die mittlere Ziffer zeigt die Zehner." }, { loesung: e, tipp: "Die letzte Ziffer zeigt die Einer." }], erklaerung: erkl, tipp: "Hunderter, Zehner, Einer: so stehen die Ziffern von links nach rechts." });
      const teile = r.shuffle([[h, "Hunderter"], [z, "Zehner"], [e, "Einer"]]).filter(([x]) => x > 0 || r.f() < 0.5);
      const txt = teile.map(([x, s]) => x + " " + s).join(", ");
      const fehlt = ["Hunderter", "Zehner", "Einer"].filter((s) => !teile.some((t) => t[1] === s));
      return aufgabe({ frage: "Welche Zahl ist das?", zeilen: [zeile([W(txt), "=", F(0)])], felder: [{ loesung: n, tipp: "Sortiere zuerst: Hunderter vorne, dann Zehner, dann Einer." + (fehlt.length ? ` Keine ${fehlt.join(" und keine ")}? Dort steht eine 0.` : "") }], erklaerung: erkl, tipp: "Achte auf die Wörter, nicht auf die Reihenfolge." });
    },
    nachbar(r, st) {
      const h = r.int(1, 9), e = r.int(1, 9);
      const z = r.f() < 0.3 ? r.pick([0, 9]) : r.int(1, 8);
      const n = 100 * h + 10 * z + e;
      const zu = n - e, zo = zu + 10, hu = 100 * h, ho = hu + 100;
      const felder = [
        { loesung: zu, tipp: `Der Nachbarzehner unten: Die Einer werden 0. Aus ${n} wird ${String(zu).slice(0, -1)}0.` },
        { loesung: zo, tipp: `Der nächste Zehner nach ${zu} ist ${zu} + 10.` },
      ];
      if (st >= 1) felder.push({ loesung: hu, tipp: `Die Hunderterziffer ${h} bleibt gleich. Zehner und Einer werden 0. Nicht eins weniger nehmen!` }, { loesung: ho, tipp: `Der nächste Hunderter nach ${hu}.` });
      return aufgabe({
        layout: "nachbar", frage: st >= 1 ? "Trage Nachbarzehner und Nachbarhunderter ein." : "Trage die Nachbarzehner ein.",
        nachbar: { zahl: n, hunderter: st >= 1 },
        zeilen: [zeile(st >= 1 ? [F(2), "<", F(0), "<", n, "<", F(1), "<", F(3)] : [F(0), "<", n, "<", F(1)])],
        felder, tipp: `${n} liegt zwischen zwei Zehnerzahlen. Welche sind das?`,
        merk: "Unten bleibt die Ziffer stehen, nur dahinter wird alles 0.",
        erklaerung: st >= 1 ? `${hu} < ${zu} < ${n} < ${zo} < ${ho}` : `${zu} < ${n} < ${zo}`,
      });
    },
    vergleich(r, st) {
      const a = r.int(102, 998);
      const art = r.f();
      let b;
      if (art < 0.1) b = a;
      else if (art < 0.45) { // Ziffern tauschen: 433 und 343
        const d = [H(a), Z(a), E(a)];
        const [i, j] = r.pick([[0, 1], [1, 2], [0, 2]]);
        [d[i], d[j]] = [d[j], d[i]];
        b = d[0] * 100 + d[1] * 10 + d[2];
        if (b === a || b < 100) b = H(a) * 100 + ((Z(a) + 3) % 10) * 10 + E(a);
      } else if (art < 0.7) b = H(a) * 100 + ziehe(r, 0, 9, (x) => x !== Z(a)) * 10 + E(a);
      else if (art < 0.85) b = H(a) * 100 + Z(a) * 10 + ziehe(r, 0, 9, (x) => x !== E(a));
      else { // andere Hunderter, aber größere Zehner (Falle)
        const hb = ziehe(r, 1, 9, (x) => x !== H(a));
        b = hb * 100 + (hb < H(a) ? 9 : 0) * 10 + r.int(0, 9);
      }
      if (b === a && art >= 0.1) b = a === 998 ? 997 : a + 1;
      const loesung = a < b ? "<" : a > b ? ">" : "=";
      const wort = { "<": "kleiner als", ">": "größer als", "=": "gleich" }[loesung];
      let grund;
      if (a === b) grund = "Alle Ziffern sind gleich.";
      else if (H(a) !== H(b)) grund = `${a} hat ${H(a)} Hunderter, ${b} hat ${H(b)} Hunderter.`;
      else if (Z(a) !== Z(b)) grund = `Die Hunderter sind gleich. ${a} hat ${Z(a)} Zehner, ${b} hat ${Z(b)} Zehner.`;
      else grund = `Hunderter und Zehner sind gleich. ${a} hat ${E(a)} Einer, ${b} hat ${E(b)} Einer.`;
      return aufgabe({
        art: "wahl", layout: "vergleich", frage: "Setze ein: <, > oder =",
        vergleich: [a, b], optionen: ["<", ">", "="], loesung,
        tipp: "Vergleiche zuerst die Hunderter. Sind sie gleich, dann die Zehner.",
        erklaerung: `${grund} Also ist ${a} ${wort} ${b}.`,
        merk: "Das Krokodil frisst immer die größere Zahl. Sein Maul ist offen zur größeren Zahl.",
      });
    },
    strahl(r, st) {
      const ziel = st === 0 ? r.int(0, 9) * 100 + 50 : ziehe(r, 2, 98, (x) => x % 10 !== 0) * 10;
      const tausch = Z(ziel) * 100 + H(ziel) * 10;
      const kand = [ziel + 100, ziel - 100, tausch, ziel + 50, ziel - 50, 1000 - ziel, ziel + 200, ziel - 200];
      const andere = [];
      for (const x of kand) if (x > 0 && x < 1000 && x % 10 === 0 && Math.abs(x - ziel) >= 40 && x !== ziel && !andere.includes(x) && andere.length < 3) andere.push(x);
      const optionen = r.shuffle([ziel].concat(andere)).map(String);
      const hu = H(ziel) * 100;
      return aufgabe({
        art: "wahl", layout: "strahl", frage: "Welche Zahl zeigt der Pfeil?",
        fig: { typ: "strahl", von: 0, bis: 1000, ziel, beschriftung: st >= 2 ? [0, 500, 1000] : [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] },
        optionen, loesung: String(ziel),
        tipp: "Zwischen welchen Hundertern zeigt der Pfeil? Ist er am Anfang, in der Mitte oder am Ende?",
        erklaerung: `Der Pfeil zeigt zwischen ${hu} und ${hu + 100}${E(ziel) === 0 && Z(ziel) === 5 ? ", genau in der Mitte" : Z(ziel) < 5 ? ", näher bei " + hu : ", näher bei " + (hu + 100)}. Das ist ${ziel}.`,
      });
    },

    // ===== Hunderter, Zehner, Einer weg =====
    "h-weg"(r, st) {
      const ha = r.int(2, 9), hb = r.int(1, ha - 1), z = r.int(1, 9), e = r.int(1, 9);
      const b = hb * 100;
      if (st <= 1) {
        const zahlen = [ha * 100, ha * 100 + z * 10, ha * 100 + z * 10 + e];
        return paeckchen(zahlen.map((a) => [a, b]), { erklaerung: `${ha} ${M} ${hb} = ${ha - hb} Hunderter. Die ${z} und die ${e} wandern einfach mit.`, tipp: "Nur die Hunderter werden weniger.", merk: "Hunderter weg: nur die erste Ziffer ändert sich." });
      }
      const a = ha * 100 + r.int(0, 9) * 10 + r.int(0, 9);
      return aufgabe({ zeilen: [zeile([a, M, b, "=", F(0)])], felder: [{ loesung: a - b, tipp: tippSchritt(a, b) }], tipp: "Nur die Hunderter werden weniger.", merk: "Hunderter weg: nur die erste Ziffer ändert sich." });
    },
    "z-weg"(r, st) {
      const y = r.int(1, 8), zd = r.int(Math.max(y, 2), 9), ed = r.int(0, 9), h = r.int(2, 9);
      const b = y * 10, ze = zd * 10 + ed;
      if (st <= 1) return paeckchen([[ze, b], [100 + ze, b], [h * 100 + ze, b]], { erklaerung: `${zd} ${M} ${y} = ${zd - y} Zehner. Hunderter und Einer bleiben.`, tipp: "Nur die Zehner werden weniger.", merk: "Zehner weg: nur die mittlere Ziffer ändert sich." });
      const a = h * 100 + ze;
      return aufgabe({ zeilen: [zeile([a, M, b, "=", F(0)])], felder: [{ loesung: a - b, tipp: tippSchritt(a, b) }], tipp: "Nur die Zehner werden weniger.", merk: "Zehner weg: nur die mittlere Ziffer ändert sich." });
    },
    "e-weg"(r, st) {
      const y = r.int(1, 8), ed = r.int(y, 9), zd = r.int(1, 9), h = r.int(2, 9);
      const ze = zd * 10 + ed;
      if (st <= 1) return paeckchen([[ze, y], [100 + ze, y], [h * 100 + ze, y]], { erklaerung: `${ed} ${M} ${y} = ${ed - y}. Nur die Einer ändern sich.`, tipp: "Nur die Einer werden weniger.", merk: "Einer weg: nur die letzte Ziffer ändert sich." });
      const a = h * 100 + ze;
      return aufgabe({ zeilen: [zeile([a, M, y, "=", F(0)])], felder: [{ loesung: a - y, tipp: tippSchritt(a, y) }], tipp: "Nur die Einer werden weniger.", merk: "Einer weg: nur die letzte Ziffer ändert sich." });
    },
    "bis-zehner"(r, st) {
      const h = r.int(1, 9), z = r.int(1, st >= 1 ? 8 : 9), e = r.int(1, 9);
      const n = h * 100 + z * 10 + e, zu = n - e;
      const zeilen = [zeile([n, M, F(0), "=", zu]), zeile([zu, M, F(1), "=", h * 100])];
      const felder = [
        { loesung: e, tipp: `Bis zum Nachbarzehner nimmst du genau die Einer weg. Wie viele Einer hat ${n}?` },
        { loesung: z * 10, tipp: `Jetzt nimmst du alle Zehner weg. ${zu} hat ${z} Zehner.` },
      ];
      if (st >= 1) {
        zeilen.push(zeile([n, "+", F(2), "=", zu + 10]), zeile([zu + 10, "+", F(3), "=", (h + 1) * 100]));
        felder.push({ loesung: 10 - e, tipp: `Wie viele fehlen von ${n} bis ${zu + 10}? ${e} und wie viel sind 10?` }, { loesung: (h + 1) * 100 - zu - 10, tipp: `Wie viele Zehner fehlen von ${zu + 10} bis ${(h + 1) * 100}?` });
      }
      return aufgabe({
        frage: "Welche Zahl fehlt?", zeilen, felder,
        hilfe: sprung(n, [e, z * 10], "alleOhneSprung"),
        tipp: "Bis zum Zehner: die Einer weg. Bis zum Hunderter: die Zehner weg.",
        merk: "Bis zum Zehner nimmst du immer genau die Einer weg.",
      });
    },

    // ===== Über den Zehner =====
    "nachbar-aufg"(r, st) {
      if (st === 0 || (st >= 1 && r.f() < 0.55)) {
        const h = r.int(1, 9), z = r.int(1, 9), e = st >= 2 ? r.int(2, 7) : r.int(2, 8);
        const a = h * 100 + z * 10 + e;
        const ys = st >= 2 ? [e, e + 1, e + 2] : [e - 1, e, e + 1];
        return paeckchen(ys.map((y) => [a, y]), {
          frage: "Nachbaraufgaben: rechne und vergleiche.",
          hilfen: ys.map((y) => hilfeSchritt(a, y)),
          erklaerung: "Jedes Mal nimmst du eins mehr weg. Darum wird das Ergebnis jedes Mal um eins kleiner.",
          tipp: `Bei ${M} ${e} landest du genau auf ${a - e}.`, merk: "Eins mehr weg, eins weniger raus.",
        });
      }
      const h = r.int(1, 9), z = r.int(2, 8), a = h * 100 + z * 10;
      const ys = [(z - 1) * 10, z * 10, (z + 1) * 10];
      return paeckchen(ys.map((y) => [a, y]), {
        frage: "Nachbaraufgaben: rechne und vergleiche.",
        hilfen: ys.map((y) => hilfeSchritt(a, y)),
        erklaerung: "Jedes Mal nimmst du 10 mehr weg. Darum wird das Ergebnis jedes Mal um 10 kleiner.",
        tipp: `Bei ${M} ${z * 10} landest du genau auf ${h * 100}.`, merk: "10 mehr weg, 10 weniger raus.",
      });
    },
    "e-ueber"(r, st, o) {
      const h = r.int(1, 9), z = r.int(1, 9), e = r.int(1, 7);
      const a = h * 100 + z * 10 + e, b = r.int(e + 1, 9);
      return zweiSchritt(r, st, a, b, e, "erst bis zum Zehner", { freund: o.freund, geschichte: 0.4, tipp1: `Nimm nur die Einer weg: ${a} ${M} ${e}. Dann bist du genau beim Zehner.`, tippTeil: `Wie viele Einer hat ${a}? So viele nimmst du zuerst weg.`, merk: "Erst bis zum Zehner, dann weiter." });
    },
    "aehnlich-e"(r) {
      const zd = r.int(1, 9), ed = r.int(0, 7), y = r.int(ed + 1, 9), h = r.int(2, 9);
      const ze = zd * 10 + ed;
      const erst = ed ? `Erst ${ed} weg bis ${ze - ed}, dann noch ${y - ed} weg.` : `Zähle von ${ze} aus ${y} zurück.`;
      return paeckchen([[ze, y], [100 + ze, y], [h * 100 + ze, y]], {
        frage: "Ähnliche Aufgaben: rechne und vergleiche.",
        tipps: [erst, `Wie die Aufgabe darüber, nur mit einem Hunderter mehr: ${ze} ${M} ${y} = ${ze - y}.`, `Wie die erste Aufgabe, nur mit ${h} Hundertern mehr.`],
        hilfen: [hilfeSchritt(ze, y), null, null],
        erklaerung: `${ze} ${M} ${y} = ${ze - y}. Darum ist ${100 + ze} ${M} ${y} = ${100 + ze - y} und ${h * 100 + ze} ${M} ${y} = ${h * 100 + ze - y}.`,
        tipp: "Löse zuerst die kleine Aufgabe oben. Die anderen gehen dann genauso.", merk: "Die Hunderter wandern einfach mit.",
      });
    },
    "e-ueber-h"(r, st, o) {
      const h = r.int(1, 9);
      if (st >= 2 && r.f() < 0.3) {
        const a = h * 100, b = r.int(1, 9);
        return aufgabe({ zeilen: [zeile([a, M, b, "=", F(0)])], felder: [{ loesung: a - b, tipp: `Rückwärts von ${a}: ${a - 1}, ${a - 2}, ${a - 3} …` }], hilfe: sprung(a, [b], "start"), tipp: `Vor ${a} kommt ${a - 1}.`, merk: "Vor dem Hunderter kommt eine 99." });
      }
      const e = r.int(1, 8), a = h * 100 + e, b = r.int(e + 1, 9);
      return zweiSchritt(r, st, a, b, e, "erst bis zum Hunderter", { freund: o.freund, geschichte: 0.3, tipp1: `Nimm nur die Einer weg: ${a} ${M} ${e} = ${h * 100}.`, tippTeil: `Wie viele Einer hat ${a}? So viele nimmst du zuerst weg.`, merk: "Vor dem Hunderter kommt eine 99: 400, 399, 398 …" });
    },

    // ===== Über den Hunderter =====
    "z-ueber"(r, st, o) {
      const h = r.int(1, 9), z = r.int(1, 8), y = r.int(z + 1, 9);
      const a = h * 100 + z * 10, b = y * 10;
      return zweiSchritt(r, st, a, b, z * 10, "erst bis zum Hunderter", { freund: o.freund, geschichte: 0.4, tipp1: `Nimm nur die Zehner weg: ${a} ${M} ${z * 10} = ${h * 100}.`, tippTeil: `Wie viele Zehner hat ${a}? So viele nimmst du zuerst weg.`, merk: "Erst bis zum Hunderter, dann weiter." });
    },
    "aehnlich-z"(r) {
      const z = r.int(0, 8), y = r.int(z + 1, 9), e = r.int(1, 9), h = r.int(2, 9);
      const a1 = 100 + z * 10, b = y * 10;
      return paeckchen([[a1, b], [a1 + e, b], [h * 100 + z * 10 + e, b]], {
        frage: "Ähnliche Aufgaben: rechne und vergleiche.",
        tipps: [`${10 + z} Zehner ${M} ${y} Zehner = ${10 + z - y} Zehner.`, `Wie oben, die ${e} Einer kommen dazu.`, `Wie die Aufgabe darüber, nur mit ${h - 1} ${h - 1 === 1 ? "Hunderter" : "Hundertern"} mehr.`],
        hilfen: [z ? sprung(a1, [z * 10, b - z * 10], "ohneZiel") : null, null, null],
        erklaerung: `${a1} ${M} ${b} = ${a1 - b}. Darum ist ${a1 + e} ${M} ${b} = ${a1 + e - b} und ${h * 100 + z * 10 + e} ${M} ${b} = ${h * 100 + z * 10 + e - b}.`,
        tipp: "Löse zuerst die Aufgabe oben. Die anderen gehen dann genauso.", merk: "Rechne mit Zehnern: 14 Zehner minus 8 Zehner sind 6 Zehner.",
      });
    },
    raupe(r, st) {
      const d = st >= 2 && r.f() < 0.4 ? 1 : 10;
      let s;
      if (d === 10) s = r.int(1, 9) * 100 + r.int(1, 6) * 10 + r.int(0, 9);
      else s = r.int(1, 9) * 100 + (r.f() < 0.5 ? 0 : r.int(1, 9)) * 10 + r.int(1, 6);
      const werte = Array.from({ length: 10 }, (_, i) => s - i * d);
      const gegeben = st === 0 ? [0, 1, 2, 7] : st === 1 ? [0, 1, 7] : [0, 1];
      let fi = 0; const felder = [];
      const teile = werte.map((w, i) => {
        if (gegeben.includes(i)) return w;
        const vorher = werte[i - 1];
        felder.push({ loesung: w, tipp: (d === 10 ? Z(vorher) === 0 : E(vorher) === 0) ? `Achtung, hier geht es über den ${d === 10 ? "Hunderter" : "Zehner"}: ${vorher} ${M} ${d}.` : `Nimm die Zahl davor und rechne ${M} ${d}.` });
        return F(fi++);
      });
      return aufgabe({ layout: "raupe", frage: `Die Raupe zählt rückwärts. Immer ${M} ${d}.`, zeilen: [zeile(teile)], felder, tipp: d === 10 ? "Bei − 10 wird nur die Zehnerziffer kleiner. Nach der 0 geht es über den Hunderter." : "Bei − 1 wird die Einerziffer kleiner.", merk: d === 10 ? "Nach 304 kommt 294." : "Nach 400 kommt 399." });
    },

    // ===== In Schritten rechnen =====
    "schritte-3"(r, st, o) {
      const a1 = r.int(2, 9), a2 = r.int(1, 9), a3 = r.int(1, 9);
      const b = r.int(1, a1 - 1) * 100 + r.int(1, a2) * 10 + r.int(1, a3);
      return schrittAufgabe(r, st, a1 * 100 + a2 * 10 + a3, b, { freund: o.freund, geschichte: 0.4 });
    },
    "schritte-2"(r, st, o) {
      const a1 = r.int(2, 9), a2 = r.int(1, 9), a3 = r.int(1, 9), a = a1 * 100 + a2 * 10 + a3;
      const muster = r.pick(["ze", "ze", "hz", "he"]);
      const bh = muster === "ze" ? 0 : r.int(1, a1 - 1), bz = muster === "he" ? 0 : r.int(1, a2), be = muster === "hz" ? 0 : r.int(1, a3);
      return schrittAufgabe(r, st, a, bh * 100 + bz * 10 + be, { freund: o.freund, geschichte: 0.3 });
    },
    "schritte-ue2"(r, st, o) {
      // zwei Schritte, mindestens einer mit Übergang: 652 − 37, 738 − 145 ohne Hunderter …
      let a, b;
      for (let i = 0; i < 100; i++) {
        a = r.int(120, 999);
        const muster = r.pick(["ze", "ze", "hz", "he"]);
        const bh = muster === "ze" ? 0 : r.int(1, Math.max(1, H(a) - 1)), bz = muster === "he" ? 0 : r.int(1, 9), be = muster === "hz" ? 0 : r.int(1, 9);
        b = bh * 100 + bz * 10 + be;
        if (b < a - 9 && zerlege(b).length === 2 && (Z(a) < Z(b) || E(a) < E(b))) break;
      }
      return schrittAufgabe(r, st, a, b, { freund: o.freund, geschichte: 0.3 });
    },
    "schritte-ue"(r, st, o) {
      let a, b;
      for (let i = 0; i < 100; i++) {
        a = r.int(200, 999);
        b = r.int(1, H(a) - 1) * 100 + r.int(1, 9) * 10 + r.int(1, 9);
        if (b < a - 9 && (Z(a) < Z(b) || E(a) < E(b))) break;
      }
      return schrittAufgabe(r, st, a, b, { freund: o.freund, geschichte: 0.3 });
    },
    kurz(r, st, o) {
      let a, b;
      const mitUebergang = st === 0 ? false : st === 1 ? r.f() < 0.5 : r.f() < 0.8;
      for (let i = 0; i < 200; i++) {
        a = r.int(200, 999);
        b = r.int(1, H(a) - 1) * 100 + r.int(1, 9) * 10 + r.int(1, 9);
        const ue = Z(a) < Z(b) || E(a) < E(b);
        if (b < a - 9 && ue === mitUebergang) break;
      }
      const teile = zerlege(b), zw = [a - teile[0], a - teile[0] - teile[1]], res = a - b;
      const g = st >= 2 && o.freund !== undefined && r.f() < 0.3 ? geschichte(r, o.freund, a, b) : null;
      return aufgabe({
        layout: "kurz", frage: g ? "Rechengeschichte: schreib kurz." : "Schreib nur die Zwischenergebnisse auf.", text: g ? g.text : "",
        kurz: { schritte: st === 0 ? teile : null },
        zeilen: [zeile([a, M, b, "=", F(2)]), zeile([F(0), F(1)])],
        felder: [
          { loesung: zw[0], tipp: `Rechne im Kopf: ${a} ${M} ${teile[0]}.` },
          { loesung: zw[1], tipp: `Jetzt ${zw[0]} ${M} ${teile[1]}. ` + tippSchritt(zw[0], teile[1]), hilfe: hilfeSchritt(zw[0], teile[1]) },
          { loesung: res, tipp: `Zum Schluss ${zw[1]} ${M} ${teile[2]}. ` + tippSchritt(zw[1], teile[2]), hilfe: hilfeSchritt(zw[1], teile[2]) },
        ],
        hilfe: sprung(a, teile, "start"),
        tipp: `Im Kopf: erst ${M} ${teile[0]}, dann ${M} ${teile[1]}, dann ${M} ${teile[2]}.`,
        erklaerung: `${a} ${M} ${teile[0]} = ${zw[0]}, ${zw[0]} ${M} ${teile[1]} = ${zw[1]}, ${zw[1]} ${M} ${teile[2]} = ${res}.`,
        merk: "Kurz geschrieben: nur die Zwischenergebnisse.",
      });
    },
  };

  // ---------- Themen und Lernteile ----------
  const THEMEN = [
    { id: "zahlen", name: "Zahlen bis 1000", icon: "🧱", buch: "Stellenwerte, Nachbarzehner, Zahlenstrahl, Vergleichen", skills: ["stellen", "nachbar", "vergleich", "strahl"] },
    { id: "weg", name: "Hunderter, Zehner, Einer weg", icon: "🧺", buch: "Buch S. 28 und 29", skills: ["h-weg", "z-weg", "e-weg", "bis-zehner"] },
    { id: "zehner", name: "Über den Zehner", icon: "🪜", buch: "Buch S. 36 und 37", skills: ["nachbar-aufg", "e-ueber", "aehnlich-e", "e-ueber-h"] },
    { id: "hunderter", name: "Über den Hunderter", icon: "🏰", buch: "Buch S. 36 und 37", skills: ["z-ueber", "aehnlich-z", "raupe"] },
    { id: "schritte", name: "In Schritten rechnen", icon: "👣", buch: "Buch S. 32 und 33", skills: ["schritte-3", "schritte-2"] },
    { id: "uebergang", name: "Schritte mit Übergang", icon: "⭐", buch: "Buch S. 39", skills: ["schritte-ue2", "schritte-ue"] },
    { id: "kurz", name: "Kurz geschrieben", icon: "✍️", buch: "Buch S. 41", skills: ["kurz"] },
  ];
  const SKILL_NAMEN = {
    stellen: "Hunderter, Zehner, Einer", nachbar: "Nachbarzehner und Nachbarhunderter", vergleich: "Größer, kleiner, gleich", strahl: "Zahlenstrahl",
    "h-weg": "Hunderter weg", "z-weg": "Zehner weg", "e-weg": "Einer weg", "bis-zehner": "Bis zum Zehner und Hunderter",
    "nachbar-aufg": "Nachbaraufgaben", "e-ueber": "Einer weg über den Zehner", "aehnlich-e": "Ähnliche Aufgaben", "e-ueber-h": "Einer weg über den Hunderter",
    "z-ueber": "Zehner weg über den Hunderter", "aehnlich-z": "Ähnliche Aufgaben mit Zehnern", raupe: "Zahlenraupe rückwärts",
    "schritte-3": "Drei Schritte: Hunderter, Zehner, Einer weg", "schritte-2": "Zwei Schritte",
    "schritte-ue2": "Zwei Schritte mit Übergang", "schritte-ue": "Drei Schritte mit Übergang", kurz: "Kurze Schreibweise",
  };
  const ALLE_SKILLS = THEMEN.flatMap((t) => t.skills);
  const themaVon = (skill) => (THEMEN.find((t) => t.skills.includes(skill)) || THEMEN[0]).id;
  const themaById = (id) => THEMEN.find((t) => t.id === id) || null;

  function makeTask(skill, stufe, seed, opt) {
    const gen = GEN[skill];
    if (!gen) return null;
    opt = opt || {};
    const st = Math.max(0, Math.min(2, stufe | 0));
    const r = R(hash(skill + "|" + st + "|" + (opt.freund || "")) ^ (seed >>> 0));
    const t = gen(r, st, { freund: opt.freund || null });
    t.id = skill + "|" + st + "|" + (seed >>> 0);
    t.skill = skill; t.thema = themaVon(skill); t.stufe = st; t.seed = seed >>> 0;
    return t;
  }
  function checkFeld(t, i, wert) {
    const f = t.felder[i];
    if (!f) return { ok: false };
    const n = parseZahl(wert);
    if (isNaN(n)) return { ok: false, leer: String(wert == null ? "" : wert).trim() === "" };
    return { ok: n === f.loesung };
  }
  const checkWahl = (t, wert) => ({ ok: String(wert) === String(t.loesung) });

  // ---------- Datum ----------
  const pad = (n) => String(n).padStart(2, "0");
  function heuteISO(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function tagNr(iso) { const [y, m, d] = String(iso).split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); }
  const tageBis = (von, bis) => tagNr(bis) - tagNr(von);
  function plusTage(iso, n) { const d = new Date((tagNr(iso) + n) * 864e5); return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  const gueltigesDatum = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(tagNr(s));

  // ---------- Laden, Puppe, Belohnungen ----------
  const SHOP = {
    leckeres: [
      { id: "tee", name: "Tee", icon: "🍵", preis: 2 },
      { id: "erdbeeren", name: "Erdbeeren", icon: "🍓", preis: 3 },
      { id: "keks", name: "Keks", icon: "🍪", preis: 3 },
      { id: "muffin", name: "Muffin", icon: "🧁", preis: 4 },
      { id: "eis", name: "Eis", icon: "🍦", preis: 5 },
      { id: "pfannkuchen", name: "Pfannkuchen", icon: "🥞", preis: 5 },
      { id: "torte", name: "Torte", icon: "🎂", preis: 8 },
    ],
    kleider: [
      { id: "kleid", name: "Kleid", icon: "👗", preis: 0 },
      { id: "latzhose", name: "Latzhose", icon: "👖", preis: 15 },
      { id: "sport", name: "Sportsachen", icon: "👟", preis: 15 },
      { id: "regenjacke", name: "Regenjacke", icon: "🧥", preis: 18 },
      { id: "schlafanzug", name: "Schlafanzug", icon: "🌙", preis: 18 },
      { id: "ballett", name: "Ballettkleid", icon: "🩰", preis: 25 },
      { id: "prinzessin", name: "Ballkleid", icon: "✨", preis: 40 },
    ],
    schmuck: [
      { id: "schleife", name: "Haarschleife", icon: "🎀", preis: 10 },
      { id: "haarreif", name: "Haarreif", icon: "💜", preis: 12 },
      { id: "kette", name: "Perlenkette", icon: "📿", preis: 15 },
      { id: "blumenkranz", name: "Blumenkranz", icon: "🌼", preis: 15 },
      { id: "brille", name: "Brille", icon: "👓", preis: 18 },
      { id: "tasche", name: "Handtasche", icon: "👜", preis: 20 },
      { id: "sonnenhut", name: "Sonnenhut", icon: "👒", preis: 25 },
      { id: "krone", name: "Krone", icon: "👑", preis: 50 },
    ],
    moebel: [
      { id: "pflanze", name: "Pflanze", icon: "🪴", preis: 12 },
      { id: "teppich", name: "Teppich", icon: "🟣", preis: 15 },
      { id: "bild", name: "Bild", icon: "🖼️", preis: 15 },
      { id: "kuscheltier", name: "Kuscheltier", icon: "🧸", preis: 18 },
      { id: "bett", name: "Puppenbett", icon: "🛏️", preis: 20 },
      { id: "lampe", name: "Lampe", icon: "💡", preis: 20 },
      { id: "vase", name: "Blumenvase", icon: "🌷", preis: 12 },
      { id: "teetisch", name: "Teetisch", icon: "🫖", preis: 25 },
      { id: "regal", name: "Regal", icon: "📚", preis: 25 },
      { id: "puppenwagen", name: "Puppenwagen", icon: "🛒", preis: 30 },
      { id: "lichterkette", name: "Lichterkette", icon: "✨", preis: 30 },
    ],
  };
  const shopDing = (id) => SHOP.leckeres.concat(SHOP.kleider, SHOP.schmuck, SHOP.moebel).find((x) => x.id === id) || null;
  function kaufe(s, id) {
    const d = shopDing(id);
    if (!d) return { ok: false, grund: "unbekannt" };
    const essen = SHOP.leckeres.includes(d), kleid = SHOP.kleider.includes(d);
    if (!essen && (s.besitz.includes(id) || (kleid && d.preis === 0))) return { ok: false, grund: "schon" };
    if (s.muenzen < d.preis) return { ok: false, grund: "muenzen", fehlt: d.preis - s.muenzen };
    s.muenzen -= d.preis;
    if (essen) s.gegessen++;
    else {
      s.besitz.push(id);
      if (kleid) s.puppe.kleid = id;
      else if (SHOP.schmuck.includes(d) && !s.traegt.includes(id)) s.traegt.push(id);
    }
    return { ok: true, ding: d, essen, kleid };
  }
  const STICKER = ["🌸", "🦄", "🌈", "⭐", "🍓", "🐞", "🦋", "🍦", "🎀", "🐱", "🌻", "🍭", "🐰", "🦊", "🐢", "🌙", "🍉", "🐬", "🎈", "🧁", "🐝", "🍀", "🦔", "💎"];
  // Überraschung nach jeder Etappe: mal Edelsteine, mal ein Sticker
  function ueberraschung(s, r) {
    const x = r.f();
    if (x < 0.32) {
      const fehlend = STICKER.filter((k) => !s.sticker[k]);
      const id = fehlend.length && r.f() < 0.85 ? r.pick(fehlend) : r.pick(STICKER);
      s.sticker[id] = (s.sticker[id] || 0) + 1;
      return { typ: "sticker", id, neu: s.sticker[id] === 1 };
    }
    const n = x < 0.9 ? r.int(3, 6) : 10;
    s.muenzen += n;
    return { typ: "steine", n };
  }
  const STUFEN = [{ ab: 0, name: "Kleines Puppenhaus" }, { ab: 300, name: "Puppenhaus mit Blumen" }, { ab: 1000, name: "Puppenhaus mit Regenbogen" }, { ab: 2500, name: "Glitzer-Puppenhaus" }];
  const stufe = (punkte) => { let i = 0; STUFEN.forEach((x, j) => { if (punkte >= x.ab) i = j; }); return i; };
  const LOHN = { richtig: 2, spaeter: 1, etappe: 5, mission: 10, kette: 3, punkteRichtig: 10, punkteSpaeter: 5 };
  const HA_LOHN = (min) => (min >= 15 ? 12 : min >= 10 ? 8 : min >= 5 ? 5 : min >= 3 ? 3 : 0);

  // ---------- Spielstand ----------
  const STAND_V = 1;
  const HAUT = ["#fde3cc", "#f6cba6", "#e0a77c", "#b77a4f", "#7e4e31"];
  const HAAR = { blond: "#f0c75e", braun: "#8a5a2b", dunkel: "#4a2f1e", schwarz: "#2b2626", rot: "#c9572e", rosa: "#f39cc3", lila: "#a57ad6" };
  const FRISUREN = { zoepfe: "Zöpfe", pferdeschwanz: "Pferdeschwanz", lang: "Lange Haare", bob: "Bob", locken: "Locken", dutt: "Dutt", kurz: "Kurz" };
  const FARBEN = { rosa: "#f58fb7", lila: "#a983e0", mint: "#5cc7a9", blau: "#5aa2e6", gelb: "#f6c445", rot: "#e8605a", orange: "#f39a4b", gruen: "#74b85c" };
  function defaults() {
    return {
      v: STAND_V,
      name: "",
      puppe: null, // { name, haut, haar, frisur, kleid, farbe }
      muenzen: 0, punkte: 0, gegessen: 0,
      besitz: [], traegt: [],
      fortschritt: {}, // skill -> { box, sterne, n, ok, reihe, last }
      fehler: [], // skills in der Übe-Kiste
      gesehen: {}, // skill -> Datum, an dem die Erklärung gezeigt wurde
      offen: ["zahlen", "weg"], // freigeschaltete Themen
      fokus: null, // Schwerpunkt-Thema, von den Eltern gesetzt
      tage: {}, // Datum -> { sek, aufgaben, richtig, etappen, mission, haSek }
      besuch: null, // { datum, freund }
      freunde: {}, // freundId -> { ab, herzen }
      sticker: {}, // emoji -> Anzahl
      einst: { etappe: 5, pauseSek: 30, pause: true, ruhig: false, vorlesen: false, toene: true },
      lastBackup: null, erstellt: null,
    };
  }
  const istObj = (o) => !!o && typeof o === "object" && !Array.isArray(o);
  const zahl = (x, d, min, max) => { x = Number(x); if (!isFinite(x)) return d; if (min != null && x < min) x = min; if (max != null && x > max) x = max; return x; };
  const str = (x, n) => (typeof x === "string" ? x.slice(0, n) : "");
  // Alte, halbe oder kaputte Stände in einen gültigen Stand verwandeln. Nichts, was lesbar ist, geht verloren.
  function migrate(raw) {
    const s = defaults();
    if (!istObj(raw)) return s;
    s.name = str(raw.name, 30);
    if (istObj(raw.puppe)) {
      const p = raw.puppe;
      s.puppe = {
        name: str(p.name, 30),
        haut: Math.floor(zahl(p.haut, 0, 0, HAUT.length - 1)),
        haar: HAAR[p.haar] ? p.haar : "braun",
        frisur: FRISUREN[p.frisur] ? p.frisur : "zoepfe",
        kleid: SHOP.kleider.some((k) => k.id === p.kleid) ? p.kleid : "kleid",
        farbe: FARBEN[p.farbe] ? p.farbe : "rosa",
      };
    }
    s.muenzen = Math.floor(zahl(raw.muenzen, 0, 0));
    s.punkte = Math.floor(zahl(raw.punkte, 0, 0));
    s.gegessen = Math.floor(zahl(raw.gegessen, 0, 0));
    if (Array.isArray(raw.besitz)) s.besitz = [...new Set(raw.besitz.filter((x) => typeof x === "string" && shopDing(x)))];
    if (Array.isArray(raw.traegt)) s.traegt = [...new Set(raw.traegt.filter((x) => typeof x === "string" && s.besitz.includes(x)))];
    if (s.puppe && s.puppe.kleid !== "kleid" && !s.besitz.includes(s.puppe.kleid)) s.puppe.kleid = "kleid";
    if (istObj(raw.fortschritt)) for (const id of Object.keys(raw.fortschritt)) {
      const p = raw.fortschritt[id]; if (!istObj(p) || !GEN[id]) continue;
      s.fortschritt[id] = { box: Math.floor(zahl(p.box, 0, 0, 5)), sterne: Math.floor(zahl(p.sterne, 0, 0, 3)), n: Math.floor(zahl(p.n, 0, 0)), ok: Math.floor(zahl(p.ok, 0, 0)), reihe: Math.floor(zahl(p.reihe, 0, 0)), last: gueltigesDatum(p.last) ? p.last : null };
    }
    if (Array.isArray(raw.fehler)) s.fehler = [...new Set(raw.fehler.filter((x) => typeof x === "string" && GEN[x]))];
    if (istObj(raw.gesehen)) for (const id of Object.keys(raw.gesehen)) if (GEN[id] && gueltigesDatum(raw.gesehen[id])) s.gesehen[id] = raw.gesehen[id];
    if (Array.isArray(raw.offen)) s.offen = ["zahlen"].concat(raw.offen.filter((id) => typeof id === "string" && themaById(id)));
    s.offen = THEMEN.map((t) => t.id).filter((id) => s.offen.includes(id));
    if (typeof raw.fokus === "string" && themaById(raw.fokus)) s.fokus = raw.fokus;
    if (istObj(raw.tage)) for (const t of Object.keys(raw.tage)) {
      const x = raw.tage[t]; if (!gueltigesDatum(t) || !istObj(x)) continue;
      s.tage[t] = { sek: zahl(x.sek, 0, 0), aufgaben: Math.floor(zahl(x.aufgaben, 0, 0)), richtig: Math.floor(zahl(x.richtig, 0, 0)), etappen: Math.floor(zahl(x.etappen, 0, 0)), mission: !!x.mission, haSek: zahl(x.haSek, 0, 0), perlen: Math.floor(zahl(x.perlen, 0, 0)) };
    }
    if (istObj(raw.besuch) && gueltigesDatum(raw.besuch.datum) && freundById(raw.besuch.freund)) s.besuch = { datum: raw.besuch.datum, freund: raw.besuch.freund };
    if (istObj(raw.freunde)) for (const id of Object.keys(raw.freunde)) {
      const x = raw.freunde[id]; if (!freundById(id) || !istObj(x)) continue;
      s.freunde[id] = { ab: gueltigesDatum(x.ab) ? x.ab : null, herzen: Math.floor(zahl(x.herzen, 1, 1)) };
    }
    if (istObj(raw.sticker)) for (const k of Object.keys(raw.sticker)) if (STICKER.includes(k)) s.sticker[k] = Math.floor(zahl(raw.sticker[k], 1, 1));
    if (istObj(raw.einst)) {
      const e = raw.einst;
      s.einst.etappe = Math.floor(zahl(e.etappe, s.einst.etappe, 3, 10));
      s.einst.pauseSek = Math.floor(zahl(e.pauseSek, s.einst.pauseSek, 10, 120));
      for (const b of ["pause", "ruhig", "vorlesen", "toene"]) if (typeof e[b] === "boolean") s.einst[b] = e[b];
    }
    if (typeof raw.lastBackup === "number" && isFinite(raw.lastBackup)) s.lastBackup = raw.lastBackup;
    if (typeof raw.erstellt === "number" && isFinite(raw.erstellt)) s.erstellt = raw.erstellt;
    s.v = STAND_V;
    return s;
  }

  // ---------- Fortschritt ----------
  const sterneFuer = (box) => (box >= 5 ? 3 : box >= 3 ? 2 : box >= 1 ? 1 : 0);
  const leer = () => ({ box: 0, sterne: 0, n: 0, ok: 0, reihe: 0, last: null });
  const teilStand = (s, id) => s.fortschritt[id] || leer();
  // Ergebnis einer Aufgabe eintragen. ersterVersuch: ohne Fehler und ohne Tipp gelöst. Sterne gehen nie verloren.
  function record(s, id, ersterVersuch, heute) {
    const p = s.fortschritt[id] || (s.fortschritt[id] = leer());
    p.n++; p.last = heute || p.last;
    if (ersterVersuch) {
      p.ok++; p.reihe++; p.box = Math.min(5, p.box + 1);
      if (p.reihe >= 2) { const i = s.fehler.indexOf(id); if (i >= 0) s.fehler.splice(i, 1); }
    } else {
      p.reihe = 0; p.box = Math.max(0, p.box - 1);
      if (!s.fehler.includes(id)) s.fehler.push(id);
    }
    p.sterne = Math.max(p.sterne, sterneFuer(p.box));
    return p;
  }
  // Bereitschaft je Thema in Prozent: Box 4 und höher zählt voll
  function bereitschaft(s, themaId) {
    const th = themaById(themaId); if (!th) return 0;
    let sumB = 0; for (const id of th.skills) sumB += Math.min(4, teilStand(s, id).box) / 4;
    return Math.round((100 * sumB) / th.skills.length);
  }
  const wackelt = (s) => ALLE_SKILLS.filter((id) => s.fehler.includes(id) || (teilStand(s, id).n > 0 && teilStand(s, id).box <= 1));
  // Nächstes Thema freischalten, wenn das vorige zu 60 % sitzt. Gibt die neu freigeschalteten Themen zurück.
  function aktualisiereOffen(s) {
    const neu = [];
    THEMEN.forEach((t, i) => {
      if (s.offen.includes(t.id)) return;
      const vor = THEMEN[i - 1];
      if (i === 0 || (vor && s.offen.includes(vor.id) && bereitschaft(s, vor.id) >= 60)) { s.offen.push(t.id); neu.push(t.id); }
    });
    s.offen = THEMEN.map((t) => t.id).filter((id) => s.offen.includes(id));
    return neu;
  }
  function fokus(s) {
    if (s.fokus && s.offen.includes(s.fokus)) return s.fokus;
    const offen = THEMEN.filter((t) => s.offen.includes(t.id));
    const t = offen.find((x) => bereitschaft(s, x.id) < 70);
    return (t || offen[offen.length - 1] || THEMEN[0]).id;
  }
  function aktuellerSkill(s, themaId) {
    const th = themaById(themaId) || THEMEN[0];
    const id = th.skills.find((x) => teilStand(s, x).box < 3);
    if (id) return id;
    return th.skills.slice().sort((a, b) => teilStand(s, a).box - teilStand(s, b).box)[0];
  }
  function stufeFuer(box, r) {
    let st = box <= 1 ? 0 : box <= 3 ? 1 : 2;
    if (r && st > 0 && r.f() < 0.2) st--; // ab und zu leichter zum Durchatmen
    return st;
  }

  // ---------- Etappen ----------
  // art: "warm" (Sicheres und Übe-Kiste), "neu" (aktueller Lernteil des Schwerpunkts), "mix" (gemischt),
  //      "kiste" (nur Übe-Kiste), "thema" (ein Thema), "skill" (ein Lernteil)
  function buildEtappe(s, opt) {
    const n = opt.n || 5;
    const r = R((opt.seed >>> 0) || 1);
    const art = opt.art || "mix";
    const offen = THEMEN.filter((t) => s.offen.includes(t.id));
    const fok = opt.thema || fokus(s);
    const fokSkills = (themaById(fok) || THEMEN[0]).skills;
    const offenSkills = offen.flatMap((t) => t.skills);
    const st = (id) => teilStand(s, id);
    const gesehen = (id) => st(id).n > 0;
    const nachAlter = (arr) => r.shuffle(arr).sort((a, b) => (st(a).last || "").localeCompare(st(b).last || ""));
    const kiste = r.shuffle(s.fehler.filter((id) => art === "kiste" || offenSkills.includes(id)));
    const wahl = [];
    const nimm = (ids, k, doppelt) => { for (const id of ids) { if (wahl.length >= n || k <= 0) break; if (doppelt || !wahl.includes(id)) { wahl.push(id); k--; } } };
    const cur = aktuellerSkill(s, fok);
    let leichter = 0, gruppiert = false;
    if (art === "kiste") nimm(kiste, n);
    else if (art === "skill") { while (wahl.length < n) wahl.push(opt.skill); gruppiert = true; }
    else if (art === "warm") {
      leichter = 1;
      nimm(kiste, 2);
      nimm(nachAlter(offenSkills.filter((id) => gesehen(id) && st(id).box >= 2)), n);
      nimm(nachAlter(offenSkills.filter(gesehen)), n);
      while (wahl.length < n) wahl.push(wahl.length ? r.pick(wahl) : cur);
      // erste Aufgabe: die sicherste, damit der Start leicht fällt
      let best = 0; wahl.forEach((id, i) => { if (st(id).box > st(wahl[best]).box) best = i; });
      wahl.unshift(wahl.splice(best, 1)[0]);
    } else if (art === "neu" || art === "thema") {
      const i = fokSkills.indexOf(cur);
      nimm([cur, cur, cur], Math.ceil(n * 0.6), true);
      if (st(cur).box >= 2 && fokSkills[i + 1]) nimm([fokSkills[i + 1]], 1);
      nimm(r.shuffle(fokSkills.slice(0, i).filter(gesehen)), n);
      while (wahl.length < n) wahl.push(cur);
      gruppiert = true;
    } else { // mix
      nimm(kiste, Math.ceil(n / 3));
      nimm(nachAlter(fokSkills.filter(gesehen)), Math.ceil(n / 2));
      const vorher = offen.slice(0, Math.max(0, offen.findIndex((t) => t.id === fok))).flatMap((t) => t.skills).filter(gesehen);
      nimm(nachAlter(vorher), n);
      nimm(nachAlter(offenSkills.filter(gesehen)), n);
      while (wahl.length < n) wahl.push(cur);
    }
    let reihe = wahl;
    if (!gruppiert && art !== "warm") {
      reihe = r.shuffle(wahl);
      for (let i = 1; i < reihe.length; i++) if (reihe[i] === reihe[i - 1]) { const j = reihe.findIndex((x, k) => k > i && x !== reihe[i - 1]); if (j > 0) [reihe[i], reihe[j]] = [reihe[j], reihe[i]]; }
    }
    return reihe.map((id) => ({ skill: id, stufe: Math.max(0, stufeFuer(st(id).box, r) - leichter), seed: r.seed(), freund: opt.freund || null }));
  }
  // Die drei Etappen der Tagesmission
  function missionEtappen(s) {
    const fok = fokus(s);
    return [{ titel: "Aufwärmen", art: "warm" }, { titel: "Neues lernen", art: "neu", thema: fok }, { titel: "Festigen", art: "mix", thema: fok }];
  }
  // Wer kommt heute zu Besuch? Zuerst alle, die noch nicht im Freundebuch stehen, dann reihum.
  function besuchFuer(s, heute) {
    if (s.besuch && s.besuch.datum === heute) return s.besuch.freund;
    const neu = FREUNDE.filter((f) => !s.freunde[f.id]);
    let id;
    if (neu.length) id = neu[0].id;
    else {
      const min = Math.min(...FREUNDE.map((f) => s.freunde[f.id].herzen));
      const kand = FREUNDE.filter((f) => s.freunde[f.id].herzen === min);
      id = kand[hash(heute) % kand.length].id;
    }
    s.besuch = { datum: heute, freund: id };
    return id;
  }
  function freundDanke(s, id, heute) {
    const neu = !s.freunde[id];
    if (neu) s.freunde[id] = { ab: heute, herzen: 1 };
    else s.freunde[id].herzen++;
    return { neu, herzen: s.freunde[id].herzen };
  }

  const L = {
    R, hash, M, H, Z, E, zerlege, parseZahl,
    GEN, THEMEN, SKILL_NAMEN, ALLE_SKILLS, themaVon, themaById, makeTask, checkFeld, checkWahl, tippSchritt, kreuztSchritt,
    FREUNDE, freundById, GESCHICHTEN, geschichte,
    heuteISO, tageBis, plusTage, gueltigesDatum,
    SHOP, shopDing, kaufe, STICKER, ueberraschung, STUFEN, stufe, LOHN, HA_LOHN,
    HAUT, HAAR, FRISUREN, FARBEN,
    defaults, migrate, record, teilStand, bereitschaft, wackelt, sterneFuer, aktualisiereOffen, fokus, aktuellerSkill, stufeFuer,
    buildEtappe, missionEtappen, besuchFuer, freundDanke,
  };
  root.PS = L;
  if (typeof module !== "undefined" && module.exports) module.exports = L;
})(typeof window !== "undefined" ? window : globalThis);
