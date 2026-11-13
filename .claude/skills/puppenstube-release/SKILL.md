---
name: puppenstube-release
description: Fester Ablauf für jede Änderung an der Puppenstube-App, von Branch über Tests bis Merge nach Rückfrage.
---

# Änderung an der Puppenstube veröffentlichen

1. **Neuer Branch** von `main`, Name beschreibt die Änderung (zum Beispiel `raupe-mit-einern`).
2. **Ändern** in `public/`. Neue Aufgabenarten nach dem Skill `puppenstube-inhalte`.
3. **Version erhöhen**: `public/version.js` (`n` und Datum) und den Cache-Namen `puppenstube-v<n>` in `public/sw.js` gemeinsam. Neue Dateien in die Liste `DATEIEN` in `sw.js` aufnehmen.
4. **Tests lokal**: `npm test`. Alle müssen grün sein. Bei neuen Aufgabenarten zusätzlich `node tools/bilder-aufgaben.mjs 820 1180 <lernteil>` und die Bilder unter `/tmp/typ-*.png` ansehen.
5. **Texte prüfen**: deutsch mit ß, Du-Form, kurz, keine langen Gedankenstriche, keine Namen aus der Familie.
6. **Pull Request** mit kurzer Beschreibung, was sich für das Kind ändert.
7. **CI abwarten** (GitHub Actions, Playwright auf Chromium). Nur bei grünem CI weiter.
8. **Vor dem Merge den Vater fragen.** Erst nach seinem Okay mergen. Danach veröffentlicht GitHub Pages automatisch.
9. **Rückmeldung** an den Vater: neue Versionsnummer und was sich geändert hat. Auf dem iPad die App einmal öffnen, schließen und wieder öffnen, dann ist die neue Version da.
