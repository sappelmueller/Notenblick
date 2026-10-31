# Notenblick 1.23.0 – Verbindliches Konzept zur Hilfe und Tastatursteuerung

## Quelle und Umsetzung

**Maßgebliche überarbeitete Textfassung:** dieses Paket. Die vorherige ZIP-Datei und frühere Fassungen bitte nicht mehr verwenden. Enthalten sind neun Themen mit 77 Hilfeseitenabschnitten, nicht mehrere konkurrierende Hilfen.

Die Datei `HILFE-1.23.0.json` enthält die vollständigen Benutzertexte in strukturierter Form. `HILFE-1.23.0.md` und `HILFE-1.23.0.txt` sind daraus abgeleitete Lesefassungen mit identischem Wortlaut. Für die Implementierung die JSON-Datei als maßgebliche Textquelle verwenden; nicht neu formulieren, kürzen oder durch die bisherige Hilfe ergänzen. Die Formulierungen sind als endgültige Benutzerhilfe vorgesehen. Stimmt eine Bezeichnung noch nicht mit der Oberfläche überein, die vereinbarte Oberfläche und die Texte zusammenführen; keine stillen Bedeutungsänderungen.

GitHub-Referenz für das Konzept: privates Repository `sappelmueller/Notenblick`, Stand 1.22.0, `main` am 31.10.2026, Commit `76f0415fdcd31c0506d926411bf0cfdbd2cf18fc`. Version 1.23.0 ist eine geplante Version, nicht Teil dieses Pakets. Dieses Paket enthält ausschließlich Hilfetexte und Implementierungsvorgaben, keinen modifizierten Programmcode und keine getestete Windows-Ausgabe.

## Neue Hilfeoberfläche

- H1 `Hilfe`, danach genau der Einleitungstext aus der Textquelle.
- Neun thematische Registerkarten in dieser Reihenfolge: Einstieg, Verwaltung, Noten, Punkte, Berechnung, Export, Sicherung, Einstellungen, Tastatur.
- Echte ARIA-Registerkarten mit Pfeiltasten/Pos1/Ende und Eingabe/Leertaste. Nach dem Wechsel bleibt der Fokus auf dem gewählten Tab; nur dessen Panel ist sichtbar.
- Innerhalb jedes Panels: H2 des Themas, die mitgelieferten H3-Überschriften mit jeweils 1–3 kurzen Absätzen. Keine zusätzlichen technischen Erklärungen, keine verschachtelten Akkordeons und keine doppelten Überschriftenansagen.
- Auf schmalen Fenstern die neun Tabs sinnvoll umbruchfähig oder scrollbar darstellen, ohne Tabstopps zu verlieren; niemals Texte abschneiden. Kurze Zeilenlängen, hohe Kontraste, sichtbarer Tastaturfokus.
- Einfache Leertasten- und Tabbedienung auch ohne die neuen Tastenkombinationen. Der Bereich ist immer offline verfügbar.
- Bei erneutem regulärem Öffnen die zuletzt gewählte Hilferegisterkarte merken; F1 wählt dagegen das kontextbezogene **konkrete Unterthema**. Die Datei `F1-KONTEXTE.json` ordnet 49 typische Ansichten und Dialoge festen Abschnitt-IDs aus der Hilfe-JSON zu. Bei F1 aus einem Dialog zuerst dessen speziellen Kontext bestimmen. Keine heuristische Suche nach einem ähnlich klingenden Stichwort und kein pauschales Öffnen von „Noten“ für alle Eingabefragen.

## Teilnehmerauswahl

Nur Darstellung ändern, ohne den Schutz und die Datenlogik aus 1.22.0 anzutasten: pro Schüler eine horizontal angeordnete Zeile mit Kontrollfeld links und Name rechts; die ganze Zeile anklickbar. Einspaltige, unabhängig scrollbar bleibende Liste; Suchfeld, Zähler, Alle auswählen und Auswahl aufheben darüber. Bereits vorhandene Einträge bleiben wie bisher ausgewählt und geschützt. `label` und `input` bleiben verbunden; Tab navigiert direkt zu Kontrollfeldern. Anordnungen mit einer eigenen Checkbox-Spalte und darunter getrennten Namen vermeiden.

## Startseite

Drei vorhandene Karten erhalten. „Weiterarbeiten“ öffnet das zuletzt verwendete Fach sinnvoll im zuletzt verwendeten Bereich und nicht zwangsläufig in der Notenübersicht; daneben gegebenenfalls ein kleiner Link „Zur Notenübersicht“. „Offene Noteneingaben“ erhält eine knappe Gesamtzahl; höchstens fünf zuerst sichtbar, bei mehr zusätzlich „Weitere offene Leistungen anzeigen“ zum Einblenden der restlichen Liste ohne neue Verwaltungsseite. „Meine Fächer“ bleibt erhalten. Keine neue große Statistik- oder Verwaltungsansicht.

## Klassenreihenfolge

Neue Einstellung unter `Einstellungen → Darstellung`: `Klassenreihenfolge`, Werte `Aufsteigend` (Standard) und `Absteigend`. Natürlich nach Klassenname mit numerisch sinnvoller Ordnung sortieren. Die Änderung gilt einheitlich für die Klassenauswahl, Schnellzugriffe auf Start/Noten und die zugehörige Reihenfolge in der Verwaltung; innerhalb jeder Klasse bleiben die Fächer alphabetisch. Nur Ansichts-/Arbeitsbereichseinstellungen anpassen, niemals Noten oder Identifikatoren umsortieren. Bestehende Nutzer ohne gespeicherte Einstellung erhalten `Aufsteigend`, bestehende Daten bleiben kompatibel.

## Fachzugriffe Alt+Ziffer

Alt+1 bis Alt+9 öffnen exakt die ersten neun **angezeigten Fachlinks** in „Meine Fächer“, also Kombinationen aus Klasse und Fach, nicht nur Klassen. Beispiel: Alt+4 = 7a/WBS, Alt+5 = 7a/Geschichte, wenn diese so in der sichtbaren Liste stehen. Die Nummerierung folgt dem Sortierstatus einschließlich der neuen Klassenreihenfolge; sie muss immer mit der sichtbaren Reihenfolge übereinstimmen. Auch wenn 16 Schnellzugriffe angelegt sind, bleiben nur die ersten neun nummeriert; alle übrigen sind weiterhin per Tab erreichbar. Alt+0 öffnet „Alle Klassen und Fächer“, mit einer geeigneten Fokussetzung. Kein frei erfundener zehnter Schnellzugriff. Wird ein Fach bewusst geöffnet, die vorhandene Fachöffnungsregel beachten; bei aktuell geöffnetem Dialog keine ungefragten Sprünge.

## Hauptbereiche und Aktionen

- Alt+S Start; Alt+N Noten; Alt+V Verwaltung; **Alt+I Sicherung**; Alt+E Einstellungen; Alt+H Hilfe.
- Strg+1 bis Strg+9: sichtbare Registerkarte auf ihrer tatsächlichen 1-basierten Position, nicht eine versteckte; auf eine nicht existierende Position keinesfalls einen anderen Tab mappen. Insbesondere **kein Strg+9-Sonderfall** für „Schüler“. Die Regel gilt für Noten, Verwaltung, Sicherung, Einstellungen und Hilfe.
- Strg+Tab / Strg+Umschalt+Tab: nächste/vorherige Registerkarte im aktiven Tab-Kontext, bei geöffneter Noteneingabe vorrangig „Alle Schüler“/„Einzeln“, andernfalls die äußere Tab-Leiste. Nur implementieren, wenn diese Kombination zuverlässig vom WebView2-Host ankommt; unter Windows prüfen.
- Strg+N Menü „Leistung hinzufügen“; das Menü enthält klar getrennt „Mündliche Noten für mehrere Schüler“ und „Mündliche Einzelnote“. Der bestehende Eintrag „Mündliche Note“ wird eindeutig zu „Mündliche Einzelnote“ präzisiert; den bestehenden Schalter „Noten für Klasse erfassen“ für konsistente Benutzerbegriffe auf „Mündliche Noten für mehrere Schüler“ umbenennen.
- Strg+Umschalt+K neue Klassenarbeit; Strg+Umschalt+T neuer Test; Strg+Umschalt+M **mündliche Noten für mehrere Schüler**. Für Einzelnote, Hausaufgabe und Heftbewertung reicht Strg+N.
- Strg+E Export: innerhalb Noten kontextbezogener Export, sonst Sicherung → Exportieren. Strg+G Gewichtung des aktuellen Fachs, falls vorhanden. Strg+S bisherige Speichersicherung, bestehende Schutzlogik beibehalten.
- F1 kontextbezogene Hilfe mit folgenden Grundzuordnungen (exakte Unterthemen gemäß `F1-KONTEXTE.json`): Start/Einrichtung → Einstieg; Verwaltung → Verwaltung; Noten/Leistungs- und Teilnehmerdialog → Noten; Punkte- und Notenschlüsseldialog → Punkte; Gewichtung/Abschlussnoten → Berechnung; Exportdialog oder Sicherung/Exportieren → Export; andere Sicherungsansichten → Sicherung; Einstellungen → Einstellungen; auf der Hilfe selbst keine unkontrollierte Navigation.
- **F1 bei geöffnetem Dialog:** Kontexttext aus derselben Textquelle innerhalb des bestehenden Dialogkontexts anzeigen, ohne den Dialog zu ersetzen, Felder neu zu rendern oder Eingaben zu verlieren. Danach Fokus zuverlässig zurück; Escape schließt zunächst nur die eingeblendete Hilfe. Kein zweiter nativer Modal-Dialog über dem ersten. Bei regulärem F1-Wechsel zur Haupt-Hilfe ursprünglichen Bereich und Fokus für eine sichere Rückkehr speichern.
- Escape schließt das oberste schließbare Element: Hilfekontext, Menü/aufgeklappte Optionen, Dialog oder offene Leistungsbearbeitung (bei geschützter/ungültiger Eingabe nicht stillschweigend); Fokus kehrt korrekt zurück. Alt+F4 bleibt dem Windows-Fenster vorbehalten.
- Bestehende Schnell-Eingabe unverändert: Eingabe / Umschalt+Eingabe (Noten und Punkte), Strg+Eingabe (Klassenabschlussnoten).

## Technische Sicherheitsbedingungen

Nur einen zentralen Tastenkombinations-Handler ergänzen und die vorhandenen Aktivierungsfunktionen/Aktionspfade wiederverwenden (`activateGroup`, `chooseContext`, vorhandene Dialog-/Export-/Leistungsaktionen). `canLeave`, Schutz vor ungespeicherten Werten, Fokuslogik, echte Tabs und Fehlerfokus bleiben maßgeblich. Niemals `keydown` direkt auf Dateneingaben überschreiben, wenn dadurch Standard-Eingabeoperationen zerstört würden. Keine Abkürzung darf während eines geschützten Dialogs unerlaubt navigieren, vorhandene Noten verwerfen oder Speichern/Export umgehen. Modifikatoren unterscheiden (insbesondere AltGr). Bereits verwendete Kombinationen nur nach Kollisionsprüfung übernehmen. ARIA `aria-keyshortcuts` für geeignete sichtbare Aktionsschalter ergänzen, ohne deren gesprochene Namen aufzublähen.

## Prüfungen vor einer Freigabe

1. Wortlaute jeder Hilfe-Unterüberschrift und jedes Aktionsnamens mit dem tatsächlich ausgelieferten Programm abgleichen. Hilfetexte wortgetreu einbinden; etwaige Abweichung von einer vereinbarten neuen Beschriftung ist ein Implementierungsfehler.
2. Jede der neun Registerkarten, alle Unterthemen, mobile/kleine Fenster, Zoom und NVDA-Struktur auf Vollständigkeit und logische Überschriften prüfen.
3. Alt+1…9 mit mehreren Fächern derselben Klasse, 12–16 Schnellzugriffen, wechselnder Klassenreihenfolge und Alt+0 prüfen; sichtbare Reihenfolge muss den Ziffern entsprechen.
4. Strg+1…9 bei kompakter und erweiterter Notenansicht, ausgeblendeten Leistungsarten, Verwaltung, Sicherung, Einstellungen, Hilfe und verschachtelten Eingabetabs prüfen. Nicht vorhandene Positionen tun nichts.
5. Strg+N, K/T/M, G, E und F1 bei normalen, geschützten, abgeschlossenen und fehlenden Fachkontexten prüfen. Keine Doppelausführung oder überraschende Speicherung.
6. Fokus beim Aufrufen/Schließen eines Dialogs, bei Esc, F1-Kontext und Hilfe-Rückkehr, bei ungültigen Noten/Punkten und bei ungespeicherten Gewichtungsvorgaben prüfen. Echte NVDA-/Braille-/Windows-Livetests als gesondert kennzeichnen.
7. Berechnungen, Datenkompatibilität, Wiederherstellung, TXT, alle Exporte, Installer-/ZIP-Startprüfung und die bisherigen Regressionstests unverändert bestehen lassen.

## Zusätzliche Befunde der erneuten Prüfung

- In `src/dialogs/grades.js` beim Bearbeiten einer vorhandenen mündlichen Einzelnote ist noch `Faktor` als Feldbeschriftung enthalten, während daneben bereits `Gewichtung der Leistung` verwendet wird. Die Vorlage enthält nach Codeprüfung im selben Modus zwei Felder mit `id="q-weight"`. Das in 1.23.0 auf **ein einziges Feld „Gewichtung der Leistung“** korrigieren, ohne bisherige Werte zu verändern; Speichern, Anzeige und NVDA-Label testen. Dieses Problem besteht unabhängig von der Hilfe.
- Die geplanten neuen Begriffe „Mündliche Noten für mehrere Schüler“ und „Mündliche Einzelnote“ müssen in Hauptmenü, Leistungsansichten, Dialogtiteln, F1-Kontext und Hilfe miteinander abgestimmt werden. Bisherige Datenarten und der Unterschied gemeinsame/Einzelnote dürfen dabei nicht geändert werden. Bestehende passende Beschriftungen wie „Einzelnote eintragen“, „Klassenübersicht“ und „Einzelnoten“ bleiben erhalten, sofern sie eindeutig sind.
- Die Erstellung eines neuen Schuljahres übernimmt **nicht von selbst** alle alten Klassen. Erst Schuljahr anlegen, dann für jede gewünschte Klasse „Klasse übernehmen“ nutzen. Die Hilfe ist darauf korrigiert.
- Bei der ersten Einrichtung lautet die tatsächliche Abschlussaktion **„Einrichtung abschließen“**. Fachzugriffe zeigen ein **Fach einer bestimmten Klasse**, nicht nur die Klasse.
- Die Gesamt-Exportfunktion unter „Sicherung → Exportieren“ bietet **Text (TXT), Word oder PDF als ZIP**, während der Exportdialog im Fach zusätzlich Drucken, Excel und CSV ermöglicht. Diese beiden Arbeitswege müssen getrennt verständlich bleiben.
- Der Link „Weitere offene Leistungen anzeigen“, die Klassenreihenfolge, die beiden eindeutigen mündlichen Menüeinträge und die neuen Tastenkombinationen existieren in 1.22.0 noch nicht. Die Hilfe beschreibt sie verbindlich als Ziel für 1.23.0; erst nach funktionsfähiger Umsetzung ausliefern.

## Zusätzliche Umsetzungskontrollen

- **Texttreue:** Texte ausschließlich aus `HILFE-1.23.0.json`; Markdown und TXT sind daraus abgeleitet. Stabile Abschnitt-IDs nicht bei der Integration verändern. Keine alten Hilfetexte anhängen und keine technischen Erläuterungen in die Benutzerhilfe einführen.
- **F1:** Bei Hilfe aus einem Dialog darf kein geöffnetes Formular neu aufgebaut werden. Bei Hilfeende kehrt der Fokus exakt an die vorherige Stelle zurück, und die Eingabe bleibt erhalten. Für jeden Eintrag aus `F1-KONTEXTE.json` prüfen: erwartetes Thema, Abschnitt, Fokus und Zurück.
- **Begriffe:** Bestehende Kurzbeschriftungen exakt verwenden. Besondere Regression: `Gewichtung der Leistung` statt `Faktor` bei mündlichen Einzelnoten; `Fachname` und `Fachkürzel`; `Einrichtung abschließen`; `Früheren Stand auswählen`; `Notenschlüssel als PDF speichern`; `Schülerliste übernehmen`; `Teilnahme beenden`; `Wieder aufnehmen`.
- **Berichte:** Getrennt prüfen: Übersicht, Leistungsliste, Fachbericht, Einzel-/Sammel-Schülerbericht, einzelne Leistung, mündliche Einzelnoten, abgeschlossene Schuljahre sowie „Alle Noten exportieren“. Filter, ehemalige Schüler, Punkte und Bemerkungen erhalten; keine Datenverluste.
- **Gezielte Realtests:** WebView2 und NVDA auf einem echten Windows-Rechner bei Alt+I, Alt+0–9, Strg+1–9, Strg+Tab, Strg+N, Strg+Umschalt+K/T/M, Strg+G, Strg+E und F1 prüfen; insbesondere AltGr, Eingabefelder, Dialoge und NVDA-Kurzbefehle. Wenn ein Kürzel tatsächlich abgefangen wird, nicht trotzdem als nutzbar ausliefern oder in der Hilfe versprechen.

## Hinweis zu den vorbereiteten Hilfetexten

Die Hilfe enthält bewusst die für 1.23.0 vereinbarten neuen Funktionen und Labels, die in 1.22.0 **noch nicht** umgesetzt sind (insbesondere die Tastenkombinationen, Klassenreihenfolge, Startseiten-Erweiterungen und die zwei mündlichen Menübezeichnungen). Diese Texte dürfen erst gemeinsam mit der entsprechenden funktionsfähigen Umsetzung ausgeliefert werden. Sie sind keine Aussage, dass Version 1.23.0 bereits existiert oder getestet wurde.
