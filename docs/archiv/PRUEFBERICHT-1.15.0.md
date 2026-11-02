# Notenblick 1.15.0 – Abschlussnoten und Bedienkomfort

Die gemeinsame Abschlussnotenverwaltung aus 1.14.0 bleibt erhalten. Geändert werden Beschriftungen, Layout, zentrale numerische Viertelnotendarstellung und eine ausdrückliche Tastenkombination. Der produktive Rechen-/Speicherkern und das Dateiformat bleiben unverändert. Vorhandene Versionen einschließlich 1.14.0 werden weiterhin akzeptiert; historische Noten werden nicht umgewandelt.

## Bedienung und Grenzen

Halbjahresausgabe mit dynamisch zugeordneter Beschreibung, ohne zusätzliche Live-Region oder Fokuswechsel. Einheitliche Einzel-/Klassendialoge für Halbjahresinformation, Halbjahreszeugnis und Jahreszeugnis. Abweichende frühere Noten und gespeicherte Informationen bleiben erreichbar. Abschlussklassen werden ausdrücklich konfiguriert; Jahresdurchschnitte dienen dort weiterhin nur der Orientierung.

Die native Auswahlliste bleibt erhalten. `change` unterscheidet keine Enter-Bestätigung von anderen Auswahlwegen; Tastaturereignisse hängen vom nativen Popup und der Plattform ab. Der HTML-Standard beschreibt [Auswahländerungen und Ereignisse](https://html.spec.whatwg.org/multipage/form-elements.html#the-select-element), liefert aber keinen Windows-/NVDA-Abnahmenachweis. Deshalb keine heuristische automatische Enter-Navigation: Auswahl wie gewohnt bestätigen, dann **Strg+Enter** zum nächsten sichtbaren Schüler. Tabellenende, wiederholte Tastendrücke und ausgeblendete Zeilen sind geschützt. Kein Speichern durch diese Aktion; Tab bleibt verfügbar.

NVDA-Sprach-/Brailleansagen, Windows/WebView2/UIA, tatsächliche Windows-Skalierung, Microsoft Office und physischer Druck sind hier nicht live geprüft. Automatisierte Chromium-/axe-/Strukturprüfungen ersetzen diese Abnahme nicht. Automatische Enter-Navigation bleibt deaktiviert. Der Windows-Build bleibt bis zur tatsächlichen Abnahme ein lokal geprüfter Kandidat.

## Dauerhaft integrierte Regressionen

- `v1150.cjs`: alle 21 numerischen Viertelnoten und Ganznoten, exakte Grenzwerte, Halbjahresausgabe/Jahresbeginn, alle Einzel-/Klassendialoge, Erstfokus, Status/Tabellensemantik, Shortcut/Filter/Übernahmeschutz, unveränderte 1.14.0-Daten.
- `v1150-browser.cjs`: tatsächliche Chromium-Tastenfolgen mit nativer Auswahl, explizites Strg+Enter, Escape/Tab/Rückkehrfokus, Accessibility-Baum/axe, 30/60/300 Schüler und enge effektive Fenstergrößen. Keine Behauptung tatsächlich gesprochener NVDA-Ansagen oder realer Windows-Skalierung.
- `v1140-storage.cjs`: bisherigen vollständigen produktiven Speicher-/Fehler-/Sicherungsprüfungen um tatsächliche 1.14.0-Datei, bytegleiches Öffnen, vorausgewählte Festlegung und Wiederherstellung unter 1.15.0 ergänzt.
- `v1140-files.py`: unabhängige Word-/Excel-/Text-/CSV-/PDF-/Druckleser prüfen numerische Festlegungen, echte Excelzahlen mit `0.00`, Schema, PDF/UA und vollständige gerenderte Inhalte. Sämtliche bestehenden Exportprüfungen und Schüler-ZIP-Regressionen bleiben bestehen.

## Ausgeführte Vorabprüfungen am 27. Oktober 2026

Die sechs neuen Struktur-/Domänengruppen und fünf neuen Browsergruppen einschließlich neun Klassenfällen (30/60/300 Schüler × drei Zeugnisarten) sind erfolgreich. Die sieben produktiven Speichergruppen einschließlich 1.14.0-Update/Wiederherstellung sowie die unabhängigen Abschlussnoten-Dateiprüfungen sind ebenfalls erfolgreich. Bei 320 × 480 Pixeln wurde das Bemerkungsfeld tatsächlich per Tab erreicht; effektive Größen bis 160 Pixel Breite und die zwölf bestehenden Größen-/Skalierungskombinationen werden zusätzlich im vollständigen Lauf geprüft.

Der neue Tendenzprüfer erkannte zunächst aneinandergehängte Word-Tabellenzellen mit Note, Gedankenstrich und Datum irrtümlich als Minusnotation. Die Regel erkennt nun die tatsächlichen bisherigen Tendenzformate; positive und negative Beispiele sichern sie ab. Die anschließend erneut ausgeführte unabhängige Dateiprüfung besteht. Bestehende Berechnungs-, Migrations-, Wechsel- und produktive Speicherdateien wurden zusätzlich bytegleich mit dem Ausgangsstand verglichen.

## Freigabenachweis

Entwicklungsplan und gezielte Prüfungen laufen über `dev/manage.py`. Der unmittelbar folgende vollständige `python3 dev/manage.py release` deckt die Integration ab: alle 46 Testsuiten einschließlich 180.000 Ergebnissen, sämtliche bisherigen Berechnungen/Regressionen, Sicherung/Wiederherstellung, Browser/Tastatur/Fokus/axe, Office/PDF-UA/Druck, Lader/Abhängigkeiten sowie zwei frische bytegleiche Builds und ZIP-/Entpacktest. Insgesamt 53 Prozessschritte. Keine GitHub Actions.

Vollständige lokale Nachweise: `reports/<Lauf>/summary.json`, Einzellogs und `determinism.json`; Freigabe nur nach erfolgreichem `status --report`. Der abschließende Versionscommit hält den tatsächlich ausgeführten Lauf, Ergebnis, Dauer, geprüften Baum und ZIP-Prüfsummen fest. Vorbereitende oder fehlgeschlagene Läufe gelten nicht als Freigabe. Die Dokumentation wird vor dem letzten Lauf abgeschlossen, damit der geprüfte Stand unverändert bleibt.

## Update

Anwendung schließen und eine Sicherung erstellen. Nur `Notenblick.exe` und den **vollständigen** Ordner `Programm` durch die neue Ausgabe ersetzen. Den vorhandenen Ordner `Daten` einschließlich Einstellungen, Sicherungen und Notenlisten behalten. Die Programm-ZIP enthält keine Nutzerdaten. Quellcode-ZIP getrennt vom vollständigen portablen Windows-Programm.
