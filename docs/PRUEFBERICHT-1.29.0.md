# Notenblick 1.29.0 – Prüfbericht

Sebastian Müller hat die unveränderte Windows-Testversion am 27. November 2026 praktisch geprüft und ausdrücklich freigegeben. Die Bestätigung umfasst die Bedienung mit Braillezeile und den Einsatz unter Windows auf ARM64.

## Gezielte Prüfungen der Testversion

- **Noteneingabe:** Anlegen, Nachtragen, Tabellen- und Einzelansicht, „Speichern und schließen“, fehlerhafte Eingaben und Rückkehr von Fokus und Filter. Geprüft wurde auch die Wiederholung nach einem Fehler in der TXT-Aktualisierung.
- **Leistungsaktionen:** Noten ansehen und bearbeiten, Angaben ändern, verschieben, löschen und rückgängig machen. Die Verschiebung zwischen Tests und Mündlich wurde mit Punkten, Bemerkungen und festgelegten Abschlussnoten geprüft.
- **Daten und Notenlisten:** Zwei Fälle mit dem nativen Windows-Speicherkern, mit und ohne Passwortschutz. Bei einem Fehler der TXT-Aktualisierung blieben die Noten nach dem erneuten Versuch bytegleich. Selbst bearbeitete TXT-Dateien blieben erhalten.
- **Darstellung und Tastatur:** Gezielte Chromium-Prüfungen einschließlich Fokus, F1, axe, schmalen Fenstern, erzwungenen Farben und Vergrößerung bis 400 Prozent.
- **Windows x64 und Paket:** Start aus dem entpackten Archiv mit passendem WebView2-Loader. Die nativen Update- und Lesetests sowie der Wechsel des Notfallzugriffs von 1.28.0 auf 1.29.0 bestanden. Dabei blieben die synthetischen Testdaten bytegleich. Das Archiv enthält die Loader für x64 und ARM64.

Die Windows-Praxisfreigabe und die gezielten automatischen Prüfungen sind getrennte Nachweise. Eine eigene NVDA-Prüfreihe ist in den vorliegenden Nachweisen für 1.29.0 nicht dokumentiert.

## Gezielte Prüfung des Updatewegs

Der veröffentlichte Windows-Updater aus 1.28.0 prüfte mit einer kontrollierten GitHub-Antwort das unveränderte 1.29.0-Update-ZIP mit 96 Dateien. Er bot den Stand mit Testdeskriptor nicht an und installierte nach Freigabe die vollständige Ausgabe. Bei einem erzwungenen Abbruch stellte er die vorherige Version bytegleich wieder her. Der synthetische Ordner Daten blieb bei Installation und Rückfall unverändert.

## Veröffentlichungsstand

Das Windows-ZIP `Notenblick_1.29.0_Windows.zip` umfasst 10.447.885 Byte. Seine SHA-256-Prüfsumme ist `ad041dcba0d6c28c26831e1a34f78b78aafd2171b8fdec65a10b1b60bdf03190`. Die Programmpakete stammen bytegleich aus der geprüften Testversion. Die Veröffentlichung ergänzt Dokumentation und Freigabemetadaten. Das Quellcode-ZIP gehört zum freigegebenen Git-Stand.

[Release und Downloads](https://github.com/sappelmueller/Notenblick/releases/tag/v1.29.0)
