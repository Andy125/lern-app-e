# Puppenstube

Lern-App fürs iPad für die 3. Klasse: Minus rechnen im Zahlenraum bis 1000. Jeden Tag kommt eine Puppenfreundin oder ein Puppenfreund zu Besuch und braucht Hilfe beim Rechnen. Die Tagesmission hat drei kurze Etappen mit je 5 Aufgaben, dazwischen ein Geschenk und eine Bewegungspause. Mit den Edelsteinen vom Rechnen bekommt die eigene Puppe Kleider, Schmuck, Möbel und Leckeres für die Teeparty.

Die App ist eine Web-App ohne Build-Schritt (reines JavaScript im Ordner `public/`), läuft offline und wird über GitHub Pages veröffentlicht.

## Aufs iPad

1. Die Adresse der App in **Safari** öffnen (steht nach der ersten Veröffentlichung unter Settings → Pages).
2. Teilen → **Zum Home-Bildschirm**.
3. Ab jetzt die App immer über das Symbol auf dem Home-Bildschirm öffnen. Dann läuft sie im Vollbild, auch ohne Internet, und Safari löscht den Spielstand nicht.

Oben rechts steht die Versionsnummer. So sieht man nach einem Update, ob die neue Version angekommen ist.

## Gebaut für ein Kind mit ADS

- **Leichter Start:** Die erste Aufgabe jeder Mission ist die sicherste. Ein neuer Rechentrick beginnt immer mit einer kurzen Erklärung in Bildern.
- **Oft kleine Erfolge:** Jedes richtige Feld klingt, jede Aufgabe bringt Edelsteine, fünf geschaffte Aufgaben ergeben eine Glitzerkette mit Bonus. Nach jeder Etappe gibt es ein Geschenk zum Antippen (Edelsteine oder ein Sticker fürs Album).
- **Kein Druck:** Keine Zeitmessung bei den Aufgaben, keine Strafen, Sterne gehen nie verloren. Fehler wandern in den Übe-Korb und kommen später wieder. Die Puppenfreunde sind nie traurig, wenn ein Tag ausfällt.
- **Feld für Feld:** Jedes Zwischenergebnis wird sofort geprüft. Beim ersten Fehler kommt ein Tipp mit Rechenstrich, beim zweiten die Lösung.
- **Hausaufgaben-Zeit:** Drei Startklar-Haken, dann macht die Puppe mit (5, 10 oder 15 Minuten) und ermutigt zwischendurch. Am Ende gibt es Edelsteine.

## Was geübt wird (Lernpfad)

| Thema | Im Buch | Lernteile |
| --- | --- | --- |
| Zahlen bis 1000 | Stellenwerte, Nachbarzehner, Zahlenstrahl | Hunderter, Zehner, Einer · Nachbarzehner und Nachbarhunderter · Größer, kleiner, gleich · Zahlenstrahl |
| Hunderter, Zehner, Einer weg | S. 28 und 29 | Hunderter weg · Zehner weg · Einer weg · Bis zum Zehner und Hunderter |
| Über den Zehner | S. 36 und 37 | Nachbaraufgaben · Einer weg über den Zehner · Ähnliche Aufgaben · Einer weg über den Hunderter |
| Über den Hunderter | S. 36 und 37 | Zehner weg über den Hunderter · Ähnliche Aufgaben mit Zehnern · Zahlenraupe rückwärts |
| In Schritten rechnen | S. 32 und 33 | Drei Schritte · Zwei Schritte |
| Schritte mit Übergang | S. 39 | Zwei Schritte mit Übergang · Drei Schritte mit Übergang |
| Kurz geschrieben | S. 41 | Kurze Schreibweise |

Jeder Lernteil hat drei Stufen: geführt (Zwischenschritte vorgegeben), selbst zerlegen, frei (manchmal als Rechengeschichte). Ein Thema öffnet sich, wenn das vorige zu 60 % sitzt. In der Eltern-Übersicht lassen sich Themen freischalten und ein Schwerpunkt setzen.

## Für Eltern

Langer Fingerdruck auf «Für Eltern» unten rechts: Fortschritt je Thema, was noch wackelt, Übungs- und Hausaufgabenzeit der letzten 7 Tage, Lernpfad, Einstellungen und Sicherungsdatei.

## Tests

```
npm install
npx playwright install chromium
npm test
```

- `tools/test-logic.mjs` erzeugt jede Aufgabenart in jeder Stufe 400-mal und rechnet jede Zeile unabhängig nach, dazu Erklärungen, Spielstand und Freischalten.
- `tools/e2e.mjs` spielt eine ganze Tagesmission wie ein Kind durch.
- `tools/e2e-speicher.mjs` prüft, dass der Spielstand nie verloren geht.
- `tools/e2e-geraete.mjs` prüft iPad hochkant und quer, kleines iPad und Handy.
- `tools/test-offline.mjs` und `tools/monkey.mjs` prüfen Offline-Betrieb und zufälliges Antippen.

Bei jeder Änderung die Versionsnummer in `public/version.js` und den Cache-Namen in `public/sw.js` gemeinsam erhöhen.
