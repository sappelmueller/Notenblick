# Windows-Prüfung vor Freigabe

Ein Linux-Build ersetzt diese Prüfung nicht. Unter Windows 11 zunächst die ZIP-Prüfsumme mit der erzeugten Prüfsummendatei vergleichen. Die Anwendung in einen neuen Ordner ohne bestehende Schülerdaten entpacken. `dev/windows-qa.ps1 -Archive <ZIP-Pfad>` prüft Entpackung, Grundstruktur, .NET-Voraussetzung und vorhandene WebView2-Registrierung. `-Launch` startet ausschließlich diese frisch entpackte Kopie; die folgenden Punkte bleiben manuell zu bestätigen.

- EXE direkt nach dem Entpacken starten; Fehlermeldungen, fehlende Bibliotheken und .NET-Ladefehler prüfen. Reguläre Windows-Sicherheitswarnungen nicht umgehen oder abschalten.
- Ersteinrichtung mit erfundenem Schuljahr, Klasse, Fach und Schülern durchführen. Die portable Ausgabe darf keine Beispieldaten automatisch mitbringen.
- Note erfassen, schließen, erneut starten; Noten und letzte Ansicht müssen erhalten bleiben.
- Sicherung erzeugen, Note ändern, Sicherung wiederherstellen; Originalwerte prüfen.
- Anwendung schließen und vollständigen Ordner in einen Pfad mit Leerzeichen/Umlauten kopieren; erneut öffnen.
- Mit NVDA alle Hauptlinks, internen Tabs und Dialoge prüfen. Eingabe/Leertaste, Pfeiltasten, Pos1/Ende, Escape, kurze Ansagen und Fokusrückkehr kontrollieren.
- Notentabellen, mündliche Einzelnoten, Gewichtung einschließlich Kommaeingabe und manuelle Zeugnisnoten prüfen.
- Fenstergrößen und 100/150/200 Prozent Windows-Skalierung visuell prüfen; keine abgeschnittenen Bedienelemente.
- Nach Möglichkeit getrennt auf Windows x64 und Windows ARM64 prüfen. Vorhandene Loaderdateien allein belegen keine ausgeführte ARM64-Prüfung.

Prüfdatum, Windows-Version/Architektur, WebView2-Version, NVDA-Version und die Ergebnisse dokumentieren. Offene Punkte bleiben offen; keine automatische Umwandlung in eine Freigabe. Falls der Linux-Build künftig scheitert: dieselben mitgelieferten Python-Buildskripte mit dem gesperrten SDK auf einem vorhandenen Windows-Rechner verwenden. Keine kostenpflichtigen Dienste und keine GitHub Actions einschalten.

## Ergänzung für 1.9.0

- Start → Weiterarbeiten nach Besuch eines früheren Schuljahrs: korrekte Jahresangabe und Rückkehr zur tatsächlichen Fachansicht.
- Mündlich: Klassenübersicht/Einzelnoten per Auswahlfeld, jeweils genau eine Hauptaktion; Ansicht anpassen mit Eingabe/Leertaste öffnen und mit Escape schließen.
- Einzelnoten: sechs Spalten, kurze Bearbeiten-/Löschen-Ansagen, Bezeichnungssuche, kombinierter Schülerfilter; Rückkehr aus Dialog und Schüleransicht zur ursprünglichen Position.
- Neue Einzelnote: bekannter Schüler fokussiert Note, allgemeiner Aufruf Schüler; Mündliche Note und heutiges Datum vorbelegt; Speichern und nächste mehrfach prüfen.
- Neue Bewertungsrunde für ganze Klasse und ausgewählte Gruppe: individuelle Noten, direkte Eingabe, Eingabe schließen mit nachvollziehbarem Fokus.
- 40, 100 und 250 synthetische Einzelnoten bei 100/150/200 Prozent Windows-Skalierung prüfen. Browserzoom und Pixelratio sind keine tatsächliche Windows-Skalierungsprüfung.

## Ergänzung für 1.13.0

- Schüler → Exportieren: beide Ausgabeoptionen mit NVDA prüfen; Erklärung genau einmal, aktuelle ZIP-Anzahl, kein Fokuswechsel. Alle bisherigen Leistungs-/Anordnungserklärungen und fünf ZIP-Formate kontrollieren.
- Breite Notenübersicht mit sieben, acht und zehn geeigneten Spalten: Export empfiehlt A4 quer; WebView2-Browser-Druckvorschau öffnen, Drucker wählen, Ausrichtung dort und im Windows-/Druckertreiberdialog vergleichen. Schmale Übersicht entsprechend A4 hoch. Wegen der ShowPrintUI-Schnittstellengrenze erforderlichenfalls empfohlene Ausrichtung bestätigen. Nicht ohne Vorschau drucken.
- Vorschau länger als zwei Minuten offen lassen, abbrechen, erneut öffnen: keine zweite Vorschau, kein verspäteter Druck, ursprünglicher Exportfokus. Seitenzahl, vollständige Noten und Tabellenköpfe auf jeder tatsächlichen Fortsetzungsseite sowie Schwarz-Weiß-Ausdruck kontrollieren.
- Klasse mit aktiver Schülersuche und ohne Suche in allen sechs Formen exportieren. Klassendurchschnitt muss jeweils mit dem Bildschirm übereinstimmen und alle aktiven Fachteilnehmer berücksichtigen; ausgeschiedene Schüler nicht einrechnen, Zeugnisnotenspalte „–“.
- Word-Dokumente tatsächlich unter Microsoft Word öffnen: keine Feldaktualisierungs-/Reparaturabfrage, unveränderte lokale Seitenzahlen, Tabellenköpfe und letzte Ergebniszeile; NVDA-Tabellennavigation. Automatischer LibreOffice-Render und vollständige Open-XML-Validierung ersetzen diese Prüfung nicht.
- Bestehenden synthetischen 1.12.0-Datenordner beim Update behalten: nur EXE und vollständigen Programmordner ersetzen, alle Daten/Sicherungen/Notenlisten erhalten.


## Ergänzung 1.14.0 – tatsächlich unter Windows/NVDA abnehmen

Diese Punkte sind ein offener Prüfplan, kein Testnachweis:

1. Vorhandenen Datenordner sichern; vollständige EXE/Programm-Ausgabe ersetzen, Daten behalten. Start auf Windows x64/ARM64, WebView2 und Speicherrechte prüfen.
2. Vorhandenes Schuljahr ohne Halbjahreseinstellung öffnen. Einmalige Auswahl speichern, anderes Fach öffnen, dieselbe Einstellung prüfen. Klassenverwaltung ändern, Warnung bestätigen und alle bisherigen Werte unverändert wiederfinden.
3. Abschlussnotenmenü mit Enter/Pfeilen öffnen. Fokus auf erster offener Note, native Auswahl mit Pfeilen, kurze eindeutige NVDA-Ausgabe mit Schüler und Note prüfen. Ganze Klasse per Übernahme bearbeiten, offene filtern, Änderungen beibehalten, speichern; Fokus am auslösenden Schalter.
4. Echte NVDA-Tabellennavigation mit Zeilen-/Spaltenköpfen in Übersicht und Klassendialog; Einzelbearbeitung und drei Schülerkarten, gespeicherte Vorauswahl, Weitere Informationen, Bemerkung, bestätigtes Entfernen und Escape prüfen.
5. 100/125/150/200-Prozent-Windows-Skalierung und kleines Fenster: letzte Zeile, horizontaler Tabelleninhalt, Dialogaktionen und Fehler weiterhin erreichbar. Keine Tastaturfalle oder abgeschnittene fokussierte Eingabe.
6. Datenträgerfehler/Schreibschutz: Entwurf behalten, erneutes Speichern, Programmneustart, JSON- und TXT-Sicherung/Wiederherstellung prüfen. Spätere Märzleistungen und Gewichtsänderungen verändern keine Festlegung.
7. Alle Exportformen mit und ohne Bemerkungen unter echtem Microsoft Word/Excel/Adobe Reader und NVDA prüfen; native Druckvorschau, physischer Druck, Leserichtung und Tabellenbezug kontrollieren.

## Ergänzung für 1.15.0 (noch nicht ausgeführt)

- Drei Zeugnisarten einzeln und mit 30/60/300 synthetischen Schülern: Kontext, Zeitraum, H3-Schülername, numerische Viertelnoten/ganze Noten und frühere Informationen prüfen.
- Halbjahresausgabe ändern: Erklärung einmal, Auswahlfokus unverändert, Bestandsnoten geschützt; keine Ableitung aus dem Klassennamen.
- Native Auswahl mit Enter öffnen, Pfeilen ändern, Enter bestätigen; kein automatischer Schülerwechsel. Maus, Tab, unveränderte Auswahl und Popup-Escape prüfen.
- Nach geschlossener Auswahlliste **Strg+Enter**: nächstes sichtbares Notenfeld und kurze Namens-/Wertansage ohne Klassenstatus. Versteckte Zeilen, letzter Schüler und Gedrückthalten prüfen. Keine Speicherung ohne Speichern.
- NVDA mit Sprache/Braille: Shortcut-Durchleitung im Fokusmodus, kurze Labels, Tabellenkopfzuordnung, keine zusätzliche Abschlussnotenregion. Tab bleibt verfügbar.
- 100/125/150/200 Prozent Windows-Skalierung, kleine Fenster, lange Namen und Altwerte: vollständige Lesbarkeit, erreichbare Aktionen, beide Scrollrichtungen und sichtbare Tabellenköpfe.
- Escape nach geschlossener Auswahlliste verwirft den Entwurf; Speichern/Abbrechen gibt Fokus zurück. Speicherfehler erhält Eingaben. Bestehende 1.14.0-Daten und alle Exporte/Sicherungen/Schüler-ZIPs kontrollieren.

Automatische Enter-Navigation bleibt bis zum dokumentierten zuverlässigen Windows-/NVDA-Livetest deaktiviert. Chromium/axe belegt keine tatsächlich gesprochenen NVDA-Ansagen.
