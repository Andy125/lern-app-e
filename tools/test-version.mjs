// Versionsnummer und Offline-Liste passen zusammen.
import { readFileSync, existsSync } from "fs";
const r = (f) => readFileSync(new URL("../public/" + f, import.meta.url), "utf8");
let f = 0; const ok = (b, t) => { if (!b) { f++; console.log("FEHLER:", t); } };
const n = Number((r("version.js").match(/n:\s*(\d+)/) || [])[1]);
const sw = r("sw.js");
ok(n > 0, "Versionsnummer fehlt");
ok(sw.includes(`"puppenstube-v${n}"`), `Cache-Name in sw.js passt nicht zu Version ${n}`);
const liste = JSON.parse(sw.match(/const DATEIEN = (\[[^\]]+\])/)[1]);
for (const d of liste) if (d !== "./") ok(existsSync(new URL("../public/" + d, import.meta.url)), `Offline-Datei fehlt: ${d}`);
for (const [, src] of r("index.html").matchAll(/(?:src|href)="([^"]+)"/g)) ok(liste.includes(src), `index.html lädt ${src}, das offline fehlt`);
console.log(`Version ${n}: ${f} Fehler`); process.exit(f ? 1 : 0);
