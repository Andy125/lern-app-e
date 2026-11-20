# Puppenstube

Lern-App fürs iPad für die 3. Klasse: Minus rechnen im Zahlenraum bis 1000 und Französisch-Vokabeln. Jeden Tag kommt eine Puppenfreundin oder ein Puppenfreund zu Besuch und braucht Hilfe beim Rechnen. Die Tagesmission hat drei kurze Etappen mit je 5 Aufgaben, dazwischen ein Geschenk und eine Bewegungspause. Mit den Edelsteinen vom Rechnen bekommt die eigene Puppe Kleider, Schmuck, Möbel und Leckeres für die Teeparty.

Die App ist eine Web-App ohne Build-Schritt (reines JavaScript im Ordner `public/`), läuft offline und wird über GitHub Pages veröffentlicht.

## Aufs iPad

1. Die Adresse der App in **Safari** öffnen (steht nach der ersten Veröffentlichung unter Settings → Pages).
2. Teilen → **Zum Home-Bildschirm**.
3. Ab jetzt die App immer über das Symbol auf dem Home-Bildschirm öffnen. Dann läuft sie im Vollbild, auch ohne Internet, und Safari löscht den Spielstand nicht.

Oben rechts steht die Versionsnummer. So sieht man nach einem Update, ob die neue Version angekommen ist.

## Gebaut für ein Kind mit ADS

- **Leichter Start:** Die erste Aufgabe jeder Mission ist die sicherste. Ein neuer Rechentrick beginnt immer mit einer kurzen Erklärung in Bildern.
- **Oft kleine Erfolge, aber verdient:** Jedes richtige Feld klingt. Eine Aufgabe auf Anhieb bringt 1 Edelstein, eine Profi-Aufgabe beim Minusrechnen (selbst zerlegt, in Schritten oder mit Übergang) 1 extra. Fünf geschaffte Aufgaben ergeben eine Glitzerkette mit Bonus. Nach jeder Etappe gibt es ein Geschenk zum Antippen (Edelsteine oder ein Sticker fürs Album). Sitzt ein Thema zu 100 %, gibt es eine Medaille.
- **Kein Druck:** Keine Zeitmessung bei den Aufgaben, keine Strafen, Sterne gehen nie verloren. Fehler wandern in den Übe-Korb und kommen später wieder. Die Puppenfreunde sind nie traurig, wenn ein Tag ausfällt.
- **Feld für Feld:** Jedes Zwischenergebnis wird sofort geprüft. Beim ersten Fehler kommt ein Tipp mit Rechenstrich, beim zweiten die Lösung.
- **Hausaufgaben-Zeit:** Drei Startklar-Haken, dann macht die Puppe mit (5, 10 oder 15 Minuten) und ermutigt zwischendurch. Am Ende gibt es Edelsteine.

## Was geübt wird (Lernpfad)

| Thema | Im Buch | Lernteile |
| --- | --- | --- |
| Zahlen bis 1000 | Stellenwerte, Nachbarzehner, Zahlenstrahl | Hunderter, Zehner, Einer · Nachbarzehner und Nachbarhunderter · Größer, kleiner, gleich · Zahlenstrahl |
| Hunderter, Zehner, Einer weg | S. 28 und 29 | Hunderter weg · Zehner weg · Einer weg · Bis zum Zehner und Hunderter |
| In Schritten rechnen | S. 32 und 33, Arbeitsblatt «Subtraktion ohne Übertrag» | Drei Schritte · Zwei Schritte |
| Über den Zehner | S. 36 und 37 | Nachbaraufgaben · Einer weg über den Zehner · Ähnliche Aufgaben · Einer weg über den Hunderter |
| Über den Hunderter | S. 36 und 37 | Zehner weg über den Hunderter · Ähnliche Aufgaben mit Zehnern · Zahlenraupe rückwärts |
| Schritte mit Übergang | S. 39 | Zwei Schritte mit Übergang · Drei Schritte mit Übergang |
| Kurz geschrieben | S. 41 | Kurze Schreibweise |

Jeder Lernteil hat drei Stufen: geführt (Zwischenschritte vorgegeben), selbst zerlegen, frei. Beim Rechnen in Schritten ist die dritte Stufe das Schulformat wie im Heft: der ganze Rechenweg, auch die Zahl vorne in jeder Zeile (manchmal als Rechengeschichte).

Die Reihenfolge folgt dem Buch. Der **Schulstand** (in der Eltern-Übersicht einstellbar, zurzeit «In Schritten rechnen») bestimmt, was offen ist: Alles bis dahin ist offen und wird zum Aufwärmen wiederholt, die Tagesmission übt vor allem das erste Thema ab dem Schulstand, das noch nicht sitzt. Die Themen danach öffnen sich, wenn das vorige zu 60 % sitzt. In der Eltern-Übersicht lassen sich Themen auch freischalten und ein fester Schwerpunkt setzen.

## Französisch mit Camille

Die Puppenfreundin Camille übt die Vokabeln der Arbeitsblätter: Winterkleider (les vêtements d'hiver), Farben (les couleurs, auch Farben mischen) und Zahlen von 1 bis 20. Camille spricht jedes Wort mit der französischen Stimme des iPads vor.

- **Wörter anschauen:** Wortkarten mit Bild, französischem und deutschem Wort. Antippen oder «Alle anhören».
- **Üben:** Hören und Bild wählen, Bild und Wort, Deutsch und Französisch, kleiner Begleiter (un, une, des), Farben mischen, Zählen, Wort aus Buchstaben legen. Ein Wort kommt erst zum Buchstabenlegen, wenn es beim Erkennen und Wissen sitzt.
- **Vokabel-Training:** drei Etappen (Kleider, Farben, Zahlen) mit Geschenken und Bewegungspausen. Danach schreibt Camille ins Freundebuch.
- **Winterkleider:** Jedes Kleidungsstück, das das Kind auf Französisch gewusst hat, darf die Puppe in der Puppenstube anziehen. Beim Antippen sagt Camille das Wort.

## Für Eltern

Langer Fingerdruck auf «Für Eltern» unten rechts: Fortschritt je Thema (auch Französisch), was noch wackelt, Übungs- und Hausaufgabenzeit der letzten 7 Tage, Lernpfad, Einstellungen und Sicherungsdatei.

## Tests

```
npm install
npx playwright install chromium
npm test
```

- `tools/test-logic.mjs` erzeugt jede Aufgabenart in jeder Stufe 400-mal und rechnet jede Zeile unabhängig nach, dazu Erklärungen, Spielstand und Freischalten.
- `tools/test-franz.mjs` vergleicht die Wortliste mit den Arbeitsblättern und prüft jede Französisch-Aufgabe in jeder Art.
- `tools/e2e-franz.mjs` spielt das Vokabel-Training wie ein Kind durch.
- `tools/e2e.mjs` spielt eine ganze Tagesmission wie ein Kind durch.
- `tools/e2e-speicher.mjs` prüft, dass der Spielstand nie verloren geht.
- `tools/e2e-geraete.mjs` prüft iPad hochkant und quer, kleines iPad und Handy.
- `tools/test-offline.mjs` und `tools/monkey.mjs` prüfen Offline-Betrieb und zufälliges Antippen.

Bei jeder Änderung die Versionsnummer in `public/version.js` und den Cache-Namen in `public/sw.js` gemeinsam erhöhen.
