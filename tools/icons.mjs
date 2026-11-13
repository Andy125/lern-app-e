// Erzeugt die App-Symbole aus der gezeichneten Puppe.
import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome" });
const p = await b.newPage();
await p.setContent("<html><body style='margin:0'></body></html>");
await p.addScriptTag({ path: "public/logic.js" });
await p.addScriptTag({ path: "public/puppe.js" });
for (const n of [180, 192, 512]) {
  await p.setViewportSize({ width: n, height: n });
  await p.evaluate((n) => {
    const P = window.PS_PUPPE;
    document.body.innerHTML = `<div style="width:${n}px;height:${n}px;background:radial-gradient(circle at 50% 40%,#fff 0,#fde7ef 70%);overflow:hidden"><svg viewBox="22 4 156 156" width="${n}" height="${n}">${P.puppeSvg({ haut: 1, haar: "braun", frisur: "zoepfe", kleid: "kleid", farbe: "lila" }, { mood: "froh", traegt: ["schleife"], nurInhalt: true })}</svg></div>`;
  }, n);
  await p.screenshot({ path: `public/icons/icon-${n}.png`, clip: { x: 0, y: 0, width: n, height: n } });
}
await b.close();
console.log("Symbole erzeugt");
