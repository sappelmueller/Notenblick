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

## Ergänzung 1.16.0 – offen, kein Testnachweis

- Strg+Enter in allen drei Abschlussdialogen mit NVDA Sprache und Braille: nächster sichtbarer Schüler, dessen passender Durchschnitt oder „Noch kein Durchschnitt“ und aktueller Notenwert; keine doppelte Namens-/Statusansage. Native Auswahl, Filter, Tabellenende und Escape erhalten.
- TXT-Notenlisten mit Windows-Editor/NVDA ohne laufendes Notenblick lesen: eine Übersicht je Fach, genau ein Durchschnitt je Schüler, beide Festlegungen/offene Werte, alle Leistungsdateien, Schülernoten-Unterordner, Bemerkungen und ehemalige Schüler. Gelöschte Datei sowie unterbrochene Aktualisierung erneuern; JSON bleibt sicher.
- Alle vier Verwaltungsregister mit Tab/Pfeilen/Pos1/Ende/Enter/Escape: Überschriften, Direktverweise, Suche, Filter, Bestätigungen und Rückkehrfokus. Arbeitsjahr bleibt beim Abschließen erhalten.
- Neue portable Ausgabe ohne Daten: Willkommen, vier Schritte mit mehreren Klassen/Fächern und getrennten Schülerlisten, Vorschau/mehrteiligen Namen/Dubletten/Fachteilnahme, Zurück und Abbruch. Abschließenden Schreibfehler, Wiederholung und Neustart prüfen. Bestehender 1.15.0-Datenordner oder beschädigte Dateien dürfen niemals neu eingerichtet/überschrieben werden.
- 100/125/150/200 Prozent tatsächliche Windows-Skalierung, kleine Fenster, letzte Zeilen, Dialogaktionen und horizontale Tabellen. Word/Excel/Adobe Reader, native Export-/Druckdialoge und physischer Druck weiterhin gesondert abnehmen.

## Zusätzliche Abnahme 1.17.0

Unter Windows/NVDA mit Sprache und Braille alle fünf Einrichtungsschritte, Inline-Schülerbearbeitung, Fachteilnahmen, Namensvorschau, Gewichtungen sowie Escape/X/Einrichtung beenden prüfen. Besonders wiederholtes Escape, Fortsetzen und Bestätigungs-Escape mit korrektem Rückkehrfokus prüfen, ebenso Verwerfen ohne Teildaten und Fehler/Wiederholung beim abschließenden Speichern. Bei Windows-Skalierung 100/150/200 Prozent alle Dialogaktionen erreichen. Abschlussnoten-Klassenwerte bei 1/5/12/28 Festlegungen, aktiven/ehemaligen Fachschülern und Suche gegen tatsächliche Festlegungen prüfen; Word/Excel/Adobe Reader und physische Ausdrucke einschließlich Klassenergebniszeile abnehmen. Neue Installationen müssen Schnellzugriff verwenden; gespeicherte Auswahlfelder müssen bei Updates bleiben. Diese Liste ist ein offener manueller Prüfplan, kein Prüfbeleg.

## Ergänzung 1.18.0 – manuell noch abzunehmen

Alle fünf Schritte mit NVDA-Sprache/Braille prüfen: Halbjahresoptionen ohne doppelte Erklärungen, dauerhaftes Feldlabel „Fachname“, eindeutige Entfernen-Aktionen und kurze Schülerzahl. Zwei Klassen, mehrere Fächer und getrennte Listen importieren/bearbeiten; Enter, Tab/Shift+Tab, Schrittüberschrift, benachbarter Fokus sowie Scrollposition beim Zurückgehen prüfen. Fenstergrößen/Windows-Skalierungen mit nebeneinander beziehungsweise darunter stehenden Aktionen kontrollieren. Escape/X/Einrichtung beenden, Fortsetzen/Verwerfen und ausgefüllte Klassenentfernung dürfen keinen Fokus-/Eingabeverlust oder Teilspeicherung verursachen. Erst der fünfte Schritt speichert gemeinsam. Diese Abnahme ist durch Chromium/CSS-Zoom/axe unter Linux nicht ersetzt.

## Ergänzung 1.19.0 – manuell noch abzunehmen

Neue Installation mit Kürzen und Leistungsarten, Altstand ohne globale Vorgaben mit Runden/Kompakt sowie ausdrückliche Kurs-/Benutzervorgaben unter Windows x64 und ARM64 prüfen. Alle fünf Einrichtungsschritte mit gemeinsamer Fußzeile bei 100/150/200 Prozent Windows-Skalierung bedienen. Sechs Hauptlinks einschließlich Hilfe, alle vier Sicherungstabs mit NVDA-Sprache/Braille und Pfeilen/Pos1/Ende/Enter/Leertaste abnehmen. JSON- und TXT-Fehler, Datenordner öffnen, vollständige Sicherung, Datei-/Stand-/Arbeitskopiewiederherstellung, zweite Bestätigung, Schutzsicherung, Abbruch und Rückkehrfokus prüfen. Alle Exportformate/Schüler-ZIPs mit Microsoft Office, PDF-Anwendung und physischem Druck kontrollieren. Automatisierte Linux/Chromium/axe/CSS-Zoom-Prüfungen ersetzen diese tatsächliche Abnahme nicht.


## Ergänzung 1.20.0 – manuell noch abzunehmen

- Einrichtung abschließen und einmalige sichtbare/NVDA-Rückmeldung; alle fünf Schritte und gemeinsame Fußzeile.
- Drei Speicherfunktionen einschließlich Beschreibungen, tatsächlichem Ergebnis und getrennten JSON-/TXT-/Ansichtsfehlern. Kein doppeltes NVDA-Erfolgssignal.
- Datei-/Stand-/Arbeitskopie-Wiederherstellung: tatsächliche Phasen, keine kritische Unterbrechung, sinnvolle Fehlerrückkehr und Fokus ausschließlich auf Sicherung → Wiederherstellen. Übernommene Darstellung und Noten-Arbeitsbereiche bleiben erhalten; Notenübersicht nur auf Wunsch.
- Automatische/geschützte Sicherungszahlen und Bytes. Bestätigte Bereinigung mit 0/1/30/31/50/vielen Ständen; fremde, geschützte, beschädigte und veränderte Dateien sowie Strom-/Dateisystemfehler berücksichtigen. Daten/Ansicht/TXT müssen erhalten bleiben.
- Unabhängige Exportauswahl mit allen Formaten, Leistungsübersicht gegen vollständigen Fachbericht unterscheiden. Alle Noten immer als TXT-/Word-/PDF-ZIP; abgeschlossene Jahre, Kollisionen, leere und historische Daten kontrollieren.
- Tatsächliche Fortschritte, Escape während Erstellung, Dateidialog-Abbruch, Größen-/Dokumentgrenze und Fokus prüfen. NVDA-Sprache/Braille, Windows-Skalierung, WebView2/UIA, Microsoft Office und realer Druck bleiben live zu prüfen.


## 1.20.1: verbindliche Windows-/NVDA-Liveabnahme (offen)

1. Mit ausschließlich synthetischen Daten alle TXT-/Word-/PDF-Gesamtexporte über Sicherung → Exportieren speichern: mehrere/abgeschlossene Jahre, mehrere Klassen/Fächer, Umlaute und gleiche Namen. Im echten Windows-Speicherdialog „ZIP-Archiv (*.zip)“. Gespeicherte Archive unabhängig entpacken; dieselben Ordner und vollständige Dokumente.
2. Nacheinander Dokumenterstellung, Zusammenstellung, native Prüfung, Dateiauswahl und Speicherung beobachten. Während des Handoffs wiederholtes Escape darf keinen noch laufenden Vorgang verwaisen lassen. Abbruch ausschließlich im Speicherdialog, kein Erfolg; Fehler mit erneut bedienbarem Ursprungsdialog. Erfolg erst nach dem tatsächlichen Schreiben, eine sichtbare Rückmeldung und eine NVDA-Ansage; Rückkehr zum Auslöser.
3. Tastatur, NVDA-Sprache und Braille im Fortschritts-/Fehler-/Abbruchzustand prüfen; 100/150/200/300 Prozent Windows-Skalierung, 320/640/1280 effektive Pixel, keine verdeckten Aktionen. Dies ist durch Linux-/Chromium-/CSS-Zoomtests nicht belegt.
4. Tatsächliches Microsoft Word und PDF-Leser: Einzel-/ZIP-Berichte gleich gestaltet, Tabellenköpfe auf Folgeseiten, Farben/Schrift, Kopf-/Fußzeilen/Seitennummern, Lesereihenfolge, Tags und keine abgeschnittenen langen Namen/Bemerkungen. Klassendurchschnitt einzelner Leistungen mit nur aktiven bewerteten Teilnehmern, fehlende Werte als „–“; gespeicherte Zeugnisnoten unverändert.
5. Windows x64/ARM64, WebView2 und echtes Programmstarten/Neustarten mit altem Datenordner getrennt protokollieren. Beim Update nur EXE und vollständigen Programmordner ersetzen; Daten, Sicherungen und Einstellungen bleiben bestehen.

## 1.20.2: kompakte Exportberichte, Liveabnahme offen

- Synthetischen Fachbericht mit 23 Schülern/wenigen Leistungen und mit vielen Leistungen in Word, PDF, Excel, TXT, CSV und Druck öffnen. Vollständige Einzelnoten ohne eingebettete Wiederholungen aller Schülerberichte, tatsächliche Bemerkungen einmal und nur bei aktivierter Option; keine normalen Berechnungsstatus- oder leeren Gewichtungstabellen.
- Achtspaltige Notenübersicht A4 quer: genau eine zusammenhängende Tabelle einschließlich Halbjahres- und Jahreszeugnisnoten, ausschließlich vertikale Fortsetzungen, wiederholte Tabellenköpfe, lange Namen ohne Abschneiden. Viele Leistungsarten in den Details vollständig erhalten.
- Klassenarbeiten/Tests, mündliche Runden und Einzelnoten, GFS/Faktoren, besondere Status, fehlende Noten, manuelle Abschlussnoten und Klassendurchschnitte gegen die Anwendung vergleichen. Eigenständige Schülerberichte und explizite Auswahl aller Leistungen prüfen.
- NVDA/Braille: Inhaltsbeschreibungen, Tab-Reihenfolge, Format-/Bemerkungsauswahl, Abbruch und Fokusrückkehr im Exportdialog; Word-Überschriften, Tabellenköpfe, PDF-Lesereihenfolge. Windows-Skalierung und tatsächliche Druckvorschau mit Hoch-/Querformat prüfen.
- TXT-/Word-/PDF-Gesamt-ZIPs und fünf Schüler-ZIP-Formate tatsächlich über Windows speichern und öffnen. Gleiche Ordnerstruktur, sichere Namen, Erfolg erst nach Speicherung, Abbruch ohne Erfolg; automatischen Datenordner/Notfalllisten unverändert lassen.

Diese Punkte sind keine bereits ausgeführten Windows-/NVDA-Livetests. Automatische Linux-/Chromium-/LibreOffice-/C#-Host-/Open-XML-/veraPDF-Prüfungen sind im aktuellen Prüfbericht getrennt dokumentiert.

## 1.20.3 Registerkarten und Exporte Liveabnahme offen

- Nach Leistungsarten: alle 32 Sichtbarkeitskombinationen, insbesondere ohne Hausaufgaben/Heftführung; niemals zusätzlicher Reiter Leistungen. Kompakt behält Leistungen. Ausgeblendete vorhandene Leistung über Übersicht öffnen, bearbeiten und schließen; Fokus, Registerkarten und gespeicherte Vorgaben prüfen.
- Schülerberichte über Sicherung: Schüler gezielt auswählen, fehlende Auswahl, gleiche Namen, ehemalige Schüler und Wechsel zu Alle Schüler einzeln. Arbeitsfach/-schüler unverändert; Escape und Fehlerfokus nachvollziehbar, keine doppelten NVDA-Ansagen.
- Mündliche vollständige Klassenrunde, dünn besetzte Klassenbewertung und echte Einzelnote in allen Formaten prüfen. Gleiche Titel/Datumswerte müssen in Berichten eindeutig zugeordnet bleiben. Bemerkungen/Status/GFS/Faktoren erhalten.
- Kurze Schüler-, Test- und Fachberichte ohne unnötige PDF-Restseite; große Tabellen mit wiederholten Köpfen und langen Bemerkungen ohne Überlauf. PDF-Tags/Lesereihenfolge mit geeignetem Hilfsmittel menschlich prüfen.
- Gesamtexport immer als ZIP: Fächer und Klassenlisten vollständig, leere Schülerberichte nur bei ausdrücklicher Einzelanforderung; manuelle Abschlussnoten/Bemerkungen/Historie niemals unterdrücken. Unbenotete Fachinformation statt Leertabelle. Automatische Notfalllisten und JSON-Sicherungen unverändert.
