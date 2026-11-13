// «So geht's»: kurze Erklärungen je Lernteil. Jede Seite hat einen Satz und ein Bild.
// Bilder: bloecke (Rechenmaterial), sprung (Rechenstrich), strahl (Zahlenstrahl), rechnung (Zeilen).
// Alle Rechnungen hier prüft tools/test-logic.mjs nach.
(function (root) {
  "use strict";
  const ERKLAER = {
    stellen: [
      { text: "Eine Platte ist 100. Eine Stange ist 10. Ein Würfel ist 1.", bild: { typ: "bloecke", zahl: 111 } },
      { text: "Hier liegen 3 Platten, 4 Stangen und 6 Würfel. Das sind 3 Hunderter, 4 Zehner und 6 Einer: 346.", bild: { typ: "bloecke", zahl: 346 } },
      { text: "Bei 802 gibt es keine Stange. Darum steht in der Mitte eine 0.", bild: { typ: "bloecke", zahl: 802 } },
    ],
    nachbar: [
      { text: "Die Nachbarzehner sind die Zehnerzahlen direkt vor und nach einer Zahl. 587 liegt zwischen 580 und 590.", bild: { typ: "strahl", von: 580, bis: 590, schritt: 1, beschriftung: [580, 587, 590], ziel: 587 } },
      { text: "Für den Nachbarzehner unten machst du nur die Einer zur 0. Aus 587 wird 580. Die 58 bleibt stehen.", bild: { typ: "rechnung", zeilen: ["580 < 587 < 590"], gross: true } },
      { text: "Die Nachbarhunderter von 587 sind 500 und 600. Die 5 vorne bleibt stehen, nicht eins weniger nehmen!", bild: { typ: "strahl", von: 500, bis: 600, schritt: 10, beschriftung: [500, 587, 600], ziel: 587 } },
      { text: "Bei 802 sind die Nachbarzehner 800 und 810. Die Nachbarhunderter sind 800 und 900.", bild: { typ: "rechnung", zeilen: ["800 < 802 < 810", "800 < 802 < 900"] } },
    ],
    vergleich: [
      { text: "Zuerst schaust du auf die Hunderter. 433 hat 4 Hunderter, 343 nur 3. Also ist 433 größer.", bild: { typ: "rechnung", zeilen: ["433 > 343"], gross: true } },
      { text: "Sind die Hunderter gleich, entscheiden die Zehner. 443 hat 4 Zehner, 434 nur 3. Also ist 443 größer.", bild: { typ: "rechnung", zeilen: ["443 > 434"], gross: true } },
      { text: "Das Krokodil 🐊 frisst immer die größere Zahl. Sein Maul ist offen zur größeren Zahl.", bild: { typ: "rechnung", zeilen: ["343 < 433"], gross: true } },
    ],
    strahl: [
      { text: "Auf dem Zahlenstrahl stehen die Zahlen der Reihe nach. Links die kleinen, rechts die großen.", bild: { typ: "strahl", von: 0, bis: 1000, schritt: 100, beschriftung: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] } },
      { text: "Suche zuerst die Hunderter links und rechts vom Pfeil. Genau in der Mitte zwischen 200 und 300 liegt 250.", bild: { typ: "strahl", von: 0, bis: 1000, schritt: 100, beschriftung: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000], ziel: 250 } },
      { text: "Ist der Pfeil kurz nach 400, dann ist es zum Beispiel 410 oder 420.", bild: { typ: "strahl", von: 0, bis: 1000, schritt: 100, beschriftung: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000], ziel: 410 } },
    ],
    "h-weg": [
      { text: "Bei 642 − 300 nimmst du nur Hunderter weg. Zehner und Einer bleiben, wie sie sind.", bild: { typ: "bloecke", zahl: 642, weg: { h: 3 } } },
      { text: "6 Hunderter minus 3 Hunderter sind 3 Hunderter. Die 4 und die 2 wandern einfach mit.", bild: { typ: "rechnung", zeilen: ["600 − 300 = 300", "640 − 300 = 340", "642 − 300 = 342"] } },
    ],
    "z-weg": [
      { text: "Bei 453 − 30 nimmst du 3 Zehner weg. Die Hunderter und die Einer bleiben.", bild: { typ: "bloecke", zahl: 453, weg: { z: 3 } } },
      { text: "5 Zehner minus 3 Zehner sind 2 Zehner. Also ist 453 − 30 = 423.", bild: { typ: "rechnung", zeilen: ["53 − 30 = 23", "153 − 30 = 123", "453 − 30 = 423"] } },
    ],
    "e-weg": [
      { text: "Bei 456 − 4 nimmst du nur Einer weg: 6 − 4 = 2.", bild: { typ: "bloecke", zahl: 456, weg: { e: 4 } } },
      { text: "Siehst du das Muster? Nur die letzte Ziffer ändert sich.", bild: { typ: "rechnung", zeilen: ["56 − 4 = 52", "156 − 4 = 152", "456 − 4 = 452"] } },
    ],
    "bis-zehner": [
      { text: "836 − ? = 830. Bis zum Nachbarzehner nimmst du genau die Einer weg: 6.", bild: { typ: "sprung", start: 836, spruenge: [6], labels: "alle" } },
      { text: "830 − ? = 800. Bis zum Nachbarhunderter nimmst du die Zehner weg: 30.", bild: { typ: "sprung", start: 836, spruenge: [6, 30], labels: "alle" } },
      { text: "Mit Plus geht es nach oben: 836 + 4 = 840. Denn 6 und 4 sind 10.", bild: { typ: "rechnung", zeilen: ["836 + 4 = 840", "840 + 60 = 900"] } },
    ],
    "nachbar-aufg": [
      { text: "645 − 4, 645 − 5, 645 − 6: Jedes Mal nimmst du eins mehr weg. Darum wird das Ergebnis eins kleiner.", bild: { typ: "rechnung", zeilen: ["645 − 4 = 641", "645 − 5 = 640", "645 − 6 = 639"] } },
      { text: "Bei − 5 landest du genau auf dem Zehner 640. Bei − 6 springst du einen weiter, über den Zehner: 639.", bild: { typ: "sprung", start: 645, spruenge: [5, 1], labels: "alle" } },
    ],
    "e-ueber": [
      { text: "645 − 8. Die 8 ist mehr als die 5 Einer. Darum rechnest du in zwei Schritten.", bild: { typ: "bloecke", zahl: 645 } },
      { text: "Erst bis zum Zehner: Nimm die 5 Einer weg. 645 − 5 = 640.", bild: { typ: "sprung", start: 645, spruenge: [5], labels: "alle" } },
      { text: "Dann den Rest: 8 sind 5 und 3. Also noch 3 weg: 640 − 3 = 637.", bild: { typ: "sprung", start: 645, spruenge: [5, 3], labels: "alle" } },
    ],
    "aehnlich-e": [
      { text: "12 − 3 = 9. Dann ist 112 − 3 = 109 und 212 − 3 = 209. Die Hunderter wandern einfach mit.", bild: { typ: "rechnung", zeilen: ["12 − 3 = 9", "112 − 3 = 109", "212 − 3 = 209"] } },
    ],
    "e-ueber-h": [
      { text: "403 − 6. Erst bis zum Hunderter: 403 − 3 = 400.", bild: { typ: "sprung", start: 403, spruenge: [3], labels: "alle" } },
      { text: "Dann noch 3 weg. Rückwärts nach 400 kommt 399, 398, 397.", bild: { typ: "sprung", start: 403, spruenge: [3, 3], labels: "alle" } },
    ],
    "z-ueber": [
      { text: "740 − 50. Erst bis zum Hunderter: Nimm die 4 Zehner weg. 740 − 40 = 700.", bild: { typ: "sprung", start: 740, spruenge: [40], labels: "alle" } },
      { text: "Dann den Rest: 50 sind 40 und 10. Also noch 10 weg: 700 − 10 = 690.", bild: { typ: "sprung", start: 740, spruenge: [40, 10], labels: "alle" } },
    ],
    "aehnlich-z": [
      { text: "Rechne mit Zehnern: 14 Zehner minus 8 Zehner sind 6 Zehner. Also 140 − 80 = 60.", bild: { typ: "rechnung", zeilen: ["140 − 80 = 60"], gross: true } },
      { text: "Die Einer und die Hunderter wandern einfach mit.", bild: { typ: "rechnung", zeilen: ["140 − 80 = 60", "146 − 80 = 66", "846 − 80 = 766"] } },
    ],
    raupe: [
      { text: "Die Raupe zählt rückwärts in Zehnerschritten. Nur die Zehnerziffer wird kleiner: 354, 344, 334.", bild: { typ: "rechnung", zeilen: ["354, 344, 334, 324, 314"] } },
      { text: "Nach 304 geht es über den Hunderter: 304 − 10 = 294.", bild: { typ: "sprung", start: 304, spruenge: [4, 6], labels: "alle" } },
    ],
    "schritte-3": [
      { text: "438 − 126. Zerlege die 126 in 100, 20 und 6.", bild: { typ: "bloecke", zahl: 438 } },
      { text: "Erst die Hunderter weg: 438 − 100 = 338.", bild: { typ: "sprung", start: 438, spruenge: [100], labels: "alle" } },
      { text: "Dann die Zehner weg: 338 − 20 = 318.", bild: { typ: "sprung", start: 438, spruenge: [100, 20], labels: "alle" } },
      { text: "Danach die Einer weg: 318 − 6 = 312. Fertig!", bild: { typ: "sprung", start: 438, spruenge: [100, 20, 6], labels: "alle" } },
    ],
    "schritte-2": [
      { text: "934 − 23 hat keine Hunderter. Dann brauchst du nur zwei Schritte.", bild: { typ: "rechnung", zeilen: ["934 − 20 = 914", "914 − 3 = 911"] } },
      { text: "Bei 785 − 202 fehlen die Zehner. Erst 200 weg, dann 2 weg.", bild: { typ: "sprung", start: 785, spruenge: [200, 2], labels: "alle" } },
    ],
    "schritte-ue2": [
      { text: "652 − 37. Erst die Zehner weg: 652 − 30 = 622.", bild: { typ: "sprung", start: 652, spruenge: [30], labels: "alle" } },
      { text: "Jetzt 622 − 7. Die 2 Einer reichen nicht. Also erst 2 weg bis 620, dann noch 5 weg: 615.", bild: { typ: "sprung", start: 622, spruenge: [2, 5], labels: "alle" } },
      { text: "Bei 150 − 70 geht es über den Hunderter: erst 50 weg bis 100, dann noch 20 weg: 80.", bild: { typ: "sprung", start: 150, spruenge: [50, 20], labels: "alle" } },
    ],
    "schritte-ue": [
      { text: "594 − 218. Erst 594 − 200 = 394. Dann 394 − 10 = 384.", bild: { typ: "sprung", start: 594, spruenge: [200, 10], labels: "alle" } },
      { text: "Jetzt 384 − 8. Die 4 Einer reichen nicht. Erst 4 weg bis 380, dann noch 4 weg: 376.", bild: { typ: "sprung", start: 384, spruenge: [4, 4], labels: "alle" } },
      { text: "Bei 647 − 50 denkst du dir die 7 Einer kurz weg: 640 − 50 = 590. Dann kommen die 7 wieder dazu: 597.", bild: { typ: "rechnung", zeilen: ["640 − 50 = 590", "647 − 50 = 597"] } },
    ],
    kurz: [
      { text: "Bei der kurzen Schreibweise schreibst du nur die Zwischenergebnisse auf. Beispiel: 658 − 137.", bild: { typ: "rechnung", zeilen: ["658 − 137 = ?"], gross: true } },
      { text: "Im Kopf: 658 − 100 = 558. Du schreibst nur 558 auf.", bild: { typ: "kurz", a: 658, b: 137, zeige: 1 } },
      { text: "Dann 558 − 30 = 528. Du schreibst 528 auf.", bild: { typ: "kurz", a: 658, b: 137, zeige: 2 } },
      { text: "Zum Schluss 528 − 7 = 521. Das ist das Ergebnis!", bild: { typ: "kurz", a: 658, b: 137, zeige: 3 } },
    ],
  };
  root.PS_ERKLAER = ERKLAER;
  if (typeof module !== "undefined" && module.exports) module.exports = ERKLAER;
})(typeof window !== "undefined" ? window : globalThis);
