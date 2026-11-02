# Notenblick 1.23.0 – Prüfergebnis der Hilfe

**Verglichener Programmstand:** privates GitHub-Repository `sappelmueller/Notenblick`, Branch `main`, Version **1.22.0**, Commit `76f0415fdcd31c0506d926411bf0cfdbd2cf18fc` (31.10.2026).

**Geprüft:** Hilfetexte der vorherigen Fassung und der erneuerten Fassung; Benutzerabläufe und konkrete Beschriftungen in den Programmteilen `src/views/`, `src/dialogs/`, `src/app/`, `src/exports/`, `src/domain/`, `src/shell.html`, besonders Einrichtung, Klassen/Fächer/Schüler, Noteneingabe, Punkte, Abschlussnoten, Sicherung und Export. Dies ist eine **inhaltliche Quellcodeprüfung**; es wurde keine neue Windows-Version gebaut oder live mit NVDA getestet.

## Wichtigste Verbesserungen

1. **Neues Schuljahr:** präzisiert, dass zuerst das Schuljahr und dann mit „Klasse übernehmen“ die gewünschten Klassen kopiert werden. Es gibt keinen pauschalen automatischen Jahresübertrag.
2. **Verwaltung:** „Fach übernehmen“, „Fachname“, „Fachkürzel“, die Übernahme von Schülerlisten aus bisherigen Klassen, Fachteilnahmen, „Teilnahme beenden“ und „Wieder aufnehmen“ klarer beschrieben.
3. **Noteneingabe:** Anlegen, Teilnehmerauswahl, direkte Eingabe, „Alle Schüler“/„Einzeln“, Zurück/Weiter, Speichern, Korrektur und Löschen als nachvollziehbarer Arbeitsweg beschrieben. Gespeicherte Einträge und fehlende Noten eindeutig behandelt.
4. **Mündlich:** gemeinsame Bewertungen und einzelne mündliche Noten deutlicher voneinander abgegrenzt, dazu „Klassenübersicht“/„Einzelnoten“, Suche und späteres Bearbeiten.
5. **Punkte:** tatsächliche Felder und Aktionen („Maximal erreichbare Punkte“, „Erreichte Punkte“, „Punktzahl prüfen“, „Punkteschritte“, „Notenschlüssel als PDF speichern“) verwendet und Vorschau von der Übernahme unterschieden.
6. **Berechnung:** Gewichtung einer Leistung und Notengewichtung eines Fachs getrennt; Abschlussnoten als bewusste Entscheidung erklärt, Abgrenzung zwischen Halbjahresinformation und Halbjahreszeugnis erhalten.
7. **Export:** zwei Wege (aus dem Fach / unabhängig unter Sicherung), Entscheidungshilfe für die verschiedenen Berichte, Filter/Umfang, einzelne vs. viele Schülerberichte, Formate, Punktzahlen/Bemerkungen und Gesamtexport sauber getrennt.
8. **Sicherung:** automatische Speicherung, Textlisten, vollständige Sicherung, Wiederherstellung, frühere Speicherstände und Bereinigung ohne technische Interna beschrieben.
9. **Hilfe per F1:** jede Unterüberschrift hat eine stabile ID; 49 typische Kontexte sind in `F1-KONTEXTE.json` dem passenden Unterthema zugeordnet. Das ist eine Vorgabe für die Entwicklung, keine bereits eingebaute Funktion.

## Abweichungen zwischen Quellcode und gewünschter 1.23-Oberfläche

- In **1.22.0** enthält „Leistung hinzufügen“ nur „Mündliche Note“, nicht die zwei neuen eindeutigen Menüpunkte. Das neue Menü muss **erst umgesetzt** werden.
- In **1.22.0** heißt der Schalter für gemeinsame mündliche Leistungen noch **„Noten für Klasse erfassen“**. Vorgesehen ist „Mündliche Noten für mehrere Schüler“.
- Im Code von `src/dialogs/grades.js` sind beim Bearbeiten einer mündlichen Einzelnote **„Gewichtung der Leistung“ und „Faktor“ zugleich** angelegt; beide benutzen `q-weight`. Dies ist keine reine Textabweichung: vor Freigabe das doppelte Eingabefeld korrigieren und Speicherung/Fokus regressionsprüfen.
- Die neue **Klassenreihenfolge**, Alt-/Strg-Kombinationen, F1-Kontexthilfe und **„Weitere offene Leistungen anzeigen“** sind in 1.22.0 noch nicht implementiert. Die Hilfe ist das fertige Ziel für **1.23.0**, nicht die Beschreibung einer schon ausgelieferten Version.
- Bei der ersten Einrichtung ist der richtige Schalter **„Einrichtung abschließen“**, im Sicherungsbereich **„Früheren Stand auswählen“**. Die überarbeiteten Texte verwenden diese Bezeichnungen.
- Der eigentliche ausgegebene Schülerbericht kann im Berichtstitel „Schülernoten“ heißen, während die Auswahl im Sicherungsbereich „Schülerberichte“ lautet. Das ist derzeit eine unterschiedliche Benennung zweier Ebenen; bei Weiterentwicklung möglichst konsistent lassen oder sauber vereinheitlichen, nicht die Hilfe mit zusätzlichen Synonymen überladen.

## Themenabdeckung

Die Hilfe bleibt bei neun Registern und jetzt **77 kurzen Unterabschnitten** (zuvor 70). Die Benutzerfassung ist bewusst kein technisches Handbuch und enthält keine Quellcode-, Speicherformat- oder Entwicklerdetails. Gewisse Vorgänge (Kopieren/Aktualisieren des Programms und Wiederherstellung) nennen nur die Dateien bzw. Schalter, die eine Lehrkraft wirklich benötigt.

## Abnahme offen

Noch ausstehend: Implementierung der geplanten Funktionen, tatsächlicher Wortlaut-Abgleich mit der **fertigen** Version 1.23.0, echte Tastatur-/NVDA-Tests unter Windows inklusive Skalierung, F1-Rückkehr aus Dialogen und die üblichen fachlichen Regressionstests. Die vorliegenden Hilfetexte selbst wurden auf konsistente neun Register, gültige Abschnitt-IDs und Übereinstimmung zwischen JSON, Markdown und TXT geprüft.
