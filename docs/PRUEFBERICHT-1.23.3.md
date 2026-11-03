# Notenblick 1.23.3 – Testversion

Ausgang: aktueller bereinigter `main`, Commit `f6bb26b0cf5c004c4c6191f5fe14d6df6cec043e`, Quellbaum `da72c1eff2d46c40a3923fd26a0cfd37590f4d91`, vollständig bytegleich abgeglichen. Einziger Entwicklungsbranch: `codex/1.23.3-bedienung-github`. Repository `sappelmueller/Notenblick`, ID 1432518047, bleibt privat; Actions bleiben deaktiviert. Neue Commits verwenden die GitHub-noreply-Adresse. Keine Änderung bestehender Tags, Releases, Downloads oder historischer Prüfberichte. Die drei historischen PR-Referenzen bleiben der Supportklärung vorbehalten.

## Änderungen und Ursachen

- Windows-Fenster: `WindowState = Maximized` wird bereits im Konstruktor vor `Shown` gesetzt. Die spätere Größenkorrektur entfällt. Normale Wiederherstellungsgröße und Mindestgröße berücksichtigen den Arbeitsbereich; Standardrahmen und Windows-Schalter bleiben erhalten. Windows verwaltet maximierte Arbeitsfläche, Taskleiste und Monitor-Skalierung.
- Wiederholte Kurzbefehle: `focusTarget` ergänzt ausschließlich für ausdrückliche Kurzbefehle eine kurze Statusansage, wenn dieselbe Überschrift schon fokussiert ist. Bei echtem Fokuswechsel kommt die Bestätigung weiter über den Fokus. Kein Blur/Refokus, keine zweite Live-Region, keine Änderung der sichtbaren Überschrift. Der Fachkontext verwendet weiterhin den vorhandenen H1-Namen.
- Statusmeldungen: Gleiche Texte und ausdrückliche Kurzbefehl-Rückmeldungen werden zunächst geleert und nach 100 ms über die bestehende Statusquelle geschrieben. Damit liegen Leeren und neue Meldung nicht im selben Aktualisierungsschritt. Epochenschutz verwirft überholte Meldungen; normale Noten-/Punkte- und Fehlerabläufe bleiben erhalten. Nicht belegte Ziffern bestätigen „Kein Fach zugeordnet.“ beziehungsweise „Keine Registerkarte vorhanden.“ ohne Fokuswechsel.
- Weniger Neuaufbau: Ein bereits aktiver Tab wird bei direktem Kurzbefehl nach unveränderter Eingabeprüfung beibehalten. Dasselbe Fach behält bei passender Fachöffnungsregel den montierten Arbeitsbereich. Eingaben, Formularobjekte und Scrollpositionen bleiben erhalten; „Immer Übersicht“ und echte Fach-/Bereichswechsel behalten ihre Wirkung.
- Größenänderungen: Die bestehende Tabellenprüfung überspringt unsichtbare Bereiche, bündelt Resize-/Observer-Aufrufe pro Darstellungszyklus und schreibt tabindex nur bei tatsächlicher Änderung. Das reduziert vermeidbare Layout- und Accessibility-Aktualisierungen. Zusätzlich bestätigte die gezielte Prüfung einen Fokusfehler: Beim Schließen eines Menüs durch Größenänderung blieb der Fokus auf einem ausgeblendeten Menüeintrag. Beide Menüarten führen jetzt zum Auslöser zurück; liegt der Fokus außerhalb des Menüs, bleibt er dort. Ob damit alle beobachteten NVDA-Verzögerungen beseitigt sind, muss die echte Abnahme zeigen.
- GitHub: Kurzbeschreibung wortgetreu nach Auftrag; Themen um gradebook, teachers, braille und portable ergänzt, vorhandene sinnvolle Themen erhalten. README und Barrierefreiheitsinformationen erklären den tatsächlichen Funktionsumfang und die Nutzerabnahme kurz. Lizenztexte, Sicherheitsregeln, native ARM64-Unterstützung, Berechnungen, Datenformate, Speicherung, Sicherungen und Exporte bleiben erhalten. Die vorhandene Liste gültiger Datenversionen enthält zusätzlich 1.23.3; eigene Daten werden nicht erneut migriert. `Daten` bleibt unangetastet.

## Nutzerabnahme für 1.23.2

Sebastian Müller bestätigte am **2. November 2026** praktische Tests auf einem Windows-PC und unter Windows auf ARM in Parallels mit **NVDA und Braille**. Beide Systeme funktionieren grundsätzlich; die oben bearbeiteten Ansageprobleme wurden dort beobachtet. PowerShell zeigte unter Windows auf ARM die tatsächliche Prozessarchitektur **ARM64** und den geladenen Loader **Programm\Windows\arm64\WebView2Loader.dll**. Native ARM64-Ausführung ist in dieser Umgebung damit praktisch bestätigt.

Diese Rückmeldung ergänzt den damaligen Prüfstand, ohne historische Nachweise oder Releases zu verändern. Sie stammt vom Nutzer und ist von den hier ausgeführten automatisierten Tests getrennt. Es liegen keine zusätzlichen Einzelprotokolle mit allen Geräte-/NVDA-Versionen, Microsoft-Office- oder physischen Drucktests vor. Keine vollständige Barrierefreiheitszertifizierung ableiten.

## Automatisierte Prüfungen

Die vorhandenen Gruppen `v1231`, `v1230-browser` und `loader` werden erweitert: wiederholte Strg+1 bis Strg+6 und Alt+1 bis Alt+9, einmalige Statusaktualisierung ohne zusätzliche Fokusereignisse, unbesetzte Ziffern, schnelle Wechsel mit Abbruch überholter Meldungen, Erhalt von Eingaben/DOM/Scrollposition, normale Tabs, Fachöffnungsregeln, F1 sowie Größenänderungen ohne Fokusverlust einschließlich geöffneter normaler und temporärer Kurzbefehlsmenüs. Der kompilierte Windows-Code wird auf maximierten Zustand vor `Shown`, ausbleibende nachträgliche Größenänderung und erhaltene Standard-Fensterbedienung untersucht. Diese IL-Prüfung ist kein realer Windows-Fensterstart.

Abschluss: frischer vollständiger Lauf `TZ=UTC python3 dev/manage.py release` mit allen bestehenden Testgruppen, 180.000 synthetischen Ergebnissen, C#-Speicherung/Wiederherstellung, Chromium/axe, Office/Open XML, PDF/UA und Druck, zwei bytegleichen sauberen Builds sowie vollständiger ZIP-/Entpackprüfung. Freigabenachweis anschließend mit `status --report reports/<Lauf>/summary.json`: Quellen, Werkzeuge, Ausgabe und Index müssen aktuell sein. Dieser vorbereitete Bericht behauptet keinen noch laufenden Test als bestanden; der Abschlusscommit dokumentiert tatsächlich erfolgreichen Lauf, Quellbaum und Archivprüfsummen.

## Noch zu prüfen und Freigabe

Die Änderungen von **1.23.3** benötigen eine erneute echte Windows-/NVDA-/Braille-Abnahme: maximierter Erststart und Wiederherstellen auf x64/ARM64, Taskleiste/Monitore/Skalierung, mehrfach Strg+1 bis Strg+6 und Alt+1 bis Alt+9, unbesetzte Ziffern, kleine Fenster und schnelle Noteneingabe. Andere nicht ausdrücklich bestätigte Office-/Druck-/UIA-Einzelprüfungen bleiben offen. Automatisierte Prüfungen ersetzen diese Abnahme nicht.

Zunächst ausschließlich Test-ZIPs und geprüfte Quellen im Entwicklungsbranch bereitstellen. Erst Sebastian Müllers ausdrückliche Freigabe erlaubt Übernahme nach `main`, Versions-Tag und offizielles Release. Erforderlichen Branchschutz beachten; keine unnötigen PRs. Den Entwicklungsbranch erst nach vollständiger Übernahme entfernen.

## Vorbereitete Release-Beschreibung: Was ist neu?

- Notenblick startet maximiert; Verkleinern und Wiederherstellen bleiben möglich.
- Wiederholte Fach- und Registerkurzbefehle bestätigen den gewählten Bereich. Nicht belegte Ziffern geben eine kurze Rückmeldung.
- Weniger Neuaufbau bei gleichem Fach und weniger unnötige Aktualisierungen beim Ändern der Fenstergröße.
- Verständlichere GitHub-Texte mit vollständigem Funktionsüberblick und dokumentierten Windows-/NVDA-/Braille- und nativen ARM64-Praxistests für 1.23.2.

Neue Bedienabläufe von 1.23.3 zunächst unter Windows mit NVDA und Braille abnehmen. Beim Update nur EXE und vollständigen Ordner `Programm` ersetzen; `Daten` behalten.
