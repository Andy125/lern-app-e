// Deutsch in der Puppenstube: Wörter mit ie (Sprachbuch Seite 79 und 80).
// Reine Logik ohne Oberfläche. Läuft im Browser und in Node (tools/test-deutsch.mjs).
// Jede Aufgabe entsteht aus (Wort, Aufgabenart, Stufe, Startwert) und ist damit reproduzierbar.
(function (root) {
  "use strict";
  const L = root.PS || (typeof require === "function" ? require("./logic.js") : null);

  const THEMEN = [
    { id: "bilder", name: "Wörter mit Bild", icon: "🐝", buch: "Seite 79, Nr. 1" },
    { id: "reime", name: "Reimpaare", icon: "🎵", buch: "Seite 79 und 80, Nr. 2" },
    { id: "silben", name: "Silben verbinden", icon: "🧩", buch: "Seite 80, Nr. 1" },
  ];
  const slug = (s) => s.toLowerCase().replace(/ß/g, "ss").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/[^a-z]+/g, "-");
  // W(Wort, Bild auf der Wiese, Satz fürs Diktat, mehr): art = der/die/das bei Nomen, verb = Tuwort,
  // bild = Bild für Bildaufgaben, eindeutig = das Bild heißt sicher so (für «Wo hörst du ein langes i?»)
  const W = (wort, deko, satz, mehr) => Object.assign({ id: slug(wort), wort, deko, satz, themen: [] }, mehr || {});
  const WOERTER = [
    // Seite 79, Nr. 1: Schreibe die Wörter mit ie
    W("Biene", "🐝", "Die Biene summt um die Blume.", { art: "die", bild: "🐝", eindeutig: true, silben: ["Bie", "ne"], himmel: true }),
    W("Brief", "✉️", "Im Brief steht: Ich hab dich lieb!", { art: "der", bild: "✉️", eindeutig: true }),
    W("Dieb", "🦝", "Der Dieb schleicht auf Zehenspitzen.", { art: "der", bild: "🦝💰", tipp: "Der Waschbär trägt eine Maske und einen Sack, wie ein Dieb." }),
    W("Knie", "🦵", "Auf meinem Knie klebt ein Pflaster.", { art: "das", bild: "🦵", tipp: "Das Knie ist in der Mitte vom Bein." }),
    W("Fieber", "🌡️", "Mit Fieber bleibt man im Bett.", { art: "das", bild: "🤒", eindeutig: true }),
    W("Schiene", "🛤️", "Der Zug fährt auf der Schiene.", { art: "die", bild: "🛤️", eindeutig: true }),
    W("vier", "🍀", "Das Kleeblatt hat vier Blätter.", { bild: "4️⃣", eindeutig: true }),
    W("Ziel", "🎯", "Der Pfeil fliegt genau ins Ziel.", { art: "das", bild: "🎯", eindeutig: true }),
    W("Stiel", "🧹", "Der Besen hat einen langen Stiel.", { art: "der", bild: "🧹", tipp: "Der Stiel ist der lange Stock am Besen." }),
    W("Tiere", "🐶", "Im Zoo leben viele Tiere.", { art: "die", bild: "🐶🐱", tipp: "Hund und Katze sind zwei Tiere." }),
    W("Spiel", "🎲", "Wir machen ein lustiges Spiel.", { art: "das", bild: "🎲", tipp: "Mit Würfeln macht man ein Spiel." }),
    W("Zwiebel", "🧅", "Die Zwiebel bringt mich zum Weinen.", { art: "die", bild: "🧅", eindeutig: true }),
    // Seite 79, Nr. 2: Reimpaare
    W("Fliege", "🪰", "Eine Fliege sitzt auf meiner Nase.", { art: "die", bild: "🪰", eindeutig: true, himmel: true }),
    W("Liege", "⛱️", "Die Puppe ruht auf der Liege.", { art: "die" }),
    W("biegen", "🌷", "Der Wind kann die Blumen biegen.", { verb: true }),
    W("wiegen", "⚖️", "Wir wiegen das Mehl für den Kuchen.", { verb: true, silben: ["wie", "gen"] }),
    W("tief", "🌊", "Der See ist sehr tief."),
    W("schließen", "🔒", "Bitte die Tür schließen!", { verb: true }),
    W("fließen", "💧", "Im Bach fließen kleine Wellen.", { verb: true }),
    W("verlieren", "🧦", "Ich will meine Socke nicht verlieren.", { verb: true }),
    W("spazieren", "🐕", "Wir gehen mit dem Hund spazieren.", { verb: true }),
    W("Wiese", "🌼", "Auf der Wiese blühen Blumen.", { art: "die" }),
    W("Riese", "👣", "Der Riese hat große Füße.", { art: "der" }),
    W("kriechen", "🐛", "Die Raupe kann langsam kriechen.", { verb: true }),
    W("riechen", "🌹", "Ich kann die Rose riechen.", { verb: true }),
    W("wieder", "🦋", "Morgen komme ich wieder.", { himmel: true }),
    W("Lieder", "🎶", "Wir singen fröhliche Lieder.", { art: "die", himmel: true }),
    // Seite 80, Nr. 2: Reimpaare
    W("kariert", "🧺", "Die Picknickdecke ist rot kariert."),
    W("rasiert", "🪒", "Der Clown hat sich rasiert."),
    W("Tier", "🐴", "Mein liebstes Tier ist das Pony.", { art: "das" }),
    W("ziehen", "🪁", "Wir ziehen den Drachen an der Schnur.", { verb: true, himmel: true }),
    W("fliehen", "🐭", "Die Mäuse fliehen vor der Katze.", { verb: true }),
    W("wie", "❓", "Weißt du, wie spät es ist?"),
    W("Niete", "🎟️", "Bei der Tombola zog ich eine Niete.", { art: "die" }),
    W("Miete", "🏠", "Für die Wohnung zahlt man Miete.", { art: "die" }),
    W("hieß", "🏷️", "Früher hieß mein Teddy Brummi.", { verb: true, vor: "er" }),
    W("ließ", "🎈", "Er ließ den Ballon fliegen.", { verb: true, vor: "er", himmel: true }),
    W("Sieb", "🍝", "Die Nudeln kommen in das Sieb.", { art: "das" }),
    W("Ziegel", "🧱", "Auf dem Dach fehlt ein Ziegel.", { art: "der", bild: "🧱" }),
    W("Spiegel", "🪞", "Im Spiegel sehe ich mich.", { art: "der", bild: "🪞", eindeutig: true }),
    W("verbieten", "🚫", "Die Lehrerin will das Rennen verbieten.", { verb: true }),
    W("mieten", "⛵", "Im Urlaub mieten wir ein Boot.", { verb: true }),
    // Seite 80, Nr. 1: Verbinde die Silben
    W("Tiefe", "🐠", "Der Taucher schwimmt in die Tiefe.", { art: "die", silben: ["Tie", "fe"] }),
    W("Diener", "🤵", "Der Diener bringt dem König Tee.", { art: "der", silben: ["Die", "ner"] }),
    W("Frieden", "🕊️", "Alle Tiere leben in Frieden.", { art: "der", silben: ["Frie", "den"], himmel: true }),
    W("piepen", "🐣", "Die Küken piepen ganz laut.", { verb: true, silben: ["pie", "pen"] }),
    W("spiegeln", "🏔️", "Die Berge spiegeln sich im See.", { verb: true, silben: ["spie", "geln"] }),
    W("schießen", "⚽", "Ich will ein Tor schießen!", { verb: true, silben: ["schie", "ßen"] }),
    W("siegen", "🏆", "Wer wird heute siegen?", { verb: true, silben: ["sie", "gen"] }),
    W("gießen", "🪴", "Ich muss die Blumen gießen.", { verb: true, silben: ["gie", "ßen"] }),
    W("bieten", "🍰", "Wir bieten dir Kuchen an.", { verb: true, silben: ["bie", "ten"] }),
    W("niemand", "👻", "Im Puppenhaus ist gerade niemand.", { silben: ["nie", "mand"] }),
    W("riesig", "🐘", "Der Elefant ist riesig.", { silben: ["rie", "sig"] }),
    W("schieben", "🛒", "Wir schieben den Einkaufswagen.", { verb: true, silben: ["schie", "ben"] }),
  ];
  // So stehen die Wörter im Buch zusammen
  const BILDWOERTER = ["biene", "brief", "dieb", "knie", "fieber", "schiene", "vier", "ziel", "stiel", "tiere", "spiel", "zwiebel"];
  const REIME = [
    ["fliege", "liege"], ["ziel", "stiel"], ["biegen", "wiegen"], ["brief", "tief"], ["schliessen", "fliessen"], ["verlieren", "spazieren"], ["wiese", "riese"], ["kriechen", "riechen"], ["wieder", "lieder"],
    ["kariert", "rasiert"], ["vier", "tier"], ["ziehen", "fliehen"], ["knie", "wie"], ["niete", "miete"], ["hiess", "liess"], ["sieb", "dieb"], ["ziegel", "spiegel"], ["verbieten", "mieten"],
  ];
  const KAESTEN = [["biene", "tiefe"], ["diener", "frieden"], ["piepen", "spiegeln"], ["schiessen", "siegen"], ["giessen", "bieten"], ["niemand", "riesig"], ["wiegen", "schieben"]];
  const BY = {};
  WOERTER.forEach((w) => (BY[w.id] = w));
  const dazu = (id, th) => { if (!BY[id].themen.includes(th)) BY[id].themen.push(th); };
  BILDWOERTER.forEach((id) => dazu(id, "bilder"));
  REIME.forEach(([a, b], i) => { BY[a].reim = b; BY[b].reim = a; BY[a].seite = BY[b].seite = i < 9 ? 79 : 80; dazu(a, "reime"); dazu(b, "reime"); });
  KAESTEN.forEach(([a, b], i) => { BY[a].kasten = i; BY[b].kasten = i; dazu(a, "silben"); dazu(b, "silben"); });

  // Gegenspieler: kurzes i und ei. Damit «ie» eine echte Entscheidung bleibt. Sie zählen nicht zum Fortschritt.
  const K = (wort, bild, laut) => ({ id: "k-" + slug(wort), wort, bild, laut, kontrast: true });
  const KONTRAST = [
    K("Fisch", "🐟", "i"), K("Ring", "💍", "i"), K("Pilz", "🍄", "i"), K("Milch", "🥛", "i"), K("Schiff", "🚢", "i"), K("Stift", "✏️", "i"),
    K("Kirsche", "🍒", "i"), K("Brille", "👓", "i"), K("Kiste", "📦", "i"), K("Licht", "💡", "i"), K("Kind", "🧒", "i"), K("Pinsel", "🖌️", "i"),
    K("Seife", "🧼", "ei"), K("Kleid", "👗", "ei"), K("Reis", "🍚", "ei"), K("Schwein", "🐷", "ei"), K("Stein", "🪨", "ei"), K("Leiter", "🪜", "ei"),
    K("Geige", "🎻", "ei"), K("Kreis", "⭕", "ei"), K("Zeitung", "📰", "ei"), K("Seil", "🪢", "ei"),
  ];
  const wortById = (id) => BY[id] || null;
  const kontrastById = (id) => KONTRAST.find((k) => k.id === id) || null;
  const imThema = (th) => WOERTER.filter((w) => w.themen.includes(th));
  const zeige = (w) => (w.vor ? w.vor + " " : "") + w.wort;
  const istNomen = (w) => w.wort.charAt(0) !== w.wort.charAt(0).toLowerCase();
  const LIESE = { id: "liese", name: "Liese", sie: true, mag: "Bienen, Blumenwiesen und Lieder", farbe: "Gelb wie eine Biene", danke: "Du weißt jetzt, wie man ie-Wörter schreibt. Meine Wiese blüht!", look: { haut: 0, haar: "blond", frisur: "zoepfe", kleid: "latzhose", farbe: "gelb" } };
  // {…} wird in der App hervorgehoben, beim Vorlesen fallen die Klammern weg
  const MERKSPRUCH = "Klingt das i ganz lang wie bei {Biene}, schreib {ie}, so wie {Liese}!";
  // Erklärung zum Start (Bilder zeichnet app.js). sag = so liest das iPad vor.
  const REGEL = [
    { text: "Hör mal: {Biiiiene}. Das i in {Biene} klingt ganz lang, wie ein Gummiband.", sag: "Hör mal: Biene. Das i in Biene klingt ganz lang, wie ein Gummiband.", bild: { typ: "dehnen", wort: "Biene", bild: "🐝" } },
    { text: "Ein langes i ist nie allein. Es nimmt seine Freundin e an die Hand. Zusammen schreibt man sie {ie}.", bild: { typ: "paar" } },
    { text: "Hör mal: Fisch. Hier ist das i ganz kurz und schnell. Dann steht das i allein.", bild: { typ: "kurz", wort: "Fisch", bild: "🐟" } },
    { text: "Erst kommt das i, dann das e. So wie in meinem Namen: {Liese}.", bild: { typ: "reihe", wort: "Liese" } },
    { text: "Mein Merkspruch: " + MERKSPRUCH, bild: { typ: "liese" } },
  ];
  // Seite 79, Nr. 3
  const REGEL_FRAGE = { frage: "Wie wird ein lang gesprochenes i meistens geschrieben?", optionen: ["i", "ie"], loesung: "ie" };

  // Diktatsatz mit Lücke: [davor, danach]. Das Wort steht genau so im Satz.
  function satzLuecke(w) {
    const m = new RegExp("(^|[^A-Za-zÄÖÜäöüß])" + w.wort + "(?![A-Za-zÄÖÜäöüß])").exec(w.satz || "");
    if (!m) return null;
    const i = m.index + m[1].length;
    return [w.satz.slice(0, i), w.satz.slice(i + w.wort.length)];
  }
  // Wort in Bausteine: auf Stufe 0 ist «ie» ein einziger Baustein
  function bausteine(wort, mitIe) {
    if (!mitIe) return Array.from(wort);
    const i = wort.indexOf("ie");
    return Array.from(wort.slice(0, i)).concat(["ie"], Array.from(wort.slice(i + 2)));
  }
  const andersGross = (c) => (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase());
  const ende = (w) => w.wort.slice(w.wort.indexOf("ie") + 2);

  // ---------- Aufgaben ----------
  const ARTEN = ["bild-wort", "luecke", "hoeren-lang", "reim", "silbe", "gross", "buchstaben"];
  function makeTask(spec) {
    const w = wortById(spec.wort) || kontrastById(spec.wort);
    if (!w) return null;
    let typ = ARTEN.includes(spec.typ) ? spec.typ : "luecke";
    if (w.kontrast) typ = "luecke";
    if (typ === "hoeren-lang" && !w.eindeutig) typ = w.bild ? "bild-wort" : "luecke";
    if (typ === "bild-wort" && !w.bild) typ = "luecke";
    if (typ === "reim" && !w.reim) typ = "luecke";
    if (typ === "silbe" && w.kasten == null) typ = "luecke";
    const stufe = Math.max(0, Math.min(2, spec.stufe || 0));
    const seed = spec.seed >>> 0;
    const r = L.R(L.hash("de|" + w.id + "|" + typ + "|" + stufe) ^ seed);
    const t = {
      fach: "de", wort: w.id, thema: spec.thema || null, typ, stufe, seed, id: `de|${w.id}|${typ}|${stufe}|${seed}`, kontrast: !!w.kontrast,
      art: "wahl", layout: "de", frage: "", prompt: null, optionen: [], anzeige: "text", loesung: "", sprich: "", sprichNachher: zeige(w), tipp: w.tipp || "", tippFuer: null, erklaerung: "", merk: "",
    };
    switch (typ) {
      case "bild-wort": {
        const opts = r.shuffle([w].concat(r.shuffle(WOERTER.filter((x) => x.bild && x.id !== w.id)).slice(0, 2)));
        t.frage = "Was ist das?"; t.prompt = { typ: "bild", bild: w.bild };
        t.optionen = opts.map(zeige); t.loesung = zeige(w);
        t.tipp = w.tipp || "Sag leise, was du siehst. Welches Wort passt?";
        t.erklaerung = `{${zeige(w)}} schreibt man mit ie. Das i klingt lang.`;
        break;
      }
      case "luecke": {
        const ziel = w.kontrast ? w.laut : "ie";
        const pos = w.wort.indexOf(ziel);
        t.frage = "Welche Buchstaben fehlen?";
        t.prompt = { typ: "luecke", vor: w.vor || "", a: w.wort.slice(0, pos), b: w.wort.slice(pos + ziel.length), bild: w.bild || null, satz: w.bild ? null : satzLuecke(w) };
        t.optionen = r.shuffle(["i", "ie", "ei"]); t.loesung = ziel; t.sprich = zeige(w);
        t.tipp = "Sprich das Wort ganz langsam. Klingt es lang wie bei Liiiese, kurz wie bei Fisch oder wie bei Eis?";
        const EI = "ei klingt wie bei Eis. Hör noch einmal genau hin.";
        if (ziel === "ie") {
          t.tippFuer = { i: "Hör genau hin: Das i klingt lang, nicht kurz wie bei Fisch. Ein langes i schreibt man ie.", ei: EI };
          t.erklaerung = `{${zeige(w)}} hat ein langes i. Darum schreibt man ie.`;
        } else if (ziel === "i") {
          t.tippFuer = { ie: "Hör genau hin: Das i ist ganz kurz und schnell. Dann steht das i allein.", ei: EI };
          t.erklaerung = `${w.wort} hat ein kurzes i. Darum steht das i allein.`;
        } else {
          t.tippFuer = { i: "Hör genau hin: Das klingt wie bei Eis. Das schreibt man ei.", ie: "Hör genau hin: Das klingt wie bei Eis. Das schreibt man ei, erst das e, dann das i." };
          t.erklaerung = `${w.wort} klingt wie bei Eis. Darum schreibt man ei.`;
        }
        t.merk = "Langes i: ie. Kurzes i: i. Wie bei Eis: ei.";
        break;
      }
      case "hoeren-lang": {
        const andere = r.shuffle(KONTRAST.filter((k) => k.bild !== w.bild)).slice(0, 2);
        const opts = r.shuffle([w].concat(andere));
        t.frage = "Bei welchem Bild hörst du ein langes i?"; t.prompt = { typ: "hoeren-lang" };
        t.anzeige = "bild"; t.optionen = opts.map((x) => x.id); t.loesung = w.id;
        t.bilder = {}; t.namen = {};
        opts.forEach((x) => { t.bilder[x.id] = x.bild; t.namen[x.id] = x.wort; });
        t.sprich = opts.map((x) => x.wort).join(". ") + ".";
        t.tipp = "Tippe auf den Lautsprecher. Bei welchem Wort kannst du das i lang ziehen wie ein Gummiband?";
        t.erklaerung = `{${zeige(w)}} hat ein langes i. Darum schreibt man ie.`;
        break;
      }
      case "reim": {
        const p = wortById(w.reim);
        const k = ende(w).charAt(0);
        const andere = r.shuffle(imThema("reime").filter((x) => x.id !== w.id && x.id !== p.id && ende(x).charAt(0) !== k)).slice(0, 2);
        t.frage = `Was reimt sich auf «${zeige(w)}»?`; t.prompt = { typ: "wort", text: zeige(w), bild: w.bild || null };
        t.optionen = r.shuffle([p].concat(andere)).map(zeige); t.loesung = zeige(p);
        t.sprich = zeige(w); t.sprichNachher = `${zeige(w)}, ${zeige(p)}`;
        t.tipp = `Sag die Wörter laut. Welches klingt am Ende so wie «${zeige(w)}»?`;
        t.erklaerung = `{${zeige(w)}} und {${zeige(p)}} reimen sich. Beide schreibt man mit ie.`;
        break;
      }
      case "silbe": {
        const [a, b] = KAESTEN[w.kasten].map(wortById);
        const anderer = a.id === w.id ? b : a;
        t.frage = "Welche Silbe passt dazu?"; t.prompt = { typ: "silbe", erste: w.silben[0] };
        t.optionen = r.shuffle([w.silben[1], anderer.silben[1]]); t.loesung = w.silben[1];
        t.tipp = "Setz die Silben zusammen und sprich sie laut. Welches Wort kennst du?";
        t.erklaerung = `${w.silben[0]} und ${w.silben[1]} gibt {${w.wort}}.`;
        break;
      }
      case "gross": {
        const erst = w.wort.charAt(0), nomen = istNomen(w);
        t.frage = "Groß oder klein?";
        t.prompt = { typ: "gross", vor: w.vor || "", rest: w.wort.slice(1), bild: w.bild || null, satz: w.bild ? null : satzLuecke(w) };
        t.optionen = [erst.toUpperCase(), erst.toLowerCase()]; t.loesung = erst;
        t.tipp = "Kannst du der, die oder das davor sagen? Dann ist es ein Nomen. Nomen schreibt man groß.";
        t.tippFuer = { [andersGross(erst)]: nomen ? `Man sagt «${w.art} ${w.wort}». Es ist ein Nomen. Nomen schreibt man groß.` : w.verb ? "Das kann man tun. Es ist ein Verb. Verben schreibt man klein." : "Der, die oder das passt nicht davor. Darum schreibt man es klein." };
        t.erklaerung = nomen ? `Es heißt ${w.art} {${w.wort}}. Nomen schreibt man groß.` : w.verb ? `{${zeige(w)}} ist ein Verb. Verben schreibt man klein.` : `{${w.wort}} schreibt man klein.`;
        t.merk = "Nomen schreibt man groß. Vor ein Nomen passt der, die oder das.";
        break;
      }
      case "buchstaben": {
        const ziel = w.wort;
        const einheiten = bausteine(ziel, stufe === 0);
        let extra = [];
        if (stufe >= 2) {
          const pool = r.shuffle(Array.from("aonrtulmdkhb").filter((c) => !ziel.toLowerCase().includes(c)));
          const gross = andersGross(ziel.charAt(0));
          extra = (ziel.includes(gross) ? [] : [gross]).concat(pool).slice(0, 2);
        }
        let kacheln = r.shuffle(einheiten.concat(extra));
        for (let i = 0; i < 5 && kacheln.join("|") === einheiten.join("|"); i++) kacheln = r.shuffle(kacheln);
        t.art = "buchstaben"; t.frage = stufe >= 2 ? "Hör gut zu und lege das Wort." : "Lege das Wort mit den Buchstaben.";
        t.prompt = { typ: "buchstaben", bild: stufe < 2 ? w.bild || null : null, satz: satzLuecke(w), vorne: w.vor || "", diktat: stufe >= 2 };
        t.ziel = ziel; t.einheiten = einheiten; t.kacheln = kacheln; t.loesung = ziel;
        t.sprich = stufe >= 2 ? `${zeige(w)}. ${w.satz}` : zeige(w);
        t.tipp = w.tipp ? w.tipp + " Und beim langen i: erst das i, dann das e." : "Sprich das Wort langsam mit. Beim langen i kommt erst das i, dann das e.";
        t.erklaerung = `{${zeige(w)}}: erst das i, dann das e.${istNomen(w) ? " Und vorne groß, weil es ein Nomen ist." : ""}`;
        break;
      }
    }
    return t;
  }
  const checkWahl = (t, wert) => ({ ok: String(wert) === String(t.loesung) });
  const naechsterOk = (t, gelegt, baustein) => t.einheiten[gelegt.length] === baustein;
  // Passender Tipp, wenn ein falscher Buchstabe angetippt wurde
  function kachelTipp(t, gelegt, baustein) {
    const soll = t.einheiten[gelegt.length];
    if (soll == null) return t.tipp;
    if (soll === "ie") return "Hier klingt das i lang. Nimm die ie-Kachel, da halten sich i und e an der Hand.";
    if (soll === "i" && baustein === "e") return "Erst kommt das i, dann das e. Das i geht vorne.";
    if (soll === "e" && gelegt[gelegt.length - 1] === "i") return "Das lange i hat seine Freundin e dabei. Jetzt kommt das e.";
    if (soll !== baustein && soll.toLowerCase() === String(baustein).toLowerCase()) return soll === soll.toUpperCase() ? "Groß oder klein? Nomen schreibt man groß." : "Groß oder klein? Dieses Wort schreibt man klein.";
    return t.tipp;
  }

  // ---------- Fortschritt ----------
  function defaultsDe() { return { w: {}, wiese: [], glitzer: [], liese: null, runden: 0, regel: false }; }
  function migrateDe(raw) {
    const d = defaultsDe();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return d;
    const zahl = (x, def, min, max) => { x = Number(x); if (!isFinite(x)) return def; return Math.min(max, Math.max(min, Math.floor(x))); };
    if (raw.w && typeof raw.w === "object") for (const id of Object.keys(raw.w)) {
      const p = raw.w[id]; if (!wortById(id) || !p || typeof p !== "object") continue;
      d.w[id] = { box: zahl(p.box, 0, 0, 5), n: zahl(p.n, 0, 0, 1e6), ok: zahl(p.ok, 0, 0, 1e6), last: L.gueltigesDatum(p.last) ? p.last : null };
    }
    const gut = (x) => typeof x === "string" && !!wortById(x);
    if (Array.isArray(raw.wiese)) d.wiese = [...new Set(raw.wiese.filter(gut))];
    if (Array.isArray(raw.glitzer)) d.glitzer = [...new Set(raw.glitzer.filter((x) => gut(x) && d.wiese.includes(x)))];
    if (raw.liese && typeof raw.liese === "object") d.liese = { ab: L.gueltigesDatum(raw.liese.ab) ? raw.liese.ab : null, herzen: zahl(raw.liese.herzen, 1, 1, 1e6) };
    d.runden = zahl(raw.runden, 0, 0, 1e6);
    d.regel = raw.regel === true;
    return d;
  }
  // logic.js kennt Deutsch nicht: Spielstand hier um den Teil «de» erweitern
  if (L && !L.__deDrin) {
    const altD = L.defaults, altM = L.migrate;
    L.defaults = () => Object.assign(altD(), { de: defaultsDe() });
    L.migrate = (raw) => Object.assign(altM(raw), { de: migrateDe(raw && typeof raw === "object" ? raw.de : null) });
    L.__deDrin = true;
  }
  const stand = (s, id) => (s.de && s.de.w[id]) || { box: 0, n: 0, ok: 0, last: null };
  // Auf Anhieb richtig: das Wort blüht auf der Wiese. Auf Anhieb selbst geschrieben: es glitzert.
  function record(s, id, ersterVersuch, heute, typ) {
    if (!s.de) s.de = defaultsDe();
    if (!wortById(id)) return { p: null, neuWiese: null, neuGlitzer: null };
    const p = s.de.w[id] || (s.de.w[id] = { box: 0, n: 0, ok: 0, last: null });
    p.n++; p.last = heute || p.last;
    if (ersterVersuch) { p.ok++; p.box = Math.min(5, p.box + 1); } else p.box = Math.max(0, p.box - 1);
    let neuWiese = null, neuGlitzer = null;
    if (ersterVersuch && !s.de.wiese.includes(id)) { s.de.wiese.push(id); neuWiese = id; }
    if (ersterVersuch && typ === "buchstaben" && !s.de.glitzer.includes(id)) { s.de.glitzer.push(id); neuGlitzer = id; }
    return { p, neuWiese, neuGlitzer };
  }
  // Wie gut sitzt ein Thema? Box 3 heißt: erkannt, gewusst und richtig geschrieben
  function bereitschaft(s, th) {
    const ws = th ? imThema(th) : WOERTER;
    return Math.round((100 * ws.reduce((a, w) => a + Math.min(3, stand(s, w.id).box) / 3, 0)) / ws.length);
  }
  function typFuer(w, box, r, thema) {
    const th = thema || w.themen[0];
    const erst = th === "reime" ? "reim" : th === "silben" ? "silbe" : "bild-wort";
    const hoer = th === "bilder" && w.eindeutig ? "hoeren-lang" : "gross";
    if (box <= 0) return r.pick([erst, "luecke"]);
    if (box === 1) return r.pick([erst, "luecke", hoer]);
    if (box === 2) return r.pick(["buchstaben", "luecke", "gross"]);
    return r.pick(["buchstaben", "buchstaben", hoer === "gross" ? erst : hoer]);
  }
  // Etappe: die schwächsten Wörter zuerst. Bei gemischten Etappen kommen zwei Gegenspieler dazu
  // (ein Wort mit kurzem i und eins mit ei), damit «ie» nie geraten werden kann.
  function buildEtappe(s, opt) {
    const r = L.R((opt.seed >>> 0) || 1);
    const n = opt.n || 8;
    const mitGegen = !opt.typ && n >= 5;
    const nWort = mitGegen ? n - 2 : n;
    const ws = opt.thema ? imThema(opt.thema) : WOERTER.slice();
    const rang = (w) => { const p = stand(s, w.id); return opt.typ === "buchstaben" ? (p.n > 0 && p.box < 4 ? p.box : 10 + p.box) : p.box; };
    const sortiert = r.shuffle(ws).sort((a, b) => rang(a) - rang(b) || (stand(s, a.id).last || "").localeCompare(stand(s, b.id).last || ""));
    const wahl = [];
    for (let i = 0; wahl.length < nWort; i++) wahl.push(sortiert[i % sortiert.length]);
    let reihe = r.shuffle(wahl);
    for (let i = 1; i < reihe.length; i++) if (reihe[i].id === reihe[i - 1].id) { const j = reihe.findIndex((x, k) => k > i && x.id !== reihe[i - 1].id); if (j > 0) [reihe[i], reihe[j]] = [reihe[j], reihe[i]]; }
    // Leichter Start: das schwächste Wort zuerst (es bekommt die leichteste Aufgabe)
    const leicht = reihe.reduce((m, w, i) => (stand(s, w.id).box < stand(s, reihe[m].id).box ? i : m), 0);
    reihe = [reihe[leicht]].concat(reihe.filter((_, i) => i !== leicht));
    const specs = reihe.map((w) => { const box = stand(s, w.id).box; return { fach: "de", wort: w.id, thema: opt.thema || null, typ: opt.typ || typFuer(w, box, r, opt.thema), stufe: box >= 4 ? 2 : box >= 2 ? 1 : 0, seed: r.seed() }; });
    if (mitGegen) for (const laut of r.shuffle(["i", "ei"])) {
      const k = r.pick(KONTRAST.filter((x) => x.laut === laut));
      specs.splice(r.int(1, specs.length), 0, { fach: "de", wort: k.id, thema: opt.thema || null, typ: "luecke", stufe: 0, seed: r.seed() });
    }
    return specs;
  }
  // ie-Training: drei Etappen wie die Aufgaben im Buch
  const missionEtappen = () => THEMEN.map((th) => ({ titel: th.name, fach: "de", thema: th.id, n: 8 }));

  const DE = { THEMEN, WOERTER, BILDWOERTER, REIME, KAESTEN, KONTRAST, LIESE, MERKSPRUCH, REGEL, REGEL_FRAGE, ARTEN, wortById, kontrastById, imThema, zeige, istNomen, satzLuecke, bausteine, makeTask, checkWahl, naechsterOk, kachelTipp, defaultsDe, migrateDe, stand, record, bereitschaft, typFuer, buildEtappe, missionEtappen };
  root.PS_DE = DE;
  if (typeof module !== "undefined" && module.exports) module.exports = DE;
})(typeof window !== "undefined" ? window : globalThis);
