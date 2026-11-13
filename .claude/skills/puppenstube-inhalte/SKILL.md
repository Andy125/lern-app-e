---
name: puppenstube-inhalte
description: Neue Aufgabenarten, Themen oder Erklärungen für die Puppenstube anlegen, passend zum Mathebuch und zu den Fehlern des Kindes.
---

# Neue Inhalte für die Puppenstube

1. **Material zuerst auswerten**: Fotos von Buchseiten, Arbeitsblättern und korrigierten Arbeiten ansehen (bleiben in `privat/`, nie ins Repository). Welche Aufgabenformate nutzt das Buch, wo macht das Kind Fehler? Beispiel aus dem Start: Bei den Nachbarzehnern unten nahm sie eins weniger (587 → 570 statt 580), und 433 > 343 wurde verneint.
2. **Buchaufgaben nicht abtippen.** Aufgaben werden mit Startwert erzeugt (Generator in `public/logic.js`, Objekt `GEN`). Das Format darf dem Buch folgen (Päckchen, Rechne in Schritten, Zahlenraupe, verkürzte Schreibweise).
3. **Generator schreiben**: `GEN["neuer-teil"](r, stufe, { freund })` gibt eine Aufgabe zurück. Stufe 0 geführt, Stufe 1 selbst zerlegen, Stufe 2 frei (gern als Rechengeschichte). Jedes Feld bekommt einen Tipp, Felder mit Übergang ein Hilfebild (`hilfeSchritt`).
4. **Eintragen**: Lernteil in `THEMEN` (Reihenfolge = Lernpfad), Name in `SKILL_NAMEN`, Erklärung in `public/erklaerungen.js` (2 bis 4 Seiten, je ein Satz und ein Bild).
5. **Nachrechnen**: In `tools/test-logic.mjs` die Regel des Lernteils ergänzen (zum Beispiel: muss über den Zehner gehen). Der Test rechnet jede Zeile unabhängig nach.
6. **Ansehen**: `node tools/bilder-aufgaben.mjs 820 1180 neuer-teil` und `node tools/bilder-aufgaben.mjs 1180 820 neuer-teil`.
7. Mit dem Vater kurz besprechen, ob das Thema gerade in der Schule dran ist. Dann weiter mit dem Skill `puppenstube-release`.
