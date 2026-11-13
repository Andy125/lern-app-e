// Puppe, Puppenhaus und Rechenbilder. Alles als SVG gezeichnet, eigene Figuren, keine Bilddateien.
(function (root) {
  "use strict";
  const L = root.PS;
  const HAUT = L.HAUT, HAAR = L.HAAR, FARBEN = L.FARBEN;
  const M = "−";

  function heller(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const m = (x) => Math.round(x + (255 - x) * f);
    return "#" + [m(r), m(g), m(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  function dunkler(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const m = (x) => Math.round(x * (1 - f));
    return "#" + [m(r), m(g), m(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  }

  // ---------- Haare ----------
  const HAAR_HINTEN = {
    lang: (c) => `<path d="M48 82 Q44 22 100 24 Q156 22 152 82 L158 168 Q132 180 100 174 Q68 180 42 168 Z" fill="${c}"/>`,
    zoepfe: (c) => `<g fill="${c}">${[0, 1, 2, 3].map((i) => `<ellipse cx="44" cy="${104 + i * 17}" rx="${11 - i}" ry="11"/><ellipse cx="156" cy="${104 + i * 17}" rx="${11 - i}" ry="11"/>`).join("")}</g><circle cx="44" cy="166" r="6" fill="#f58fb7"/><circle cx="156" cy="166" r="6" fill="#f58fb7"/><path d="M40 172 L36 186 M48 172 L50 186 M152 172 L150 186 M160 172 L164 186" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
    pferdeschwanz: (c) => `<path d="M138 46 Q182 50 176 104 Q172 140 156 158 Q164 118 150 92 Z" fill="${c}"/><circle cx="146" cy="50" r="7" fill="#f58fb7"/>`,
    locken: (c) => `<g fill="${c}">${[[52, 60], [46, 88], [52, 116], [70, 132], [148, 60], [154, 88], [148, 116], [130, 132], [70, 36], [100, 26], [130, 36]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="22"/>`).join("")}</g>`,
    bob: (c) => `<path d="M44 90 Q40 26 100 26 Q160 26 156 90 L156 122 Q140 128 132 116 L68 116 Q60 128 44 122 Z" fill="${c}"/>`,
    dutt: (c) => `<circle cx="100" cy="30" r="22" fill="${c}"/><path d="M84 26 Q100 18 116 26" stroke="${dunkler(c, 0.25)}" stroke-width="3" fill="none"/>`,
    kurz: () => "",
  };
  const HAAR_VORNE = {
    standard: (c) => `<path d="M50 80 Q48 30 100 30 Q152 30 150 80 Q140 58 120 62 Q106 48 88 60 Q68 54 50 80 Z" fill="${c}"/>`,
    kurz: (c) => `<path d="M50 84 Q46 26 100 28 Q154 26 150 84 Q146 66 136 60 Q120 64 104 56 Q90 64 74 58 Q60 64 50 84 Z" fill="${c}"/>`,
    locken: (c) => `<g fill="${c}">${[[62, 54], [80, 42], [100, 38], [120, 42], [138, 54], [148, 72], [52, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15"/>`).join("")}</g>`,
    dutt: (c) => `<path d="M50 80 Q48 30 100 32 Q152 30 150 80 Q138 50 100 50 Q62 50 50 80 Z" fill="${c}"/>`,
  };

  // ---------- Kleider ----------
  const KLEIDER = {
    kleid: (f, H) => `<path d="M72 134 Q100 126 128 134 L150 206 Q100 218 50 206 Z" fill="${f}"/>
      <path d="M86 133 Q100 146 114 133" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${[[80, 172], [104, 162], [122, 186], [90, 196], [112, 200], [70, 194], [130, 166]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#fff" opacity=".8"/>`).join("")}`,
    latzhose: (f) => `<path d="M72 134 Q100 126 128 134 L132 178 L68 178 Z" fill="${f}"/>
      <path d="M72 162 L128 162 L132 206 L106 206 L100 188 L94 206 L68 206 Z" fill="#4a78c2"/><rect x="84" y="146" width="32" height="20" rx="3" fill="#4a78c2"/>
      <path d="M84 148 L76 134 M116 148 L124 134" stroke="#4a78c2" stroke-width="6"/><circle cx="88" cy="152" r="2.5" fill="#f2c94c"/><circle cx="112" cy="152" r="2.5" fill="#f2c94c"/><rect x="94" y="152" width="12" height="9" rx="2" fill="#3c64a8"/>`,
    sport: (f) => `<path d="M70 134 Q100 126 130 134 L134 182 L66 182 Z" fill="${f}"/><path d="M92 134 L100 142 L108 134" stroke="#fff" stroke-width="3" fill="none"/>
      <text x="100" y="166" text-anchor="middle" font-size="18" font-weight="700" fill="#fff" font-family="system-ui">3</text>
      <path d="M68 180 L132 180 L134 204 L106 204 L100 192 L94 204 L66 204 Z" fill="#3d4a6b"/>`,
    regenjacke: () => `<path d="M68 134 Q100 124 132 134 L142 208 Q100 216 58 208 Z" fill="#f7d038"/><line x1="100" y1="134" x2="100" y2="210" stroke="#d9b21f" stroke-width="3"/>
      ${[150, 168, 186].map((y) => `<circle cx="106" cy="${y}" r="3" fill="#d9b21f"/>`).join("")}<path d="M74 186 L90 186 M110 186 L126 186" stroke="#d9b21f" stroke-width="3"/>`,
    schlafanzug: () => `<path d="M70 134 Q100 126 130 134 L134 186 L66 186 Z" fill="#9fc3ee"/><path d="M70 184 L130 184 L126 236 L104 236 L100 200 L96 236 L74 236 Z" fill="#9fc3ee"/>
      ${[[82, 150], [116, 160], [96, 172], [86, 214], [116, 222], [122, 144]].map(([x, y]) => `<text x="${x}" y="${y}" font-size="11" fill="#f6d44b" text-anchor="middle">★</text>`).join("")}`,
    ballett: () => `<path d="M78 134 Q100 126 122 134 L122 180 L78 180 Z" fill="#f7a8c8"/>
      <ellipse cx="100" cy="182" rx="46" ry="13" fill="#fbd0e1"/><ellipse cx="100" cy="178" rx="40" ry="10" fill="#f9bcd5"/><ellipse cx="100" cy="176" rx="30" ry="6" fill="#f7a8c8"/>
      <path d="M84 134 L82 126 M116 134 L118 126" stroke="#f7a8c8" stroke-width="4"/>`,
    prinzessin: (f) => `<path d="M78 134 Q100 126 122 134 L120 170 Q156 206 162 246 Q100 258 38 246 Q44 206 80 170 Z" fill="${f}"/>
      <path d="M80 170 Q100 180 120 170" stroke="#f2c94c" stroke-width="4" fill="none"/><path d="M62 246 Q100 236 138 246" stroke="${heller(f, 0.5)}" stroke-width="4" fill="none"/>
      ${[[70, 214], [100, 206], [128, 222], [86, 234], [116, 238], [100, 150]].map(([x, y]) => `<path d="M${x} ${y - 5} L${x + 1.6} ${y - 1.6} L${x + 5} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 5} L${x - 1.6} ${y + 1.6} L${x - 5} ${y} L${x - 1.6} ${y - 1.6} Z" fill="#fff6c8"/>`).join("")}`,
  };
  const SCHUHE = {
    kleid: "#c2456e", latzhose: "#7a4a2a", sport: "#ffffff", regenjacke: "#f7d038", schlafanzug: "#f6a5c0", ballett: "#f7a8c8", prinzessin: "#f2c94c",
  };

  // ---------- Schmuck ----------
  const SCHMUCK = {
    kette: `<g>${[78, 84, 90, 96, 102, 108, 114, 120].map((x, i) => `<circle cx="${x + 2}" cy="${139 + Math.sin((i / 7) * Math.PI) * 7}" r="3.2" fill="#fff" stroke="#e0d7f2"/>`).join("")}</g>`,
    tasche: `<path d="M140 186 Q148 172 156 186" stroke="#8e5a3b" stroke-width="3" fill="none"/><rect x="136" y="186" width="24" height="18" rx="5" fill="#e8605a"/><circle cx="148" cy="194" r="2.5" fill="#f2c94c"/>`,
    brille: `<circle cx="82" cy="92" r="12" fill="#cfe8ff" fill-opacity=".25" stroke="#7a4fb5" stroke-width="3.5"/><circle cx="118" cy="92" r="12" fill="#cfe8ff" fill-opacity=".25" stroke="#7a4fb5" stroke-width="3.5"/><path d="M94 91 Q100 87 106 91" stroke="#7a4fb5" stroke-width="3.5" fill="none"/>`,
    haarreif: `<path d="M52 66 Q100 12 148 66" stroke="#a983e0" stroke-width="7" fill="none" stroke-linecap="round"/>${[70, 100, 130].map((x, i) => `<circle cx="${x}" cy="${[40, 28, 40][i]}" r="4" fill="#fff"/>`).join("")}`,
    blumenkranz: `<g>${[[58, 56, "#f58fb7"], [76, 40, "#f6c445"], [100, 33, "#fff"], [124, 40, "#a983e0"], [142, 56, "#f58fb7"]].map(([x, y, c]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map((w) => `<circle cx="${Math.cos((w * Math.PI) / 180) * 5}" cy="${Math.sin((w * Math.PI) / 180) * 5}" r="4.2" fill="${c}"/>`).join("")}<circle r="3" fill="#f2a93b"/></g>`).join("")}</g>`,
    schleife: `<g transform="translate(140 44) rotate(18)"><path d="M0 0 L-20 -12 Q-24 0 -20 12 Z" fill="#e84a7a"/><path d="M0 0 L20 -12 Q24 0 20 12 Z" fill="#e84a7a"/><circle r="5.5" fill="#c2185b"/></g>`,
    sonnenhut: `<ellipse cx="100" cy="46" rx="70" ry="14" fill="#f3d9a4"/><path d="M66 46 Q66 8 100 8 Q134 8 134 46 Z" fill="#f3d9a4"/><path d="M67 38 L133 38 L134 46 L66 46 Z" fill="#f58fb7"/><circle cx="126" cy="40" r="6" fill="#fff"/>`,
    krone: `<path d="M72 36 L76 8 L90 24 L100 2 L110 24 L124 8 L128 36 Z" fill="#f2c94c" stroke="#d4a017" stroke-width="2"/><circle cx="100" cy="24" r="4" fill="#e8605a"/><circle cx="84" cy="28" r="3" fill="#5aa2e6"/><circle cx="116" cy="28" r="3" fill="#5cc7a9"/>`,
  };
  const SCHMUCK_REIHE = ["kette", "tasche", "brille", "haarreif", "blumenkranz", "schleife", "sonnenhut", "krone"];

  // ---------- Gesicht ----------
  function augen(mood) {
    if (mood === "jubel" || mood === "mampf") return `<path d="M74 93 Q82 83 90 93 M110 93 Q118 83 126 93" stroke="#3a2a2a" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    const dy = mood === "denk" ? -3 : 0;
    return `<ellipse class="auge" cx="82" cy="${92 + dy}" rx="6.5" ry="8.5" fill="#3a2a2a"/><ellipse class="auge" cx="118" cy="${92 + dy}" rx="6.5" ry="8.5" fill="#3a2a2a"/><circle cx="84.5" cy="${88.5 + dy}" r="2.6" fill="#fff"/><circle cx="120.5" cy="${88.5 + dy}" r="2.6" fill="#fff"/><circle cx="80" cy="${95 + dy}" r="1.2" fill="#fff"/><circle cx="116" cy="${95 + dy}" r="1.2" fill="#fff"/>`;
  }
  function mund(mood) {
    if (mood === "mampf") return `<ellipse class="kau" cx="100" cy="114" rx="7" ry="5" fill="#a8434f"/>`;
    if (mood === "jubel") return `<path d="M88 108 Q100 126 112 108 Z" fill="#a8434f"/><path d="M94 116 Q100 121 106 116" fill="#f28b8b"/>`;
    if (mood === "denk") return `<path d="M93 111 Q100 116 107 111" stroke="#8a4a3a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    return `<path d="M90 109 Q100 119 110 109" stroke="#8a4a3a" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  }

  // Die Puppe. p = { haut, haar, frisur, kleid, farbe }, o = { mood, traegt, buch, essen, klasse, nurInhalt }
  function puppeSvg(p, o) {
    p = p || {}; o = o || {};
    const haut = HAUT[p.haut || 0] || HAUT[0];
    const hc = HAAR[p.haar] || HAAR.braun;
    const fr = p.frisur || "zoepfe";
    const kleid = KLEIDER[p.kleid] ? p.kleid : "kleid";
    const farbe = FARBEN[p.farbe] || FARBEN.rosa;
    const mood = o.mood || "froh";
    let s = "";
    s += (HAAR_HINTEN[fr] || HAAR_HINTEN.kurz)(hc);
    // Beine und Schuhe
    if (kleid !== "prinzessin") {
      const strumpf = kleid === "ballett" ? "#f9cfe0" : haut;
      s += `<rect x="82" y="196" width="13" height="42" rx="6" fill="${strumpf}"/><rect x="105" y="196" width="13" height="42" rx="6" fill="${strumpf}"/>`;
      const sc = SCHUHE[kleid];
      s += `<ellipse cx="88" cy="241" rx="12" ry="7" fill="${sc}" stroke="${kleid === "sport" ? "#d5d5d5" : "none"}"/><ellipse cx="112" cy="241" rx="12" ry="7" fill="${sc}" stroke="${kleid === "sport" ? "#d5d5d5" : "none"}"/>`;
      if (kleid === "regenjacke") s += `<rect x="80" y="218" width="17" height="24" rx="5" fill="#f7d038"/><rect x="103" y="218" width="17" height="24" rx="5" fill="#f7d038"/>`;
    }
    // Hals und Kleid
    s += `<rect x="92" y="122" width="16" height="16" rx="6" fill="${haut}"/>`;
    s += KLEIDER[kleid](farbe);
    // Arme
    const arm = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${kleid === "regenjacke" ? "#f7d038" : kleid === "schlafanzug" ? "#9fc3ee" : haut}" stroke-width="13" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="7.5" fill="${haut}"/>`;
    if (o.buch) s += arm(74, 144, 84, 176) + arm(126, 144, 116, 176);
    else if (mood === "jubel") s += arm(72, 144, 48, 108) + arm(128, 144, 152, 108);
    else s += arm(72, 144, 60, 190) + arm(128, 144, 140, 190);
    if (o.buch) s += `<g><rect x="74" y="160" width="52" height="34" rx="3" fill="#5aa2e6"/><rect x="77" y="163" width="22" height="28" fill="#fff"/><rect x="101" y="163" width="22" height="28" fill="#fff"/><path d="M80 170 L96 170 M80 176 L96 176 M80 182 L92 182 M104 170 L120 170 M104 176 L118 176 M104 182 L114 182" stroke="#b9c6d6" stroke-width="2"/><circle cx="84" cy="178" r="7" fill="${haut}"/><circle cx="116" cy="178" r="7" fill="${haut}"/></g>`;
    // Kopf
    s += `<circle cx="100" cy="84" r="50" fill="${haut}"/>`;
    s += (HAAR_VORNE[fr] || HAAR_VORNE.standard)(hc);
    s += `<ellipse cx="70" cy="106" rx="9" ry="5.5" fill="#f4908f" opacity=".5"/><ellipse cx="130" cy="106" rx="9" ry="5.5" fill="#f4908f" opacity=".5"/>`;
    s += augen(mood);
    s += `<ellipse cx="100" cy="102" rx="3" ry="2.2" fill="${dunkler(haut, 0.25)}"/>`;
    s += mund(mood);
    for (const z of SCHMUCK_REIHE) if ((o.traegt || []).includes(z) && !(o.buch && z === "tasche")) s += SCHMUCK[z];
    if (o.essen) s += `<text x="126" y="132" font-size="30" text-anchor="middle">${o.essen}</text>`;
    const g = `<g>${s}</g>`;
    if (o.nurInhalt) return g;
    return `<svg class="puppe-svg${o.klasse ? " " + o.klasse : ""}" viewBox="0 0 200 260" role="img" aria-label="Puppe">${g}</svg>`;
  }
  const kopfSvg = (p, o) => `<svg class="puppe-kopf" viewBox="20 0 160 160" role="img" aria-label="Puppe">${puppeSvg(p, Object.assign({}, o, { nurInhalt: true }))}</svg>`;

  // ---------- Puppenhaus ----------
  const MOEBEL = {
    lichterkette: `<path d="M0 10 Q50 34 100 12 Q150 34 200 12 Q250 34 300 12 Q350 34 400 10" stroke="#8a6d8f" stroke-width="2" fill="none"/>` + [[25, 22, "#f94144"], [75, 25, "#f9c74f"], [125, 22, "#90be6d"], [175, 25, "#577590"], [225, 22, "#f58fb7"], [275, 25, "#f9c74f"], [325, 22, "#43aa8b"], [375, 24, "#a983e0"]].map(([x, y, c]) => `<circle class="licht" cx="${x}" cy="${y}" r="5" fill="${c}"/>`).join(""),
    lampe: `<line x1="318" y1="0" x2="318" y2="22" stroke="#8a6d8f" stroke-width="2"/><path d="M300 40 L336 40 L328 22 L308 22 Z" fill="#f6c445"/><ellipse cx="318" cy="70" rx="40" ry="34" fill="#fff3b0" opacity=".28"/>`,
    bild: `<rect x="296" y="44" width="70" height="52" rx="4" fill="#b48ad6"/><rect x="302" y="50" width="58" height="40" fill="#cde7f7"/><path d="M302 90 L322 66 L334 80 L344 70 L360 90 Z" fill="#74b85c"/><circle cx="350" cy="58" r="5" fill="#f6c445"/>`,
    regal: `<rect x="30" y="124" width="100" height="6" fill="#b48a6a"/>` + [[36, "#e8605a", 26], [46, "#5aa2e6", 22], [55, "#f6c445", 28], [66, "#5cc7a9", 24], [76, "#a983e0", 20]].map(([x, c, h]) => `<rect x="${x}" y="${124 - h}" width="9" height="${h}" rx="1" fill="${c}"/>`).join("") + `<circle cx="112" cy="114" r="9" fill="#f58fb7"/><rect x="106" y="114" width="12" height="10" fill="#c1693c"/>`,
    vase: `<path d="M74 104 Q70 92 78 86 L90 86 Q98 92 94 104 Z" fill="#5aa2e6"/><path d="M84 86 Q80 70 76 64 M84 86 Q86 68 92 62 M84 86 Q84 72 84 58" stroke="#4f9d69" stroke-width="2.5" fill="none"/><circle cx="76" cy="62" r="5" fill="#e8605a"/><circle cx="92" cy="60" r="5" fill="#f6c445"/><circle cx="84" cy="56" r="5" fill="#f58fb7"/>`,
    teppich: `<ellipse cx="200" cy="238" rx="120" ry="16" fill="#d7b8f0"/><ellipse cx="200" cy="238" rx="98" ry="10" fill="none" stroke="#b48ad6" stroke-width="3" stroke-dasharray="8 6"/>`,
    bett: `<rect x="8" y="182" width="104" height="36" rx="6" fill="#f2d4e4"/><rect x="8" y="156" width="14" height="80" rx="4" fill="#b48a6a"/><rect x="98" y="176" width="14" height="60" rx="4" fill="#b48a6a"/><rect x="24" y="172" width="34" height="16" rx="7" fill="#fff"/><path d="M56 182 L98 182 L98 214 L56 214 Z" fill="#f58fb7"/><path d="M56 192 L98 192" stroke="#fff" stroke-width="2" stroke-dasharray="4 4"/>`,
    kuscheltier: (bett) => { const x = bett ? 58 : 40, y = bett ? 156 : 206; return `<g transform="translate(${x} ${y})"><circle cx="0" cy="18" r="14" fill="#c8915c"/><circle cx="0" cy="0" r="11" fill="#c8915c"/><circle cx="-9" cy="-9" r="5" fill="#c8915c"/><circle cx="9" cy="-9" r="5" fill="#c8915c"/><circle cx="-4" cy="-1" r="1.6" fill="#3a2a2a"/><circle cx="4" cy="-1" r="1.6" fill="#3a2a2a"/><ellipse cx="0" cy="4" rx="4" ry="3" fill="#e9c39b"/><circle cx="0" cy="3" r="1.4" fill="#3a2a2a"/></g>`; },
    teetisch: `<ellipse cx="312" cy="206" rx="36" ry="9" fill="#e9b7cf"/><rect x="306" y="206" width="12" height="28" fill="#c98aa9"/><ellipse cx="312" cy="236" rx="20" ry="4" fill="#c98aa9"/><path d="M290 202 Q290 186 302 186 Q314 186 314 202 Z" fill="#fff" stroke="#a983e0" stroke-width="2"/><path d="M314 192 Q322 192 320 200" stroke="#a983e0" stroke-width="2" fill="none"/><rect x="320" y="194" width="10" height="8" rx="2" fill="#fff" stroke="#a983e0" stroke-width="2"/><rect x="333" y="194" width="10" height="8" rx="2" fill="#fff" stroke="#a983e0" stroke-width="2"/>`,
    pflanze: `<path d="M354 200 L390 200 L384 236 L360 236 Z" fill="#c1693c"/><path d="M372 200 Q352 166 362 146 Q376 172 372 200 M372 200 Q388 164 400 156 Q394 184 372 200 M372 200 Q372 166 378 134 Q386 170 372 200" fill="#4f9d69"/>`,
    puppenwagen: `<g transform="translate(-34 0)"><path d="M150 188 L196 188 Q196 216 172 216 Q150 216 150 188 Z" fill="#a983e0"/><path d="M150 188 Q150 164 174 166 L174 188 Z" fill="#c9a8f0"/><circle cx="158" cy="226" r="9" fill="none" stroke="#5b4a6b" stroke-width="4"/><circle cx="188" cy="226" r="9" fill="none" stroke="#5b4a6b" stroke-width="4"/><path d="M196 188 L208 172" stroke="#5b4a6b" stroke-width="4" stroke-linecap="round"/></g>`,
  };
  function zimmerSvg(p, o) {
    o = o || {};
    const besitz = o.besitz || [];
    const st = o.stufe || 0;
    let s = `<rect x="-800" y="-200" width="2000" height="400" fill="#fde7ef"/>`;
    s += `<g opacity=".35">${Array.from({ length: 9 }, (_, i) => Array.from({ length: 4 }, (_, j) => `<path transform="translate(${20 + i * 46 + (j % 2) * 23} ${40 + j * 40}) scale(.5)" d="M0 4 C0 -4 10 -4 10 4 C10 -4 20 -4 20 4 C20 12 10 16 10 20 C10 16 0 12 0 4 Z" fill="#f5b6cf"/>`).join("")).join("")}</g>`;
    if (st >= 2) s += `<g opacity=".55">${["#f94144", "#f9a03f", "#f6d44b", "#74b85c", "#5aa2e6", "#a983e0"].map((c, i) => `<path d="M${80 + i * 8} 200 A ${120 - i * 8} ${110 - i * 8} 0 0 1 ${320 - i * 8} 200" stroke="${c}" stroke-width="8" fill="none"/>`).join("")}</g>`;
    s += `<rect x="-800" y="198" width="2000" height="300" fill="#e8c39e"/>` + [214, 230].map((y) => `<line x1="-800" y1="${y}" x2="1200" y2="${y}" stroke="#d6a97b" stroke-width="2"/>`).join("");
    // Fenster mit Vorhängen
    s += `<rect x="34" y="30" width="96" height="76" rx="6" fill="#fff"/><rect x="40" y="36" width="84" height="64" fill="#cde7f7"/><line x1="82" y1="36" x2="82" y2="100" stroke="#fff" stroke-width="5"/><line x1="40" y1="68" x2="124" y2="68" stroke="#fff" stroke-width="5"/>`;
    s += `<path d="M30 26 L58 26 Q50 70 40 108 L30 108 Z" fill="#f58fb7"/><path d="M134 26 L106 26 Q114 70 124 108 L134 108 Z" fill="#f58fb7"/>`;
    if (st >= 1) s += `<rect x="36" y="106" width="92" height="12" rx="3" fill="#c1693c"/>` + [44, 58, 72, 86, 100, 114].map((x, i) => `<circle cx="${x + 4}" cy="102" r="6" fill="${["#e8605a", "#f6c445", "#f58fb7", "#a983e0", "#e8605a", "#f6c445"][i]}"/>`).join("");
    for (const z of ["lichterkette", "lampe", "bild", "regal", "vase", "teppich", "bett", "pflanze", "teetisch"]) if (besitz.includes(z)) s += MOEBEL[z];
    if (besitz.includes("kuscheltier")) s += MOEBEL.kuscheltier(besitz.includes("bett"));
    if (st >= 3) s += `<g class="glanz">${[[160, 40], [250, 30], [370, 130], [20, 150], [210, 120]].map(([x, y]) => `<path d="M${x} ${y - 8} l3 6 l6 3 l-6 3 l-3 6 l-3 -6 l-6 -3 l6 -3 Z" fill="#f6d44b"/>`).join("")}</g>`;
    s += `<g transform="translate(128 60) scale(.72)"><g class="puppe-im-zimmer">${puppeSvg(p, { mood: o.mood, traegt: o.traegt, essen: o.essen, nurInhalt: true })}</g></g>`;
    if (besitz.includes("puppenwagen")) s += MOEBEL.puppenwagen;
    return `<svg class="zimmer-svg" viewBox="0 0 400 260" role="img" aria-label="Puppenstube">${s}</svg>`;
  }

  // ---------- Rechenmaterial: Hunderterplatten, Zehnerstangen, Einerwürfel ----------
  function bloeckeSvg(n, o) {
    o = o || {};
    const weg = o.weg || {};
    const h = L.H(n), z = L.Z(n), e = L.E(n);
    const c = 9, P = 10 * c; // Kästchen, Plattengröße
    const proReihe = 5, reihen = Math.max(1, Math.ceil(h / proReihe));
    const teile = [];
    const kreuz = (x0, y0, w, hh) => `<path d="M${x0 + 2} ${y0 + 2} L${x0 + w - 2} ${y0 + hh - 2} M${x0 + w - 2} ${y0 + 2} L${x0 + 2} ${y0 + hh - 2}" stroke="#d0394e" stroke-width="3.5" stroke-linecap="round"/>`;
    for (let i = 0; i < h; i++) {
      const w = i >= h - (weg.h || 0);
      const x = 4 + (i % proReihe) * (P + 8), y = 4 + Math.floor(i / proReihe) * (P + 8);
      let g = `<rect x="${x}" y="${y}" width="${P}" height="${P}" fill="#f6c445" stroke="#c99a1c" stroke-width="1.5"/>`;
      for (let k = 1; k < 10; k++) g += `<line x1="${x + k * c}" y1="${y}" x2="${x + k * c}" y2="${y + P}" stroke="#c99a1c" stroke-width=".8"/><line x1="${x}" y1="${y + k * c}" x2="${x + P}" y2="${y + k * c}" stroke="#c99a1c" stroke-width=".8"/>`;
      teile.push(`<g opacity="${w ? 0.35 : 1}">${g}</g>` + (w ? kreuz(x, y, P, P) : ""));
    }
    let x = 4 + (h ? Math.min(h, proReihe) * (P + 8) + 6 : 0);
    const unten = 4 + reihen * (P + 8) - 8; // Unterkante der untersten Reihe
    for (let i = 0; i < z; i++) {
      const w = i >= z - (weg.z || 0);
      let g = `<rect x="${x}" y="${unten - P}" width="${c}" height="${P}" fill="#5aa2e6" stroke="#2f6fae" stroke-width="1.5"/>`;
      for (let k = 1; k < 10; k++) g += `<line x1="${x}" y1="${unten - P + k * c}" x2="${x + c}" y2="${unten - P + k * c}" stroke="#2f6fae" stroke-width=".8"/>`;
      teile.push(`<g opacity="${w ? 0.35 : 1}">${g}</g>` + (w ? kreuz(x - 3, unten - P, c + 6, P) : ""));
      x += c + 7;
    }
    if (z) x += 8;
    const wz = c + 5;
    for (let i = 0; i < e; i++) {
      const w = i >= e - (weg.e || 0);
      const col = Math.floor(i / 5), row = i % 5;
      const cx = x + col * (wz + 6), cy = unten - (row + 1) * (wz + 6) + 6;
      teile.push(`<rect x="${cx}" y="${cy}" width="${wz}" height="${wz}" rx="2" fill="#e8605a" stroke="#a83a35" stroke-width="1.5" opacity="${w ? 0.35 : 1}"/>` + (w ? kreuz(cx - 3, cy - 3, wz + 6, wz + 6) : ""));
    }
    if (e) x += (e > 5 ? 2 : 1) * (wz + 6);
    const breite = Math.max(x + 4, 60), hoehe = unten + 4;
    return `<svg class="bloecke" viewBox="0 0 ${breite} ${hoehe}" role="img" aria-label="${h} Hunderter, ${z} Zehner, ${e} Einer">${teile.join("")}</svg>`;
  }

  // ---------- Rechenstrich mit Sprüngen (von rechts nach links) ----------
  // labels: "alle" (alle Zahlen), "start" (nur Startzahl), "ohneZiel" (alles außer dem Ergebnis), "alleOhneSprung" (Zahlen ja, Sprünge als ?)
  function sprungSvg(start, spruenge, labels) {
    labels = labels || "alle";
    const W = 640, links = 40, rechts = 600, k = spruenge.length;
    const total = L.zerlege ? spruenge.reduce((a, b) => a + b, 0) : 1;
    const minW = 90, frei = rechts - links - minW * k;
    const breiten = spruenge.map((v) => minW + Math.max(0, frei) * (v / total));
    const xs = [rechts]; breiten.forEach((b) => xs.push(xs[xs.length - 1] - b));
    const werte = [start]; spruenge.forEach((v) => werte.push(werte[werte.length - 1] - v));
    let s = `<line x1="16" y1="104" x2="624" y2="104" stroke="#5b4a6b" stroke-width="3" stroke-linecap="round"/>`;
    xs.forEach((x, i) => {
      s += `<line x1="${x}" y1="94" x2="${x}" y2="114" stroke="#5b4a6b" stroke-width="3"/>`;
      const zeig = labels === "alle" || labels === "alleOhneSprung" || i === 0 || (labels === "ohneZiel" && i < xs.length - 1);
      s += `<text x="${x}" y="140" text-anchor="middle" font-size="22" font-weight="700" fill="${i === 0 ? "#5b4a6b" : "#2e7d5b"}">${zeig ? werte[i] : "?"}</text>`;
    });
    spruenge.forEach((v, i) => {
      const x1 = xs[i], x2 = xs[i + 1], mx = (x1 + x2) / 2, hoehe = Math.min(70, 28 + (x1 - x2) * 0.22);
      s += `<path d="M${x1 - 4} 98 Q${mx} ${98 - hoehe * 2} ${x2 + 6} 98" stroke="#6aa84f" stroke-width="3.5" fill="none"/><path d="M${x2 + 6} 98 l12 -4 l-6 -9 Z" fill="#6aa84f"/>`;
      s += `<text x="${mx}" y="${98 - hoehe - 8}" text-anchor="middle" font-size="22" font-weight="700" fill="#c0392b">${labels === "alleOhneSprung" ? "?" : M + v}</text>`;
    });
    return `<svg class="sprung" viewBox="0 0 ${W} 150" role="img" aria-label="Rechenstrich">${s}</svg>`;
  }

  // ---------- Zahlenstrahl ----------
  function strahlSvg(o) {
    const von = o.von, bis = o.bis, schritt = o.schritt || 100;
    const x0 = 36, x1 = 644, X = (v) => x0 + ((v - von) / (bis - von)) * (x1 - x0);
    let s = `<line x1="${x0 - 14}" y1="70" x2="${x1 + 14}" y2="70" stroke="#5b4a6b" stroke-width="3" stroke-linecap="round"/>`;
    const n = Math.round((bis - von) / schritt);
    for (let i = 0; i <= n; i++) {
      const v = von + i * schritt;
      const gross = (bis - von === 1000 && v % 100 === 0) || i === 0 || i === n || (schritt === 1 && v % 5 === 0) || (schritt === 10 && v % 50 === 0);
      s += `<line x1="${X(v)}" y1="${gross ? 58 : 63}" x2="${X(v)}" y2="${gross ? 82 : 77}" stroke="#5b4a6b" stroke-width="${gross ? 3 : 1.8}"/>`;
    }
    if (bis - von === 1000) for (let v = von + 50; v < bis; v += 100) s += `<line x1="${X(v)}" y1="65" x2="${X(v)}" y2="75" stroke="#5b4a6b" stroke-width="1.4"/>`;
    for (const v of o.beschriftung || []) s += `<text x="${X(v)}" y="106" text-anchor="middle" font-size="${(o.beschriftung || []).length > 8 ? 17 : 20}" font-weight="${v === o.ziel ? 800 : 600}" fill="${v === o.ziel ? "#c2456e" : "#5b4a6b"}">${v}</text>`;
    if (o.ziel != null) s += `<path d="M${X(o.ziel)} 56 L${X(o.ziel) - 9} 30 L${X(o.ziel) + 9} 30 Z" fill="#c2456e"/><circle cx="${X(o.ziel)}" cy="20" r="11" fill="#f58fb7" stroke="#c2456e" stroke-width="2.5"/>`;
    return `<svg class="strahl" viewBox="0 0 680 118" role="img" aria-label="Zahlenstrahl">${s}</svg>`;
  }

  // ---------- App-Symbol (Kopf der Puppe) ----------
  const iconSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" fill="#fde7ef"/><g transform="translate(-4 4) scale(1.0)">${puppeSvg({ haut: 1, haar: "braun", frisur: "zoepfe", kleid: "kleid", farbe: "lila" }, { mood: "froh", traegt: ["schleife"], nurInhalt: true })}</g></svg>`;

  root.PS_PUPPE = { puppeSvg, kopfSvg, zimmerSvg, bloeckeSvg, sprungSvg, strahlSvg, iconSvg, KLEIDER: Object.keys(KLEIDER), SCHMUCK: Object.keys(SCHMUCK), MOEBEL: Object.keys(MOEBEL), heller };
})(typeof window !== "undefined" ? window : globalThis);
